/**
 * Standard bilingual dictionary for AgriBiz Customer GST Invoices and Quotations.
 * Carefully balanced: Natural Marathi for customer communication,
 * standard English for statutory GST, HSN/SAC, PAN, GSTIN, CGST/SGST/IGST, banking identifiers.
 */

export interface InvoiceLabels {
  // Document titles
  taxInvoice: string;
  quotationTitle: string;
  invoiceNo: string;
  quotationNo: string;
  date: string;
  validUntil: string;
  dueDate: string;
  originalForRecipient: string;

  // Business Header Labels
  email: string;
  mob: string;
  web: string;
  gstin: string;
  pan: string;

  // Customer / Bill To
  billTo: string;
  customerName: string;
  address: string;
  phone: string;
  walkInCustomer: string;
  addressNa: string;
  state: string;

  // Payment section
  paymentInfo: string;
  paymentStatus: string;
  paymentMethod: string;
  statusPaid: string;
  statusPartial: string;
  statusUnpaid: string;
  methodCash: string;
  methodUpi: string;
  methodBankTransfer: string;
  methodCheque: string;
  chequeNo: string;
  txnRefNo: string;
  dueBy: string;

  // Product Table
  srNo: string;
  itemDescription: string;
  hsn: string;
  gstRate: string;
  price: string;
  qty: string;
  discount: string;
  total: string;

  // Financial Summary
  taxableAmount: string;
  subtotal: string;
  discountMinus: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalAmount: string;
  collectedAmount: string;
  balanceDue: string;
  amountInWords: string;

  // Bank & Conditions
  bankDetails: string;
  bank: string;
  acName: string;
  acNo: string;
  ifsc: string;
  upi: string;
  termsConditions: string;
  note: string;

  // Signatures
  receiversSignature: string;
  authorizedSignature: string;
  forCompany: string;

  // Footer & Misc
  footerMessage: string;
  thankYouMessage: string;
  computerGeneratedNotice: string;
}

export const INVOICE_LABELS_MR: InvoiceLabels = {
  // Document titles
  taxInvoice: 'कर चलन',
  quotationTitle: 'अंदाजपत्रक / कोटेशन',
  invoiceNo: 'Invoice No.',
  quotationNo: 'Quotation No.',
  date: 'दिनांक',
  validUntil: 'वैधता दिनांक',
  dueDate: 'देय दिनांक',
  originalForRecipient: 'मूळ प्रत (ग्राहक)',

  // Business Header Labels
  email: 'ईमेल:',
  mob: 'मोबाईल:',
  web: 'वेबसाइट:',
  gstin: 'GSTIN:',
  pan: 'PAN:',

  // Customer / Bill To
  billTo: 'ग्राहकाची माहिती',
  customerName: 'ग्राहकाचे नाव',
  address: 'पत्ता',
  phone: 'मोबाईल',
  walkInCustomer: 'थेट ग्राहक (Walk-in)',
  addressNa: 'पत्ता उपलब्ध नाही',
  state: 'राज्य',

  // Payment section
  paymentInfo: 'देयक तपशील',
  paymentStatus: 'स्थिती',
  paymentMethod: 'पद्धत',
  statusPaid: 'पूर्ण अदा (PAID)',
  statusPartial: 'अंशतः अदा (PARTIAL)',
  statusUnpaid: 'बाकी (UNPAID)',
  methodCash: 'रोख (Cash)',
  methodUpi: 'UPI',
  methodBankTransfer: 'बँक ट्रान्सफर',
  methodCheque: 'चेक (Cheque)',
  chequeNo: 'चेक क्र.',
  txnRefNo: 'व्यवहार क्र. (Txn ID)',
  dueBy: 'देय दिनांक:',

  // Product Table
  srNo: 'अ. क्र.',
  itemDescription: 'वस्तूचे नाव / तपशील',
  hsn: 'HSN/SAC',
  gstRate: 'GST %',
  price: 'दर (₹)',
  qty: 'नग / प्रमाण',
  discount: 'सवलत (%)',
  total: 'एकूण रक्कम (₹)',

  // Financial Summary
  taxableAmount: 'करपात्र रक्कम',
  subtotal: 'उपएकूण',
  discountMinus: 'सवलत (-)',
  cgst: 'CGST',
  sgst: 'SGST',
  igst: 'IGST',
  totalAmount: 'एकूण देय रक्कम',
  collectedAmount: 'प्राप्त रक्कम',
  balanceDue: 'शिल्लक बाकी',
  amountInWords: 'अक्षरी रक्कम',

  // Bank & Conditions
  bankDetails: 'बँक तपशील (BANK DETAILS):',
  bank: 'बँक:',
  acName: 'खातेदाराचे नाव:',
  acNo: 'खाते क्र.:',
  ifsc: 'IFSC:',
  upi: 'UPI:',
  termsConditions: 'नियम व अटी (TERMS & CONDITIONS):',
  note: 'टीप (NOTE):',

  // Signatures
  receiversSignature: 'ग्राहकाची सही',
  authorizedSignature: 'अधिकृत स्वाक्षरी',
  forCompany: 'करिता:',

  // Footer & Misc
  footerMessage: 'आपल्या व्यवसायाबद्दल धन्यवाद! पुन्हा भेट द्या.',
  thankYouMessage: 'आपल्या व्यवसायाबद्दल धन्यवाद! पुन्हा भेट द्या.',
  computerGeneratedNotice: 'संगणकीकृत कर चलन',
};

