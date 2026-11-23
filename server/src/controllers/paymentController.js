import paymentService from '../services/paymentService.js';
import settingsService from '../services/settingsService.js';
import invoiceRepository from '../repositories/invoiceRepository.js';
import customerRepository from '../repositories/customerRepository.js';
import paymentRepository from '../repositories/paymentRepository.js';
import logger from '../config/logger.js';
import { touchCompanyData } from '../utils/updateCompanyTimestamp.js';

class PaymentController {
  async getPayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const payment = await paymentService.getPayment(req.params.id, companyId);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }
      res.status(200).json({ success: true, payment });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const payments = await paymentService.getAllPayments(companyId);
      res.status(200).json({ success: true, payments });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentsByContact(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const payments = await paymentService.getPaymentsByContact(req.params.contactId, companyId);
      res.status(200).json({ success: true, payments });
    } catch (error) {
      next(error);
    }
  }

  async createPayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const creatorName = req.user.name || req.user.role || req.user.userId || 'System';
      logger.info('Creating payment record for company %s by %s', companyId, creatorName);
      const payment = await paymentService.createPayment(req.body, companyId, creatorName);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Payments', 'CREATE', payment._id || payment.paymentId, payment);
      res.status(201).json({ success: true, payment });
    } catch (error) {
      next(error);
    }
  }

  async updatePayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.name || req.user.role || req.user.userId || 'System';
      logger.info('Updating payment record %s for company %s by %s', req.params.id, companyId, updaterName);
      const payment = await paymentService.updatePayment(req.params.id, companyId, req.body, updaterName);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Payments', 'UPDATE', req.params.id, payment);
      res.status(200).json({ success: true, payment });
    } catch (error) {
      next(error);
    }
  }

  async deletePayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.name || req.user.role || req.user.userId || 'System';
      logger.info('Deleting payment record %s for company %s by %s', req.params.id, companyId, deleterName);
      await paymentService.deletePayment(req.params.id, companyId, deleterName);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Payments', 'DELETE', req.params.id);
      res.status(200).json({ success: true, message: 'Payment record soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async verifyPaytmPayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { invoiceNo, invoiceId, amount } = req.body;

      if (!invoiceNo) {
        return res.status(400).json({ success: false, message: 'Invoice number is required' });
      }

      const settings = await settingsService.getSettings(companyId);
      if (!settings || !settings.enablePaytmQr) {
        return res.status(400).json({ success: false, message: 'Paytm Dynamic QR is disabled in Settings' });
      }

      const mid = settings.paytmMid?.trim();
      if (!mid) {
        return res.status(400).json({ success: false, message: 'Paytm MID is not configured in Settings' });
      }

      // Query Paytm merchant-status endpoint
      const paytmUrl = 'https://securegw.paytm.in/merchant-status/getTxnStatus';
      const jsonData = JSON.stringify({ MID: mid, ORDERID: invoiceNo });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      let data = null;
      try {
        const response = await fetch(`${paytmUrl}?JsonData=${encodeURIComponent(jsonData)}`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        data = await response.json().catch(() => null);
      } catch (err) {
        logger.warn('Paytm verification network error for order %s: %s', invoiceNo, err.message);
      } finally {
        clearTimeout(timeout);
      }

      if (!data) {
        return res.status(200).json({ verified: false, status: 'PENDING', message: 'No response from Paytm' });
      }

      const status = data.STATUS;
      const orderId = data.ORDERID;
      const txnAmount = parseFloat(data.TXNAMOUNT);
      const expectedAmount = parseFloat(amount);

      if (status === 'TXN_SUCCESS' && orderId === invoiceNo) {
        if (!isNaN(expectedAmount) && Math.abs(txnAmount - expectedAmount) > 0.01) {
          logger.warn('Paytm amount mismatch for %s: expected %s, got %s', invoiceNo, expectedAmount, txnAmount);
          return res.status(200).json({
            verified: false,
            status: 'AMOUNT_MISMATCH',
            message: `Amount mismatch: expected ₹${expectedAmount}, received ₹${txnAmount}`,
            receivedAmount: txnAmount,
          });
        }

        const utr = data.BANKTXNID || data.TXNID || `PAYTM-${Date.now()}`;
        const txnId = data.TXNID || utr;

        // Automatically update invoice in database if invoice exists
        const targetId = invoiceId || invoiceNo;
        const invoice = await invoiceRepository.findById(targetId, companyId);
        if (invoice) {
          if (invoice.referenceNumber !== utr) {
            invoice.referenceNumber = utr;
            invoice.paymentMethod = 'UPI';

            // Only update amounts if paying remaining balance on an existing invoice
            if (invoice.paymentStatus !== 'Paid') {
              if (txnAmount >= (invoice.balanceDue || 0) && (invoice.balanceDue || 0) > 0) {
                const oldBalanceDue = invoice.balanceDue;
                invoice.paymentStatus = 'Paid';
                invoice.amountPaid = invoice.grandTotal;
                invoice.balanceDue = 0;
                if (invoice.customerId && oldBalanceDue > 0) {
                  await customerRepository.adjustOutstanding(invoice.customerId, companyId, -oldBalanceDue);
                }
              } else if (txnAmount < (invoice.balanceDue || 0) && (invoice.balanceDue || 0) > 0 && invoice.amountPaid !== txnAmount) {
                invoice.amountPaid = (invoice.amountPaid || 0) + txnAmount;
                invoice.balanceDue = Math.max(0, invoice.grandTotal - invoice.amountPaid);
                invoice.paymentStatus = invoice.balanceDue === 0 ? 'Paid' : 'Partial';
                if (invoice.customerId) {
                  await customerRepository.adjustOutstanding(invoice.customerId, companyId, -txnAmount);
                }
              }
            }
            invoice.updatedBy = req.user.name || 'UPI QR Auto-Verify';
            await invoice.save();

            // Create payment receipt record for actual transaction amount
            const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            await paymentRepository.create({
              paymentId,
              companyId,
              date: new Date().toISOString().split('T')[0],
              type: 'CustomerReceipt',
              contactId: invoice.customerId,
              contactName: invoice.customerName,
              amount: txnAmount,
              paymentMethod: 'UPI',
              referenceNumber: utr,
              notes: `Auto-verified via UPI QR against ${invoice.invoiceNumber}`,
              createdBy: 'UPI QR Auto-Verify',
              updatedBy: 'UPI QR Auto-Verify',
            });

            await touchCompanyData(companyId, req.headers['x-socket-id'], 'Invoices', 'UPDATE', invoice.invoiceId || invoice._id, invoice);
          }
        }

        return res.status(200).json({
          verified: true,
          status: 'SUCCESS',
          utr,
          txnId,
          amount: txnAmount,
          paymentDate: data.TXNDATE,
          message: 'Payment verified successfully!',
        });
      }

      return res.status(200).json({
        verified: false,
        status: status || 'PENDING',
        message: data.RESPMSG || 'Payment not completed yet',
      });
    } catch (error) {
      logger.error('Error during Paytm verification: %s', error.message);
      next(error);
    }
  }
}

export default new PaymentController();
