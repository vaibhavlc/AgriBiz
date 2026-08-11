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

      // Revert old product stock increases
      for (const item of oldPurchase.items) {
        const product = await productRepository.findById(item.productId, companyId);
        if (product) {
          const revertedStock = Math.max(0, product.stock - item.quantity);
          await productRepository.update(item.productId, companyId, { stock: revertedStock }, session);
        }
      }

      // Revert old supplier outstanding adjustments
      const supplier = await supplierRepository.findById(oldPurchase.supplierId, companyId);
      if (supplier) {
        const revertedOutstanding = supplier.outstanding - oldPurchase.balanceDue;
        await supplierRepository.update(oldPurchase.supplierId, companyId, { outstanding: revertedOutstanding }, session);
      }

      // Apply new product stock increases
      for (const item of purchaseData.items) {
        const product = await productRepository.findById(item.productId, companyId);
        if (!product) throw new Error(`Product ${item.productName} not found`);
        const newStock = product.stock + item.quantity;
        await productRepository.update(item.productId, companyId, { stock: newStock }, session);
      }

      // Apply new supplier outstanding adjustments
      const currentSupplier = await supplierRepository.findById(purchaseData.supplierId, companyId);
      if (!currentSupplier) throw new Error('Supplier not found');
      const newOutstanding = currentSupplier.outstanding + purchaseData.balanceDue;
      await supplierRepository.update(purchaseData.supplierId, companyId, { outstanding: newOutstanding }, session);

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
        const product = await productRepository.findById(item.productId, companyId);
        if (product) {
          const revertedStock = Math.max(0, product.stock - item.quantity);
          await productRepository.update(item.productId, companyId, { stock: revertedStock }, session);
        }
      }

      // Revert supplier outstanding balance
      const supplier = await supplierRepository.findById(purchase.supplierId, companyId);
      if (supplier) {
        const revertedOutstanding = Math.max(0, supplier.outstanding - purchase.balanceDue);
        await supplierRepository.update(purchase.supplierId, companyId, { outstanding: revertedOutstanding }, session);
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
}

export default new PurchaseService();
