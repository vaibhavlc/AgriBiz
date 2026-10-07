import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { translateCategory, translateStatus, translatePaymentMethod } from '../utils/statusTranslation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate, getFullAddress } from '../utils/dummyData';
import { KpiCard } from '../components/KpiCard';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Layers,
  Percent,
  FileText,
  Printer,
  Download,
  Users,
  Truck,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { t } = useTranslation();
  const {
    invoices,
    purchases,
    products,
    customers,
    suppliers,
    settings,
    expenses,
  } = useApp();

  const [activeReport, setActiveReport] = useState<'sales' | 'purchase' | 'expense' | 'profit' | 'stock' | 'gst' | 'custLedger' | 'suppLedger' | 'gstr1' | 'gstr2' | 'gstr3b'>('sales');
  
  // Date filtering state
  const [dateRange, setDateRange] = useState('All');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-07-01');

  const returnPeriod = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return start.toLocaleDateString('en-US', options);
    }
    return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  };

  const generatedOn = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Toast status alert
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (type === 'error') {
      console.error(`[TOAST ERROR] ${message}`);
    } else {
      console.log(`[TOAST ${type.toUpperCase()}] ${message}`);
    }
    setTimeout(() => setToast(null), 3500);
  };

  const reportTabsRef = useRef<HTMLDivElement>(null);

  // Center active report tab item when activeReport changes without scrolling window vertically
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      if (reportTabsRef.current) {
        const activeTabElement = reportTabsRef.current.querySelector('[data-active="true"]') as HTMLElement;
        if (activeTabElement) {
          const container = reportTabsRef.current;
          const containerRect = container.getBoundingClientRect();
          const childRect = activeTabElement.getBoundingClientRect();
          const scrollOffset = childRect.left - containerRect.left - (containerRect.width / 2) + (childRect.width / 2);
          container.scrollBy({ left: scrollOffset, behavior: 'smooth' });
        }
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [activeReport]);

  const filterByDate = (dateStr: string) => {
    if (dateRange === 'All') return true;
    const date = new Date(dateStr).getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return date >= start && date <= end;
  };
  // --- GSTR-1 Data Mappings & Calculations ---

  const GST_STATES: { [key: string]: string } = {
    'MADHYA PRADESH': '23-Madhya Pradesh',
    'GUJARAT': '24-Gujarat',
    'PUNJAB': '03-Punjab',
    'MAHARASHTRA': '27-Maharashtra',
    'RAJASTHAN': '08-Rajasthan',
    'DELHI': '07-Delhi',
    'UTTAR PRADESH': '09-Uttar Pradesh',
    'HARYANA': '06-Haryana',
    'KARNATAKA': '29-Karnataka',
    'TAMIL NADU': '33-Tamil Nadu',
    'ANDHRA PRADESH': '37-Andhra Pradesh',
    'TELANGANA': '36-Telangana',
    'KERALA': '32-Kerala',
    'WEST BENGAL': '19-West Bengal',
    'BIHAR': '10-Bihar',
    'CHHATTISGARH': '22-Chhattisgarh',
    'JHARKHAND': '20-Jharkhand',
    'ODISHA': '21-Odisha',
  };

  const resolvePOS = (custName: string): string => {
    const cust = customers.find(c => c.name === custName);
    if (!cust) return '23-Madhya Pradesh';
    if (cust.gstin && cust.gstin.length >= 2) {
      const prefix = cust.gstin.substring(0, 2);
      const found = Object.values(GST_STATES).find(s => s.startsWith(prefix));
      if (found) return found;
      return `${prefix}-Other State`;
    }
    const stateName = (cust.state || 'Madhya Pradesh').toUpperCase().trim();
    return GST_STATES[stateName] || '23-Madhya Pradesh';
  };

  const businessStateCode = settings.gstin ? settings.gstin.substring(0, 2) : '23';

  const formatGstDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  // Reusable CSV downloader
  const downloadCSVFile = (headers: string[], rows: any[][], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => {
        const strVal = val === null || val === undefined ? '' : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // B2B Sheet (Registered Outward Supplies)
  const gstr1B2BList = useMemo(() => {
    const list: Array<{
      gstin: string;
      receiverName: string;
      invoiceNumber: string;
      invoiceDate: string;
      invoiceValue: number;
      pos: string;
      reverseCharge: string;
      rate: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
    }> = [];

    const targetInvoices = invoices.filter(inv => filterByDate(inv.date));

    targetInvoices.forEach(inv => {
      const cust = customers.find(c => c.id === inv.customerId);
      if (cust && cust.gstin && cust.gstin.trim().length > 0) {
        const pos = resolvePOS(cust.name);
        const isInterState = !pos.startsWith(businessStateCode);

        // Group items in this invoice by tax rate
        const rateGroups: { [rate: number]: { taxable: number; gst: number } } = {};
        inv.items.forEach(item => {
          const rate = item.gstRate;
          if (!rateGroups[rate]) {
            rateGroups[rate] = { taxable: 0, gst: 0 };
          }
          rateGroups[rate].taxable += item.subtotal;
          rateGroups[rate].gst += item.gstAmount;
        });

        Object.entries(rateGroups).forEach(([rateStr, group]) => {
          const rate = parseFloat(rateStr);
          let cgst = 0;
          let sgst = 0;
          let igst = 0;

          if (isInterState) {
            igst = group.gst;
          } else {
            cgst = group.gst / 2;
            sgst = group.gst / 2;
          }

          list.push({
            gstin: cust.gstin!.toUpperCase(),
            receiverName: cust.name,
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: formatGstDate(inv.date),
            invoiceValue: inv.grandTotal,
            pos,
            reverseCharge: 'N',
            rate,
            taxableValue: group.taxable,
            cgst,
            sgst,
            igst
          });
        });
      }
    });

    return list;
  }, [invoices, customers, dateRange, startDate, endDate, settings.gstin]);

  // B2CS Sheet (Unregistered Consumer Small consolidated)
  const gstr1B2CSList = useMemo(() => {
    const targetInvoices = invoices.filter(inv => filterByDate(inv.date));
    const groups: { [key: string]: { pos: string; rate: number; taxable: number; cgst: number; sgst: number; igst: number } } = {};

    targetInvoices.forEach(inv => {
      const cust = customers.find(c => c.id === inv.customerId);
      if (cust && (!cust.gstin || cust.gstin.trim().length === 0)) {
        const pos = resolvePOS(cust.name);
        const isInterState = !pos.startsWith(businessStateCode);

        inv.items.forEach(item => {
          const rate = item.gstRate;
          const key = `${pos}_${rate}`;

          if (!groups[key]) {
            groups[key] = {
              pos,
              rate,
              taxable: 0,
              cgst: 0,
              sgst: 0,
              igst: 0
            };
          }

          groups[key].taxable += item.subtotal;
          if (isInterState) {
            groups[key].igst += item.gstAmount;
          } else {
            groups[key].cgst += item.gstAmount / 2;
            groups[key].sgst += item.gstAmount / 2;
          }
        });
      }
    });

    return Object.values(groups);
  }, [invoices, customers, dateRange, startDate, endDate, settings.gstin]);

  // HSN Summary Sheet (Table 12)
  const gstr1HSNList = useMemo(() => {
    const targetInvoices = invoices.filter(inv => filterByDate(inv.date));
    const groups: { [key: string]: { hsn: string; desc: string; uqc: string; qty: number; totalVal: number; taxable: number; cgst: number; sgst: number; igst: number } } = {};

    targetInvoices.forEach(inv => {
      const cust = customers.find(c => c.id === inv.customerId);
      const pos = cust ? resolvePOS(cust.name) : '23-Madhya Pradesh';
      const isInterState = !pos.startsWith(businessStateCode);

      inv.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const hsn = prod?.hsn || '8432';
        const desc = item.productName;
        
        let uqc = 'NOS-NUMBERS';
        if (prod) {
          const cat = prod.category.toUpperCase();
          if (cat.includes('SEED') || cat.includes('FERT') || cat.includes('IRR')) {
            uqc = 'BAG-BAGS';
          }
        }

        const rate = item.gstRate;
        const key = `${hsn}_${desc}_${uqc}_${rate}`;

        if (!groups[key]) {
          groups[key] = {
            hsn,
            desc,
            uqc,
            qty: 0,
            totalVal: 0,
            taxable: 0,
            cgst: 0,
            sgst: 0,
            igst: 0
          };
        }

        groups[key].qty += item.quantity;
        groups[key].taxable += item.subtotal;
        groups[key].totalVal += item.total;
        if (isInterState) {
          groups[key].igst += item.gstAmount;
        } else {
          groups[key].cgst += item.gstAmount / 2;
          groups[key].sgst += item.gstAmount / 2;
        }
      });
    });

    return Object.values(groups);
  }, [invoices, products, customers, dateRange, startDate, endDate, settings.gstin]);

  // Documents Issued Sheet (Table 13)
  const gstr1DocsSummary = useMemo(() => {
    const targetInvoices = invoices.filter(inv => filterByDate(inv.date));
    if (targetInvoices.length === 0) {
      return { from: '—', to: '—', total: 0, cancelled: 0, netIssued: 0 };
    }

    const sortedInvoices = [...targetInvoices].sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber));
    const from = sortedInvoices[0].invoiceNumber;
    const to = sortedInvoices[sortedInvoices.length - 1].invoiceNumber;
    const total = targetInvoices.length;

    return {
      from,
      to,
      total,
      cancelled: 0,
      netIssued: total
    };
  }, [invoices, dateRange, startDate, endDate]);


  // --- GSTR-2 Calculations (Inward Supplies / Purchases) ---
  const gstr2B2BList = useMemo(() => {
    const list: Array<{
      gstin: string;
      supplierName: string;
      invoiceNumber: string;
      invoiceDate: string;
      invoiceValue: number;
      pos: string;
      reverseCharge: string;
      rate: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      itcEligible: 'Inputs' | 'Capital Goods' | 'Ineligible';
    }> = [];

    const targetPurchases = purchases.filter(pur => filterByDate(pur.date));

    targetPurchases.forEach(pur => {
      const supp = suppliers.find(s => s.id === pur.supplierId);
      if (supp && supp.gstin && supp.gstin.trim().length > 0) {
        const prefix = supp.gstin.substring(0, 2);
        const supplierState = Object.values(GST_STATES).find(s => s.startsWith(prefix)) || `${prefix}-Other State`;
        const isInterState = !supplierState.startsWith(businessStateCode);

        const rateGroups: { [rate: number]: { taxable: number; gst: number } } = {};
        pur.items.forEach(item => {
          const rate = item.gstRate;
          if (!rateGroups[rate]) {
            rateGroups[rate] = { taxable: 0, gst: 0 };
          }
          rateGroups[rate].taxable += item.subtotal;
          rateGroups[rate].gst += item.gstAmount;
        });

        Object.entries(rateGroups).forEach(([rateStr, group]) => {
          const rate = parseFloat(rateStr);
          let cgst = 0;
          let sgst = 0;
          let igst = 0;

          if (isInterState) {
            igst = group.gst;
          } else {
            cgst = group.gst / 2;
            sgst = group.gst / 2;
          }

          list.push({
            gstin: supp.gstin!.toUpperCase(),
            supplierName: supp.name,
            invoiceNumber: pur.purchaseNumber,
            invoiceDate: formatGstDate(pur.date),
            invoiceValue: pur.grandTotal,
            pos: supplierState,
            reverseCharge: 'N',
            rate,
            taxableValue: group.taxable,
            cgst,
            sgst,
            igst,
            itcEligible: 'Inputs'
          });
        });
      }
    });

    return list;
  }, [purchases, suppliers, dateRange, startDate, endDate, settings.gstin]);

  const gstr2HSNList = useMemo(() => {
    const targetPurchases = purchases.filter(pur => filterByDate(pur.date));
    const groups: { [key: string]: { hsn: string; desc: string; uqc: string; qty: number; totalVal: number; taxable: number; cgst: number; sgst: number; igst: number } } = {};

    targetPurchases.forEach(pur => {
      const supp = suppliers.find(s => s.id === pur.supplierId);
      const prefix = supp && supp.gstin ? supp.gstin.substring(0, 2) : businessStateCode;
      const isInterState = prefix !== businessStateCode;

      pur.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const hsn = prod?.hsn || '3101';
        const desc = item.productName;
        
        let uqc = 'NOS-NUMBERS';
        if (prod) {
          const cat = prod.category.toUpperCase();
          if (cat.includes('SEED') || cat.includes('FERT') || cat.includes('IRR')) {
            uqc = 'BAG-BAGS';
          }
        }

        const rate = item.gstRate;
        const key = `${hsn}_${desc}_${uqc}_${rate}`;

        if (!groups[key]) {
          groups[key] = {
            hsn,
            desc,
            uqc,
            qty: 0,
            totalVal: 0,
            taxable: 0,
            cgst: 0,
            sgst: 0,
            igst: 0
          };
        }

        groups[key].qty += item.quantity;
        groups[key].taxable += item.subtotal;
        groups[key].totalVal += item.total;
        if (isInterState) {
          groups[key].igst += item.gstAmount;
        } else {
          groups[key].cgst += item.gstAmount / 2;
          groups[key].sgst += item.gstAmount / 2;
        }
      });
    });

    return Object.values(groups);
  }, [purchases, products, suppliers, dateRange, startDate, endDate, settings.gstin]);

  const gstr2DocsSummary = useMemo(() => {
    const targetPurchases = purchases.filter(pur => filterByDate(pur.date));
    if (targetPurchases.length === 0) {
      return { from: '—', to: '—', total: 0, cancelled: 0, netIssued: 0 };
    }

    const sortedPurchases = [...targetPurchases].sort((a, b) => a.purchaseNumber.localeCompare(b.purchaseNumber));
    const from = sortedPurchases[0].purchaseNumber;
    const to = sortedPurchases[sortedPurchases.length - 1].purchaseNumber;
    const total = targetPurchases.length;

    return {
      from,
      to,
      total,
      cancelled: 0,
      netIssued: total
    };
  }, [purchases, dateRange, startDate, endDate]);

  // --- GSTR-3B Calculations (Consolidated return values) ---
  const gstr3BData = useMemo(() => {
    let outwardTaxableVal = 0;
    let outwardCGST = 0;
    let outwardSGST = 0;
    let outwardIGST = 0;

    gstr1B2BList.forEach(item => {
      outwardTaxableVal += item.taxableValue;
      outwardCGST += item.cgst;
      outwardSGST += item.sgst;
      outwardIGST += item.igst;
    });

    gstr1B2CSList.forEach(item => {
      outwardTaxableVal += item.taxable;
      outwardCGST += item.cgst;
      outwardSGST += item.sgst;
      outwardIGST += item.igst;
    });

    let itcTaxableVal = 0;
    let itcCGST = 0;
    let itcSGST = 0;
    let itcIGST = 0;

    gstr2B2BList.forEach(item => {
      itcTaxableVal += item.taxableValue;
      itcCGST += item.cgst;
      itcSGST += item.sgst;
      itcIGST += item.igst;
    });

    return {
      outward: {
        taxable: outwardTaxableVal,
        cgst: outwardCGST,
        sgst: outwardSGST,
        igst: outwardIGST
      },
      itc: {
        taxable: itcTaxableVal,
        cgst: itcCGST,
        sgst: itcSGST,
        igst: itcIGST
      }
    };
  }, [gstr1B2BList, gstr1B2CSList, gstr2B2BList]);

  // CSV download handlers
  const handleExportGstr1B2B = () => {
    const headers = ['GSTIN/UIN of Recipient', 'Receiver Name', 'Invoice Number', 'Invoice Date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Invoice Type', 'E-Commerce GSTIN', 'Rate', 'Taxable Value', 'Cess Amount'];
    const rows = gstr1B2BList.map(item => [
      item.gstin,
      item.receiverName,
      item.invoiceNumber,
      item.invoiceDate,
      item.invoiceValue.toFixed(2),
      item.pos,
      item.reverseCharge,
      'Regular',
      '',
      item.rate,
      item.taxableValue.toFixed(2),
      '0.00'
    ]);
    downloadCSVFile(headers, rows, `gstr1_b2b_${startDate}_to_${endDate}.csv`);
    showToast(t('reports.b2bGstr1Exported', 'B2B GSTR-1 sheet exported successfully!'));
  };

  const handleExportGstr1B2CS = () => {
    const headers = ['Type', 'Place Of Supply', 'Applicable % of Tax Rate', 'E-Commerce GSTIN', 'Rate', 'Taxable Value', 'Cess Amount'];
    const rows = gstr1B2CSList.map(item => [
      'OE',
      item.pos,
      '',
      '',
      item.rate,
      item.taxable.toFixed(2),
      '0.00'
    ]);
    downloadCSVFile(headers, rows, `gstr1_b2cs_${startDate}_to_${endDate}.csv`);
    showToast(t('reports.b2csGstr1Exported', 'B2CS GSTR-1 sheet exported successfully!'));
  };

  const handleExportGstr1HSN = () => {
    const headers = ['HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount'];
    const rows = gstr1HSNList.map(item => [
      item.hsn,
      item.desc,
      item.uqc,
      item.qty,
      item.totalVal.toFixed(2),
      item.taxable.toFixed(2),
      item.igst.toFixed(2),
      item.cgst.toFixed(2),
      item.sgst.toFixed(2),
      '0.00'
    ]);
    downloadCSVFile(headers, rows, `gstr1_hsn_${startDate}_to_${endDate}.csv`);
    showToast(t('reports.hsnGstr1Exported', 'HSN Summary GSTR-1 sheet exported successfully!'));
  };

  const handleExportGstr1Docs = () => {
    const headers = ['Nature of Document', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled', 'Net Issued'];
    const rows = [
      [
        'Invoices for outward supply',
        gstr1DocsSummary.from,
        gstr1DocsSummary.to,
        gstr1DocsSummary.total,
        gstr1DocsSummary.cancelled,
        gstr1DocsSummary.netIssued
      ]
    ];
    downloadCSVFile(headers, rows, `gstr1_docs_${startDate}_to_${endDate}.csv`);
    showToast(t('reports.docsGstr1Exported', 'Documents Issued GSTR-1 sheet exported successfully!'));
  };

  const handleExportGstr2B2B = () => {
    const headers = ['GSTIN of Supplier', 'Supplier Name', 'Invoice Number', 'Invoice Date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Rate', 'Taxable Value', 'Integrated Tax Paid', 'Central Tax Paid', 'State/UT Tax Paid', 'ITC Eligible'];
    const rows = gstr2B2BList.map(item => [
      item.gstin,
      item.supplierName,
      item.invoiceNumber,
      item.invoiceDate,
      item.invoiceValue.toFixed(2),
      item.pos,
      item.reverseCharge,
      item.rate,
      item.taxableValue.toFixed(2),
      item.igst.toFixed(2),
      item.cgst.toFixed(2),
      item.sgst.toFixed(2),
      item.itcEligible
    ]);
    downloadCSVFile(headers, rows, `gstr2_b2b_${startDate}_to_${endDate}.csv`);
    showToast(t('reports.gstr2B2bExported', 'GSTR-2 B2B sheet exported successfully!'));
  };

  const handleExportGstr2HSN = () => {
    const headers = ['HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount'];
    const rows = gstr2HSNList.map(item => [
      item.hsn,
      item.desc,
      item.uqc,
      item.qty,
      item.totalVal.toFixed(2),
      item.taxable.toFixed(2),
      item.igst.toFixed(2),
      item.cgst.toFixed(2),
      item.sgst.toFixed(2),
      '0.00'
    ]);
    downloadCSVFile(headers, rows, `gstr2_hsn_${startDate}_to_${endDate}.csv`);
    showToast(t('reports.gstr2HsnExported', 'GSTR-2 HSN summary sheet exported successfully!'));
  };

  const handleExportGstr2Docs = () => {
    const headers = ['Nature of Document', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled', 'Net Received'];
    const rows = [
      [
        'Invoices for inward supply',
        gstr2DocsSummary.from,
        gstr2DocsSummary.to,
        gstr2DocsSummary.total,
        gstr2DocsSummary.cancelled,
        gstr2DocsSummary.netIssued
      ]
    ];
    downloadCSVFile(headers, rows, `gstr2_docs_${startDate}_to_${endDate}.csv`);
    showToast(t('reports.gstr2DocsExported', 'GSTR-2 Documents summary sheet exported successfully!'));
  };

  const handleExportGstr3B = () => {
    const headers = ['GSTR-3B Table Section', 'Nature of Supplies / Credit', 'Total {t("reports.gstr3b.taxableValueRs", "Taxable Value (₹)")}', '{t("reports.gstr3b.integratedTaxRs", "Integrated Tax (₹)")}', '{t("reports.gstr3b.centralTaxRs", "Central Tax (₹)")}', '{t("reports.gstr3b.stateUtTaxRs", "State/UT Tax (₹)")}', '{t("reports.gstr3b.cessRs", "Cess (₹)")}'];
    const rows = [
      ['Table 3.1(a)', 'Outward Taxable Supplies (other than zero rated, nil rated and exempted)', gstr3BData.outward.taxable.toFixed(2), gstr3BData.outward.igst.toFixed(2), gstr3BData.outward.cgst.toFixed(2), gstr3BData.outward.sgst.toFixed(2), '0.00'],
      ['Table 3.1(d)', 'Inward Supplies Liable to Reverse Charge', '0.00', '0.00', '0.00', '0.00', '0.00'],
      ['Table 4(A)(5)', 'All Other Eligible ITC Available', gstr3BData.itc.taxable.toFixed(2), gstr3BData.itc.igst.toFixed(2), gstr3BData.itc.cgst.toFixed(2), gstr3BData.itc.sgst.toFixed(2), '0.00'],
      ['Table 4(C)', 'Net ITC Available (A - B)', gstr3BData.itc.taxable.toFixed(2), gstr3BData.itc.igst.toFixed(2), gstr3BData.itc.cgst.toFixed(2), gstr3BData.itc.sgst.toFixed(2), '0.00']
    ];
    downloadCSVFile(headers, rows, `gstr3b_return_${startDate}_to_${endDate}.csv`);
    showToast(t('reports.gstr3bExported', 'GSTR-3B consolidated return exported successfully!'));
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Reports calculations ---

  // 1. Sales Report
  const filteredInvoices = invoices.filter((inv) => filterByDate(inv.date));
  const totalSalesVal = filteredInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalSalesTax = filteredInvoices.reduce((s, i) => s + i.gstTotal, 0);
  const totalSalesBase = filteredInvoices.reduce((s, i) => s + i.subtotal - i.discountTotal, 0);

  // 2. Purchase Report
  const filteredPurchases = purchases.filter((pur) => filterByDate(pur.date));
  const totalPurchasesVal = filteredPurchases.reduce((s, i) => s + i.grandTotal, 0);
  const totalPurchasesTax = filteredPurchases.reduce((s, i) => s + i.gstTotal, 0);
  const totalPurchasesBase = filteredPurchases.reduce((s, i) => s + i.subtotal, 0);

  // 3. Profit Report
  const coGS = filteredInvoices.reduce((sum, inv) => {
    const invCOGS = inv.items.reduce((invSum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      const cost = prod ? prod.purchasePrice : 0;
      return invSum + (item.quantity * cost);
    }, 0);
    return sum + invCOGS;
  }, 0);
  const grossProfit = totalSalesBase - coGS;
  const filteredExpenses = expenses.filter((exp) => filterByDate(exp.date));
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalPaidExpensesVal = filteredExpenses.filter(e => e.status === 'Paid').reduce((s, e) => s + e.amount, 0);
  const totalDueExpensesVal = filteredExpenses.filter(e => e.status === 'Due').reduce((s, e) => s + e.amount, 0);

  const topExpenseCategory = useMemo(() => {
    const totals: { [cat: string]: number } = {};
    filteredExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    let topCatName = 'None';
    let maxVal = 0;
    Object.entries(totals).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        topCatName = cat;
      }
    });
    return { name: topCatName, amount: maxVal };
  }, [filteredExpenses]);

  const netProfit = grossProfit;
  const profitMarginPercent = totalSalesBase > 0 ? (netProfit / totalSalesBase) * 100 : 0;

  // 4. Stock Valuation Report
  const totalStockQty = products.reduce((s, p) => s + p.stock, 0);
  const totalAssetVal = products.reduce((s, p) => s + (p.stock * p.purchasePrice), 0);
  const totalRetailVal = products.reduce((s, p) => s + (p.stock * p.sellingPrice), 0);

  // 5. GST Report (Tax filing summary)
  const totalCGSTCollected = totalSalesTax / 2;
  const totalSGSTCollected = totalSalesTax / 2;
  const totalCGSTPaid = totalPurchasesTax / 2;
  const totalSGSTPaid = totalPurchasesTax / 2;
  const netGSTDue = totalSalesTax - totalPurchasesTax;

  // Additional counts for dues ledgers and ITC
  const customersWithDues = customers.filter(c => c.outstanding > 0).length;
  const suppliersWithDues = suppliers.filter(s => s.outstanding > 0).length;
  const totalGstr2ITC = gstr2B2BList.reduce((acc, x) => acc + x.cgst + x.sgst + x.igst, 0);

  // 6. Customer Ledger Report
  const totalCustomers = customers.length;
  const pendingReceivables = customers.reduce((sum, c) => sum + (c.outstanding > 0 ? c.outstanding : 0), 0);
  const averageReceivable = customers.length > 0 ? (pendingReceivables / customers.length) : 0;

  // 7. Supplier Ledger Report
  const totalSuppliers = suppliers.length;
  const pendingPayables = suppliers.reduce((sum, s) => sum + (s.outstanding > 0 ? s.outstanding : 0), 0);
  const averagePayable = suppliers.length > 0 ? (pendingPayables / suppliers.length) : 0;

  const handleExportGstr1Consolidated = () => {
    const csvRows: string[] = [];
    csvRows.push('GSTR-1 OUTWARD SUPPLIES RETURN STATEMENT (CA-READY)');
    csvRows.push(`Period: ${startDate} to ${endDate}`);
    csvRows.push('');

    csvRows.push('--- SECTION 1: B2B REGISTERED SUPPLIES (4A; 4B; 4C; 6B; 6C) ---');
    csvRows.push(['GSTIN/UIN of Recipient', 'Receiver Name', 'Invoice Number', 'Invoice Date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Invoice Type', 'E-Commerce GSTIN', 'Rate', 'Taxable Value', 'Cess Amount'].join(','));
    gstr1B2BList.forEach(item => {
      csvRows.push([
        `"${item.gstin}"`,
        `"${item.receiverName.replace(/"/g, '""')}"`,
        `"${item.invoiceNumber}"`,
        `"${item.invoiceDate}"`,
        item.invoiceValue.toFixed(2),
        `"${item.pos}"`,
        `"${item.reverseCharge}"`,
        '"Regular"',
        '""',
        item.rate,
        item.taxableValue.toFixed(2),
        '0.00'
      ].join(','));
    });
    csvRows.push('');

    csvRows.push('--- SECTION 2: B2C SMALL OUTWARD SUPPLIES (7 - CONSOLIDATED) ---');
    csvRows.push(['Type', 'Place Of Supply', 'Applicable % of Tax Rate', 'E-Commerce GSTIN', 'Rate', 'Taxable Value', 'Cess Amount'].join(','));
    gstr1B2CSList.forEach(item => {
      csvRows.push([
        '"OE"',
        `"${item.pos}"`,
        '""',
        '""',
        item.rate,
        item.taxable.toFixed(2),
        '0.00'
      ].join(','));
    });
    csvRows.push('');

    csvRows.push('--- SECTION 3: HSN SUMMARY OF OUTWARD SUPPLIES (12) ---');
    csvRows.push(['HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount'].join(','));
    gstr1HSNList.forEach(item => {
      csvRows.push([
        `"${item.hsn}"`,
        `"${item.desc.replace(/"/g, '""')}"`,
        `"${item.uqc.split('-')[0]}"`,
        item.qty,
        item.totalVal.toFixed(2),
        item.taxable.toFixed(2),
        item.igst.toFixed(2),
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        '0.00'
      ].join(','));
    });
    csvRows.push('');

    csvRows.push('--- SECTION 4: DOCUMENTS ISSUED SUMMARY (13) ---');
    csvRows.push(['Nature of Document', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled', 'Net Issued'].join(','));
    csvRows.push([
      '"Invoices for outward supply"',
      `"${gstr1DocsSummary.from}"`,
      `"${gstr1DocsSummary.to}"`,
      gstr1DocsSummary.total,
      gstr1DocsSummary.cancelled,
      gstr1DocsSummary.netIssued
    ].join(','));

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gstr1_consolidated_return_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t('reports.gstr1ConsolidatedExported', 'Consolidated GSTR-1 Return exported successfully!'));
  };

  const handleExportGstr2Consolidated = () => {
    const csvRows: string[] = [];
    csvRows.push('GSTR-2 INWARD SUPPLIES RETURN STATEMENT (CA-READY)');
    csvRows.push(`Period: ${startDate} to ${endDate}`);
    csvRows.push('');

    csvRows.push('--- SECTION 1: B2B INWARD SUPPLIES RECEIVED FROM REGISTERED SUPPLIERS (3; 4A) ---');
    csvRows.push(['GSTIN of Supplier', 'Supplier Name', 'Invoice Number', 'Invoice Date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Rate', 'Taxable Value', 'Integrated Tax Paid', 'Central Tax Paid', 'State/UT Tax Paid', 'ITC Eligible'].join(','));
    gstr2B2BList.forEach(item => {
      csvRows.push([
        `"${item.gstin}"`,
        `"${item.supplierName.replace(/"/g, '""')}"`,
        `"${item.invoiceNumber}"`,
        `"${item.invoiceDate}"`,
        item.invoiceValue.toFixed(2),
        `"${item.pos}"`,
        `"${item.reverseCharge}"`,
        item.rate,
        item.taxableValue.toFixed(2),
        item.igst.toFixed(2),
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        `"${item.itcEligible}"`
      ].join(','));
    });
    csvRows.push('');

    csvRows.push('--- SECTION 2: HSN SUMMARY OF INWARD SUPPLIES (13) ---');
    csvRows.push(['HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount'].join(','));
    gstr2HSNList.forEach(item => {
      csvRows.push([
        `"${item.hsn}"`,
        `"${item.desc.replace(/"/g, '""')}"`,
        `"${item.uqc.split('-')[0]}"`,
        item.qty,
        item.totalVal.toFixed(2),
        item.taxable.toFixed(2),
        item.igst.toFixed(2),
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        '0.00'
      ].join(','));
    });
    csvRows.push('');

    csvRows.push('--- SECTION 3: SUMMARY OF DOCUMENTS RECEIVED ---');
    csvRows.push(['Nature of Document', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled', 'Net Received'].join(','));
    csvRows.push([
      '"Invoices for inward supply"',
      `"${gstr2DocsSummary.from}"`,
      `"${gstr2DocsSummary.to}"`,
      gstr2DocsSummary.total,
      gstr2DocsSummary.cancelled,
      gstr2DocsSummary.netIssued
    ].join(','));

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gstr2_consolidated_return_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t('reports.gstr2ConsolidatedExported', 'Consolidated GSTR-2 Return exported successfully!'));
  };

  // --- Export CSV Handler ---
  const handleExport = () => {
    if (activeReport === 'gstr1') {
      handleExportGstr1Consolidated();
      return;
    }

    if (activeReport === 'gstr2') {
      handleExportGstr2Consolidated();
      return;
    }

    if (activeReport === 'gstr3b') {
      handleExportGstr3B();
      return;
    }

    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === 'sales') {
      headers = [t("sales.invoiceNo", "Invoice No"), t("sales.customerName", "Customer Name"), t("reports.date", "Date"), t("reports.sales.taxableAmtRs", "Taxable Amt (INR)"), t("reports.sales.taxCollectedRs", "Tax Collected (INR)"), t("reports.sales.grandTotalRs", "Grand Total (INR)"), t("common.status", "Status")];
      rows = filteredInvoices.map(inv => [
        inv.invoiceNumber,
        inv.customerName,
        formatDate(inv.date),
        (inv.subtotal - inv.discountTotal).toFixed(2),
        inv.gstTotal.toFixed(2),
        inv.grandTotal.toFixed(2),
        translateStatus(t, inv.paymentStatus)
      ]);
      rows.push([t("reports.summaryTotal", "Report Summary Total"), '', '', totalSalesBase.toFixed(2), totalSalesTax.toFixed(2), totalSalesVal.toFixed(2), '']);
    } else if (activeReport === 'purchase') {
      headers = [t("purchases.billNumber", "Bill Number"), t("purchases.supplierName", "Supplier Name"), t("reports.receiptDate", "Receipt Date"), t("purchases.baseCost", "Base Cost (INR)"), t("purchases.taxPaid", "Tax Paid (INR)"), t("purchases.totalCost", "Total Cost (INR)"), t("common.status", "Status")];
      rows = filteredPurchases.map(pur => [
        pur.purchaseNumber,
        pur.supplierName,
        formatDate(pur.date),
        pur.subtotal.toFixed(2),
        pur.gstTotal.toFixed(2),
        pur.grandTotal.toFixed(2),
        translateStatus(t, pur.paymentStatus)
      ]);
      rows.push([t("reports.summaryTotal", "Report Summary Total"), '', '', totalPurchasesBase.toFixed(2), totalPurchasesTax.toFixed(2), totalPurchasesVal.toFixed(2), '']);
    } else if (activeReport === 'profit') {
      headers = [t("sales.invoiceNo", "Invoice No"), t("reports.date", "Date"), t("reports.profit.customer", "Customer"), t("reports.profit.taxableSalesRs", "Taxable Sales (INR)"), t("reports.profit.costPriceRs", "Cost Price (INR)"), t("reports.profit.netProfitRs", "Net Profit (INR)"), t("reports.print.margin", "Margin (%)")];
      rows = filteredInvoices.map(inv => {
        const invoiceCOGS = inv.items.reduce((s, i) => {
          const cost = products.find((p) => p.id === i.productId)?.purchasePrice || 0;
          return s + (i.quantity * cost);
        }, 0);
        const invProfit = inv.subtotal - invoiceCOGS;
        const invMargin = inv.subtotal > 0 ? (invProfit / inv.subtotal) * 100 : 0;
        return [
          inv.invoiceNumber,
          formatDate(inv.date),
          inv.customerName,
          inv.subtotal.toFixed(2),
          invoiceCOGS.toFixed(2),
          invProfit.toFixed(2),
          `${invMargin.toFixed(1)}%`
        ];
      });
      rows.push([t("reports.summaryTotal", "Report Summary Total"), '', '', totalSalesBase.toFixed(2), coGS.toFixed(2), grossProfit.toFixed(2), `${profitMarginPercent.toFixed(1)}%`]);
    } else if (activeReport === 'stock') {
      headers = [t("reports.print.sku", "SKU Code"), t("reports.print.productName", "Product Name"), t("reports.print.category", "Category"), t("inventory.availableQty", "Available Qty"), t("reports.profit.costPriceRs", "Cost Price (INR)"), t("reports.print.assetValueRs", "Asset Valuation (INR)"), t("reports.print.retailPriceRs", "Retail Rate (INR)"), t("reports.print.retailValueRs", "Retail Valuation (INR)")];
      rows = products.map(p => [
        p.sku,
        p.name,
        translateCategory(t, p.category),
        p.stock.toString(),
        p.purchasePrice.toFixed(2),
        (p.stock * p.purchasePrice).toFixed(2),
        p.sellingPrice.toFixed(2),
        (p.stock * p.sellingPrice).toFixed(2)
      ]);
      rows.push([t("reports.stockSummaryTotal", "Stock Summary Total"), '', '', totalStockQty.toString(), '', totalAssetVal.toFixed(2), '', totalRetailVal.toFixed(2)]);
    } else if (activeReport === 'gst') {
      headers = [t("reports.gst.transactionType", "Transaction Type"), t("reports.gst.docCount", "Document Count"), t("reports.gst.goodsValue", "Goods Value (INR)"), t("reports.gstr3b.centralTaxRs", "Central GST (CGST) (INR)"), t("reports.gstr3b.stateUtTaxRs", "State GST (SGST) (INR)"), `${t("reports.purchase.totalTax", "Total Tax")} Liability (INR)`];
      rows = [
        [t("reports.gst.outwardSupplySales", "Outward Supply (Sales Invoices)"), filteredInvoices.length.toString(), totalSalesBase.toFixed(2), totalCGSTCollected.toFixed(2), totalSGSTCollected.toFixed(2), totalSalesTax.toFixed(2)],
        [t("reports.gst.inwardSupplyBills", "Inward Supply (Supplier Bills)"), filteredPurchases.length.toString(), totalPurchasesBase.toFixed(2), totalCGSTPaid.toFixed(2), totalSGSTPaid.toFixed(2), totalPurchasesTax.toFixed(2)],
        [t("reports.gst.netPayableTaxDues", "Net Payable Tax Dues"), '', (totalSalesBase - totalPurchasesBase).toFixed(2), (totalCGSTCollected - totalCGSTPaid).toFixed(2), (totalSGSTCollected - totalSGSTPaid).toFixed(2), netGSTDue.toFixed(2)]
      ];
    } else if (activeReport === 'custLedger') {
      headers = [t("customers.id", "Customer ID"), t("customers.name", "Customer Name"), t("common.phone", "Phone Number"), t("common.gstin", "GSTIN Identification"), t("reports.custLedger.outstandingBalance", "Outstanding Balance (INR)"), t("common.status", "Status")];
      rows = customers.map(c => [
        c.id,
        c.name,
        c.phone,
        c.gstin || '—',
        c.outstanding.toFixed(2),
        c.outstanding === 0 ? t('status.settled', 'Settled') : c.outstanding > 0 ? t('status.duesPending', 'Dues Pending') : t('status.advanceCredit', 'Advance Credit')
      ]);
      rows.push([t("reports.custLedger.accumulatedCustomerDues", "Accumulated Customer Dues"), '', '', '', pendingReceivables.toFixed(2), '']);
    } else if (activeReport === 'suppLedger') {
      headers = [t("suppliers.id", "Supplier ID"), t("suppliers.name", "Supplier Name"), t("common.phone", "Phone Number"), t("common.gstin", "GSTIN Identification"), t("suppliers.balanceOwed", "Balance Owed (INR)"), t("common.status", "Status")];
      rows = suppliers.map(s => [
        s.id,
        s.name,
        s.phone,
        s.gstin || '—',
        s.outstanding.toFixed(2),
        s.outstanding === 0 ? t('status.settled', 'Settled') : t('status.payablePending', 'Payable Pending')
      ]);
      rows.push([t("reports.suppLedger.accumulatedWeOweSuppliers", "Accumulated We Owe Suppliers"), '', '', '', pendingPayables.toFixed(2), '']);
    } else if (activeReport === 'expense') {
      headers = [t("reports.date", "Date"), t("reports.print.voucherId", "Voucher ID"), t("reports.print.category", "Category"), t("reports.expense.payeePaidTo", "Payee / Paid To"), t("common.amount", "Amount (INR)"), t("common.status", "Status"), t("reports.print.method", "Payment Method"), t("reports.expense.refNumber", "Ref No."), t("reports.expense.notes", "Notes")];
      rows = filteredExpenses.map(exp => [
        formatDate(exp.date),
        exp.id,
        translateCategory(t, exp.category),
        exp.payee || t("categories.general", "General"),
        exp.amount.toFixed(2),
        translateStatus(t, exp.status || 'Paid'),
        exp.status === 'Due' ? '—' : translatePaymentMethod(t, exp.paymentMethod),
        exp.status === 'Due' ? '—' : (exp.referenceNumber || '—'),
        exp.notes || '—'
      ]);
      rows.push([t("reports.summaryTotal", "Report Summary Total"), '', '', '', totalExpenses.toFixed(2), '', '', '', '']);
    }

    downloadCSVFile(headers, rows, filename);
    showToast(t('reports.csvExported', 'Report exported as CSV successfully!'));
  };

  const handleDownloadPDF = async () => {
    const wrapper = document.querySelector('.pdf-print-wrapper') as HTMLElement | null;
    const element = document.getElementById('pdf-report-printout');
    if (!element || !wrapper) {
      showToast('Could not find report printout element.', 'error');
      return;
    }

    showToast('Generating PDF, please wait...', 'info');

    // Temporarily make element visible for html2canvas to capture
    wrapper.style.visibility = 'visible';
    wrapper.style.zIndex = '9999';

    try {
      const isGstr = activeReport.startsWith('gstr') && activeReport !== 'gstr3b';
      const orientation = isGstr ? 'landscape' : 'portrait';
      const pageW = isGstr ? 297 : 210;
      const pageH = isGstr ? 210 : 297;

      await new Promise(r => setTimeout(r, 80)); // allow render flush

      const pdfPages = element.querySelectorAll('.gstr3b-pdf-page');
      const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

      if (pdfPages.length > 0) {
        // Multi-page sequential capture mode (for GSTR-3B A4 Simulator pages)
        for (let i = 0; i < pdfPages.length; i++) {
          const pageEl = pdfPages[i] as HTMLElement;
          const canvas = await html2canvas(pageEl, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: pageEl.scrollWidth,
            windowHeight: pageEl.scrollHeight,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.97);

          if (i > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH);
        }
      } else {
        // Single screenshot slicing mode (default fallback for other reports)
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.97);

        const imgW = pageW;
        const imgH = (canvas.height * imgW) / canvas.width;
        let heightLeft = imgH;
        let posY = 0;

        pdf.addImage(imgData, 'JPEG', 0, posY, imgW, imgH);
        heightLeft -= pageH;

        while (heightLeft > 0) {
          posY -= pageH;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, posY, imgW, imgH);
          heightLeft -= pageH;
        }
      }

      // Hide again immediately
      wrapper.style.visibility = 'hidden';
      wrapper.style.zIndex = '-1';

      const filename = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      showToast(t('reports.pdfDownloaded', 'PDF downloaded successfully!'));
    } catch (err) {
      wrapper.style.visibility = 'hidden';
      wrapper.style.zIndex = '-1';
      console.error('PDF generation error:', err);
      showToast('Error generating PDF. Please try again.', 'error');
    }
  };

  // Auto-fitting responsive grid style for KPIs
  const kpiGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  };

  // ── GSTR-3B SCREEN VIEW (dashboard-style, consistent with GSTR-1 / GSTR-2) ──
  const renderGstr3bScreenView = () => {
    const businessStateCode = settings.gstin ? settings.gstin.substring(0, 2) : '23';

    const outwardTaxTotal = gstr3BData.outward.cgst + gstr3BData.outward.sgst + gstr3BData.outward.igst;
    const itcTotal = gstr3BData.itc.cgst + gstr3BData.itc.sgst + gstr3BData.itc.igst;
    const netGstPayable = Math.max(0, outwardTaxTotal - itcTotal);
    const remainingItc = Math.max(0, itcTotal - outwardTaxTotal);

    const igstLiability = gstr3BData.outward.igst;
    const igstItcUtilized = Math.min(igstLiability, gstr3BData.itc.igst);
    const igstCashPaid = Math.max(0, igstLiability - igstItcUtilized);

    const cgstLiability = gstr3BData.outward.cgst;
    const cgstItcUtilized = Math.min(cgstLiability, gstr3BData.itc.cgst);
    const cgstCashPaid = Math.max(0, cgstLiability - cgstItcUtilized);

    const sgstLiability = gstr3BData.outward.sgst;
    const sgstItcUtilized = Math.min(sgstLiability, gstr3BData.itc.sgst);
    const sgstCashPaid = Math.max(0, sgstLiability - sgstItcUtilized);

    const totalLiability = igstLiability + cgstLiability + sgstLiability;
    const totalItcUtilized = igstItcUtilized + cgstItcUtilized + sgstItcUtilized;
    const totalCashPaid = igstCashPaid + cgstCashPaid + sgstCashPaid;

    const gstDiff = Math.abs(totalSalesTax - outwardTaxTotal);
    const isMismatch = gstDiff > 0.05;

    const interstateUnregisteredTaxable = gstr1B2CSList
      .filter(item => !item.pos.startsWith(businessStateCode))
      .reduce((acc, item) => acc + item.taxable, 0);

    const interstateUnregisteredIGST = gstr1B2CSList
      .filter(item => !item.pos.startsWith(businessStateCode))
      .reduce((acc, item) => acc + item.igst, 0);

    return (
      <div style={{ animation: 'fadeIn 0.2s ease-out' }}>

        {/* KPI Cards */}
        <div style={kpiGridStyle}>
          <KpiCard
            label={t("reports.gstr3b.totalTaxableSales", "Total Taxable Sales")}
            value={formatINR(gstr3BData.outward.taxable)}
            subtext="Outward taxable supplies"
            icon={<FileText size={20} />}
            variant="success"
          />
          <KpiCard
            label={t("reports.gstr3b.totalGstLiability", "Total GST Liability")}
            value={formatINR(outwardTaxTotal)}
            subtext="CGST + SGST + IGST"
            icon={<Percent size={20} />}
            variant="danger"
          />
          <KpiCard
            label={t("reports.gstr3b.eligibleItcCard", "Eligible ITC")}
            value={formatINR(itcTotal)}
            subtext="Input Tax Credit available"
            icon={<TrendingDown size={20} />}
            variant="info"
          />
          <KpiCard
            label={t("reports.gstr3b.netGstPayableCard", "Net GST Payable")}
            value={formatINR(netGstPayable)}
            subtext={remainingItc > 0 ? `₹${remainingItc.toFixed(0)} carry forward` : 'Cash payment due'}
            icon={<Briefcase size={20} />}
            variant={netGstPayable > 0 ? "danger" : "success"}
          />
        </div>

        {/* Reconciliation Status Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
          borderRadius: '10px', marginBottom: '24px',
          backgroundColor: isMismatch ? 'var(--color-warning-bg, #fffbeb)' : 'var(--color-success-bg, #f0fdf4)',
          border: isMismatch ? '1px solid #fde68a' : '1px solid #bbf7d0'
        }}>
          {isMismatch ? (
            <>
              <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309' }}>{t("reports.gstr3b.reconciliationWarning", "Reconciliation Warning")}</div>
                <div style={{ fontSize: '12px', color: '#b45309' }}>
                  {t("reports.gstr3b.discrepancyDetected", "Discrepancy of {{diff}} found between Sales Invoice Register ({{salesTax}}) and Outward Tax ({{outwardTax}}). Please verify your tax configurations.", { diff: formatINR(gstDiff), salesTax: formatINR(totalSalesTax), outwardTax: formatINR(outwardTaxTotal) })}
                </div>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>{t("reports.gstr3b.ledgerReconciled", "Ledger Reconciled")}</div>
                <div style={{ fontSize: '12px', color: '#15803d' }}>{t("reports.gstr3b.reconciledDesc", "Outward tax matches Sales Invoice Register perfectly. No discrepancy found.")}</div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Table 3.1 – Outward Supplies */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t("reports.gstr3b.table31Title", "Table 3.1: Outward Supplies Summary")}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {t("reports.gstr3b.table31Subtitle", "Details of outward taxable supplies and inward supplies liable to reverse charge.")}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleExportGstr3B}>
                <Percent size={14} style={{ marginRight: '6px' }} /> {t("reports.gstr3b.downloadGstr3bCsv", "Download GSTR-3B CSV")}
              </button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">{t("reports.natureOfSupplies", "Nature of Supplies")}</th>
                    <th className="text-nowrap align-right">{t("reports.taxableValue", "Taxable Value")}</th>
                    <th className="text-nowrap align-right">{t("reports.igst", "IGST")}</th>
                    <th className="text-nowrap align-right">{t("reports.cgst", "CGST")}</th>
                    <th className="text-nowrap align-right">{t("reports.sgstUtgst", "SGST/UTGST")}</th>
                    <th className="text-nowrap align-right">{t("reports.cess", "Cess")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t("reports.gstr3b.sec31a", "(a) Outward taxable supplies (other than zero rated, nil rated and exempted)")}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.taxable)}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.igst)}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.cgst)}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.sgst)}</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td>{t("reports.gstr3b.sec31b", "(b) Outward taxable supplies (Zero Rated)")}</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td>{t("reports.gstr3b.sec31c", "(c) Other Outward Supplies (Nil Rated / Exempted)")}</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td>{t("reports.gstr3b.sec31d", "(d) Inward Supplies liable to Reverse Charge)")}</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td>{t("reports.gstr3b.sec31e", "(e) Non GST Outward Supplies)")}</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-secondary, #f9fafb)' }}>
                    <td>{t("reports.grandTotal", "Grand Total")}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.taxable)}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.igst)}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.cgst)}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.sgst)}</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3.2 – Interstate Supplies */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t("reports.gstr3b.table32Title", "Table 3.2: Inter-State Supplies to Unregistered / Composition / UIN")}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {t("reports.gstr3b.table32Subtitle", "Details of inter-state supplies made to unregistered persons, composition dealers and UIN holders.")}
              </p>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">{t("reports.recipientType", "Recipient Type")}</th>
                    <th className="text-nowrap align-right">{t("reports.taxableValue", "Taxable Value")}</th>
                    <th className="text-nowrap align-right">{t("reports.integratedTaxIgst", "Integrated Tax (IGST)")}</th>
                  </tr>
                </thead>
                <tbody>
                  {interstateUnregisteredTaxable > 0 ? (
                    <>
                      <tr>
                        <td>{t("reports.suppliesUnregistered", "Supplies to Unregistered Persons")}</td>
                        <td className="align-right">{formatINR(interstateUnregisteredTaxable)}</td>
                        <td className="align-right">{formatINR(interstateUnregisteredIGST)}</td>
                      </tr>
                      <tr>
                        <td>{t("reports.suppliesComposition", "Supplies to Composition Taxable Persons")}</td>
                        <td className="align-right">₹0.00</td>
                        <td className="align-right">₹0.00</td>
                      </tr>
                      <tr>
                        <td>{t("reports.suppliesUinHolders", "Supplies to UIN Holders")}</td>
                        <td className="align-right">₹0.00</td>
                        <td className="align-right">₹0.00</td>
                      </tr>
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-secondary, #f9fafb)' }}>
                        <td>{t("reports.totalInterstateSupplies", "Total Interstate Supplies")}</td>
                        <td className="align-right">{formatINR(interstateUnregisteredTaxable)}</td>
                        <td className="align-right">{formatINR(interstateUnregisteredIGST)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px', fontStyle: 'italic' }}>
                        {t("reports.gstr3b.noInterstateSuppliesPeriod", "No inter-state supplies found in the selected period.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4 – ITC Details */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t("reports.gstr3b.table4Title", "Table 4: Eligible Input Tax Credit (ITC)")}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {t("reports.gstr3b.table4Subtitle", "ITC available from registered supplier invoices received during the period.")}
              </p>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">{t("reports.itcCategory", "ITC Category")}</th>
                    <th className="text-nowrap align-right">{t("reports.igst", "IGST")}</th>
                    <th className="text-nowrap align-right">{t("reports.cgst", "CGST")}</th>
                    <th className="text-nowrap align-right">{t("reports.sgstUtgst", "SGST/UTGST")}</th>
                    <th className="text-nowrap align-right">{t("reports.totalItc", "Total ITC")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '16px' }}>{t("reports.importOfGoods", "Import of goods")}</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '16px' }}>{t("reports.importOfServices", "Import of services")}</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '16px' }}>{t("reports.inwardSuppliesReverseCharge", "Inward supplies (Reverse Charge)")}</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '16px', fontWeight: 600 }}>{t("reports.gstr3b.allOtherItc", "All other ITC – Registered purchases (4A.5)")}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(gstr3BData.itc.igst)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(gstr3BData.itc.cgst)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(gstr3BData.itc.sgst)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)', fontWeight: 700 }}>{formatINR(gstr3BData.itc.igst + gstr3BData.itc.cgst + gstr3BData.itc.sgst)}</td>
                  </tr>
                  <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-secondary, #f9fafb)' }}>
                    <td>{t("reports.gstr3b.netItcAvailable", "Net ITC Available (A – B)")}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(gstr3BData.itc.igst)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(gstr3BData.itc.cgst)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(gstr3BData.itc.sgst)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)', fontWeight: 700 }}>{formatINR(itcTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax Payment & Settlement Summary */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t("reports.gstr3b.taxPaymentSummaryTitle", "Tax Payment & Settlement Summary")}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {t("reports.gstr3b.taxPaymentSummarySubtitle", "Breakdown of tax liability, ITC utilized and net cash payable per tax head.")}
              </p>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">{t("reports.taxHead", "Tax Head")}</th>
                    <th className="text-nowrap align-right">{t("reports.taxLiability", "Tax Liability")}</th>
                    <th className="text-nowrap align-right">{t("reports.itcUtilized", "ITC Utilized")}</th>
                    <th className="text-nowrap align-right">{t("reports.cashToPay", "Cash to Pay")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t("reports.integratedTaxIgst", "Integrated Tax (IGST)")}</td>
                    <td className="align-right">{formatINR(igstLiability)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(igstItcUtilized)}</td>
                    <td className="align-right" style={{ color: igstCashPaid > 0 ? 'var(--color-danger-dark)' : 'inherit' }}>{formatINR(igstCashPaid)}</td>
                  </tr>
                  <tr>
                    <td>{t("reports.centralTaxCgst", "Central Tax (CGST)")}</td>
                    <td className="align-right">{formatINR(cgstLiability)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(cgstItcUtilized)}</td>
                    <td className="align-right" style={{ color: cgstCashPaid > 0 ? 'var(--color-danger-dark)' : 'inherit' }}>{formatINR(cgstCashPaid)}</td>
                  </tr>
                  <tr>
                    <td>{t("reports.stateTaxSgst", "State/UT Tax (SGST)")}</td>
                    <td className="align-right">{formatINR(sgstLiability)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(sgstItcUtilized)}</td>
                    <td className="align-right" style={{ color: sgstCashPaid > 0 ? 'var(--color-danger-dark)' : 'inherit' }}>{formatINR(sgstCashPaid)}</td>
                  </tr>
                  <tr>
                    <td>{t("reports.cess", "Cess")}</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-secondary, #f9fafb)' }}>
                    <td>{t("reports.totalSettlement", "Total Settlement")}</td>
                    <td className="align-right">{formatINR(totalLiability)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(totalItcUtilized)}</td>
                    <td className="align-right" style={{ color: totalCashPaid > 0 ? 'var(--color-danger-dark)' : 'inherit', fontWeight: 700 }}>{formatINR(totalCashPaid)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GST Summary Reconciliation Cards */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t("reports.gstr3b.gstReconciliationSummaryTitle", "GST Reconciliation Summary")}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {t("reports.gstr3b.gstReconciliationSummarySubtitle", "Comparison of book sales GST against outward tax declared in GSTR-3B.")}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {[
                { label: t("reports.gstr3b.totalBookSalesValue", "Total Book Sales Value"), value: formatINR(gstr3BData.outward.taxable), sub: t("reports.gstr3b.taxableTurnover", "Taxable turnover"), color: 'var(--text-primary)' },
                { label: t("reports.gstr3b.totalPurchaseValueItcBase", "Total Purchase Value (ITC Base)"), value: formatINR(gstr3BData.itc.taxable), sub: t("reports.gstr3b.registeredPurchases", "Registered purchases"), color: 'var(--text-primary)' },
                { label: t("reports.gstr3b.outputGstLiability", "Output GST Liability"), value: formatINR(outwardTaxTotal), sub: t("reports.gstr3b.cgstSgstIgstCollected", "CGST+SGST+IGST collected"), color: 'var(--color-danger-dark)' },
                { label: t("reports.gstr3b.inputGstCredit", "Input GST Credit (ITC)"), value: formatINR(itcTotal), sub: t("reports.gstr3b.availableItc", "Available ITC"), color: 'var(--color-success-dark)' },
                { label: t("reports.gstr3b.netGstCashLiability", "Net GST Cash Liability"), value: formatINR(netGstPayable), sub: t("reports.gstr3b.afterItcSetOff", "After ITC set-off"), color: netGstPayable > 0 ? 'var(--color-danger-dark)' : 'var(--color-success-dark)' },
                { label: t("reports.gstr3b.carryForwardItc", "Carry Forward ITC"), value: formatINR(remainingItc), sub: t("reports.gstr3b.excessCreditBalance", "Excess credit balance"), color: 'var(--color-success-dark)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #e5e7eb)', backgroundColor: 'var(--bg-base, #ffffff)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary, #9ca3af)', marginTop: '4px' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderGstr3bReport = () => {
    const businessStateCode = settings.gstin ? settings.gstin.substring(0, 2) : '23';


    const interstateUnregisteredTaxable = gstr1B2CSList
      .filter(item => !item.pos.startsWith(businessStateCode))
      .reduce((acc, item) => acc + item.taxable, 0);

    const interstateUnregisteredIGST = gstr1B2CSList
      .filter(item => !item.pos.startsWith(businessStateCode))
      .reduce((acc, item) => acc + item.igst, 0);

    const hasInterstateSupplies = interstateUnregisteredTaxable > 0;



    const outwardTaxTotal = gstr3BData.outward.cgst + gstr3BData.outward.sgst + gstr3BData.outward.igst;
    const itcTotal = gstr3BData.itc.cgst + gstr3BData.itc.sgst + gstr3BData.itc.igst;
    const netGstPayable = Math.max(0, outwardTaxTotal - itcTotal);
    const remainingItc = Math.max(0, itcTotal - outwardTaxTotal);

    // Difference between Sales Ledger GST and Outward Tax
    const gstDiff = Math.abs(totalSalesTax - outwardTaxTotal);
    const isMismatch = gstDiff > 0.05; // allow minimal rounding discrepancy

    // Payment utilization values
    const igstLiability = gstr3BData.outward.igst;
    const igstItcUtilized = Math.min(igstLiability, gstr3BData.itc.igst);
    const igstCashPaid = Math.max(0, igstLiability - igstItcUtilized);
    const igstRemainingCredit = Math.max(0, gstr3BData.itc.igst - igstLiability);

    const cgstLiability = gstr3BData.outward.cgst;
    const cgstItcUtilized = Math.min(cgstLiability, gstr3BData.itc.cgst);
    const cgstCashPaid = Math.max(0, cgstLiability - cgstItcUtilized);
    const cgstRemainingCredit = Math.max(0, gstr3BData.itc.cgst - cgstLiability);

    const sgstLiability = gstr3BData.outward.sgst;
    const sgstItcUtilized = Math.min(sgstLiability, gstr3BData.itc.sgst);
    const sgstCashPaid = Math.max(0, sgstLiability - sgstItcUtilized);
    const sgstRemainingCredit = Math.max(0, gstr3BData.itc.sgst - sgstLiability);

    const totalLiability = igstLiability + cgstLiability + sgstLiability;
    const totalItcUtilized = igstItcUtilized + cgstItcUtilized + sgstItcUtilized;
    const totalCashPaid = igstCashPaid + cgstCashPaid + sgstCashPaid;
    const totalRemainingCredit = igstRemainingCredit + cgstRemainingCredit + sgstRemainingCredit;

    return (
      <div className="gstr3b-working-report-wrapper" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
        {/* PAGE 1 */}
        <div className="gstr3b-pdf-page">
          {/* Watermark Logo */}
          {settings.showLogo && (settings.watermarkLogo || settings.logo) && (
            <div className={`print-watermark-logo ${(settings.watermarkAsIs || settings.watermarkColorMode === 'as_is') ? 'as-is' : ''}`}>
              <img src={settings.watermarkLogo || settings.logo} alt="Watermark" />
            </div>
          )}

          {/* Unified Invoice style header inside Page 1 */}
          <div className="invoice-header-bar" style={{ marginBottom: '24px' }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              {settings.showLogo && settings.logo && (
                <div className="invoice-logo-container" style={{ flexShrink: 0, margin: 0, padding: 0 }}>
                  <img 
                    src={settings.logo} 
                    alt="Business Logo" 
                    style={{ maxWidth: "120px", maxHeight: "120px", objectFit: "contain", borderRadius: "8px", margin: 0, padding: 0 }} 
                  />
                </div>
              )}
              <div>
                <h2 className="invoice-company-name">{settings.businessName || 'AgriBiz Store'}</h2>
                {settings.showAddress && (
                  <p className="invoice-company-sub">{getFullAddress(settings)}</p>
                )}
                {settings.showContact && (
                  <p className="invoice-company-sub" style={{ display: 'flex', flexWrap: 'nowrap', gap: '4px 6px', alignItems: 'center', margin: '2px 0 0 0', whiteSpace: 'nowrap' }}>
                    {settings.email && <span style={{ whiteSpace: 'nowrap' }}>{t('common.emailLabel', 'Email:')} {settings.email}</span>}
                    {settings.email && (settings.phone || settings.website) && <span style={{ opacity: 0.5 }}>|</span>}
                    {settings.phone && <span style={{ whiteSpace: 'nowrap' }}>{t('common.mobLabel', 'Mob:')} {settings.phone}</span>}
                    {settings.phone && settings.website && <span style={{ opacity: 0.5 }}>|</span>}
                    {settings.website && <span style={{ whiteSpace: 'nowrap' }}>{t('common.webLabel', 'Web:')} {settings.website}</span>}
                  </p>
                )}
                {settings.showGstin && settings.gstin && (
                  <p className="invoice-company-gst">GSTIN: {settings.gstin}</p>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <h1 className="invoice-main-title">{t("reports.gstr3bWorkingReport", "GSTR-3B WORKING {t('reports.reportTitle', 'REPORT')}")}</h1>
              <p className="invoice-company-sub" style={{ margin: '3px 0 0 0', fontWeight: 600 }}>{t('reports.returnPeriod', 'Return Period:')} {returnPeriod()}</p>
              <p className="invoice-company-sub" style={{ margin: '2px 0 0 0' }}>{t('reports.generatedOn', 'Generated On:')} {generatedOn}</p>
              <p className="invoice-company-sub" style={{ margin: '2px 0 0 0' }}>{t('reports.generatedBy', 'Generated By:')} {settings.ownerName || 'Kunal Chaudhari'}</p>
            </div>
          </div>

          {/* SUMMARY SECTION */}
          <div className="gstr3b-summary-grid">
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">t("reports.taxableValue", "Taxable Value")</div>
            <div className="gstr3b-summary-card-value">{formatINR(gstr3BData.outward.taxable)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">{t("reports.gstr3b.totalGstLiability", "Total GST Liability")}</div>
            <div className="gstr3b-summary-card-value" style={{ color: '#be3144' }}>{formatINR(outwardTaxTotal)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">{t("reports.gstr3b.eligibleItc", "Eligible ITC")}</div>
            <div className="gstr3b-summary-card-value" style={{ color: '#10b981' }}>{formatINR(itcTotal)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">{t("reports.gstr3b.netGstPayable", "Net GST Payable")}</div>
            <div className="gstr3b-summary-card-value" style={{ color: netGstPayable > 0 ? '#be3144' : '#1a2e1d' }}>{formatINR(netGstPayable)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">{t("reports.gstr3b.remainingItc", "Remaining ITC")}</div>
            <div className="gstr3b-summary-card-value" style={{ color: '#10b981' }}>{formatINR(remainingItc)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">{t("reports.gstr3b.totalPurchaseValue", "Total Purchase Value")}</div>
            <div className="gstr3b-summary-card-value">{formatINR(gstr3BData.itc.taxable)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">{t("reports.gstr3b.totalSalesValue", "Total Sales Value")}</div>
            <div className="gstr3b-summary-card-value">{formatINR(gstr3BData.outward.taxable + outwardTaxTotal)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">{t("reports.gstr3b.totalGstCollected", "Total GST Collected")}</div>
            <div className="gstr3b-summary-card-value">{formatINR(totalSalesTax)}</div>
          </div>
        </div>

        {/* TABLE 3.1 */}
        <div className="gstr3b-print-section">
          <div className="gstr3b-section-title">{t("reports.gstr3b.table31PrintTitle", "Table 3.1: Details of Outward Supplies and Inward Supplies Liable to Reverse Charge")}</div>
          <div className="gstr3b-table-scroll-wrapper">
            <table className="gstr3b-ca-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>{t("reports.natureOfSupplies", "Nature of Supplies")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.taxableValueRs", "Taxable Value (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.integratedTaxRs", "Integrated Tax (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.centralTaxRs", "Central Tax (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.stateUtTaxRs", "State/UT Tax (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.cessRs", "Cess (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t("reports.gstr3b.sec31a", "(a) Outward taxable supplies (other than zero rated, nil rated and exempted)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.taxable).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.igst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.cgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.sgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td>{t("reports.gstr3b.sec31b", "(b) Outward taxable supplies (Zero Rated)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td>{t("reports.gstr3b.sec31c", "(c) Other Outward Supplies (Nil Rated / Exempted)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td>{t("reports.gstr3b.sec31d", "(d) Inward Supplies liable to Reverse Charge)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td>{t("reports.gstr3b.sec31e", "(e) Non GST Outward Supplies)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr className="total-row">
                  <td>{t("reports.grandTotalTable31", "Grand Total (Table 3.1)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.taxable).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.igst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.cgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.sgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 3.2 */}
        <div className="gstr3b-print-section">
          <div className="gstr3b-section-title">{t("reports.gstr3b.table32PrintTitle", "Table 3.2: Details of Inter-State Supplies Made To (Unregistered/Composition/UIN)")}</div>
          <div className="gstr3b-table-scroll-wrapper">
            <table className="gstr3b-ca-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>{t("reports.gstr3b.posRecipientStateType", "Place of Supply (Recipient State Type)")}</th>
                  <th style={{ textAlign: 'right' }}>Total {t("reports.gstr3b.taxableValueRs", "Taxable Value (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.integratedTaxRs", "Integrated Tax (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                {hasInterstateSupplies ? (
                  <>
                    <tr>
                      <td>{t("reports.gstr3b.suppliesUnregistered", "Supplies made to Unregistered Persons")}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(interstateUnregisteredTaxable).replace('₹', '')}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(interstateUnregisteredIGST).replace('₹', '')}</td>
                    </tr>
                    <tr>
                      <td>{t("reports.gstr3b.suppliesComposition", "Supplies made to Composition Taxable Persons")}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                    </tr>
                    <tr>
                      <td>{t("reports.gstr3b.suppliesUinHolders", "Supplies made to UIN Holders")}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                    </tr>
                    <tr className="total-row">
                      <td>{t("reports.gstr3b.totalInterstateSuppliesTable32", "Total Interstate Supplies (Table 3.2)")}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(interstateUnregisteredTaxable).replace('₹', '')}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(interstateUnregisteredIGST).replace('₹', '')}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#5d6b5e', padding: '12px', fontStyle: 'italic' }}>
                      {t("reports.gstr3b.noInterstateSupplies", "No Interstate Supplies")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div> {/* Close Page 1 */}

        {/* PAGE 2 */}
        <div className="gstr3b-pdf-page">
          {/* Watermark Logo */}
          {settings.showLogo && (settings.watermarkLogo || settings.logo) && (
            <div className={`print-watermark-logo ${(settings.watermarkAsIs || settings.watermarkColorMode === 'as_is') ? 'as-is' : ''}`}>
              <img src={settings.watermarkLogo || settings.logo} alt="Watermark" />
            </div>
          )}

          {/* TABLE 4 */}
          <div className="gstr3b-print-section">
          <div className="gstr3b-section-title">{t("reports.gstr3b.table4PrintTitle", "Table 4: Eligible Input Tax Credit (ITC) Details")}</div>
          <div className="gstr3b-table-scroll-wrapper">
            <table className="gstr3b-ca-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>{t("reports.detailsOfItc", "Details of Input Tax Credit (ITC)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.integratedTaxRs", "Integrated Tax (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.centralTaxRs", "Central Tax (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.stateUtTaxRs", "State/UT Tax (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.cessRs", "Cess (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#fafbfa', fontWeight: 'bold' }}>
                  <td colSpan={5} style={{ textTransform: 'uppercase', fontSize: '9px', color: '#2f3e33' }}>{t("reports.gstr3b.itcAvailableHeader", "(A) ITC Available (whether in full or part)")}</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>{t("reports.gstr3b.importGoods", "1. Import of goods")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>{t("reports.gstr3b.importServices", "2. Import of services")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>{t("reports.gstr3b.inwardReverseCharge", "3. Inward supplies liable to reverse charge (other than 1 & 2 above)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>{t("reports.gstr3b.inwardIsd", "4. Inward supplies from ISD")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px', fontWeight: 600 }}>{t("reports.gstr3b.allOtherItcPrint", "5. All other ITC (Registered purchases)")}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.igst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.cgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.sgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr style={{ backgroundColor: '#fafbfa', fontWeight: 'bold' }}>
                  <td colSpan={5} style={{ textTransform: 'uppercase', fontSize: '9px', color: '#2f3e33' }}>{t("reports.gstr3b.itcReversedHeader", "(B) ITC Reversed")}</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>{t("reports.gstr3b.rules4243", "1. As per rules 42 & 43 of CGST Rules")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>{t("reports.gstr3b.others", "2. Others")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr className="total-row">
                  <td>{t("reports.gstr3b.netItcAvailablePrint", "(C) Net ITC Available (A - B)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.igst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.cgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.sgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 5 */}
        <div className="gstr3b-print-section">
          <div className="gstr3b-section-title">{t("reports.gstr3b.table5PrintTitle", "Table 5: Values of Exempt, Nil Rated and Non GST Inward Supplies")}</div>
          <div className="gstr3b-table-scroll-wrapper">
            <table className="gstr3b-ca-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>{t("reports.natureOfInwardSupplies", "Nature of Inward Supplies")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.interStateSuppliesRs", "Inter-State Supplies (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.intraStateSuppliesRs", "Intra-State Supplies (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t("reports.gstr3b.compositionExemptInward", "From a supplier under composition scheme, Exempt and Nil rated inward supplies")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td>{t("reports.gstr3b.nonGstInward", "Non GST inward supplies")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TAX PAYMENT SUMMARY */}
        <div className="gstr3b-print-section">
          <div className="gstr3b-section-title">{t("reports.gstr3b.taxPaymentLedgerTitle", "Tax Payment and Settlement Ledger")}</div>
          <div className="gstr3b-table-scroll-wrapper">
            <table className="gstr3b-ca-table">
              <thead>
                <tr>
                  <th>{t("reports.taxComponent", "Tax Component")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.taxLiabilityRs", "Tax Liability (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.itcUtilizedRs", "ITC Utilized (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.paidInCashRs", "Paid in Cash (₹)")}</th>
                  <th style={{ textAlign: 'right' }}>{t("reports.gstr3b.balanceCreditRs", "Balance Credit (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>{t("reports.integratedTaxIgst", "Integrated Tax (IGST)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(igstLiability).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(igstItcUtilized).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: igstCashPaid > 0 ? '#be3144' : 'inherit' }}>{formatINR(igstCashPaid).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(igstRemainingCredit).replace('₹', '')}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>{t("reports.centralTaxCgst", "Central Tax (CGST)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(cgstLiability).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(cgstItcUtilized).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: cgstCashPaid > 0 ? '#be3144' : 'inherit' }}>{formatINR(cgstCashPaid).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(cgstRemainingCredit).replace('₹', '')}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>{t("reports.stateTaxSgst", "State/UT Tax (SGST)")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(sgstLiability).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(sgstItcUtilized).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: sgstCashPaid > 0 ? '#be3144' : 'inherit' }}>{formatINR(sgstCashPaid).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(sgstRemainingCredit).replace('₹', '')}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>{t("reports.gstr3b.cess", "Cess")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr className="total-row">
                  <td>{t("reports.totalSettlementSummary", "Total Settlement Summary")}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(totalLiability).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(totalItcUtilized).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(totalCashPaid).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(totalRemainingCredit).replace('₹', '')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div> {/* Close Page 2 */}

        {/* PAGE 3 */}
        <div className="gstr3b-pdf-page">
          {/* Watermark Logo */}
          {settings.showLogo && (settings.watermarkLogo || settings.logo) && (
            <div className={`print-watermark-logo ${(settings.watermarkAsIs || settings.watermarkColorMode === 'as_is') ? 'as-is' : ''}`}>
              <img src={settings.watermarkLogo || settings.logo} alt="Watermark" />
            </div>
          )}

          {/* GST RECONCILIATION SUMMARY */}
          <div className="gstr3b-print-section">
          <div className="gstr3b-section-title">{t("reports.gstr3b.reconciliationAuditTitle", "GST Reconciliation Audit Summary")}</div>
          <div className="gstr3b-reconciliation-container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', fontSize: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>{t("reports.totalBookSalesValue", "Total Book Sales Value:")}</span>
                  <strong style={{ fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.taxable)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>{t("reports.totalBookPurchaseValue", "Total Book Purchase Value:")}</span>
                  <strong style={{ fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.taxable)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>{t("reports.outputGstLiability", "Output GST Liability (GSTR-3B):")}</span>
                  <strong style={{ fontFamily: 'monospace', color: '#be3144' }}>{formatINR(outwardTaxTotal)}</strong>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>{t("reports.inputGstCredit", "Input GST Credit (ITC Available):")}</span>
                  <strong style={{ fontFamily: 'monospace', color: '#10b981' }}>{formatINR(itcTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>{t("reports.netGstCashLiability", "Net GST Cash Liability:")}</span>
                  <strong style={{ fontFamily: 'monospace' }}>{formatINR(netGstPayable)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>{t("reports.carryForwardTaxCredit", "Carry Forward Tax Credit:")}</span>
                  <strong style={{ fontFamily: 'monospace', color: '#10b981' }}>{formatINR(remainingItc)}</strong>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '6px', backgroundColor: isMismatch ? '#fffbeb' : '#f0fdf4', border: isMismatch ? '1px solid #fde68a' : '1px solid #bbf7d0' }}>
              {isMismatch ? (
                <>
                  <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
                    {t("reports.gstr3b.discrepancyDetected", "Discrepancy of {{diff}} found between Sales Invoice Register ({{salesTax}}) and Outward Tax ({{outwardTax}}). Please verify your tax configurations.", { diff: formatINR(gstDiff), salesTax: formatINR(totalSalesTax), outwardTax: formatINR(outwardTaxTotal) })}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                    {t("reports.gstr3b.ledgerReconciled", "Ledger Reconciled")} Perfectly: {t("reports.gstr3b.reconciledDesc", "Outward tax matches Sales Invoice Register perfectly. No discrepancy found.")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>



        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '9px', color: '#5d6b5e', borderTop: '1px dashed #e2e9e0', paddingTop: '16px' }}>
          <div>{t("reports.systemGeneratedFooter", "System Generated Report • AgriBiz Financial Modules")}</div>
          <div style={{ marginTop: '4px', fontStyle: 'italic', maxWidth: '600px', margin: '4px auto 0 auto' }}>
            {t("reports.gstr3b.disclaimer", "Disclaimer: This report is generated from accounting entries and is intended for GST reconciliation and Chartered Accountant working purposes. It is not a substitute for the official GSTR-3B return filed on the GST Portal.")}
          </div>
        </div>
        </div> {/* Close Page 3 */}
      </div>
    );
  };



  const renderReportContent = () => {
    switch (activeReport) {
      case 'sales':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <KpiCard
                label={t("reports.sales.invoicesCountCard", "Sales Invoices Count")}
                value={filteredInvoices.length}
                subtext="Tax bills generated"
                icon={<BookOpen size={20} />}
                variant="success"
              />
              <KpiCard
                label={t("reports.sales.totalTaxableSales", "Total Taxable Sales")}
                value={formatINR(totalSalesBase)}
                subtext="Excludes GST tax"
                icon={<DollarSign size={20} />}
                variant="success"
              />
              <KpiCard
                label={t("reports.sales.totalGstCollectedCard", "Total GST Collected")}
                value={formatINR(totalSalesTax)}
                subtext="GST tax liability"
                icon={<Percent size={20} />}
                variant="success"
              />
              <KpiCard
                label={t("reports.sales.totalInvoiceValueCard", "Total Invoice Value")}
                value={formatINR(totalSalesVal)}
                subtext="Inclusive of GST"
                icon={<TrendingUp size={20} />}
                variant="success"
              />
            </div>

            {/* Sales Table Card */}
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)', marginTop: '24px', boxShadow: 'none' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t("reports.sales.breakdownTitle", "Sales Transaction Breakdown")}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t("reports.sales.breakdownSubtitle", "Detailed log of customer tax invoices, taxable turnover, and payment settlement statuses.")}
                </p>
              </div>

              {/* Desktop View */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("sales.invoiceNo", "Invoice No")}</th>
                        <th>{t("sales.customerName", "Customer Name")}</th>
                        <th>{t("reports.date", "Date")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.sales.taxableAmtRs", "Taxable Amt (₹)")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.sales.taxCollectedRs", "Tax collected (₹)")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.sales.grandTotalRs", "Grand Total (₹)")}</th>
                        <th>{t("reports.custLedger.status", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{inv.invoiceNumber}</td>
                          <td>{inv.customerName}</td>
                          <td>{formatDate(inv.date)}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(inv.subtotal - inv.discountTotal).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(inv.gstTotal).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(inv.grandTotal).replace('₹', '')}</td>
                          <td>
                            <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-success' : inv.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                              {translateStatus(t, inv.paymentStatus)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                        <td colSpan={3}>{t("reports.summaryTotal", "Report Summary Total")}:</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalSalesTax).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalSalesVal).replace('₹', '')}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="mobile-card-list">
                {filteredInvoices.map((inv) => (
                  <div key={inv.id} className="mobile-list-card">
                    <div className="mobile-list-card-header">
                      <div>
                        <h4 className="mobile-list-card-title">{inv.invoiceNumber}</h4>
                        <span className="mobile-list-card-subtitle">{inv.customerName}</span>
                      </div>
                      <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-success' : inv.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                        {translateStatus(t, inv.paymentStatus)}
                      </span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("common.date", "Date")}</span>
                      <span className="mobile-list-card-val">{formatDate(inv.date)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.sales.taxableAmt", "Taxable Amt")}</span>
                      <span className="mobile-list-card-val">{formatINR(inv.subtotal - inv.discountTotal)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.sales.taxCollected", "Tax Collected")}</span>
                      <span className="mobile-list-card-val">{formatINR(inv.gstTotal)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("sales.grandTotal", "Grand Total")}</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(inv.grandTotal)}</span>
                    </div>
                  </div>
                ))}
                
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--primary-dark)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>{t("reports.summaryTotal", "Report Summary Total")}</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">t("reports.taxableValue", "Taxable Value")</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalSalesBase)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.purchase.totalTax", "Total Tax")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalSalesTax)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.sales.totalValue", "Total Value")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '15px' }}>{formatINR(totalSalesVal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'purchase':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <KpiCard
                label={t("reports.purchase.billsLoggedCard", "Bills logged")}
                value={filteredPurchases.length}
                subtext="Supplier inward vouchers"
                icon={<BookOpen size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.purchase.totalBasePurchasesCard", "Total Base Purchases")}
                value={formatINR(totalPurchasesBase)}
                subtext="Taxable raw cost"
                icon={<DollarSign size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.purchase.totalGstPaidCard", "Total GST Paid")}
                value={formatINR(totalPurchasesTax)}
                subtext="Input tax credit"
                icon={<Percent size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.purchase.totalOutwardCostCard", "Total Outward Cost")}
                value={formatINR(totalPurchasesVal)}
                subtext="Inclusive of GST"
                icon={<TrendingDown size={20} />}
                variant="danger"
              />
            </div>

            {/* Purchase Table Card */}
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)', marginTop: '24px', boxShadow: 'none' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t("reports.purchase.breakdownTitle", "Purchase Transaction Breakdown")}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t("reports.purchase.breakdownSubtitle", "Detailed log of supplier inward purchase vouchers, input costs, and raw materials tax credit.")}
                </p>
              </div>

              {/* Desktop View */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("purchases.billNumber", "Bill Number")}</th>
                        <th>{t("purchases.supplierName", "Supplier Name")}</th>
                        <th>{t("reports.receiptDate", "Receipt Date")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.purchase.baseCostRs", "Base Cost (₹)")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.purchase.taxPaidRs", "Tax paid (₹)")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.purchase.totalCostRs", "Total Cost (₹)")}</th>
                        <th>{t("reports.custLedger.status", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.map((pur) => (
                        <tr key={pur.id}>
                          <td style={{ fontWeight: 600, color: 'var(--color-info)' }}>{pur.purchaseNumber}</td>
                          <td>{pur.supplierName}</td>
                          <td>{formatDate(pur.date)}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(pur.subtotal).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(pur.gstTotal).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(pur.grandTotal).replace('₹', '')}</td>
                          <td>
                            <span className={`badge ${pur.paymentStatus === 'Paid' ? 'badge-success' : pur.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                              {translateStatus(t, pur.paymentStatus)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                        <td colSpan={3}>{t("reports.summaryTotal", "Report Summary Total")}:</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalPurchasesBase).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalPurchasesTax).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalPurchasesVal).replace('₹', '')}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="mobile-card-list">
                {filteredPurchases.map((pur) => (
                  <div key={pur.id} className="mobile-list-card">
                    <div className="mobile-list-card-header">
                      <div>
                        <h4 className="mobile-list-card-title">{pur.purchaseNumber}</h4>
                        <span className="mobile-list-card-subtitle">{pur.supplierName}</span>
                      </div>
                      <span className={`badge ${pur.paymentStatus === 'Paid' ? 'badge-success' : pur.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                        {translateStatus(t, pur.paymentStatus)}
                      </span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.receiptDate", "Receipt Date")}</span>
                      <span className="mobile-list-card-val">{formatDate(pur.date)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.purchase.baseCost", "Base Cost")}</span>
                      <span className="mobile-list-card-val">{formatINR(pur.subtotal)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.purchase.taxPaid", "Tax Paid")}</span>
                      <span className="mobile-list-card-val">{formatINR(pur.gstTotal)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.purchase.totalCost", "Total Cost")}</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(pur.grandTotal)}</span>
                    </div>
                  </div>
                ))}
                
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-info)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>{t("reports.summaryTotal", "Report Summary Total")}</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.purchase.totalBase", "Total Base")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalPurchasesBase)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.purchase.totalTax", "Total Tax")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalPurchasesTax)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.totalCost", "Total Cost")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger-dark)', fontSize: '15px' }}>{formatINR(totalPurchasesVal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'expense':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <KpiCard
                label={t("reports.expense.totalExpensesSpendsCard", "Total Expenses Spends")}
                value={formatINR(totalExpenses)}
                subtext="Cumulative operational spends"
                icon={<TrendingDown size={20} />}
                variant="danger"
              />
              <KpiCard
                label={t("reports.expense.settledPaidExpensesCard", "Settled / Paid Expenses")}
                value={formatINR(totalPaidExpensesVal)}
                subtext="Fully paid invoices"
                icon={<TrendingUp size={20} />}
                variant="success"
              />
              <KpiCard
                label={t("reports.expense.outstandingDueDuesCard", "Outstanding / Due Dues")}
                value={formatINR(totalDueExpensesVal)}
                subtext="Unsettled accounts due"
                icon={<DollarSign size={20} />}
                variant="warning"
              />
              <KpiCard
                label={t("reports.expense.topCategoryCard", "Top Category")}
                value={topExpenseCategory.name}
                subtext={`Total: ${formatINR(topExpenseCategory.amount)}`}
                icon={<Layers size={20} />}
                variant="info"
              />
            </div>

            <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)', marginTop: '24px', boxShadow: 'none' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t("reports.expense.breakdownTitle", "Expense Statement Breakdown")}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t("reports.expense.breakdownSubtitle", "Detailed log of shop rent, light bills, transportation charges, maintenance and other operational costs.")}
                </p>
              </div>
              
              {/* Desktop view */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("reports.date", "Date")}</th>
                        <th>{t("reports.expense.voucherId", "Voucher ID")}</th>
                        <th>{t("reports.stock.category", "Category")}</th>
                        <th>{t("reports.expense.payeePaidTo", "Payee (Paid To)")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.expense.amountRs", "Amount (₹)")}</th>
                        <th>{t("reports.custLedger.status", "Status")}</th>
                        <th>{t("reports.expense.method", "Method")}</th>
                        <th>{t("reports.expense.refNumber", "Ref Number")}</th>
                        <th>{t("reports.expense.notes", "Notes")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((exp) => (
                        <tr key={exp.id}>
                          <td>{formatDate(exp.date)}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{exp.id}</td>
                          <td style={{ fontWeight: 700 }}>{translateCategory(t, exp.category)}</td>
                          <td>{exp.payee || t("categories.general", "General")}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: exp.status === 'Due' ? '#D97706' : 'var(--color-danger-dark)' }}>{formatINR(exp.amount)}</td>
                          <td>
                            <span className="badge" style={{
                              padding: '2px 6px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              backgroundColor: exp.status === 'Due' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: exp.status === 'Due' ? '#D97706' : 'var(--primary)',
                              border: exp.status === 'Due' ? '1px solid rgba(217, 119, 6, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                              {translateStatus(t, exp.status || 'Paid')}
                            </span>
                          </td>
                          <td>{exp.status === 'Due' ? '—' : translatePaymentMethod(t, exp.paymentMethod)}</td>
                          <td style={{ fontFamily: 'monospace' }}>{exp.status === 'Due' ? '—' : (exp.referenceNumber || '—')}</td>
                          <td style={{ fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.notes || '—'}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                        <td colSpan={4}>{t("reports.summaryTotal", "Report Summary Total")}:</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-danger-dark)' }}>{formatINR(totalExpenses).replace('₹', '')}</td>
                        <td colSpan={4}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile view */}
              <div className="mobile-card-list">
                {filteredExpenses.map((exp) => (
                  <div key={exp.id} className="mobile-list-card" style={{ borderLeftColor: exp.status === 'Due' ? '#D97706' : 'var(--color-danger)' }}>
                    <div className="mobile-list-card-header">
                      <div>
                        <h4 className="mobile-list-card-title">{translateCategory(t, exp.category)}</h4>
                        <span className="mobile-list-card-subtitle">{formatDate(exp.date)}</span>
                      </div>
                      <span className="badge" style={{
                        padding: '2px 6px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        backgroundColor: exp.status === 'Due' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: exp.status === 'Due' ? '#D97706' : 'var(--primary)',
                        border: exp.status === 'Due' ? '1px solid rgba(217, 119, 6, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        {translateStatus(t, exp.status || 'Paid')}
                      </span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.expense.payeeLabel", "Payee")}</span>
                      <span className="mobile-list-card-val">{exp.payee || t("categories.general", "General")}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("common.amount", "Amount")}</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 700, color: exp.status === 'Due' ? '#D97706' : 'var(--color-danger-dark)' }}>{formatINR(exp.amount)}</span>
                    </div>
                    {exp.status !== 'Due' && (
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">{t("reports.expense.method", "Method")}</span>
                        <span className="mobile-list-card-val">{translatePaymentMethod(t, exp.paymentMethod)}</span>
                      </div>
                    )}
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.expense.remarks", "Remarks")}</span>
                      <span className="mobile-list-card-val" style={{ fontStyle: 'italic' }}>{exp.notes || '—'}</span>
                    </div>
                  </div>
                ))}
                
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-info)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>{t("reports.summaryTotal", "Report Summary Total")}</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.expense.totalExpense", "Total Expense")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger-dark)', fontSize: '15px' }}>{formatINR(totalExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'profit':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <KpiCard
                label={t("reports.profit.salesRevenueTaxable", "Sales Revenue (Taxable)")}
                value={formatINR(totalSalesBase)}
                subtext="Goods value dispatched"
                icon={<TrendingUp size={20} />}
                variant="success"
              />
              <KpiCard
                label={t("reports.profit.cogsLabel", "Cost of Goods Sold (COGS)")}
                value={formatINR(coGS)}
                subtext="Original inventory purchase cost"
                icon={<TrendingDown size={20} />}
                variant="danger"
              />
              <KpiCard
                label={t("reports.profit.operationalExpensesLabel", "Operational Expenses")}
                value={formatINR(totalExpenses)}
                subtext="Rent, utility bills, salary, etc."
                icon={<TrendingDown size={20} />}
                variant="danger"
              />
              <KpiCard
                label={t("reports.profit.netProfitLossLabel", "Net Profit (Loss)")}
                value={formatINR(netProfit)}
                subtext={`Margin percentage: ${profitMarginPercent.toFixed(1)}%`}
                icon={<Percent size={20} />}
                variant={netProfit >= 0 ? "success" : "danger"}
              />
            </div>

            <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '14px' }}>{t("reports.profit.tableTitle", "Sales Profit Breakdown by Invoices")}</h4>
              {/* Desktop View */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("sales.invoiceNo", "Invoice No")}</th>
                        <th>{t("reports.date", "Date")}</th>
                        <th>{t("reports.profit.customer", "Customer")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.profit.taxableSalesRs", "Taxable Sales (₹)")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.profit.costPriceRs", "Cost Price (₹)")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.profit.netProfitRs", "Net Profit (₹)")}</th>
                        <th style={{ textAlign: 'center' }}>{t("reports.profit.marginPercent", "Margin (%)")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => {
                        const invoiceCOGS = inv.items.reduce((s, i) => {
                          const cost = products.find((p) => p.id === i.productId)?.purchasePrice || 0;
                          return s + (i.quantity * cost);
                        }, 0);
                        const invProfit = inv.subtotal - invoiceCOGS;
                        const invMargin = inv.subtotal > 0 ? (invProfit / inv.subtotal) * 100 : 0;

                        return (
                          <tr key={inv.id}>
                            <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{inv.invoiceNumber}</td>
                            <td>{formatDate(inv.date)}</td>
                            <td>{inv.customerName}</td>
                            <td style={{ textAlign: 'right' }}>{formatINR(inv.subtotal).replace('₹', '')}</td>
                            <td style={{ textAlign: 'right' }}>{formatINR(invoiceCOGS).replace('₹', '')}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: invProfit >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>
                              {formatINR(invProfit).replace('₹', '')}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{invMargin.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                        <td colSpan={3}>{t("reports.summaryTotal", "Report Summary Total")}:</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(coGS).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right', color: 'var(--primary-dark)' }}>{formatINR(grossProfit).replace('₹', '')}</td>
                        <td style={{ textAlign: 'center' }}>{profitMarginPercent.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="mobile-card-list">
                {filteredInvoices.map((inv) => {
                  const invoiceCOGS = inv.items.reduce((s, i) => {
                    const cost = products.find((p) => p.id === i.productId)?.purchasePrice || 0;
                    return s + (i.quantity * cost);
                  }, 0);
                  const invProfit = inv.subtotal - invoiceCOGS;
                  const invMargin = inv.subtotal > 0 ? (invProfit / inv.subtotal) * 100 : 0;

                  return (
                    <div key={inv.id} className="mobile-list-card">
                      <div className="mobile-list-card-header">
                        <div>
                          <h4 className="mobile-list-card-title">{inv.invoiceNumber}</h4>
                          <span className="mobile-list-card-subtitle">{inv.customerName}</span>
                        </div>
                        <span className="badge" style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>{t("reports.profit.marginBadge", "{{margin}}% Margin", { margin: invMargin.toFixed(1) })}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">{t("reports.date", "Date")}</span>
                        <span className="mobile-list-card-val">{formatDate(inv.date)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">{t("reports.profit.taxableSales", "Taxable Sales")}</span>
                        <span className="mobile-list-card-val">{formatINR(inv.subtotal)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">{t("reports.profit.costPrice", "Cost Price")}</span>
                        <span className="mobile-list-card-val">{formatINR(invoiceCOGS)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">{t("reports.profit.netProfit", "Net Profit")}</span>
                        <span className="mobile-list-card-val" style={{ fontWeight: 700, color: invProfit >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>{formatINR(invProfit)}</span>
                      </div>
                    </div>
                  );
                })}
                
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--primary-dark)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>{t("reports.summaryTotal", "Report Summary Total")}</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.profit.totalSales", "Total Sales")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalSalesBase)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.totalCost", "Total Cost")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(coGS)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.profit.totalProfit", "Total Profit")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '15px' }}>{formatINR(grossProfit)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.profit.averageMargin", "Average Margin")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800 }}>{profitMarginPercent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'stock':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <KpiCard
                label={t("reports.stock.totalStockQty", "Total Stock Quantity")}
                value={`${totalStockQty} items`}
                subtext="Available in warehouse"
                icon={<Layers size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.stock.stockValuationAssetCost", "Stock Valuation (Asset Cost)")}
                value={formatINR(totalAssetVal)}
                subtext="Valued at base purchase price"
                icon={<DollarSign size={20} />}
                variant="success"
              />
              <KpiCard
                label={t("reports.stock.potentialValueRetail", "Potential Value (Retail)")}
                value={formatINR(totalRetailVal)}
                subtext="Valued at sales retail price"
                icon={<TrendingUp size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.stock.potentialMarkupMargin", "Potential Markup Margin")}
                value={formatINR(totalRetailVal - totalAssetVal)}
                subtext="Valued at sales markup profit"
                icon={<Briefcase size={20} />}
                variant="success"
              />
            </div>

            {/* Stock Table Card */}
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)', marginTop: '24px', boxShadow: 'none' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('reports.inventoryStockBreakdown', 'Inventory Stock Status Breakdown')}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t('reports.inventoryStockDesc', 'Detailed summary of available catalog stock quantity, unit purchase costs, and raw inventory asset valuations.')}
                </p>
              </div>

              {/* Desktop View */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("reports.stock.skuCode", "SKU Code")}</th>
                        <th>{t("reports.stock.productName", "Product Name")}</th>
                        <th>{t("reports.stock.category", "Category")}</th>
                        <th style={{ textAlign: 'center' }}>{t("reports.stock.availableQty", "Available Qty")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.profit.costPriceRs", "Cost Price (₹)")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.stock.assetValuationRs", "Asset Valuation (₹)")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.stock.retailRateRs", "Retail Rate (₹)")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.stock.retailValuationRs", "Retail Valuation (₹)")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => {
                        const itemAssetVal = p.stock * p.purchasePrice;
                        const itemRetailVal = p.stock * p.sellingPrice;
                        return (
                          <tr key={p.id}>
                            <td style={{ fontFamily: 'monospace' }}>{p.sku}</td>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td>{translateCategory(t, p.category)}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.stock}</td>
                            <td style={{ textAlign: 'right' }}>{formatINR(p.purchasePrice).replace('₹', '')}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(itemAssetVal).replace('₹', '')}</td>
                            <td style={{ textAlign: 'right' }}>{formatINR(p.sellingPrice).replace('₹', '')}</td>
                            <td style={{ textAlign: 'right' }}>{formatINR(itemRetailVal).replace('₹', '')}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                        <td colSpan={3}>{t("reports.stock.stockSummaryTotalColon", "Stock Summary Total:")}</td>
                        <td style={{ textAlign: 'center' }}>{totalStockQty}</td>
                        <td></td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalAssetVal).replace('₹', '')}</td>
                        <td></td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalRetailVal).replace('₹', '')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="mobile-card-list">
                {products.map((p) => {
                  const itemAssetVal = p.stock * p.purchasePrice;
                  const itemRetailVal = p.stock * p.sellingPrice;
                  return (
                    <div key={p.id} className="mobile-list-card">
                      <div className="mobile-list-card-header">
                        <div>
                          <h4 className="mobile-list-card-title">{p.name}</h4>
                          <span className="mobile-list-card-subtitle">{translateCategory(t, p.category)} • SKU: {p.sku}</span>
                        </div>
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>{t("reports.stock.unitsBadge", "{{count}} Units", { count: p.stock })}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">{t("reports.stock.costRetailRate", "Cost / Retail Rate")}</span>
                        <span className="mobile-list-card-val">{formatINR(p.purchasePrice)} / {formatINR(p.sellingPrice)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">{t("reports.stock.assetValuation", "Asset Valuation")}</span>
                        <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{formatINR(itemAssetVal)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">{t("reports.stock.retailValuation", "Retail Valuation")}</span>
                        <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{formatINR(itemRetailVal)}</span>
                      </div>
                    </div>
                  );
                })}
                
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--primary-dark)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>{t("reports.stock.stockSummaryTotal", "Stock Summary Total")}</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.stock.totalQtyLabel", "Total Qty")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{t("reports.stock.itemsValue", "{{count}} items", { count: totalStockQty })}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.stock.totalAssetValue", "Total Asset Value")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{formatINR(totalAssetVal)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">{t("reports.stock.totalRetailValue", "Total Retail Value")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800 }}>{formatINR(totalRetailVal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'gst':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {/* GST Summary metrics */}
            <div style={kpiGridStyle}>
              <KpiCard
                label={t("reports.gst.grossTaxableTurnover", "Gross Taxable Turnover")}
                value={formatINR(totalSalesBase)}
                subtext="Excluding tax value"
                icon={<DollarSign size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.gst.outputGstCollectedLabel", "Output GST (Collected)")}
                value={formatINR(totalSalesTax)}
                subtext={`CGST: ${formatINR(totalCGSTCollected)} | SGST: ${formatINR(totalSGSTCollected)}`}
                icon={<TrendingUp size={20} />}
                variant="success"
              />
              <KpiCard
                label={t("reports.gst.inputGstItcPaidLabel", "Input GST (ITC Paid)")}
                value={formatINR(totalPurchasesTax)}
                subtext={`CGST: ${formatINR(totalCGSTPaid)} | SGST: ${formatINR(totalSGSTPaid)}`}
                icon={<TrendingDown size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.gst.netGstLiability", "Net GST Liability")}
                value={formatINR(netGSTDue)}
                subtext={netGSTDue >= 0 ? 'Cash Payable to Govt' : 'Carry Forward Credit'}
                icon={<Percent size={20} />}
                variant={netGSTDue >= 0 ? "danger" : "success"}
              />
            </div>

            {/* GST summary log */}
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)', marginTop: '24px', boxShadow: 'none' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('reports.gstrSummaryLogs', 'GSTR Summary Ledger Logs')}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t('reports.gstrSummaryLogsDesc', 'Aggregated GST summary statement of output tax liability and input tax credit (ITC) offsets.')}
                </p>
              </div>
                {/* Desktop View */}
                <div className="desktop-only-table">
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t("reports.gst.transactionType", "Transaction Type")}</th>
                          <th>{t("reports.gst.documentCount", "Document Count")}</th>
                          <th style={{ textAlign: 'right' }}>{t("reports.gst.goodsValueBase", "Goods Value (Base cost)")}</th>
                          <th style={{ textAlign: 'right' }}>{t("reports.gst.cgstHeader", "Central GST (CGST)")}</th>
                          <th style={{ textAlign: 'right' }}>{t("reports.gst.sgstHeader", "State GST (SGST)")}</th>
                          <th style={{ textAlign: 'right' }}>Total {t("reports.gstr3b.taxLiabilityRs", "Tax Liability (₹)")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600, color: 'var(--color-success-dark)' }}>{t("reports.gst.outwardSupplyInvoices", "Outward Supply (Sales Invoices)")}</td>
                          <td>{filteredInvoices.length}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalCGSTCollected).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalSGSTCollected).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success-dark)' }}>
                            {formatINR(totalSalesTax).replace('₹', '')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                          <td style={{ fontWeight: 600, color: 'var(--color-info-dark)' }}>{t("reports.gst.inwardSupplyBills", "Inward Supply (Supplier Bills)")}</td>
                          <td>{filteredPurchases.length}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalPurchasesBase).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalCGSTPaid).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalSGSTPaid).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-info-dark)' }}>
                            {formatINR(totalPurchasesTax).replace('₹', '')}
                          </td>
                        </tr>
                        <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                          <td colSpan={2}>{t("reports.gst.netPayableDues", "Net Payable Tax Dues:")}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalSalesBase - totalPurchasesBase).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' , color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                            {formatINR(totalCGSTCollected - totalCGSTPaid).replace('₹', '')}
                          </td>
                          <td style={{ textAlign: 'right' , color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                            {formatINR(totalSGSTCollected - totalSGSTPaid).replace('₹', '')}
                          </td>
                          <td style={{ textAlign: 'right' , color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                            {formatINR(netGSTDue).replace('₹', '')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="mobile-card-list">
                  <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-success-dark)' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--color-success-dark)' }}>{t("reports.gst.outwardSupplyHeader", "Outward Supply (Sales)")}</div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.documentCount", "Document Count")}</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{filteredInvoices.length}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.goodsValueBaseLabel", "Goods Value (Base)")}</span>
                      <span className="mobile-list-card-val">{formatINR(totalSalesBase)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.cgstCollected", "CGST collected")}</span>
                      <span className="mobile-list-card-val">{formatINR(totalCGSTCollected)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.sgstCollected", "SGST collected")}</span>
                      <span className="mobile-list-card-val">{formatINR(totalSGSTCollected)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.totalOutputGst", "Total Output GST")}</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 700, color: 'var(--color-success-dark)' }}>{formatINR(totalSalesTax)}</span>
                    </div>
                  </div>

                  <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-info-dark)' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--color-info-dark)' }}>{t("reports.gst.inwardSupplyHeader", "Inward Supply (Purchases)")}</div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.documentCount", "Document Count")}</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{filteredPurchases.length}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.goodsValueBaseLabel", "Goods Value (Base)")}</span>
                      <span className="mobile-list-card-val">{formatINR(totalPurchasesBase)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.cgstPaid", "CGST Paid")}</span>
                      <span className="mobile-list-card-val">{formatINR(totalCGSTPaid)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.sgstPaid", "SGST Paid")}</span>
                      <span className="mobile-list-card-val">{formatINR(totalSGSTPaid)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.totalInputItc", "Total Input ITC")}</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 700, color: 'var(--color-info-dark)' }}>{formatINR(totalPurchasesTax)}</span>
                    </div>
                  </div>

                  <div className="mobile-list-card" style={{ borderLeftColor: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', background: 'var(--bg-app)' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>{t("reports.gst.netPayableDuesNoColon", "Net Payable Tax Dues")}</div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.netGoodsDiff", "Net Goods Difference")}</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{formatINR(totalSalesBase - totalPurchasesBase)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.netCgst", "Net CGST")}</span>
                      <span className="mobile-list-card-val" style={{ color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>{formatINR(totalCGSTCollected - totalCGSTPaid)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.netSgst", "Net SGST")}</span>
                      <span className="mobile-list-card-val" style={{ color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>{formatINR(totalSGSTCollected - totalSGSTPaid)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.gst.netLiability", "Net Liability")}</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 800, color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', fontSize: '15px' }}>{formatINR(netGSTDue)}</span>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        );

      case 'custLedger':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <KpiCard
                label={t("reports.custLedger.registeredCustomers", "Registered Customers")}
                value={totalCustomers}
                subtext="Active accounts"
                icon={<Users size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.custLedger.accountsWithDues", "Accounts with Dues")}
                value={`${customersWithDues} accounts`}
                subtext="Customers owing payments"
                icon={<Users size={20} />}
                variant="warning"
              />
              <KpiCard
                label={t("reports.custLedger.totalOutstandingDues", "Total Outstanding Dues")}
                value={formatINR(pendingReceivables)}
                subtext="Collectable assets"
                icon={<TrendingUp size={20} />}
                variant="danger"
              />
              <KpiCard
                label={t("reports.custLedger.averageOutstanding", "Average Outstanding")}
                value={formatINR(averageReceivable)}
                subtext="Per active customer account"
                icon={<DollarSign size={20} />}
                variant="info"
              />
            </div>

            {/* Customer Ledger Table Card */}
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)', marginTop: '24px', boxShadow: 'none' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('reports.customerLedger', 'Customer Outstanding Ledger')}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t('reports.customerLedgerDesc', 'Detailed ledger balances showing outstanding dues pending and advance customer accounts.')}
                </p>
              </div>

              {/* Desktop View */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("reports.custLedger.customerId", "Customer ID")}</th>
                        <th>{t("sales.customerName", "Customer Name")}</th>
                        <th>{t("reports.custLedger.phoneNumber", "Phone Number")}</th>
                        <th>{t("reports.custLedger.gstinIdentification", "GSTIN Identification")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.custLedger.outstandingBalanceRs", "Outstanding Balance (₹)")}</th>
                        <th>{t("reports.custLedger.status", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontFamily: 'monospace' }}>{c.id}</td>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td>{c.phone}</td>
                          <td style={{ fontFamily: 'monospace' }}>{c.gstin || '—'}</td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              color: c.outstanding > 0 ? 'var(--color-danger)' : c.outstanding < 0 ? 'var(--color-success-dark)' : 'inherit',
                            }}
                          >
                            {formatINR(c.outstanding)}
                          </td>
                          <td>
                            <span className={`badge ${c.outstanding === 0 ? 'badge-success' : c.outstanding > 0 ? 'badge-warning' : 'badge-info'}`}>
                              {c.outstanding === 0 ? t('status.settled', 'Settled') : c.outstanding > 0 ? t('status.duesPending', 'Dues Pending') : t('status.advanceCredit', 'Advance Credit')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                        <td colSpan={4}>{t("reports.custLedger.accumulatedDuesTotal", "Accumulated Customer Dues:")}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                          {formatINR(pendingReceivables)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="mobile-card-list">
                {customers.map((c) => (
                  <div key={c.id} className="mobile-list-card">
                    <div className="mobile-list-card-header">
                      <div>
                        <h4 className="mobile-list-card-title">{c.name}</h4>
                        <span className="mobile-list-card-subtitle">ID: {c.id} • {c.phone}</span>
                      </div>
                      <span className={`badge ${c.outstanding === 0 ? 'badge-success' : c.outstanding > 0 ? 'badge-warning' : 'badge-info'}`}>
                        {c.outstanding === 0 ? t('status.settled', 'Settled') : c.outstanding > 0 ? t('status.duesPending', 'Dues Pending') : t('status.advanceCredit', 'Advance Credit')}
                      </span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.print.gstin", "GSTIN")}</span>
                      <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{c.gstin || '—'}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.custLedger.outstandingBalance", "Outstanding Balance")}</span>
                      <span className="mobile-list-card-val" style={{
                        fontWeight: 700,
                        color: c.outstanding > 0 ? 'var(--color-danger)' : c.outstanding < 0 ? 'var(--color-success-dark)' : 'inherit',
                      }}>{formatINR(c.outstanding)}</span>
                    </div>
                  </div>
                ))}
                
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-danger)', background: 'var(--bg-app)' }}>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label" style={{ fontWeight: 700 }}>{t("reports.custLedger.accumulatedDuesTotalNoColon", "Accumulated Customer Dues")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '15px' }}>
                      {formatINR(pendingReceivables)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'suppLedger':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <KpiCard
                label={t("reports.suppLedger.registeredSuppliers", "Registered Suppliers")}
                value={totalSuppliers}
                subtext="Active accounts"
                icon={<Truck size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.suppLedger.accountsWithBalance", "Accounts with Balance")}
                value={`${suppliersWithDues} accounts`}
                subtext="Suppliers we owe money"
                icon={<Truck size={20} />}
                variant="warning"
              />
              <KpiCard
                label={t("reports.suppLedger.totalBalanceOwed", "Total Balance Owed")}
                value={formatINR(pendingPayables)}
                subtext="Accounts payable cost"
                icon={<TrendingDown size={20} />}
                variant="danger"
              />
              <KpiCard
                label={t("reports.suppLedger.averagePayable", "Average Payable")}
                value={formatINR(averagePayable)}
                subtext="Per active supplier account"
                icon={<DollarSign size={20} />}
                variant="info"
              />
            </div>

            {/* Supplier Ledger Table Card */}
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)', marginTop: '24px', boxShadow: 'none' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t("reports.suppLedger.title", "Supplier Outstanding Ledger")}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t("reports.suppLedger.subtitle", "Detailed ledger balances showing raw material accounts payable costs and pending supplier settlements.")}
                </p>
              </div>

              {/* Desktop View */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("reports.suppLedger.supplierId", "Supplier ID")}</th>
                        <th>{t("reports.suppLedger.companySupplierName", "Company / Supplier Name")}</th>
                        <th>{t("reports.suppLedger.phoneContact", "Phone / Contact")}</th>
                        <th>{t("reports.custLedger.gstinIdentification", "GSTIN Identification")}</th>
                        <th style={{ textAlign: 'right' }}>{t("reports.suppLedger.balanceOwedRs", "Balance Owed (₹)")}</th>
                        <th>{t("reports.custLedger.status", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontFamily: 'monospace' }}>{s.id}</td>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td>{s.phone}</td>
                          <td style={{ fontFamily: 'monospace' }}>{s.gstin || '—'}</td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              color: s.outstanding > 0 ? 'var(--color-danger)' : 'inherit',
                            }}
                          >
                            {formatINR(s.outstanding)}
                          </td>
                          <td>
                            <span className={`badge ${s.outstanding === 0 ? 'badge-success' : 'badge-warning'}`}>
                              {s.outstanding === 0 ? t('status.settled', 'Settled') : t('status.payablePending', 'Payable Pending')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                        <td colSpan={4}>{t("reports.suppLedger.accumulatedOwedTotal", "Accumulated We Owe Suppliers:")}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                          {formatINR(pendingPayables)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="mobile-card-list">
                {suppliers.map((s) => (
                  <div key={s.id} className="mobile-list-card">
                    <div className="mobile-list-card-header">
                      <div>
                        <h4 className="mobile-list-card-title">{s.name}</h4>
                        <span className="mobile-list-card-subtitle">ID: {s.id} • {s.phone}</span>
                      </div>
                      <span className={`badge ${s.outstanding === 0 ? 'badge-success' : s.outstanding >-1 ? 'badge-warning' : 'badge-info'}`}>
                        {s.outstanding === 0 ? t('status.settled', 'Settled') : t('status.payablePending', 'Payable Pending')}
                      </span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.print.gstin", "GSTIN")}</span>
                      <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{s.gstin || '—'}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">{t("reports.suppLedger.balanceOwed", "Balance Owed")}</span>
                      <span className="mobile-list-card-val" style={{
                        fontWeight: 700,
                        color: s.outstanding > 0 ? 'var(--color-danger)' : 'inherit',
                      }}>{formatINR(s.outstanding)}</span>
                    </div>
                  </div>
                ))}
                
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-danger)', background: 'var(--bg-app)' }}>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label" style={{ fontWeight: 700 }}>{t("reports.suppLedger.accumulatedOwedTotalNoColon", "Accumulated Owed Balance")}</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '15px' }}>
                      {formatINR(pendingPayables)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'gstr1':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {/* GSTR-1 Header Dashboard Cards */}
            <div style={kpiGridStyle}>
              <KpiCard
                label={t("reports.gstr1.b2bInvoicesCard", "B2B Invoices (Registered)")}
                value={`${gstr1B2BList.length} Rows`}
                subtext={`Taxable: ${formatINR(gstr1B2BList.reduce((acc, x) => acc + x.taxableValue, 0))}`}
                icon={<BookOpen size={20} />}
                variant="success"
              />
              <KpiCard
                label={t("reports.gstr1.b2csCard", "B2CS (Unregistered OE)")}
                value={`${gstr1B2CSList.length} Groups`}
                subtext={`Taxable: ${formatINR(gstr1B2CSList.reduce((acc, x) => acc + x.taxable, 0))}`}
                icon={<Users size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.gstr1.hsnCard", "HSN Summary (Table 12)")}
                value={`${gstr1HSNList.length} Categories`}
                subtext={`Taxable: ${formatINR(gstr1HSNList.reduce((acc, x) => acc + x.taxable, 0))}`}
                icon={<Layers size={20} />}
                variant="warning"
              />
              <KpiCard
                label={t("reports.gstr1.docsCard", "Documents Issued (Table 13)")}
                value={`${gstr1DocsSummary.total} Invoices`}
                subtext={`Range: ${gstr1DocsSummary.from} - ${gstr1DocsSummary.to}`}
                icon={<FileText size={20} />}
                variant="danger"
              />
            </div>

            {/* GSTR-1 Main Section Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* 1. B2B Outward Supplies */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t("reports.gstr1.b2bTitle", "1. B2B Registered Outward Supplies (4A, 4B, 4C, 6B, 6C)")}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {t("reports.gstr1.b2bSubtitle", "Outward supplies made to GST registered entities. Grouped by invoice number and tax rate.")}
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr1B2B} disabled={gstr1B2BList.length === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> {t("reports.gstr1.downloadB2bCsv", "Download B2B CSV")}
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">{t("reports.gstr1.recipientGstin", "Recipient GSTIN")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.recipientName", "Recipient Name")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.invoiceNo", "Invoice No")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.invoiceDate", "Invoice Date")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.totalValue", "Total Value")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.pos", "POS")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr1.rate", "Rate")}</th>
                        <th className="text-nowrap align-right">{t("reports.taxableValue", "Taxable Value")}</th>
                        <th className="text-nowrap align-right">{t("reports.cgst", "CGST")}</th>
                        <th className="text-nowrap align-right">{t("reports.sgst", "SGST")}</th>
                        <th className="text-nowrap align-right">{t("reports.igst", "IGST")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1B2BList.length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            {t("reports.gstr1.noB2bSupplies", "No registered B2B supplies found in this period.")}
                          </td>
                        </tr>
                      ) : (
                        gstr1B2BList.map((item, idx) => (
                          <tr key={idx}>
                            <td className="text-nowrap" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.gstin}</td>
                            <td className="text-nowrap">{item.receiverName}</td>
                            <td className="text-nowrap" style={{ fontFamily: 'monospace' }}>{item.invoiceNumber}</td>
                            <td className="text-nowrap">{item.invoiceDate}</td>
                            <td className="text-nowrap align-right" style={{ fontWeight: 600 }}>{formatINR(item.invoiceValue).replace('₹', '')}</td>
                            <td className="text-nowrap">{item.pos}</td>
                            <td className="text-nowrap align-center" style={{ fontWeight: 'bold' }}>{item.rate}%</td>
                            <td className="text-nowrap align-right" style={{ fontWeight: 600 }}>{formatINR(item.taxableValue).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.cgst).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.sgst).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.igst).replace('₹', '')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. B2CS Consumer Supplies */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t("reports.gstr1.b2csTitle", "2. B2C Small Outward Supplies (7 - Consolidated)")}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {t("reports.gstr1.b2csSubtitle", "Consolidated taxable outward supplies to unregistered customers. Grouped by Place of Supply (POS) and Tax Rate.")}
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr1B2CS} disabled={gstr1B2CSList.length === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> {t("reports.gstr1.downloadB2csCsv", "Download B2CS CSV")}
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">{t("reports.gstr1.type", "Type")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.placeOfSupply", "Place of Supply (POS)")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr1.gstRate", "GST Rate")}</th>
                        <th className="text-nowrap align-right">{t("reports.taxableValue", "Taxable Value")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.cgstAmount", "CGST Amount")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.sgstAmount", "SGST Amount")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.igstAmount", "IGST Amount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1B2CSList.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            {t("reports.gstr1.noB2csSupplies", "No unregistered B2C supplies found in this period.")}
                          </td>
                        </tr>
                      ) : (
                        gstr1B2CSList.map((item, idx) => (
                          <tr key={idx}>
                            <td className="text-nowrap">{t("reports.gstr1.oeOther", "OE (Other)")}</td>
                            <td className="text-nowrap" style={{ fontWeight: 600 }}>{item.pos}</td>
                            <td className="text-nowrap align-center" style={{ fontWeight: 'bold' }}>{item.rate}%</td>
                            <td className="text-nowrap align-right" style={{ fontWeight: 600 }}>{formatINR(item.taxable).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.cgst).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.sgst).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.igst).replace('₹', '')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. HSN Summary */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t("reports.gstr1.hsnTitle", "{t('reports.hsnOutwardSummary', '3. HSN Summary of Outward Supplies (Table 12)')}")}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {t("reports.gstr1.hsnSubtitle", "HSN-code summary of agricultural goods supplied. Required for return filing.")}
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr1HSN} disabled={gstr1HSNList.length === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> {t("reports.gstr1.downloadHsnCsv", "Download HSN CSV")}
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">{t("reports.gstr1.hsnSac", "HSN/SAC")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.productDescription", "Product Description")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.unitUqc", "Unit (UQC)")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr1.totalQty", "Total Qty")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.totalValue", "Total Value")}</th>
                        <th className="text-nowrap align-right">{t("reports.taxableValue", "Taxable Value")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.cgstPaid", "CGST Paid")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.sgstPaid", "SGST Paid")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.igstPaid", "IGST Paid")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1HSNList.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            {t("reports.gstr1.noHsnItems", "No items found in this period.")}
                          </td>
                        </tr>
                      ) : (
                        gstr1HSNList.map((item, idx) => (
                          <tr key={idx}>
                            <td className="text-nowrap" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.hsn}</td>
                            <td className="text-nowrap">{item.desc}</td>
                            <td className="text-nowrap" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.uqc}</td>
                            <td className="text-nowrap align-center" style={{ fontWeight: 'bold' }}>{item.qty}</td>
                            <td className="text-nowrap align-right">{formatINR(item.totalVal).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ fontWeight: 600 }}>{formatINR(item.taxable).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.cgst).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.sgst).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.igst).replace('₹', '')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Documents Issued */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t("reports.gstr1.docsTitle", "4. Summary of Documents Issued (Table 13)")}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {t("reports.gstr1.docsSubtitle", "Serial number range and counts of tax invoices issued during the period.")}
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr1Docs} disabled={gstr1DocsSummary.total === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> {t("reports.gstr1.downloadDocsCsv", "Download Docs CSV")}
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">{t("reports.gstr1.natureOfDocument", "Nature of Document")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.srNoFrom", "Sr. No. From")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.srNoTo", "Sr. No. To")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr1.totalCount", "Total Count")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr1.cancelled", "Cancelled")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr1.netIssued", "Net Issued")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1DocsSummary.total === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            {t("reports.gstr1.noDocsIssued", "No invoice documents issued in this period.")}
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="text-nowrap" style={{ fontWeight: 600 }}>{t("reports.gstr1.invOutwardSupply", "Invoices for outward supply")}</td>
                          <td className="text-nowrap" style={{ fontFamily: 'monospace' }}>{gstr1DocsSummary.from}</td>
                          <td className="text-nowrap" style={{ fontFamily: 'monospace' }}>{gstr1DocsSummary.to}</td>
                          <td className="text-nowrap align-center" style={{ fontWeight: 'bold' }}>{gstr1DocsSummary.total}</td>
                          <td className="text-nowrap align-center" style={{ color: '#BE3144' }}>{gstr1DocsSummary.cancelled}</td>
                          <td className="text-nowrap align-center" style={{ fontWeight: 'bold', color: 'var(--primary-dark)' }}>{gstr1DocsSummary.netIssued}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        );

      case 'gstr2':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {/* GSTR-2 Header Dashboard Cards */}
            <div style={kpiGridStyle}>
              <KpiCard
                label={t("reports.gstr2.b2bPurchasesCard", "B2B Purchases (Registered)")}
                value={`${gstr2B2BList.length} Rows`}
                subtext={`Taxable: ${formatINR(gstr2B2BList.reduce((acc, x) => acc + x.taxableValue, 0))}`}
                icon={<Briefcase size={20} />}
                variant="success"
              />
              <KpiCard
                label={t("reports.gstr2.hsnInwardCard", "HSN Inward Summary (Table 13)")}
                value={`${gstr2HSNList.length} Categories`}
                subtext={`Taxable: ${formatINR(gstr2HSNList.reduce((acc, x) => acc + x.taxable, 0))}`}
                icon={<Layers size={20} />}
                variant="warning"
              />
              <KpiCard
                label={t("reports.gstr2.eligibleItcCard", "Eligible Input Tax Credit")}
                value={formatINR(totalGstr2ITC)}
                subtext="Claimable CGST+SGST+IGST"
                icon={<Percent size={20} />}
                variant="info"
              />
              <KpiCard
                label={t("reports.gstr2.docsReceivedCard", "Documents Received")}
                value={`${gstr2DocsSummary.total} Invoices`}
                subtext={`Range: ${gstr2DocsSummary.from} - ${gstr2DocsSummary.to}`}
                icon={<FileText size={20} />}
                variant="danger"
              />
            </div>

            {/* GSTR-2 Main Section Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* 1. B2B Inward Supplies */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t("reports.gstr2.b2bTitle", "1. B2B Inward Supplies Received from Registered Suppliers (3, 4A)")}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {t("reports.gstr2.b2bSubtitle", "Inward supplies received from GST registered suppliers. Grouped by invoice number and tax rate.")}
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr2B2B} disabled={gstr2B2BList.length === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> {t("reports.gstr2.downloadB2bCsv", "Download B2B CSV")}
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">{t("reports.gstr2.supplierGstin", "Supplier GSTIN")}</th>
                        <th className="text-nowrap">{t("reports.gstr2.supplierName", "Supplier Name")}</th>
                        <th className="text-nowrap">{t("reports.gstr2.billNo", "Bill No")}</th>
                        <th className="text-nowrap">{t("reports.gstr2.billDate", "Bill Date")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.totalValue", "Total Value")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.pos", "POS")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr1.rate", "Rate")}</th>
                        <th className="text-nowrap align-right">{t("reports.taxableValue", "Taxable Value")}</th>
                        <th className="text-nowrap align-right">{t("reports.cgst", "CGST")}</th>
                        <th className="text-nowrap align-right">{t("reports.sgst", "SGST")}</th>
                        <th className="text-nowrap align-right">{t("reports.igst", "IGST")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr2.itcEligible", "ITC Eligible")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr2B2BList.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            {t("reports.gstr2.noB2bSupplies", "No registered inward supplies found in this period.")}
                          </td>
                        </tr>
                      ) : (
                        gstr2B2BList.map((item, idx) => (
                          <tr key={idx}>
                            <td className="text-nowrap" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.gstin}</td>
                            <td className="text-nowrap">{item.supplierName}</td>
                            <td className="text-nowrap" style={{ fontFamily: 'monospace' }}>{item.invoiceNumber}</td>
                            <td className="text-nowrap">{item.invoiceDate}</td>
                            <td className="text-nowrap align-right" style={{ fontWeight: 600 }}>{formatINR(item.invoiceValue).replace('₹', '')}</td>
                            <td className="text-nowrap">{item.pos}</td>
                            <td className="text-nowrap align-center" style={{ fontWeight: 'bold' }}>{item.rate}%</td>
                            <td className="text-nowrap align-right" style={{ fontWeight: 600 }}>{formatINR(item.taxableValue).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.cgst).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.sgst).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.igst).replace('₹', '')}</td>
                            <td className="text-nowrap align-center"><span className="badge badge-success">{item.itcEligible}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. HSN Inward Summary */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t("reports.gstr2.hsnTitle", "{t('reports.hsnInwardSummary', '2. HSN Summary of Inward Supplies (Table 13)')}")}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {t("reports.gstr2.hsnSubtitle", "HSN-code summary of goods received (purchases). Required to audit input tax credit.")}
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr2HSN} disabled={gstr2HSNList.length === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> {t("reports.gstr2.downloadHsnCsv", "Download HSN CSV")}
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">{t("reports.gstr1.hsnSac", "HSN/SAC")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.productDescription", "Product Description")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.unitUqc", "Unit (UQC)")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr1.totalQty", "Total Qty")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.totalValue", "Total Value")}</th>
                        <th className="text-nowrap align-right">{t("reports.taxableValue", "Taxable Value")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.cgstPaid", "CGST Paid")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.sgstPaid", "SGST Paid")}</th>
                        <th className="text-nowrap align-right">{t("reports.gstr1.igstPaid", "IGST Paid")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr2HSNList.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            {t("reports.gstr2.noHsnItems", "No inward items found in this period.")}
                          </td>
                        </tr>
                      ) : (
                        gstr2HSNList.map((item, idx) => (
                          <tr key={idx}>
                            <td className="text-nowrap" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.hsn}</td>
                            <td className="text-nowrap">{item.desc}</td>
                            <td className="text-nowrap" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.uqc}</td>
                            <td className="text-nowrap align-center" style={{ fontWeight: 'bold' }}>{item.qty}</td>
                            <td className="text-nowrap align-right">{formatINR(item.totalVal).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ fontWeight: 600 }}>{formatINR(item.taxable).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.cgst).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.sgst).replace('₹', '')}</td>
                            <td className="text-nowrap align-right" style={{ color: 'var(--text-secondary)' }}>{formatINR(item.igst).replace('₹', '')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Documents Received */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t("reports.gstr2.docsTitle", "{t('reports.summaryOfDocsReceived', '3. Summary of Documents Received')}")}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {t("reports.gstr2.docsSubtitle", "Serial numbers and counts of supplier inward bills received during the period.")}
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr2Docs} disabled={gstr2DocsSummary.total === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> {t("reports.gstr2.downloadDocsCsv", "Download Docs CSV")}
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">{t("reports.gstr1.natureOfDocument", "Nature of Document")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.srNoFrom", "Sr. No. From")}</th>
                        <th className="text-nowrap">{t("reports.gstr1.srNoTo", "Sr. No. To")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr1.totalCount", "Total Count")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr1.cancelled", "Cancelled")}</th>
                        <th className="text-nowrap align-center">{t("reports.gstr2.netReceived", "Net Received")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr2DocsSummary.total === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            {t("reports.gstr2.noDocsReceived", "No invoice documents received in this period.")}
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="text-nowrap" style={{ fontWeight: 600 }}>{t("reports.gstr2.invInwardSupply", "Invoices for inward supply")}</td>
                          <td className="text-nowrap" style={{ fontFamily: 'monospace' }}>{gstr2DocsSummary.from}</td>
                          <td className="text-nowrap" style={{ fontFamily: 'monospace' }}>{gstr2DocsSummary.to}</td>
                          <td className="text-nowrap align-center" style={{ fontWeight: 'bold' }}>{gstr2DocsSummary.total}</td>
                          <td className="text-nowrap align-center" style={{ color: '#BE3144' }}>{gstr2DocsSummary.cancelled}</td>
                          <td className="text-nowrap align-center" style={{ fontWeight: 'bold', color: 'var(--primary-dark)' }}>{gstr2DocsSummary.netIssued}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        );

      case 'gstr3b':
        return renderGstr3bScreenView();

      default:
        return null;
    }
  };

  // --- Print-Only PDF content renderer ---
  const renderPrintReportContent = () => {
    switch (activeReport) {
      case 'sales':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              {t("reports.print.salesStatementTitle", "Sales Transaction Statement")}
            </h2>
            
            {/* Summary metrics block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>{t("reports.print.invoicesCount", "Invoices count:")}</strong> {filteredInvoices.length} {t("reports.invoicesCountLabel", "bills")}</div>
              <div><strong>{t("reports.print.taxableAmount", "Taxable Amount:")}</strong> {formatINR(totalSalesBase)}</div>
              <div><strong>{t("reports.print.gstTaxCollected", "GST Tax Collected:")}</strong> {formatINR(totalSalesTax)}</div>
              <div><strong>{t("reports.print.totalSalesIncGst", "Total Sales (Inc. GST):")}</strong> {formatINR(totalSalesVal)}</div>
            </div>

            {/* Print Grid Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.invoiceNo", "Invoice No")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.customerName", "Customer Name")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.date", "Date")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.taxableAmtRs", "Taxable Amt (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.taxRs", "Tax (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.grandTotalRs", "Grand Total (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>{t("reports.print.status", "Status")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{inv.customerName}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{formatDate(inv.date)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(inv.subtotal - inv.discountTotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(inv.gstTotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(inv.grandTotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{translateStatus(t, inv.paymentStatus)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>{t("reports.summaryTotal", "Report Summary Total")}:</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSalesTax).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSalesVal).replace('₹', '')}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'purchase':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              {t("reports.print.purchaseStatementTitle", "Purchase Transaction Statement")}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>{t("reports.print.billsLogged", "Bills Logged:")}</strong> {filteredPurchases.length} {t("reports.invoicesCountLabel", "invoices")}</div>
              <div><strong>{t("reports.print.taxablePurchases", "Taxable Purchases:")}</strong> {formatINR(totalPurchasesBase)}</div>
              <div><strong>{t("reports.print.gstTaxPaid", "GST Tax Paid:")}</strong> {formatINR(totalPurchasesTax)}</div>
              <div><strong>{t("reports.print.totalCostIncGst", "Total Cost (Inc. GST):")}</strong> {formatINR(totalPurchasesVal)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.billNumber", "Bill Number")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.supplierName", "Supplier Name")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.date", "Date")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.purchase.baseCostRs", "Base Cost (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.taxPaidRs", "Tax Paid (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.purchase.totalCostRs", "Total Cost (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>{t("reports.print.status", "Status")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((pur, idx) => (
                  <tr key={pur.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace', fontWeight: 'bold' }}>{pur.purchaseNumber}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{pur.supplierName}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{formatDate(pur.date)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(pur.subtotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(pur.gstTotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(pur.grandTotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{translateStatus(t, pur.paymentStatus)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>{t("reports.summaryTotal", "Report Summary Total")}:</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalPurchasesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalPurchasesTax).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalPurchasesVal).replace('₹', '')}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'expense':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              {t("reports.print.expenseStatementTitle", "Operational Expense Statement")}
            </h2>
            
            {/* Summary metrics block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '10px' }}>
              <div><strong>{t("reports.print.totalOperationalSpends", "Total Operational Spends:")}</strong> {formatINR(totalExpenses)}</div>
              <div><strong>{t("reports.print.settledSpends", "Settled Spends:")}</strong> {formatINR(totalPaidExpensesVal)}</div>
              <div><strong>{t("reports.print.outstandingDues", "Outstanding Dues:")}</strong> {formatINR(totalDueExpensesVal)}</div>
              <div><strong>{t("reports.print.topCategory", "Top Category:")}</strong> {topExpenseCategory.name}</div>
            </div>

            {/* Print Grid Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.date", "Date")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.voucherId", "Voucher ID")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.category", "Category")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.expense.payeePaidTo", "Payee (Paid To)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.amountRs", "Amount (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>{t("reports.print.status", "Status")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.method", "Method")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.expense.refNumber", "Ref Number")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{formatDate(exp.date)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{exp.id}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{translateCategory(t, exp.category)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{exp.payee || t("categories.general", "General")}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(exp.amount).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center', fontWeight: 'bold', color: exp.status === 'Due' ? '#D97706' : 'var(--primary)' }}>{translateStatus(t, exp.status || 'Paid')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{exp.status === 'Due' ? '—' : translatePaymentMethod(t, exp.paymentMethod)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{exp.status === 'Due' ? '—' : (exp.referenceNumber || '—')}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>{t("reports.summaryTotal", "Report Summary Total")}:</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right', color: 'var(--color-danger-dark)' }}>{formatINR(totalExpenses).replace('₹', '')}</td>
                  <td colSpan={3} style={{ border: '1px solid #C8D3C5' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'profit':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              {t("reports.print.profitStatementTitle", "Sales Profit & Loss Statement")}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '9px' }}>
              <div><strong>{t("reports.print.salesRevenue", "Sales Revenue:")}</strong> {formatINR(totalSalesBase)}</div>
              <div><strong>{t("reports.print.costOfGoods", "Cost of Goods:")}</strong> {formatINR(coGS)}</div>
              <div><strong>{t("reports.print.grossProfit", "Gross Profit:")}</strong> {formatINR(grossProfit)}</div>
              <div><strong>{t("reports.print.operatingExpenses", "Operating Expenses:")}</strong> {formatINR(totalExpenses)}</div>
              <div><strong>{t("reports.print.netProfitLoss", "Net Profit (Loss):")}</strong> {formatINR(netProfit)} ({profitMarginPercent.toFixed(1)}%</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.invoiceNo", "Invoice No")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.date", "Date")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.profit.customer", "Customer")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.profit.taxableSalesRs", "Taxable Sales (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.profit.costPriceRs", "Cost Price (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.profit.netProfitRs", "Net Profit (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>{t("reports.print.margin", "Margin")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, idx) => {
                  const invoiceCOGS = inv.items.reduce((s, i) => {
                    const cost = products.find((p) => p.id === i.productId)?.purchasePrice || 0;
                    return s + (i.quantity * cost);
                  }, 0);
                  const invProfit = inv.subtotal - invoiceCOGS;
                  const invMargin = inv.subtotal > 0 ? (invProfit / inv.subtotal) * 100 : 0;
                  return (
                    <tr key={inv.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{formatDate(inv.date)}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{inv.customerName}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(inv.subtotal).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(invoiceCOGS).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold', color: invProfit >= 0 ? '#27AE60' : '#BE3144' }}>{formatINR(invProfit).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center', fontWeight: 'bold' }}>{invMargin.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>{t("reports.profit.summaryNetProfitPrint", "Report Summary (Net Profit):")}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(coGS).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right', color: netProfit >= 0 ? '#27AE60' : '#BE3144' }}>{formatINR(netProfit).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{profitMarginPercent.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'stock':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              {t("reports.print.stockStatementTitle", "Stock Inventory Asset Valuation")}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>{t("reports.print.totalItems", "Total Items:")}</strong> {totalStockQty}</div>
              <div><strong>{t("reports.print.assetValueCost", "Asset Value (Cost):")}</strong> {formatINR(totalAssetVal)}</div>
              <div><strong>{t("reports.print.retailValuePotential", "Retail Value (Potential):")}</strong> {formatINR(totalRetailVal)}</div>
              <div><strong>{t("reports.print.potentialMargin", "Potential Margin:")}</strong> {formatINR(totalRetailVal - totalAssetVal)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.sku", "SKU")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.productName", "Product Name")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.category", "Category")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>{t("reports.print.qty", "Qty")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.profit.costPriceRs", "Cost Price (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.assetValueRs", "Asset Value (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.retailPriceRs", "Retail Price (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.retailValueRs", "Retail Value (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => {
                  const itemAssetVal = p.stock * p.purchasePrice;
                  const itemRetailVal = p.stock * p.sellingPrice;
                  return (
                    <tr key={p.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{p.sku}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{p.name}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{p.category}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center', fontWeight: 'bold' }}>{p.stock}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(p.purchasePrice).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(itemAssetVal).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(p.sellingPrice).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(itemRetailVal).replace('₹', '')}</td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>{t("reports.print.stockSummaryTotal", "Stock Summary Total:")}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{totalStockQty}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalAssetVal).replace('₹', '')}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalRetailVal).replace('₹', '')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'gst':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              {t("reports.print.gstStatementTitle", "GST Tax Ledger Summary")}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>{t("reports.print.taxableTurnover", "Taxable Turnover:")}</strong> {formatINR(totalSalesBase)}</div>
              <div><strong>{t("reports.print.outputGstCollected", "Output GST Collected:")}</strong> {formatINR(totalSalesTax)}</div>
              <div><strong>{t("reports.print.inputGstItcPaid", "Input GST ITC Paid:")}</strong> {formatINR(totalPurchasesTax)}</div>
              <div><strong>{t("reports.print.netGstPayable", "Net GST Payable:")}</strong> {formatINR(netGSTDue)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.transactionSupplyType", "Transaction Supply Type")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>{t("reports.print.docCount", "Doc Count")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.baseGoodsValueRs", "Base Goods Value (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.cgstRs", "Central GST (CGST) (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.sgstRs", "State GST (SGST) (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Total {t("reports.gstr3b.taxLiabilityRs", "Tax Liability (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{t("reports.gst.outwardSupplyInvoices", "Outward Supply (Sales Invoices)")}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{filteredInvoices.length}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalCGSTCollected).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalSGSTCollected).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(totalSalesTax).replace('₹', '')}</td>
                </tr>
                <tr style={{ backgroundColor: '#F9FAF9' }}>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{t("reports.gst.inwardSupplyBills", "Inward Supply (Supplier Bills)")}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{filteredPurchases.length}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalPurchasesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalCGSTPaid).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalSGSTPaid).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(totalPurchasesTax).replace('₹', '')}</td>
                </tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5' }}>{t("reports.gst.netPayableDues", "Net Payable Tax Dues:")}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'center' }}></td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSalesBase - totalPurchasesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalCGSTCollected - totalCGSTPaid).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSGSTCollected - totalSGSTPaid).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right', color: netGSTDue >= 0 ? '#BE3144' : '#27AE60' }}>{formatINR(netGSTDue).replace('₹', '')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'custLedger':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              {t("reports.print.custLedgerStatementTitle", "Customer Outstanding Balances Statement")}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>{t("reports.print.registeredCustomers", "Registered Customers:")}</strong> {totalCustomers} {t("reports.accounts", "accounts")}</div>
              <div><strong>{t("reports.print.accountsWithDues", "Accounts with Dues:")}</strong> {customersWithDues} {t("reports.accounts", "accounts")}</div>
              <div><strong>{t("reports.print.accumulatedDues", "Accumulated Dues:")}</strong> {formatINR(pendingReceivables)}</div>
              <div><strong>{t("reports.print.averageDues", "Average Dues:")}</strong> {formatINR(averageReceivable)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.custLedger.customerId", "Customer ID")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.customerName", "Customer Name")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.custLedger.phoneNumber", "Phone Number")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.gstin", "GSTIN")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.print.outstandingRs", "Outstanding (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>{t("reports.print.status", "Status")}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={c.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{c.id}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{c.name}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{c.phone}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{c.gstin || '—'}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold', color: c.outstanding > 0 ? '#BE3144' : c.outstanding < 0 ? '#27AE60' : 'inherit' }}>{formatINR(c.outstanding).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{c.outstanding === 0 ? t('status.settled', 'Settled') : c.outstanding > 0 ? t('status.duesPending', 'Dues') : t('status.advanceCredit', 'Advance')}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>{t("reports.custLedger.accumulatedDuesTotal", "Accumulated Outstanding Dues Total:")}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right', color: '#BE3144' }}>{formatINR(pendingReceivables).replace('₹', '')}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'suppLedger':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              {t("reports.print.suppLedgerStatementTitle", "Supplier Account Payables Statement")}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>{t("reports.print.registeredSuppliers", "Registered Suppliers:")}</strong> {totalSuppliers} {t("reports.accounts", "accounts")}</div>
              <div><strong>{t("reports.print.accountsOwed", "Accounts Owed:")}</strong> {suppliersWithDues} {t("reports.accounts", "accounts")}</div>
              <div><strong>{t("reports.print.accumulatedOwed", "Accumulated Owed:")}</strong> {formatINR(pendingPayables)}</div>
              <div><strong>{t("reports.print.averagePayables", "Average Payables:")}</strong> {formatINR(averagePayable)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.suppLedger.supplierId", "Supplier ID")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.suppLedger.companySupplierName", "Company / Supplier Name")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.custLedger.phoneNumber", "Phone Number")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>{t("reports.print.gstin", "GSTIN")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>{t("reports.suppLedger.balanceOwedRs", "Balance Owed (₹)")}</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>{t("reports.print.status", "Status")}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, idx) => (
                  <tr key={s.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{s.id}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{s.name}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{s.phone}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{s.gstin || '—'}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold', color: s.outstanding > 0 ? '#BE3144' : 'inherit' }}>{formatINR(s.outstanding).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{s.outstanding === 0 ? t('status.settled', 'Settled') : t('status.payablePending', 'Payable')}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>{t("reports.suppLedger.accumulatedOwedTotal", "Accumulated Supplier Payables Total:")}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right', color: '#BE3144' }}>{formatINR(pendingPayables).replace('₹', '')}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'gstr1':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '14px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33', borderBottom: '1px solid #E2E9E0', paddingBottom: '6px' }}>
              {t("reports.print.gstr1StatementTitle", "GSTR-1 Outward Supplies Audit Summary (CA-Ready)")}
            </h2>

            {/* Overall summary block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '10px' }}>
              <div><strong>{t("reports.print.b2bInvoices", "B2B Invoices:")}</strong> {gstr1B2BList.length} {t("reports.rows", "Rows")}</div>
              <div><strong>{t("reports.print.b2csGroups", "B2CS Groups:")}</strong> {gstr1B2CSList.length} {t("reports.groups", "Groups")}</div>
              <div><strong>{t("reports.print.hsnCategories", "HSN Categories:")}</strong> {gstr1HSNList.length} {t("reports.categories", "Codes")}</div>
              <div><strong>{t("reports.print.docsIssued", "Docs Issued:")}</strong> {gstr1DocsSummary.total} {t("reports.invoicesCountLabel", "Bills")}</div>
            </div>

            {/* 1. B2B Table */}
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', borderBottom: '1px solid #2F3E33', paddingBottom: '3px' }}>
              {t("reports.gstr1.b2bPrintTitle", "1. B2B Registered Supplies (4A, 4B, 4C, 6B, 6C)")}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.gstin", "GSTIN")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.name", "Name")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.invNo", "Inv No")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.date", "Date")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.gstr1.pos", "POS")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.gstr1.rate", "Rate")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.taxableAmtRs", "Taxable Amt (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.cgstRsShort", "CGST (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.sgstRsShort", "SGST (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.igstRsShort", "IGST (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                {gstr1B2BList.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>{t("reports.gstr1.noB2bSuppliesPrint", "No registered B2B supplies found.")}</td>
                  </tr>
                ) : (
                  gstr1B2BList.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{item.gstin}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0' }}>{item.receiverName}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{item.invoiceNumber}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0' }}>{item.invoiceDate}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.pos.split('-')[0]}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{item.rate}%</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{item.taxableValue.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.cgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.sgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.igst.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 2. B2CS Table */}
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', borderBottom: '1px solid #2F3E33', paddingBottom: '3px' }}>
              {t("reports.gstr1.b2csPrintTitle", "2. B2C Small Supplies (7 - Consolidated)")}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.gstr1.placeOfSupply", "Place of Supply (POS)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.gstr1.gstRate", "GST Rate")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.gstr3b.taxableValueRs", "Taxable Value (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.cgstAmountRs", "CGST Amount (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.sgstAmountRs", "SGST Amount (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.igstAmountRs", "IGST Amount (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                {gstr1B2CSList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>{t("reports.gstr1.noB2csSuppliesPrint", "No unregistered B2C supplies found.")}</td>
                  </tr>
                ) : (
                  gstr1B2CSList.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{item.pos}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{item.rate}%</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{item.taxable.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.cgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.sgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.igst.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 3. HSN Summary Table */}
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', borderBottom: '1px solid #2F3E33', paddingBottom: '3px' }}>
              {t('reports.hsnOutwardSummary', '3. HSN Summary of Outward Supplies (Table 12)')}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.hsn", "HSN")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.description", "Description")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.uqc", "UQC")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.print.qty", "Qty")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.totalValueRs", "Total Value (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.gstr3b.taxableValueRs", "Taxable Value (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.cgstRsShort", "CGST (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.sgstRsShort", "SGST (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.igstRsShort", "IGST (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                {gstr1HSNList.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>{t("reports.gstr1.noHsnItemsPrint", "No HSN details found.")}</td>
                  </tr>
                ) : (
                  gstr1HSNList.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.hsn}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0' }}>{item.desc}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0' }}>{item.uqc.split('-')[0]}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.totalVal.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{item.taxable.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.cgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.sgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.igst.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 4. Docs Summary Table */}
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', borderBottom: '1px solid #2F3E33', paddingBottom: '3px' }}>
              {t("reports.gstr1.docsPrintTitle", "4. Documents Issued Summary (Table 13)")}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.gstr1.natureOfDocument", "Nature of Document")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.from", "From")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.to", "To")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.print.totalNumber", "Total Number")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.gstr1.cancelled", "Cancelled")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.gstr1.netIssued", "Net Issued")}</th>
                </tr>
              </thead>
              <tbody>
                {gstr1DocsSummary.total === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>{t("reports.gstr1.noDocsIssuedPrint", "No document summary found.")}</td>
                  </tr>
                ) : (
                  <tr>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{t("reports.gstr1.invOutwardSupply", "Invoices for outward supply")}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{gstr1DocsSummary.from}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{gstr1DocsSummary.to}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{gstr1DocsSummary.total}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center', color: '#BE3144' }}>{gstr1DocsSummary.cancelled}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center', fontWeight: 'bold' }}>{gstr1DocsSummary.netIssued}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'gstr2':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '14px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33', borderBottom: '1px solid #E2E9E0', paddingBottom: '6px' }}>
              {t("reports.print.gstr2StatementTitle", "GSTR-2 Inward Supplies Audit Summary (CA-Ready)")}
            </h2>

            {/* Overall summary block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '10px' }}>
              <div><strong>{t("reports.print.b2bPurchases", "B2B Purchases:")}</strong> {gstr2B2BList.length} {t("reports.rows", "Rows")}</div>
              <div><strong>{t("reports.print.hsnCategories", "HSN Categories:")}</strong> {gstr2HSNList.length} {t("reports.categories", "Codes")}</div>
              <div><strong>{t("reports.print.eligibleItc", "Eligible ITC:")}</strong> {formatINR(totalGstr2ITC)}</div>
              <div><strong>{t("reports.print.docsReceived", "Docs Received:")}</strong> {gstr2DocsSummary.total} {t("reports.invoicesCountLabel", "Bills")}</div>
            </div>

            {/* 1. B2B Table */}
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', borderBottom: '1px solid #2F3E33', paddingBottom: '3px' }}>
              {t("reports.gstr2.b2bPrintTitle", "1. B2B Inward Supplies (3, 4A)")}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.gstin", "GSTIN")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.gstr2.supplierName", "Supplier Name")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.gstr2.billNo", "Bill No")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.date", "Date")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.gstr2.rate", "Rate")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.taxableAmtRs", "Taxable Amt (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.cgstRsShort", "CGST (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.sgstRsShort", "SGST (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.igstRsShort", "IGST (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.print.itc", "ITC")}</th>
                </tr>
              </thead>
              <tbody>
                {gstr2B2BList.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>{t("reports.gstr2.noB2bSuppliesPrint", "No registered inward supplies found.")}</td>
                  </tr>
                ) : (
                  gstr2B2BList.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{item.gstin}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0' }}>{item.supplierName}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{item.invoiceNumber}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0' }}>{item.invoiceDate}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.rate}%</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{item.taxableValue.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.cgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.sgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.igst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{item.itcEligible}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 2. HSN Table */}
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', borderBottom: '1px solid #2F3E33', paddingBottom: '3px' }}>
              {t('reports.hsnInwardSummary', '2. HSN Summary of Inward Supplies (Table 13)')}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.hsn", "HSN")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.description", "Description")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.uqc", "UQC")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.print.qty", "Qty")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.totalValueRs", "Total Value (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.gstr3b.taxableValueRs", "Taxable Value (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.cgstRsShort", "CGST (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.sgstRsShort", "SGST (₹)")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{t("reports.print.igstRsShort", "IGST (₹)")}</th>
                </tr>
              </thead>
              <tbody>
                {gstr2HSNList.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>{t("reports.gstr1.noHsnItemsPrint", "No HSN details found.")}</td>
                  </tr>
                ) : (
                  gstr2HSNList.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.hsn}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0' }}>{item.desc}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0' }}>{item.uqc.split('-')[0]}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.totalVal.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{item.taxable.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.cgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.sgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{item.igst.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 3. Docs Table */}
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', borderBottom: '1px solid #2F3E33', paddingBottom: '3px' }}>
              {t('reports.summaryOfDocsReceived', '3. Summary of Documents Received')}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.gstr1.natureOfDocument", "Nature of Document")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.from", "From")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>{t("reports.print.to", "To")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.print.totalNumber", "Total Number")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.gstr1.cancelled", "Cancelled")}</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{t("reports.gstr2.netReceived", "Net Received")}</th>
                </tr>
              </thead>
              <tbody>
                {gstr2DocsSummary.total === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>{t("reports.gstr1.noDocsIssuedPrint", "No document summary found.")}</td>
                  </tr>
                ) : (
                  <tr>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{t("reports.gstr2.invInwardSupply", "Invoices for inward supply")}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{gstr2DocsSummary.from}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{gstr2DocsSummary.to}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{gstr2DocsSummary.total}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center', color: '#BE3144' }}>{gstr2DocsSummary.cancelled}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', textAlign: 'center', fontWeight: 'bold' }}>{gstr2DocsSummary.netIssued}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'gstr3b':
        return renderGstr3bReport();

      default:
        return null;
    }
  };

  const reportTabs = [
    { id: 'sales', label: t('reports.salesReport', 'Sales Report'), icon: <FileText size={18} /> },
    { id: 'purchase', label: t('reports.purchaseReport', 'Purchase Report'), icon: <FileText size={18} /> },
    { id: 'expense', label: t('reports.expenseReport', 'Expense Report'), icon: <TrendingDown size={18} /> },
    { id: 'profit', label: t('reports.pnlSummary', 'Profit & Loss Summary'), icon: <Briefcase size={18} /> },
    { id: 'stock', label: t('reports.stockAssetValue', 'Stock Asset Value'), icon: <Layers size={18} /> },
    { id: 'gst', label: t('reports.gstTaxSummary', 'GST Tax Summary'), icon: <Percent size={18} /> },
    { id: 'custLedger', label: t('reports.customerDuesLedger', 'Customer Dues Ledger'), icon: <Users size={18} /> },
    { id: 'suppLedger', label: t('reports.supplierPayablesLedger', 'Supplier Payables Ledger'), icon: <Truck size={18} /> },
    { id: 'gstr1', label: t('reports.gstr1Return', 'GSTR-1 Return (CA-Ready)'), icon: <Percent size={18} /> },
    { id: 'gstr2', label: t('reports.gstr2Inward', 'GSTR-2 Inward (CA-Ready)'), icon: <Percent size={18} /> },
    { id: 'gstr3b', label: t('reports.gstr3bReturn', 'GSTR-3B Return (CA-Ready)'), icon: <Percent size={18} /> },
  ];

  return (
    <div className="reports-page-wrapper" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Top filter row */}
      <div className="filters-row-unified no-print">
        <div className="filters-group-one" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {/* Preset Ranges */}
          <div className="reports-preset-select-wrapper" style={{ minWidth: '160px' }}>
            <select className="filter-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="All">{t("reports.allHistoricalRecords", "All Historical Records")}</option>
              <option value="Custom">{t("reports.customDateRange", "Custom Date Range")}</option>
            </select>
          </div>

          {dateRange === 'Custom' && (
            <div className="reports-custom-date-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', flex: '1 1 auto', minWidth: '240px' }}>
              <input
                type="date"
                className="filter-select"
                style={{ flex: 1, minWidth: '110px', padding: '6px 8px' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t("reports.to", "to")}</span>
              <input
                type="date"
                className="filter-select"
                style={{ flex: 1, minWidth: '110px', padding: '6px 8px' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="filters-group-two" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <button className="btn btn-secondary reports-export-btn" onClick={handleExport}>
            <Download size={16} /> {t("common.exportCsv", "Export CSV")}
          </button>
          <button className="btn btn-secondary reports-save-btn" onClick={handleDownloadPDF}>
            <FileText size={16} /> {t("common.savePdf", "Save PDF")}
          </button>
          <button className="btn btn-primary reports-print-btn" onClick={handlePrint}>
            <Printer size={16} /> {t("common.printReport", "Print Report")}
          </button>
        </div>
      </div>

      {/* Interactive dashboard area (hidden during print) */}
      <div className="no-print">
        {/* Horizontal Tabs selector */}
        <div className="report-tabs-horizontal" ref={reportTabsRef}>
          {reportTabs.map((tab) => (
            <div
              key={tab.id}
              className={`report-tab-pill ${activeReport === tab.id ? 'active' : ''}`}
              data-active={activeReport === tab.id}
              onClick={() => setActiveReport(tab.id as any)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </div>
          ))}
        </div>

        {/* Main Content Area (Full screen width!) */}
        <div className="card report-content-container" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
          {renderReportContent()}
        </div>
      </div>

      {/* Hidden A4 Printable Report Element wrapper to prevent flash */}
      <div className={`pdf-print-wrapper ${activeReport.startsWith('gstr') && activeReport !== 'gstr3b' ? 'landscape-report' : 'portrait-report'}`} style={{ position: 'fixed', left: '-9999px', top: 0, width: activeReport.startsWith('gstr') && activeReport !== 'gstr3b' ? '1122px' : '794px', height: 'auto', overflow: 'visible', zIndex: -1, pointerEvents: 'none', visibility: 'hidden' }}>
        <div id="pdf-report-printout" style={{
          width: activeReport.startsWith('gstr') && activeReport !== 'gstr3b' ? '1122px' : '794px',
          backgroundColor: '#ffffff',
          fontFamily: 'var(--font-sans)',
          color: '#000000',
          padding: activeReport === 'gstr3b' ? '0' : '15mm',
          boxSizing: 'border-box',
          position: 'relative'
        }}>

          {/* Header Block (Unified Invoice PDF Header style) */}
          <div className="invoice-header-bar" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              {settings.showLogo && settings.logo && (
                <div className="invoice-logo-container" style={{ flexShrink: 0, margin: 0, padding: 0 }}>
                  <img 
                    src={settings.logo} 
                    alt="Business Logo" 
                    style={{ maxWidth: "120px", maxHeight: "120px", objectFit: "contain", borderRadius: "8px", margin: 0, padding: 0 }} 
                  />
                </div>
              )}
              <div>
                <h2 className="invoice-company-name">{settings.businessName || 'AgriBiz Store'}</h2>
                {settings.showAddress && (
                  <p className="invoice-company-sub">{getFullAddress(settings)}</p>
                )}
                {settings.showContact && (
                  <p className="invoice-company-sub" style={{ display: 'flex', flexWrap: 'nowrap', gap: '4px 6px', alignItems: 'center', margin: '2px 0 0 0', whiteSpace: 'nowrap' }}>
                    {settings.email && <span style={{ whiteSpace: 'nowrap' }}>{t('common.emailLabel', 'Email:')} {settings.email}</span>}
                    {settings.email && (settings.phone || settings.website) && <span style={{ opacity: 0.5 }}>|</span>}
                    {settings.phone && <span style={{ whiteSpace: 'nowrap' }}>{t('common.mobLabel', 'Mob:')} {settings.phone}</span>}
                    {settings.phone && settings.website && <span style={{ opacity: 0.5 }}>|</span>}
                    {settings.website && <span style={{ whiteSpace: 'nowrap' }}>{t('common.webLabel', 'Web:')} {settings.website}</span>}
                  </p>
                )}
                {settings.showGstin && settings.gstin && (
                  <p className="invoice-company-gst">GSTIN: {settings.gstin}</p>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {activeReport === 'gstr3b' ? (
                <>
                  <h1 className="invoice-main-title">{t("reports.gstr3bWorkingReport", "GSTR-3B WORKING {t('reports.reportTitle', 'REPORT')}")}</h1>
                  <p className="invoice-company-sub" style={{ margin: '3px 0 0 0', fontWeight: 600 }}>{t('reports.returnPeriod', 'Return Period:')} {returnPeriod()}</p>
                  <p className="invoice-company-sub" style={{ margin: '2px 0 0 0' }}>{t('reports.generatedOn', 'Generated On:')} {generatedOn}</p>
                  <p className="invoice-company-sub" style={{ margin: '2px 0 0 0' }}>{t('reports.generatedBy', 'Generated By:')} {settings.ownerName || 'Kunal Chaudhari'}</p>
                </>
              ) : (
                <>
                  <h1 className="invoice-main-title">{activeReport.toUpperCase()} {t('reports.reportTitle', 'REPORT')}</h1>
                  <p className="invoice-company-sub" style={{ margin: '3px 0 0 0' }}>
                    Period: {dateRange === 'All' ? 'All Historical Records' : `${formatDate(startDate)} to ${formatDate(endDate)}`}
                  </p>
                  <p className="invoice-company-sub" style={{ margin: '2px 0 0 0' }}>
                    {t('reports.dateGenerated', 'Date Generated:')} {formatDate(new Date().toISOString())}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Dynamic content */}
          {renderPrintReportContent()}

          {/* Signatory Blocks */}
          {activeReport !== 'gstr3b' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', fontSize: '10px', color: '#555555' }}>
              <div>{t("reports.preparedBy", "Prepared By: ___________________________")}</div>
              <div>{t("reports.authorizedSignatory", "Authorized Signatory: ___________________________")}</div>
            </div>
          )}
        </div>
      </div>

      {/* Status Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          backgroundColor: toast.type === 'error' ? '#BE3144' : toast.type === 'info' ? '#3182CE' : '#27AE60',
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 99999,
          fontSize: '13px',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
