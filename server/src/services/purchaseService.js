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
          updateTasks.push(
            productRepository.incrementStock(item.productId, companyId, item.quantity, session)
          );
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
      const oldPurchase = await purchaseRepository.findById(purchaseId, companyId);
      if (!oldPurchase) throw new Error('Purchase not found');

      // Revert old product stock additions
      for (const item of oldPurchase.items) {
        await productRepository.incrementStock(item.productId, companyId, -item.quantity, session);
      }

      // Revert old supplier outstanding adjustments
      if (oldPurchase.supplierId && oldPurchase.balanceDue) {
        await supplierRepository.adjustOutstanding(oldPurchase.supplierId, companyId, -oldPurchase.balanceDue, session);
      }

      // Apply new product stock additions
      for (const item of purchaseData.items) {
        await productRepository.incrementStock(item.productId, companyId, item.quantity, session);
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
      const purchase = await purchaseRepository.findById(purchaseId, companyId);
      if (!purchase) throw new Error('Purchase not found');

      // Revert product stocks (deduct the stock added by the purchase)
      for (const item of purchase.items) {
        await productRepository.incrementStock(item.productId, companyId, -item.quantity, session);
      }

      // Revert supplier outstanding balance
      if (purchase.supplierId && purchase.balanceDue) {
        await supplierRepository.adjustOutstanding(purchase.supplierId, companyId, -purchase.balanceDue, session);
      }

      // Record to Recycle Bin
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyId,
        originalId: purchase.purchaseId,
        name: purchase.purchaseNumber,
        module: 'Purchase',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: purchase,
      };
      await recycleBinRepository.create(recycleBinItemData, session);

      // Perform soft delete
      return purchaseRepository.softDelete(purchaseId, companyId, deletedBy, session);
    });
  }

  async returnPurchase(purchaseId, companyId, returnData, createdBy) {
    return runInTransaction(async (session) => {
      const purchase = await purchaseRepository.findById(purchaseId, companyId);
      if (!purchase) throw new Error('Purchase not found');

      // Deduct returned quantity from stock (Stock OUT)
      if (returnData.items && Array.isArray(returnData.items)) {
        for (const item of returnData.items) {
          await productRepository.incrementStock(item.productId, companyId, -item.quantity, session);
        }
      }

      if (purchase.supplierId && returnData.returnAmount) {
        await supplierRepository.adjustOutstanding(purchase.supplierId, companyId, -returnData.returnAmount, session);
      }

      const updatedItems = purchase.items.map((pItem) => {
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
