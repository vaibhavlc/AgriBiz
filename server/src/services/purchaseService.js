import purchaseRepository from '../repositories/purchaseRepository.js';
import productRepository from '../repositories/productRepository.js';
import supplierRepository from '../repositories/supplierRepository.js';
import paymentRepository from '../repositories/paymentRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';

class PurchaseService {
  async getPurchase(purchaseId, companyId) {
    return purchaseRepository.findById(purchaseId, companyId);
  }

  async getAllPurchases(companyId) {
    return purchaseRepository.findAll(companyId);
  }

  async createPurchase(purchaseData, companyId, createdBy) {
    return runInTransaction(async (session) => {
      const purchasePayload = {
        ...purchaseData,
        companyId,
        createdBy,
        updatedBy: createdBy,
      };

      const updateTasks = [];

      // Add product stock levels
      if (purchasePayload.items && Array.isArray(purchasePayload.items)) {
        for (const item of purchasePayload.items) {
          if (item && item.productId && item.quantity) {
            updateTasks.push(
              productRepository.incrementStock(item.productId, companyId, item.quantity, session)
            );
          }
        }
      }

      // Add balance due to supplier outstanding balance
      if (purchasePayload.supplierId && purchasePayload.balanceDue) {
        updateTasks.push(
          supplierRepository.adjustOutstanding(purchasePayload.supplierId, companyId, purchasePayload.balanceDue, session)
        );
      }

      // Create Payment log if purchase was paid instantly
      if (purchasePayload.amountPaid > 0 && purchasePayload.supplierId) {
        const paymentPayload = {
          paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          companyId,
          date: purchasePayload.date,
          type: 'SupplierPayment',
          contactId: purchasePayload.supplierId,
          contactName: purchasePayload.supplierName,
          amount: purchasePayload.amountPaid,
          paymentMethod: purchasePayload.paymentMethod || 'Bank Transfer',
          notes: `Against bill ${purchasePayload.purchaseNumber}`,
          createdBy,
          updatedBy: createdBy,
        };
        updateTasks.push(paymentRepository.create(paymentPayload, session));
      }

      const [purchase] = await Promise.all([
        purchaseRepository.create(purchasePayload, session),
        ...updateTasks,
      ]);

      return purchase;
    });
  }

  async updatePurchase(purchaseId, companyId, purchaseData, updatedBy) {
    return runInTransaction(async (session) => {
      const oldPurchase = await purchaseRepository.findById(purchaseId, companyId, session);
      if (!oldPurchase) {
        const err = new Error('Purchase not found');
        err.statusCode = 404;
        throw err;
      }

      // Revert old product stock additions
      if (oldPurchase.items && Array.isArray(oldPurchase.items)) {
        for (const item of oldPurchase.items) {
          if (item && item.productId && item.quantity) {
            await productRepository.incrementStock(item.productId, companyId, -item.quantity, session);
          }
        }
      }

      // Revert old supplier outstanding adjustments
      if (oldPurchase.supplierId && oldPurchase.balanceDue) {
        await supplierRepository.adjustOutstanding(oldPurchase.supplierId, companyId, -oldPurchase.balanceDue, session);
      }

      // Apply new product stock additions
      if (purchaseData.items && Array.isArray(purchaseData.items)) {
        for (const item of purchaseData.items) {
          if (item && item.productId && item.quantity) {
            await productRepository.incrementStock(item.productId, companyId, item.quantity, session);
          }
        }
      }

      // Apply new supplier outstanding adjustments
      if (purchaseData.supplierId && purchaseData.balanceDue) {
        await supplierRepository.adjustOutstanding(purchaseData.supplierId, companyId, purchaseData.balanceDue, session);
      }

      const purchasePayload = {
        ...purchaseData,
        updatedBy,
      };
      return purchaseRepository.update(purchaseId, companyId, purchasePayload, session);
    });
  }

  async deletePurchase(purchaseId, companyId, deletedBy) {
    return runInTransaction(async (session) => {
      const purchase = await purchaseRepository.findById(purchaseId, companyId, session);
      if (!purchase) {
        const existing = await purchaseRepository.findAny(purchaseId, companyId, session);
        if (existing && existing.isDeleted) {
          return existing; // Idempotent: already soft deleted
        }
        const err = new Error('Purchase not found');
        err.statusCode = 404;
        throw err;
      }

      // Revert product stocks (deduct the stock added by the purchase)
      if (purchase.items && Array.isArray(purchase.items)) {
        for (const item of purchase.items) {
          if (item && item.productId && item.quantity) {
            try {
              await productRepository.incrementStock(item.productId, companyId, -item.quantity, session);
            } catch (pErr) {}
          }
        }
      }

      // Revert supplier outstanding balance
      if (purchase.supplierId && purchase.balanceDue) {
        try {
          await supplierRepository.adjustOutstanding(purchase.supplierId, companyId, -purchase.balanceDue, session);
        } catch (sErr) {}
      }

      // Record to Recycle Bin
      try {
        const plainPurchase = purchase.toObject ? purchase.toObject() : JSON.parse(JSON.stringify(purchase));
        const effectiveDeleter = deletedBy || 'System';
        const recycleBinItemData = {
          recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          companyId,
          originalId: purchase.purchaseId || purchase._id?.toString() || purchaseId,
          name: purchase.purchaseNumber || purchaseId,
          module: 'Purchase',
          deletedAt: new Date().toISOString(),
          deletedBy: effectiveDeleter,
          originalData: plainPurchase,
        };
        await recycleBinRepository.create(recycleBinItemData, session);
      } catch (rErr) {
        console.warn('Recycle bin record warning:', rErr.message);
      }

      // Perform soft delete
      const effectiveDeleter = deletedBy || 'System';
      return purchaseRepository.softDelete(purchaseId, companyId, effectiveDeleter, session);
    });
  }

  async returnPurchase(purchaseId, companyId, returnData, createdBy) {
    return runInTransaction(async (session) => {
      const purchase = await purchaseRepository.findById(purchaseId, companyId, session);
      if (!purchase) {
        const err = new Error('Purchase not found');
        err.statusCode = 404;
        throw err;
      }

      // Deduct returned quantity from stock (Stock OUT)
      if (returnData.items && Array.isArray(returnData.items)) {
        for (const item of returnData.items) {
          if (item && item.productId && item.quantity) {
            await productRepository.incrementStock(item.productId, companyId, -item.quantity, session);
          }
        }
      }

      if (purchase.supplierId && returnData.returnAmount) {
        await supplierRepository.adjustOutstanding(purchase.supplierId, companyId, -returnData.returnAmount, session);
      }

      const updatedItems = (purchase.items || []).map((pItem) => {
        const retItem = (returnData.items || []).find((r) => r.productId === pItem.productId);
        if (retItem) {
          return {
            ...pItem,
            returnedQuantity: (pItem.returnedQuantity || 0) + retItem.quantity,
          };
        }
        return pItem;
      });

      return purchaseRepository.update(
        purchaseId,
        companyId,
        {
          items: updatedItems,
          status: 'Returned',
          returnNotes: returnData.notes || 'Purchase Return processed',
          updatedBy: createdBy,
        },
        session
      );
    });
  }
}

export default new PurchaseService();
