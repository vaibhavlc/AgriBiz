/**
 * Cascade Delete Utility
 * Deletes a company AND all related data across every collection.
 * Collections: companies, users, invoices, quotations, purchases, payments,
 *              expenses, products, customers, suppliers, settings, recyclebins, refreshtokens
 */
import mongoose from 'mongoose';

export async function cascadeDeleteCompany(companyId) {
  const db = mongoose.connection.db;

  const collections = [
    'invoices',
    'quotations',
    'purchases',
    'payments',
    'expenses',
    'products',
    'customers',
    'suppliers',
    'settings',
    'recyclebins',
    'recyclebinitems',
    'refreshtokens',
    'users',
  ];

  const results = {};

  for (const col of collections) {
    try {
      const res = await db.collection(col).deleteMany({ companyId });
      if (res.deletedCount > 0) {
        results[col] = res.deletedCount;
      }
    } catch (err) {
      // Collection might not exist yet — skip
      results[col] = `skipped (${err.message})`;
    }
  }

  // Finally delete the company itself
  const companyRes = await db.collection('companies').deleteOne({ companyId });
  results['companies'] = companyRes.deletedCount;

  return results;
}

/**
 * Cascade delete by mobile number (looks up company first)
 */
export async function cascadeDeleteByMobile(mobile) {
  const db = mongoose.connection.db;

  const company = await db.collection('companies').findOne({ mobile });
  if (!company) {
    return { found: false };
  }

  const companyId = company.companyId || company._id.toString();
  const results = await cascadeDeleteCompany(companyId);

  return { found: true, businessName: company.businessName, companyId, results };
}
