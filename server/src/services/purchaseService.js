import purchaseRepository from '../repositories/purchaseRepository.js';
import productRepository from '../repositories/productRepository.js';
import supplierRepository from '../repositories/supplierRepository.js';
import paymentRepository from '../repositories/paymentRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { normalizeRecycleBinData } from '../utils/normalizeRecycleBinData.js';

class PurchaseService {
  async getPurchase(purchaseId, companyId) {
    return purchaseRepository.findById(purchaseId, companyId);
  }

  async getAllPurchases(companyId) {
    return purchaseRepository.findAll(companyId);
  }

  async createPurchase(purchaseData, companyId, createdBy) {
    if (!companyId) {
      const err = new Error('Company ID is required for tenant operations.');
      err.statusCode = 400;
      throw err;
    }
    if (!createdBy) {
      const err = new Error('Authenticated user identity is required.');
      err.statusCode = 400;
      throw err;
    }

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
    if (!companyId) {
      const err = new Error('Company ID is required.');
      err.statusCode = 400;
      throw err;
    }
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
    if (!companyId) {
      const err = new Error('Company ID is required for deletion.');
      err.statusCode = 400;
      throw err;
    }
    if (!deletedBy) {
      const err = new Error('Authenticated user identity is required for deletion.');
      err.statusCode = 400;
      throw err;
    }

    return runInTransaction(async (session) => {
      let purchase = await purchaseRepository.findById(purchaseId, companyId, session);
      if (!purchase) {
        purchase = await purchaseRepository.findAny(purchaseId, companyId, session);
      }
      if (!purchase) {
        const err = new Error('Purchase not found');
        err.statusCode = 404;
        throw err;
      }
      if (purchase.isDeleted) {
        return purchase; // Idempotent: already soft deleted
      }

      // Revert product stocks (deduct stock added by purchase)
      if (purchase.items && Array.isArray(purchase.items)) {
        for (const item of purchase.items) {
          if (item && item.productId && item.quantity) {
            await productRepository.incrementStock(item.productId, companyId, -item.quantity, session);
          }
        }
      }

      // Revert supplier outstanding balance
      if (purchase.supplierId && purchase.balanceDue) {
        await supplierRepository.adjustOutstanding(purchase.supplierId, companyId, -purchase.balanceDue, session);
      }

      // Atomic Recycle Bin record creation
      const plainPurchase = normalizeRecycleBinData(purchase);
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        companyId,
        originalId: purchase.purchaseId || purchase._id?.toString() || purchaseId,
        name: purchase.purchaseNumber || purchaseId,
        module: 'Purchase',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: plainPurchase,
      };
      await recycleBinRepository.create(recycleBinItemData, session);

      // Perform soft delete strictly scoped to companyId and session
      const softDeleted = await purchaseRepository.softDelete(purchaseId, companyId, deletedBy, session);
      return softDeleted || purchase;
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