export const INVOICE_LABELS_EN: InvoiceLabels = {
  // Document titles
  taxInvoice: 'TAX INVOICE',
  quotationTitle: 'ESTIMATE / QUOTATION',
  invoiceNo: 'Invoice No.',
  quotationNo: 'Quotation No.',
  date: 'Date',
  validUntil: 'Valid Until',
  dueDate: 'Due Date',
  originalForRecipient: 'Original for Recipient',

  // Business Header Labels
  email: 'Email:',
  mob: 'Mob:',
  web: 'Web:',
  gstin: 'GSTIN:',
  pan: 'PAN:',

  // Customer / Bill To
  billTo: 'BILL TO / CUSTOMER DETAILS',
  customerName: 'Customer Name',
  address: 'Address',
  phone: 'Phone',
  walkInCustomer: 'Walk-in Customer',
  addressNa: 'Address: N/A',
  state: 'State',

  // Payment section
  paymentInfo: 'PAYMENT INFO',
  paymentStatus: 'Status',
  paymentMethod: 'Method',
  statusPaid: 'PAID',
  statusPartial: 'PARTIAL',
  statusUnpaid: 'UNPAID',
  methodCash: 'Cash',
  methodUpi: 'UPI',
  methodBankTransfer: 'Bank Transfer',
  methodCheque: 'Cheque',
  chequeNo: 'Cheque No.',
  txnRefNo: 'Txn / UTR No.',
  dueBy: 'Due By:',

  // Product Table
  srNo: 'Sr.',
  itemDescription: 'Product / Description',
  hsn: 'HSN/SAC',
  gstRate: 'GST %',
  price: 'Rate (₹)',
  qty: 'Qty',
  discount: 'Disc (%)',
  total: 'Total (₹)',

  // Financial Summary
  taxableAmount: 'Taxable Amount',
  subtotal: 'Subtotal',
  discountMinus: 'Discount (-)',
  cgst: 'CGST',
  sgst: 'SGST',
  igst: 'IGST',
  totalAmount: 'TOTAL AMOUNT',
  collectedAmount: 'Amount Collected',
  balanceDue: 'Balance Due',
  amountInWords: 'Amount in Words',

  // Bank & Conditions
  bankDetails: 'BANK DETAILS:',
  bank: 'Bank:',
  acName: 'A/c Name:',
  acNo: 'A/c No:',
  ifsc: 'IFSC:',
  upi: 'UPI:',
  termsConditions: 'TERMS & CONDITIONS:',
  note: 'NOTE:',

  // Signatures
  receiversSignature: "Receiver's Signature",
  authorizedSignature: 'Authorized Signatory',
  forCompany: 'For:',

  // Footer & Misc
  footerMessage: 'Thank you for your business! Visit again.',
  thankYouMessage: 'Thank you for your business! Visit again.',
  computerGeneratedNotice: 'Computer Generated Invoice',
};

export function getInvoiceLabels(lang: 'mr' | 'en' = 'mr'): InvoiceLabels {
  return lang === 'en' ? INVOICE_LABELS_EN : INVOICE_LABELS_MR;
}
