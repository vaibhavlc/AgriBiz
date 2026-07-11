import type { Product, Customer, Supplier, Invoice, Purchase, Payment, BusinessSettings, Expense } from '../types';

// Helper to format currency dynamically based on settings
export const formatCurrency = (amount: number, symbol?: string): string => {
  let currencySym = symbol;
  if (!currencySym) {
    try {
      const localSettings = localStorage.getItem('agribiz_settings');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        currencySym = parsed.currencySymbol;
      }
    } catch (e) {
      // ignore
    }
  }
  if (!currencySym) currencySym = '₹';

  const formattedValue = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currencySym}${formattedValue}`;
};

// Keep formatINR as an alias for backward compatibility
export const formatINR = (amount: number): string => {
  return formatCurrency(amount);
};

// Helper to format dates consistently based on settings
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  
  let dateFormat = 'DD/MM/YYYY';
  try {
    const localSettings = localStorage.getItem('agribiz_settings');
    if (localSettings) {
      const parsed = JSON.parse(localSettings);
      if (parsed.dateFormat) {
        dateFormat = parsed.dateFormat;
      }
    }
  } catch (e) {
    // ignore
  }

  const day = String(date.getDate()).padStart(2, '0');
  const monthNumeric = String(date.getMonth() + 1).padStart(2, '0');
  const monthShort = date.toLocaleDateString('en-IN', { month: 'short' });
  const year = date.getFullYear();

  if (dateFormat === 'YYYY-MM-DD') {
    return `${year}-${monthNumeric}-${day}`;
  }
  if (dateFormat === 'DD-MM-YYYY') {
    return `${day}-${monthNumeric}-${year}`;
  }
  if (dateFormat === 'MM/DD/YYYY') {
    return `${monthNumeric}/${day}/${year}`;
  }
  // Default fallback to DD MMM YYYY (e.g. 10 Jul 2026)
  return `${day} ${monthShort} ${year}`;
};

// Helper to format split address fields dynamically
export const getFullAddress = (settings: any): string => {
  if (!settings) return '';
  if (!settings.addressLine1) return settings.address || '';
  const parts = [
    settings.addressLine1,
    settings.addressLine2,
    settings.city,
    settings.taluka ? `Taluka: ${settings.taluka}` : '',
    settings.district,
    settings.state,
  ].filter(p => p && p.trim() !== '');

  let addr = parts.join(', ');
  if (settings.pincode && settings.pincode.trim() !== '') {
    addr += ` - ${settings.pincode}`;
  }
  return addr;
};

export const initialProducts: Product[] = [
  {
    id: 'P101',
    name: 'Mahindra 5-Tyne Cultivator',
    sku: 'MC-TY5-001',
    category: 'Machinery',
    stock: 12,
    minStock: 3,
    purchasePrice: 18000,
    sellingPrice: 22500,
    gstRate: 12,
    hsn: '8432',
  },
  {
    id: 'P102',
    name: 'Fieldking Rotavator 6 Feet',
    sku: 'FR-6FT-002',
    category: 'Machinery',
    stock: 5,
    minStock: 2,
    purchasePrice: 85000,
    sellingPrice: 98000,
    gstRate: 12,
    hsn: '8432',
  },
  {
    id: 'P103',
    name: 'Honda Power Tiller F501',
    sku: 'HP-TL5-003',
    category: 'Machinery',
    stock: 2,
    minStock: 2,
    purchasePrice: 48000,
    sellingPrice: 55000,
    gstRate: 12,
    hsn: '8432',
  },
  {
    id: 'P104',
    name: 'Varuna Submersible Pump 5HP',
    sku: 'VP-SB5-004',
    category: 'Irrigation',
    stock: 8,
    minStock: 3,
    purchasePrice: 14500,
    sellingPrice: 16800,
    gstRate: 18,
    hsn: '8413',
  },
  {
    id: 'P105',
    name: 'Finolex 3-Inch HDPE Pipe (6m)',
    sku: 'FP-HD3-005',
    category: 'Irrigation',
    stock: 120,
    minStock: 25,
    purchasePrice: 450,
    sellingPrice: 580,
    gstRate: 18,
    hsn: '3917',
  },
  {
    id: 'P106',
    name: 'Kisan Sprayer 16L (Battery)',
    sku: 'KS-BP16-006',
    category: 'Equipment',
    stock: 25,
    minStock: 8,
    purchasePrice: 1600,
    sellingPrice: 2200,
    gstRate: 12,
    hsn: '8424',
  },
  {
    id: 'P107',
    name: 'Lota Heater 1500W (Agriculture)',
    sku: 'LH-AG15-007',
    category: 'Implements',
    stock: 18,
    minStock: 5,
    purchasePrice: 800,
    sellingPrice: 1100,
    gstRate: 18,
    hsn: '8516',
  },
  {
    id: 'P108',
    name: 'Iron Nagar (Plough - Handcrafted)',
    sku: 'IN-PLG-008',
    category: 'Implements',
    stock: 3,
    minStock: 2,
    purchasePrice: 2500,
    sellingPrice: 3200,
    gstRate: 5,
    hsn: '8432',
  },
  {
    id: 'P109',
    name: 'Rotavator Blade Heavy Duty',
    sku: 'RB-HD-009',
    category: 'Spares',
    stock: 15,
    minStock: 20,
    purchasePrice: 120,
    sellingPrice: 180,
    gstRate: 18,
    hsn: '8432',
  },
  {
    id: 'P110',
    name: 'Tiller Tynes Set (9 Pcs)',
    sku: 'TT-SET9-010',
    category: 'Spares',
    stock: 4,
    minStock: 6,
    purchasePrice: 1200,
    sellingPrice: 1650,
    gstRate: 18,
    hsn: '8432',
  },
];

export const initialCustomers: Customer[] = [
  {
    id: 'C201',
    name: 'Ramesh Kumar',
    phone: '9876543210',
    email: 'ramesh.farm@gmail.com',
    address: 'Ward No. 4, Pipariya Village, Madhya Pradesh',
    state: 'Madhya Pradesh',
    gstin: '23AABCR1234F1Z5',
    outstanding: 12500,
  },
  {
    id: 'C202',
    name: 'Sanjay Patil',
    phone: '9425012345',
    email: 'patilsanjay@yahoo.com',
    address: 'Near Sugar Factory, Bardoli, Gujarat',
    state: 'Gujarat',
    outstanding: 45000,
  },
  {
    id: 'C203',
    name: 'Gurpreet Singh',
    phone: '9814098765',
    email: 'singh.gurpreet@outlook.com',
    address: 'G.T. Road, Khanna, Punjab',
    state: 'Punjab',
    gstin: '03AQVPS8765A2Z0',
    outstanding: 0,
  },
  {
    id: 'C204',
    name: 'Muthu Krishnan',
    phone: '9003124578',
    email: 'muthu.agro@gmail.com',
    address: 'Salem Bypass Road, Tamil Nadu',
    state: 'Tamil Nadu',
    outstanding: 8200,
  },
  {
    id: 'C205',
    name: 'Hari Prasad Sharma',
    phone: '8109012345',
    email: 'harisharma@gmail.com',
    address: 'Bassi Village, Jaipur, Rajasthan',
    state: 'Rajasthan',
    outstanding: -1500, // Negative outstanding means advance payment/credit
  },
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'S301',
    name: 'Mahindra Agri Implements Ltd',
    phone: '1800209600',
    email: 'dealer.relations@mahindraagri.com',
    address: 'Gateway Building, Apollo Bunder, Mumbai, Maharashtra',
    gstin: '27AAACM1234M1Z2',
    outstanding: 180000,
  },
  {
    id: 'S302',
    name: 'Fieldking Agricultural Machinery',
    phone: '0161456789',
    email: 'billing@fieldking.com',
    address: 'Phase VII, Focal Point, Ludhiana, Punjab',
    gstin: '03AAACF4321F1ZX',
    outstanding: 95000,
  },
  {
    id: 'S303',
    name: 'Kisan Pumps & Motors Corp',
    phone: '0222567890',
    email: 'sales@kisanpumps.in',
    address: 'MIDC Industrial Area, Pune, Maharashtra',
    gstin: '27AAACK9988H1ZS',
    outstanding: 0,
  },
  {
    id: 'S304',
    name: 'Finolex Industries Ltd',
    phone: '0202740820',
    email: 'pipes@finolex.com',
    address: 'D-2, MIDC, Chinchwad, Pune, Maharashtra',
    gstin: '27AAACF8888P1ZN',
    outstanding: 34000,
  },
];

export const initialInvoices: Invoice[] = [
  {
    id: 'INV-001',
    invoiceNumber: 'AB-2026-001',
    date: '2026-06-15',
    customerId: 'C201',
    customerName: 'Ramesh Kumar',
    items: [
      {
        productId: 'P101',
        productName: 'Mahindra 5-Tyne Cultivator',
        quantity: 1,
        price: 22500,
        discount: 10, // 10% discount
        gstRate: 12,
        gstAmount: 2430, // (22500 - 2250) * 0.12
        subtotal: 20250, // 22500 - 2250
        total: 22680,
      },
      {
        productId: 'P107',
        productName: 'Lota Heater 1500W (Agriculture)',
        quantity: 2,
        price: 1100,
        discount: 0,
        gstRate: 18,
        gstAmount: 396, // 2200 * 0.18
        subtotal: 2200,
        total: 2596,
      },
    ],
    subtotal: 22450,
    discountTotal: 2250,
    gstTotal: 2826,
    grandTotal: 25276,
    amountPaid: 12776,
    balanceDue: 12500,
    paymentStatus: 'Partial',
    paymentMethod: 'UPI',
    notes: 'Partial payment received via GPay. Balance to be cleared in 15 days.',
  },
  {
    id: 'INV-002',
    invoiceNumber: 'AB-2026-002',
    date: '2026-06-20',
    customerId: 'C202',
    customerName: 'Sanjay Patil',
    items: [
      {
        productId: 'P102',
        productName: 'Fieldking Rotavator 6 Feet',
        quantity: 1,
        price: 98000,
        discount: 5, // 5% discount
        gstRate: 12,
        gstAmount: 11172, // (98000 - 4900) * 0.12
        subtotal: 93100,
        total: 104272,
      },
    ],
    subtotal: 93100,
    discountTotal: 4900,
    gstTotal: 11172,
    grandTotal: 104272,
    amountPaid: 59272,
    balanceDue: 45000,
    paymentStatus: 'Partial',
    paymentMethod: 'Bank Transfer',
    notes: 'RTGS transfer received. Balance due by month-end.',
  },
  {
    id: 'INV-003',
    invoiceNumber: 'AB-2026-003',
    date: '2026-06-25',
    customerId: 'C203',
    customerName: 'Gurpreet Singh',
    items: [
      {
        productId: 'P105',
        productName: 'Finolex 3-Inch HDPE Pipe (6m)',
        quantity: 15,
        price: 580,
        discount: 0,
        gstRate: 18,
        gstAmount: 1566, // 8700 * 0.18
        subtotal: 8700,
        total: 10266,
      },
      {
        productId: 'P106',
        productName: 'Kisan Sprayer 16L (Battery)',
        quantity: 2,
        price: 2200,
        discount: 0,
        gstRate: 12,
        gstAmount: 528, // 4400 * 0.12
        subtotal: 4400,
        total: 4928,
      },
    ],
    subtotal: 13100,
    discountTotal: 0,
    gstTotal: 2094,
    grandTotal: 15194,
    amountPaid: 15194,
    balanceDue: 0,
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    notes: 'Paid fully in cash at the counter.',
  },
  {
    id: 'INV-004',
    invoiceNumber: 'AB-2026-004',
    date: '2026-06-28',
    customerId: 'C204',
    customerName: 'Muthu Krishnan',
    items: [
      {
        productId: 'P104',
        productName: 'Varuna Submersible Pump 5HP',
        quantity: 1,
        price: 16800,
        discount: 10,
        gstRate: 18,
        gstAmount: 2721.6, // (16800 - 1680) * 0.18
        subtotal: 15120,
        total: 17841.6,
      },
    ],
    subtotal: 15120,
    discountTotal: 1680,
    gstTotal: 2721.6,
    grandTotal: 17841.6,
    amountPaid: 9641.6,
    balanceDue: 8200,
    paymentStatus: 'Partial',
    paymentMethod: 'UPI',
    notes: 'UPI payment received. Customer will clear balance upon installation support.',
  },
];

export const initialPurchases: Purchase[] = [
  {
    id: 'PUR-001',
    purchaseNumber: 'PUR-26-001',
    date: '2026-06-10',
    supplierId: 'S301',
    supplierName: 'Mahindra Agri Implements Ltd',
    items: [
      {
        productId: 'P101',
        productName: 'Mahindra 5-Tyne Cultivator',
        quantity: 10,
        price: 18000,
        gstRate: 12,
        gstAmount: 21600, // 180000 * 0.12
        subtotal: 180000,
        total: 201600,
      },
    ],
    subtotal: 180000,
    gstTotal: 21600,
    grandTotal: 201600,
    amountPaid: 21600, // Paid GST portion only
    balanceDue: 180000,
    paymentStatus: 'Partial',
    paymentMethod: 'Bank Transfer',
    notes: 'Initial deposit paid. Credit period of 30 days.',
  },
  {
    id: 'PUR-002',
    purchaseNumber: 'PUR-26-002',
    date: '2026-06-12',
    supplierId: 'S302',
    supplierName: 'Fieldking Agricultural Machinery',
    items: [
      {
        productId: 'P102',
        productName: 'Fieldking Rotavator 6 Feet',
        quantity: 2,
        price: 85000,
        gstRate: 12,
        gstAmount: 20400,
        subtotal: 170000,
        total: 190400,
      },
    ],
    subtotal: 170000,
    gstTotal: 20400,
    grandTotal: 190400,
    amountPaid: 95400,
    balanceDue: 95000,
    paymentStatus: 'Partial',
    paymentMethod: 'Bank Transfer',
    notes: 'Paid half of base amount plus full GST.',
  },
  {
    id: 'PUR-003',
    purchaseNumber: 'PUR-26-003',
    date: '2026-06-18',
    supplierId: 'S303',
    supplierName: 'Kisan Pumps & Motors Corp',
    items: [
      {
        productId: 'P104',
        productName: 'Varuna Submersible Pump 5HP',
        quantity: 5,
        price: 14500,
        gstRate: 18,
        gstAmount: 13050,
        subtotal: 72500,
        total: 85550,
      },
    ],
    subtotal: 72500,
    gstTotal: 13050,
    grandTotal: 85550,
    amountPaid: 85550,
    balanceDue: 0,
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer',
    notes: 'Full payment cleared online.',
  },
  {
    id: 'PUR-004',
    purchaseNumber: 'PUR-26-004',
    date: '2026-06-22',
    supplierId: 'S304',
    supplierName: 'Finolex Industries Ltd',
    items: [
      {
        productId: 'P105',
        productName: 'Finolex 3-Inch HDPE Pipe (6m)',
        quantity: 100,
        price: 450,
        gstRate: 18,
        gstAmount: 8100,
        subtotal: 45000,
        total: 53100,
      },
    ],
    subtotal: 45000,
    gstTotal: 8100,
    grandTotal: 53100,
    amountPaid: 19100,
    balanceDue: 34000,
    paymentStatus: 'Partial',
    paymentMethod: 'Cheque',
    notes: 'Cheque no: 432901 paid. Balance outstanding.',
  },
];

export const initialPayments: Payment[] = [
  {
    id: 'PAY-001',
    date: '2026-06-15',
    type: 'CustomerReceipt',
    contactId: 'C201',
    contactName: 'Ramesh Kumar',
    amount: 12776,
    paymentMethod: 'UPI',
    referenceNumber: 'UPI60615928120',
    notes: 'Against Invoice AB-2026-001',
  },
  {
    id: 'PAY-002',
    date: '2026-06-20',
    type: 'CustomerReceipt',
    contactId: 'C202',
    contactName: 'Sanjay Patil',
    amount: 59272,
    paymentMethod: 'Bank Transfer',
    referenceNumber: 'RTGSN26171928',
    notes: 'Against Invoice AB-2026-002',
  },
  {
    id: 'PAY-003',
    date: '2026-06-25',
    type: 'CustomerReceipt',
    contactId: 'C203',
    contactName: 'Gurpreet Singh',
    amount: 15194,
    paymentMethod: 'Cash',
    notes: 'Against Invoice AB-2026-003',
  },
  {
    id: 'PAY-004',
    date: '2026-06-19',
    type: 'SupplierPayment',
    contactId: 'S303',
    contactName: 'Kisan Pumps & Motors Corp',
    amount: 85550,
    paymentMethod: 'Bank Transfer',
    referenceNumber: 'NEFT261899128',
    notes: 'Clearance of Bill PUR-26-003',
  },
  {
    id: 'PAY-005',
    date: '2026-06-28',
    type: 'CustomerReceipt',
    contactId: 'C204',
    contactName: 'Muthu Krishnan',
    amount: 9641.6,
    paymentMethod: 'UPI',
    referenceNumber: 'UPI60628221049',
    notes: 'Against Invoice AB-2026-004',
  },
  {
    id: 'PAY-006',
    date: '2026-06-29',
    type: 'CustomerReceipt',
    contactId: 'C205',
    contactName: 'Hari Prasad Sharma',
    amount: 1500,
    paymentMethod: 'Cash',
    notes: 'Advance deposit for upcoming motors purchase',
  },
];

export const initialSettings: BusinessSettings = {
  // Business Information
  businessName: 'AgriBiz Seeds & Implements Store',
  ownerName: 'Vaibhav Patel',
  gstin: '23AAACA9876C1Z9',
  panNumber: 'ABCDE1234F',
  businessType: 'Partnership',
  phone: '+91 94250 98765',
  alternatePhone: '+91 76543 21098',
  email: 'contact@agribizstore.com',
  website: 'www.agribizstore.com',

  // Business Address
  addressLine1: 'Shop No. 12-14, Krishi Mandi Complex',
  addressLine2: 'Mandi Area',
  city: 'Pipariya',
  taluka: 'Pipariya',
  district: 'Hoshangabad',
  state: 'Madhya Pradesh',
  pincode: '461775',

  // Branding
  logo: '',
  watermarkLogo: '',

  // Banking Details
  bankName: 'State Bank of India',
  accountHolderName: 'AgriBiz Seeds & Implements',
  accountNumber: '39485761029',
  ifscCode: 'SBIN0000452',
  branchName: 'Pipariya Main Branch',
  upiId: 'agribiz@sbi',

  // Invoice Configuration
  invoicePrefix: 'AB-2026-',
  purchasePrefix: 'PUR-2026-',
  quotationPrefix: 'EST-2026-',
  financialYear: '2026-2027',
  defaultTerms: '1. All rates are subject to change without prior notice.\n2. Goods once sold will not be taken back.\n3. Interest @ 18% p.a. will be charged if payment is not made within 15 days.',
  invoiceTerms: '1. Goods once sold will not be taken back or exchanged.\n2. Warranty is as per the manufacturer\'s terms and conditions only.\n3. Interest @ 18% p.a. will be charged if payment is not made within 15 days of invoice date.',
  quotationTerms: '1. This quotation is valid for 15 days from the date of issue.\n2. Prices are subject to change without prior notice.\n3. GST and transportation charges are extra unless mentioned otherwise.',
  purchaseTerms: '1. Goods received in good condition and as per the purchase order.\n2. Payment is due within 30 days from the date of this bill.\n3. Any discrepancy must be reported within 7 days of delivery.',
  footerMessage: 'Thank you for your business! Visit again.',

  // Print Preferences
  showLogo: true,
  showGstin: true,
  showAddress: true,
  showContact: true,
  showBankDetails: true,
  showTerms: true,

  // Application Preferences
  theme: 'light',
  currencySymbol: '₹',
  dateFormat: 'DD/MM/YYYY',

  // Legacy fallback address
  address: 'Shop No. 12-14, Krishi Mandi Complex, Pipariya, Madhya Pradesh - 461775',
};

export const initialExpenses: Expense[] = [
  {
    id: 'EXP-001',
    date: '2026-06-01',
    category: 'Shop Rent',
    payee: 'Mandi Board Complex',
    amount: 15000,
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    referenceNumber: 'TXN202606019912',
    notes: 'June 2026 rent for Pipariya mandi complex shop',
  },
  {
    id: 'EXP-002',
    date: '2026-06-05',
    category: 'Light Bill',
    payee: 'MP Electricity Board',
    amount: 3200,
    paymentMethod: 'UPI',
    status: 'Paid',
    referenceNumber: 'UPI202606051234',
    notes: 'Electricity bill for May 2026 usage',
  },
  {
    id: 'EXP-003',
    date: '2026-06-10',
    category: 'Tea Bills',
    payee: 'Madan Tea Stall',
    amount: 650,
    paymentMethod: 'Cash',
    status: 'Paid',
    notes: 'Monthly tea stall expense for staff and visitors',
  },
  {
    id: 'EXP-004',
    date: '2026-06-12',
    category: 'Transportation',
    payee: 'Balaji Transport Co.',
    amount: 4500,
    paymentMethod: 'Cash',
    status: 'Paid',
    notes: 'Freight charge for local cultivator delivery to customer site',
  },
  {
    id: 'EXP-005',
    date: '2026-06-18',
    category: 'Maintenance',
    payee: 'Dev Hardware Shop',
    amount: 1800,
    paymentMethod: 'UPI',
    status: 'Paid',
    referenceNumber: 'UPI202606189999',
    notes: 'Repair of billing PC power supply',
  },
  {
    id: 'EXP-006',
    date: '2026-07-02',
    category: 'Shop Rent',
    payee: 'Mandi Board Complex',
    amount: 15000,
    paymentMethod: 'Bank Transfer',
    status: 'Due',
    dueDate: '2026-07-15',
    notes: 'July rent due',
  },
  {
    id: 'EXP-007',
    date: '2026-07-05',
    category: 'Light Bill',
    payee: 'MP Electricity Board',
    amount: 4100,
    paymentMethod: 'UPI',
    status: 'Due',
    dueDate: '2026-07-20',
    notes: 'July electricity bill',
  },
];
