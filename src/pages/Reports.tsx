import React, { useState, useMemo, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate, getFullAddress } from '../utils/dummyData';
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

  // Center active report tab item when activeReport changes
  useEffect(() => {
    if (reportTabsRef.current) {
      const activeTabElement = reportTabsRef.current.querySelector('[data-active="true"]');
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeReport]);

  // Touch swipe gesture navigation to switch reports on mobile
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth > 1024) return;
      const target = e.target as HTMLElement;

      // Only allow report tab swiping if gesture started inside the report content container
      if (!target.closest('.report-content-container')) {
        return;
      }

      // Ignore swipes on tables, horizontal scrollable containers, modals, buttons, input controls
      if (
        target.closest('.table-wrapper') ||
        target.closest('.gstr3b-table-scroll-wrapper') ||
        target.closest('.modal') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('button') ||
        target.closest('a')
      ) {
        return;
      }
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth > 1024) return;
      if (touchStartX === 0 || touchStartY === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;

      // Reset
      touchStartX = 0;
      touchStartY = 0;

      // Horizontal swipe larger than Y diff and above threshold (75px)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 75) {
        const orderedReports = [
          'sales',
          'purchase',
          'expense',
          'profit',
          'stock',
          'gst',
          'custLedger',
          'suppLedger',
          'gstr1',
          'gstr2',
          'gstr3b'
        ];
        const currentIndex = orderedReports.indexOf(activeReport);
        if (currentIndex === -1) return;

        if (diffX > 0) {
          // Swiped Left -> Next Report
          const nextIndex = currentIndex + 1;
          if (nextIndex < orderedReports.length) {
            setActiveReport(orderedReports[nextIndex] as any);
          } else {
            setActiveReport(orderedReports[0] as any); // Wrap around to first
          }
        } else {
          // Swiped Right -> Previous Report
          const prevIndex = currentIndex - 1;
          if (prevIndex >= 0) {
            setActiveReport(orderedReports[prevIndex] as any);
          } else {
            setActiveReport(orderedReports[orderedReports.length - 1] as any); // Wrap around to last
          }
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
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
    showToast('B2B GSTR-1 sheet exported successfully!');
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
    showToast('B2CS GSTR-1 sheet exported successfully!');
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
    showToast('HSN Summary GSTR-1 sheet exported successfully!');
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
    showToast('Documents Issued GSTR-1 sheet exported successfully!');
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
    showToast('GSTR-2 B2B sheet exported successfully!');
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
    showToast('GSTR-2 HSN summary sheet exported successfully!');
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
    showToast('GSTR-2 Documents summary sheet exported successfully!');
  };

  const handleExportGstr3B = () => {
    const headers = ['GSTR-3B Table Section', 'Nature of Supplies / Credit', 'Total Taxable Value (₹)', 'Integrated Tax (₹)', 'Central Tax (₹)', 'State/UT Tax (₹)', 'Cess (₹)'];
    const rows = [
      ['Table 3.1(a)', 'Outward Taxable Supplies (other than zero rated, nil rated and exempted)', gstr3BData.outward.taxable.toFixed(2), gstr3BData.outward.igst.toFixed(2), gstr3BData.outward.cgst.toFixed(2), gstr3BData.outward.sgst.toFixed(2), '0.00'],
      ['Table 3.1(d)', 'Inward Supplies Liable to Reverse Charge', '0.00', '0.00', '0.00', '0.00', '0.00'],
      ['Table 4(A)(5)', 'All Other Eligible ITC Available', gstr3BData.itc.taxable.toFixed(2), gstr3BData.itc.igst.toFixed(2), gstr3BData.itc.cgst.toFixed(2), gstr3BData.itc.sgst.toFixed(2), '0.00'],
      ['Table 4(C)', 'Net ITC Available (A - B)', gstr3BData.itc.taxable.toFixed(2), gstr3BData.itc.igst.toFixed(2), gstr3BData.itc.cgst.toFixed(2), gstr3BData.itc.sgst.toFixed(2), '0.00']
    ];
    downloadCSVFile(headers, rows, `gstr3b_return_${startDate}_to_${endDate}.csv`);
    showToast('GSTR-3B consolidated return exported successfully!');
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
    showToast('Consolidated GSTR-1 Return exported successfully!');
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
    showToast('Consolidated GSTR-2 Return exported successfully!');
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
      headers = ['Invoice No', 'Customer Name', 'Date', 'Taxable Amt (INR)', 'Tax Collected (INR)', 'Grand Total (INR)', 'Status'];
      rows = filteredInvoices.map(inv => [
        inv.invoiceNumber,
        inv.customerName,
        formatDate(inv.date),
        (inv.subtotal - inv.discountTotal).toFixed(2),
        inv.gstTotal.toFixed(2),
        inv.grandTotal.toFixed(2),
        inv.paymentStatus
      ]);
      rows.push(['Report Summary Total', '', '', totalSalesBase.toFixed(2), totalSalesTax.toFixed(2), totalSalesVal.toFixed(2), '']);
    } else if (activeReport === 'purchase') {
      headers = ['Bill Number', 'Supplier Name', 'Receipt Date', 'Base Cost (INR)', 'Tax Paid (INR)', 'Total Cost (INR)', 'Status'];
      rows = filteredPurchases.map(pur => [
        pur.purchaseNumber,
        pur.supplierName,
        formatDate(pur.date),
        pur.subtotal.toFixed(2),
        pur.gstTotal.toFixed(2),
        pur.grandTotal.toFixed(2),
        pur.paymentStatus
      ]);
      rows.push(['Report Summary Total', '', '', totalPurchasesBase.toFixed(2), totalPurchasesTax.toFixed(2), totalPurchasesVal.toFixed(2), '']);
    } else if (activeReport === 'profit') {
      headers = ['Invoice No', 'Date', 'Customer', 'Taxable Sales (INR)', 'Cost Price (INR)', 'Net Profit (INR)', 'Margin (%)'];
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
      rows.push(['Report Summary Total', '', '', totalSalesBase.toFixed(2), coGS.toFixed(2), grossProfit.toFixed(2), `${profitMarginPercent.toFixed(1)}%`]);
    } else if (activeReport === 'stock') {
      headers = ['SKU Code', 'Product Name', 'Category', 'Available Qty', 'Cost Price (INR)', 'Asset Valuation (INR)', 'Retail Rate (INR)', 'Retail Valuation (INR)'];
      rows = products.map(p => [
        p.sku,
        p.name,
        p.category,
        p.stock.toString(),
        p.purchasePrice.toFixed(2),
        (p.stock * p.purchasePrice).toFixed(2),
        p.sellingPrice.toFixed(2),
        (p.stock * p.sellingPrice).toFixed(2)
      ]);
      rows.push(['Stock Summary Total', '', '', totalStockQty.toString(), '', totalAssetVal.toFixed(2), '', totalRetailVal.toFixed(2)]);
    } else if (activeReport === 'gst') {
      headers = ['Transaction Type', 'Document Count', 'Goods Value (INR)', 'Central GST (CGST) (INR)', 'State GST (SGST) (INR)', 'Total Tax Liability (INR)'];
      rows = [
        ['Outward Supply (Sales Invoices)', filteredInvoices.length.toString(), totalSalesBase.toFixed(2), totalCGSTCollected.toFixed(2), totalSGSTCollected.toFixed(2), totalSalesTax.toFixed(2)],
        ['Inward Supply (Supplier Bills)', filteredPurchases.length.toString(), totalPurchasesBase.toFixed(2), totalCGSTPaid.toFixed(2), totalSGSTPaid.toFixed(2), totalPurchasesTax.toFixed(2)],
        ['Net Payable Tax Dues', '', (totalSalesBase - totalPurchasesBase).toFixed(2), (totalCGSTCollected - totalCGSTPaid).toFixed(2), (totalSGSTCollected - totalSGSTPaid).toFixed(2), netGSTDue.toFixed(2)]
      ];
    } else if (activeReport === 'custLedger') {
      headers = ['Customer ID', 'Customer Name', 'Phone Number', 'GSTIN Identification', 'Outstanding Balance (INR)', 'Status'];
      rows = customers.map(c => [
        c.id,
        c.name,
        c.phone,
        c.gstin || '—',
        c.outstanding.toFixed(2),
        c.outstanding === 0 ? 'Settled' : c.outstanding > 0 ? 'Dues Pending' : 'Advance Credit'
      ]);
      rows.push(['Accumulated Customer Dues', '', '', '', pendingReceivables.toFixed(2), '']);
    } else if (activeReport === 'suppLedger') {
      headers = ['Supplier ID', 'Supplier Name', 'Phone Number', 'GSTIN Identification', 'Balance Owed (INR)', 'Status'];
      rows = suppliers.map(s => [
        s.id,
        s.name,
        s.phone,
        s.gstin || '—',
        s.outstanding.toFixed(2),
        s.outstanding === 0 ? 'Settled' : 'Payable Pending'
      ]);
      rows.push(['Accumulated We Owe Suppliers', '', '', '', pendingPayables.toFixed(2), '']);
    } else if (activeReport === 'expense') {
      headers = ['Date', 'Voucher ID', 'Category', 'Payee / Paid To', 'Amount (INR)', 'Status', 'Payment Method', 'Ref No.', 'Notes'];
      rows = filteredExpenses.map(exp => [
        formatDate(exp.date),
        exp.id,
        exp.category,
        exp.payee || 'General',
        exp.amount.toFixed(2),
        exp.status || 'Paid',
        exp.status === 'Due' ? '—' : exp.paymentMethod,
        exp.status === 'Due' ? '—' : (exp.referenceNumber || '—'),
        exp.notes || '—'
      ]);
      rows.push(['Report Summary Total', '', '', '', totalExpenses.toFixed(2), '', '', '', '']);
    }

    downloadCSVFile(headers, rows, filename);
    showToast('Report exported as CSV successfully!');
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
      showToast('PDF downloaded successfully!');
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
          <div className="kpi-card" style={{ cursor: 'default' }}>
            <div className="kpi-info">
              <span className="kpi-label">Total Taxable Sales</span>
              <span className="kpi-value">{formatINR(gstr3BData.outward.taxable)}</span>
              <span className="kpi-subtext">Outward taxable supplies</span>
            </div>
            <div className="kpi-icon-container emerald"><FileText size={20} /></div>
          </div>
          <div className="kpi-card" style={{ cursor: 'default' }}>
            <div className="kpi-info">
              <span className="kpi-label">Total GST Liability</span>
              <span className="kpi-value" style={{ color: 'var(--color-danger-dark)' }}>{formatINR(outwardTaxTotal)}</span>
              <span className="kpi-subtext">CGST + SGST + IGST</span>
            </div>
            <div className="kpi-icon-container rose"><Percent size={20} /></div>
          </div>
          <div className="kpi-card" style={{ cursor: 'default' }}>
            <div className="kpi-info">
              <span className="kpi-label">Eligible ITC</span>
              <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}>{formatINR(itcTotal)}</span>
              <span className="kpi-subtext">Input Tax Credit available</span>
            </div>
            <div className="kpi-icon-container blue"><TrendingDown size={20} /></div>
          </div>
          <div className="kpi-card" style={{ cursor: 'default' }}>
            <div className="kpi-info">
              <span className="kpi-label">Net GST Payable</span>
              <span className="kpi-value" style={{ color: netGstPayable > 0 ? 'var(--color-danger-dark)' : 'var(--color-success-dark)' }}>{formatINR(netGstPayable)}</span>
              <span className="kpi-subtext">{remainingItc > 0 ? `₹${remainingItc.toFixed(0)} carry forward` : 'Cash payment due'}</span>
            </div>
            <div className="kpi-icon-container amber"><Briefcase size={20} /></div>
          </div>
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
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309' }}>Reconciliation Warning</div>
                <div style={{ fontSize: '12px', color: '#b45309' }}>
                  Discrepancy of {formatINR(gstDiff)} found between Sales Invoice Register ({formatINR(totalSalesTax)}) and Outward Tax ({formatINR(outwardTaxTotal)}). Please verify your tax configurations.
                </div>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>Ledger Reconciled</div>
                <div style={{ fontSize: '12px', color: '#15803d' }}>Outward tax matches Sales Invoice Register perfectly. No discrepancy found.</div>
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
                  Table 3.1: Outward Supplies Summary
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Details of outward taxable supplies and inward supplies liable to reverse charge.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleExportGstr3B}>
                <Percent size={14} style={{ marginRight: '6px' }} /> Download GSTR-3B CSV
              </button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">Nature of Supplies</th>
                    <th className="text-nowrap align-right">Taxable Value</th>
                    <th className="text-nowrap align-right">IGST</th>
                    <th className="text-nowrap align-right">CGST</th>
                    <th className="text-nowrap align-right">SGST/UTGST</th>
                    <th className="text-nowrap align-right">Cess</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.taxable)}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.igst)}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.cgst)}</td>
                    <td className="align-right">{formatINR(gstr3BData.outward.sgst)}</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td>(b) Outward taxable supplies (Zero Rated)</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td>(c) Other Outward Supplies (Nil Rated / Exempted)</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td>(d) Inward Supplies liable to Reverse Charge</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td>(e) Non GST Outward Supplies</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-secondary, #f9fafb)' }}>
                    <td>Grand Total</td>
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
                Table 3.2: Inter-State Supplies to Unregistered / Composition / UIN
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Details of inter-state supplies made to unregistered persons, composition dealers and UIN holders.
              </p>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">Recipient Type</th>
                    <th className="text-nowrap align-right">Total Taxable Value</th>
                    <th className="text-nowrap align-right">Integrated Tax (IGST)</th>
                  </tr>
                </thead>
                <tbody>
                  {interstateUnregisteredTaxable > 0 ? (
                    <>
                      <tr>
                        <td>Supplies to Unregistered Persons</td>
                        <td className="align-right">{formatINR(interstateUnregisteredTaxable)}</td>
                        <td className="align-right">{formatINR(interstateUnregisteredIGST)}</td>
                      </tr>
                      <tr>
                        <td>Supplies to Composition Taxable Persons</td>
                        <td className="align-right">₹0.00</td>
                        <td className="align-right">₹0.00</td>
                      </tr>
                      <tr>
                        <td>Supplies to UIN Holders</td>
                        <td className="align-right">₹0.00</td>
                        <td className="align-right">₹0.00</td>
                      </tr>
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-secondary, #f9fafb)' }}>
                        <td>Total Interstate Supplies</td>
                        <td className="align-right">{formatINR(interstateUnregisteredTaxable)}</td>
                        <td className="align-right">{formatINR(interstateUnregisteredIGST)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px', fontStyle: 'italic' }}>
                        No inter-state supplies found in the selected period.
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
                Table 4: Eligible Input Tax Credit (ITC)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                ITC available from registered supplier invoices received during the period.
              </p>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">ITC Category</th>
                    <th className="text-nowrap align-right">IGST</th>
                    <th className="text-nowrap align-right">CGST</th>
                    <th className="text-nowrap align-right">SGST/UTGST</th>
                    <th className="text-nowrap align-right">Total ITC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '16px' }}>Import of goods</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '16px' }}>Import of services</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '16px' }}>Inward supplies (Reverse Charge)</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '16px', fontWeight: 600 }}>All other ITC – Registered purchases (4A.5)</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(gstr3BData.itc.igst)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(gstr3BData.itc.cgst)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(gstr3BData.itc.sgst)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)', fontWeight: 700 }}>{formatINR(gstr3BData.itc.igst + gstr3BData.itc.cgst + gstr3BData.itc.sgst)}</td>
                  </tr>
                  <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-secondary, #f9fafb)' }}>
                    <td>Net ITC Available (A – B)</td>
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
                Tax Payment & Settlement Summary
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Breakdown of tax liability, ITC utilized and net cash payable per tax head.
              </p>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">Tax Head</th>
                    <th className="text-nowrap align-right">Tax Liability</th>
                    <th className="text-nowrap align-right">ITC Utilized</th>
                    <th className="text-nowrap align-right">Cash to Pay</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Integrated Tax (IGST)</td>
                    <td className="align-right">{formatINR(igstLiability)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(igstItcUtilized)}</td>
                    <td className="align-right" style={{ color: igstCashPaid > 0 ? 'var(--color-danger-dark)' : 'inherit' }}>{formatINR(igstCashPaid)}</td>
                  </tr>
                  <tr>
                    <td>Central Tax (CGST)</td>
                    <td className="align-right">{formatINR(cgstLiability)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(cgstItcUtilized)}</td>
                    <td className="align-right" style={{ color: cgstCashPaid > 0 ? 'var(--color-danger-dark)' : 'inherit' }}>{formatINR(cgstCashPaid)}</td>
                  </tr>
                  <tr>
                    <td>State/UT Tax (SGST)</td>
                    <td className="align-right">{formatINR(sgstLiability)}</td>
                    <td className="align-right" style={{ color: 'var(--color-success-dark)' }}>{formatINR(sgstItcUtilized)}</td>
                    <td className="align-right" style={{ color: sgstCashPaid > 0 ? 'var(--color-danger-dark)' : 'inherit' }}>{formatINR(sgstCashPaid)}</td>
                  </tr>
                  <tr>
                    <td>Cess</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                    <td className="align-right">₹0.00</td>
                  </tr>
                  <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-secondary, #f9fafb)' }}>
                    <td>Total Settlement</td>
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
                GST Reconciliation Summary
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Comparison of book sales GST against outward tax declared in GSTR-3B.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Total Book Sales Value', value: formatINR(gstr3BData.outward.taxable), sub: 'Taxable turnover', color: 'var(--text-primary)' },
                { label: 'Total Purchase Value (ITC Base)', value: formatINR(gstr3BData.itc.taxable), sub: 'Registered purchases', color: 'var(--text-primary)' },
                { label: 'Output GST Liability', value: formatINR(outwardTaxTotal), sub: 'CGST+SGST+IGST collected', color: 'var(--color-danger-dark)' },
                { label: 'Input GST Credit (ITC)', value: formatINR(itcTotal), sub: 'Available ITC', color: 'var(--color-success-dark)' },
                { label: 'Net GST Cash Liability', value: formatINR(netGstPayable), sub: 'After ITC set-off', color: netGstPayable > 0 ? 'var(--color-danger-dark)' : 'var(--color-success-dark)' },
                { label: 'Carry Forward ITC', value: formatINR(remainingItc), sub: 'Excess credit balance', color: 'var(--color-success-dark)' },
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
            <div className="print-watermark-logo">
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
                    {settings.email && <span style={{ whiteSpace: 'nowrap' }}>Email: {settings.email}</span>}
                    {settings.email && (settings.phone || settings.website) && <span style={{ opacity: 0.5 }}>|</span>}
                    {settings.phone && <span style={{ whiteSpace: 'nowrap' }}>Mob: {settings.phone}</span>}
                    {settings.phone && settings.website && <span style={{ opacity: 0.5 }}>|</span>}
                    {settings.website && <span style={{ whiteSpace: 'nowrap' }}>Web: {settings.website}</span>}
                  </p>
                )}
                {settings.showGstin && settings.gstin && (
                  <p className="invoice-company-gst">GSTIN: {settings.gstin}</p>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <h1 className="invoice-main-title">GSTR-3B WORKING REPORT</h1>
              <p className="invoice-company-sub" style={{ margin: '3px 0 0 0', fontWeight: 600 }}>Return Period: {returnPeriod()}</p>
              <p className="invoice-company-sub" style={{ margin: '2px 0 0 0' }}>Generated On: {generatedOn}</p>
              <p className="invoice-company-sub" style={{ margin: '2px 0 0 0' }}>Generated By: {settings.ownerName || 'Kunal Chaudhari'}</p>
            </div>
          </div>

          {/* SUMMARY SECTION */}
          <div className="gstr3b-summary-grid">
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">Total Taxable Sales</div>
            <div className="gstr3b-summary-card-value">{formatINR(gstr3BData.outward.taxable)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">Total GST Liability</div>
            <div className="gstr3b-summary-card-value" style={{ color: '#be3144' }}>{formatINR(outwardTaxTotal)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">Eligible ITC</div>
            <div className="gstr3b-summary-card-value" style={{ color: '#10b981' }}>{formatINR(itcTotal)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">Net GST Payable</div>
            <div className="gstr3b-summary-card-value" style={{ color: netGstPayable > 0 ? '#be3144' : '#1a2e1d' }}>{formatINR(netGstPayable)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">Remaining ITC</div>
            <div className="gstr3b-summary-card-value" style={{ color: '#10b981' }}>{formatINR(remainingItc)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">Total Purchase Value</div>
            <div className="gstr3b-summary-card-value">{formatINR(gstr3BData.itc.taxable)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">Total Sales Value</div>
            <div className="gstr3b-summary-card-value">{formatINR(gstr3BData.outward.taxable + outwardTaxTotal)}</div>
          </div>
          <div className="gstr3b-summary-card">
            <div className="gstr3b-summary-card-label">Total GST Collected</div>
            <div className="gstr3b-summary-card-value">{formatINR(totalSalesTax)}</div>
          </div>
        </div>

        {/* TABLE 3.1 */}
        <div className="gstr3b-print-section">
          <div className="gstr3b-section-title">Table 3.1: Details of Outward Supplies and Inward Supplies Liable to Reverse Charge</div>
          <div className="gstr3b-table-scroll-wrapper">
            <table className="gstr3b-ca-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Nature of Supplies</th>
                  <th style={{ textAlign: 'right' }}>Taxable Value (₹)</th>
                  <th style={{ textAlign: 'right' }}>Integrated Tax (₹)</th>
                  <th style={{ textAlign: 'right' }}>Central Tax (₹)</th>
                  <th style={{ textAlign: 'right' }}>State/UT Tax (₹)</th>
                  <th style={{ textAlign: 'right' }}>Cess (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.taxable).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.igst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.cgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.sgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td>(b) Outward taxable supplies (Zero Rated)</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td>(c) Other Outward Supplies (Nil Rated / Exempted)</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td>(d) Inward Supplies liable to Reverse Charge</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td>(e) Non GST Outward Supplies</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr className="total-row">
                  <td>Grand Total (Table 3.1)</td>
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
          <div className="gstr3b-section-title">Table 3.2: Details of Inter-State Supplies Made To (Unregistered/Composition/UIN)</div>
          <div className="gstr3b-table-scroll-wrapper">
            <table className="gstr3b-ca-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Place of Supply (Recipient State Type)</th>
                  <th style={{ textAlign: 'right' }}>Total Taxable Value (₹)</th>
                  <th style={{ textAlign: 'right' }}>Integrated Tax (₹)</th>
                </tr>
              </thead>
              <tbody>
                {hasInterstateSupplies ? (
                  <>
                    <tr>
                      <td>Supplies made to Unregistered Persons</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(interstateUnregisteredTaxable).replace('₹', '')}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(interstateUnregisteredIGST).replace('₹', '')}</td>
                    </tr>
                    <tr>
                      <td>Supplies made to Composition Taxable Persons</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                    </tr>
                    <tr>
                      <td>Supplies made to UIN Holders</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                    </tr>
                    <tr className="total-row">
                      <td>Total Interstate Supplies (Table 3.2)</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(interstateUnregisteredTaxable).replace('₹', '')}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(interstateUnregisteredIGST).replace('₹', '')}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#5d6b5e', padding: '12px', fontStyle: 'italic' }}>
                      No Interstate Supplies
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
            <div className="print-watermark-logo">
              <img src={settings.watermarkLogo || settings.logo} alt="Watermark" />
            </div>
          )}

          {/* TABLE 4 */}
          <div className="gstr3b-print-section">
          <div className="gstr3b-section-title">Table 4: Eligible Input Tax Credit (ITC) Details</div>
          <div className="gstr3b-table-scroll-wrapper">
            <table className="gstr3b-ca-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Details of Input Tax Credit (ITC)</th>
                  <th style={{ textAlign: 'right' }}>Integrated Tax (₹)</th>
                  <th style={{ textAlign: 'right' }}>Central Tax (₹)</th>
                  <th style={{ textAlign: 'right' }}>State/UT Tax (₹)</th>
                  <th style={{ textAlign: 'right' }}>Cess (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#fafbfa', fontWeight: 'bold' }}>
                  <td colSpan={5} style={{ textTransform: 'uppercase', fontSize: '9px', color: '#2f3e33' }}>(A) ITC Available (whether in full or part)</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>1. Import of goods</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>2. Import of services</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>3. Inward supplies liable to reverse charge (other than 1 & 2 above)</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>4. Inward supplies from ISD</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px', fontWeight: 600 }}>5. All other ITC (Registered purchases)</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.igst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.cgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.sgst).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr style={{ backgroundColor: '#fafbfa', fontWeight: 'bold' }}>
                  <td colSpan={5} style={{ textTransform: 'uppercase', fontSize: '9px', color: '#2f3e33' }}>(B) ITC Reversed</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>1. As per rules 42 & 43 of CGST Rules</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '16px' }}>2. Others</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr className="total-row">
                  <td>(C) Net ITC Available (A - B)</td>
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
          <div className="gstr3b-section-title">Table 5: Values of Exempt, Nil Rated and Non GST Inward Supplies</div>
          <div className="gstr3b-table-scroll-wrapper">
            <table className="gstr3b-ca-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Nature of Inward Supplies</th>
                  <th style={{ textAlign: 'right' }}>Inter-State Supplies (₹)</th>
                  <th style={{ textAlign: 'right' }}>Intra-State Supplies (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>From a supplier under composition scheme, Exempt and Nil rated inward supplies</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr>
                  <td>Non GST inward supplies</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TAX PAYMENT SUMMARY */}
        <div className="gstr3b-print-section">
          <div className="gstr3b-section-title">Tax Payment and Settlement Ledger</div>
          <div className="gstr3b-table-scroll-wrapper">
            <table className="gstr3b-ca-table">
              <thead>
                <tr>
                  <th>Tax Component</th>
                  <th style={{ textAlign: 'right' }}>Tax Liability (₹)</th>
                  <th style={{ textAlign: 'right' }}>ITC Utilized (₹)</th>
                  <th style={{ textAlign: 'right' }}>Paid in Cash (₹)</th>
                  <th style={{ textAlign: 'right' }}>Balance Credit (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Integrated Tax (IGST)</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(igstLiability).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(igstItcUtilized).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: igstCashPaid > 0 ? '#be3144' : 'inherit' }}>{formatINR(igstCashPaid).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(igstRemainingCredit).replace('₹', '')}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Central Tax (CGST)</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(cgstLiability).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(cgstItcUtilized).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: cgstCashPaid > 0 ? '#be3144' : 'inherit' }}>{formatINR(cgstCashPaid).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(cgstRemainingCredit).replace('₹', '')}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>State/UT Tax (SGST)</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatINR(sgstLiability).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(sgstItcUtilized).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: sgstCashPaid > 0 ? '#be3144' : 'inherit' }}>{formatINR(sgstCashPaid).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{formatINR(sgstRemainingCredit).replace('₹', '')}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Cess</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>
                <tr className="total-row">
                  <td>Total Settlement Summary</td>
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
            <div className="print-watermark-logo">
              <img src={settings.watermarkLogo || settings.logo} alt="Watermark" />
            </div>
          )}

          {/* GST RECONCILIATION SUMMARY */}
          <div className="gstr3b-print-section">
          <div className="gstr3b-section-title">GST Reconciliation Audit Summary</div>
          <div className="gstr3b-reconciliation-container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', fontSize: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>Total Book Sales Value:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{formatINR(gstr3BData.outward.taxable)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>Total Book Purchase Value:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{formatINR(gstr3BData.itc.taxable)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>Output GST Liability (GSTR-3B):</span>
                  <strong style={{ fontFamily: 'monospace', color: '#be3144' }}>{formatINR(outwardTaxTotal)}</strong>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>Input GST Credit (ITC Available):</span>
                  <strong style={{ fontFamily: 'monospace', color: '#10b981' }}>{formatINR(itcTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>Net GST Cash Liability:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{formatINR(netGstPayable)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e9e0' }}>
                  <span>Carry Forward Tax Credit:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#10b981' }}>{formatINR(remainingItc)}</strong>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '6px', backgroundColor: isMismatch ? '#fffbeb' : '#f0fdf4', border: isMismatch ? '1px solid #fde68a' : '1px solid #bbf7d0' }}>
              {isMismatch ? (
                <>
                  <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
                    WARNING: A discrepancy of {formatINR(gstDiff)} detected between sales invoice register ({formatINR(totalSalesTax)}) and outward tax supplies ({formatINR(outwardTaxTotal)}). Please verify tax configurations.
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                    Ledger Reconciled Perfectly: Outward tax matches Sales Invoice Register perfectly. No discrepancy found.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>



        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '9px', color: '#5d6b5e', borderTop: '1px dashed #e2e9e0', paddingTop: '16px' }}>
          <div>System Generated Report • AgriBiz Financial Modules</div>
          <div style={{ marginTop: '4px', fontStyle: 'italic', maxWidth: '600px', margin: '4px auto 0 auto' }}>
            Disclaimer: This report is generated from accounting entries and is intended for GST reconciliation and Chartered Accountant working purposes. It is not a substitute for the official GSTR-3B return filed on the GST Portal.
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
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Sales Invoices Count</span>
                  <span className="kpi-value">{filteredInvoices.length}</span>
                  <span className="kpi-subtext">Tax bills generated</span>
                </div>
                <div className="kpi-icon-container emerald"><BookOpen size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Taxable Sales</span>
                  <span className="kpi-value">{formatINR(totalSalesBase)}</span>
                  <span className="kpi-subtext">Excludes GST tax</span>
                </div>
                <div className="kpi-icon-container emerald"><DollarSign size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total GST Collected</span>
                  <span className="kpi-value" style={{ color: 'var(--color-warning-dark)' }}>{formatINR(totalSalesTax)}</span>
                  <span className="kpi-subtext">GST tax liability</span>
                </div>
                <div className="kpi-icon-container emerald"><Percent size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Invoice Value</span>
                  <span className="kpi-value" style={{ color: 'var(--primary-dark)' }}>{formatINR(totalSalesVal)}</span>
                  <span className="kpi-subtext">Inclusive of GST</span>
                </div>
                <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Customer Name</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Taxable Amt (₹)</th>
                      <th style={{ textAlign: 'right' }}>Tax collected (₹)</th>
                      <th style={{ textAlign: 'right' }}>Grand Total (₹)</th>
                      <th>Status</th>
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
                            {inv.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                      <td colSpan={3}>Report Summary Total:</td>
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
                      {inv.paymentStatus}
                    </span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Date</span>
                    <span className="mobile-list-card-val">{formatDate(inv.date)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Taxable Amt</span>
                    <span className="mobile-list-card-val">{formatINR(inv.subtotal - inv.discountTotal)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Tax Collected</span>
                    <span className="mobile-list-card-val">{formatINR(inv.gstTotal)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Grand Total</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(inv.grandTotal)}</span>
                  </div>
                </div>
              ))}
              
              <div className="mobile-list-card" style={{ borderLeftColor: 'var(--primary-dark)', background: 'var(--bg-app)' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Report Summary Total</div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Taxable</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalSalesBase)}</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Tax</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalSalesTax)}</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Value</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '15px' }}>{formatINR(totalSalesVal)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'purchase':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Bills logged</span>
                  <span className="kpi-value">{filteredPurchases.length}</span>
                  <span className="kpi-subtext">Supplier inward vouchers</span>
                </div>
                <div className="kpi-icon-container blue"><BookOpen size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Base Purchases</span>
                  <span className="kpi-value">{formatINR(totalPurchasesBase)}</span>
                  <span className="kpi-subtext">Taxable raw cost</span>
                </div>
                <div className="kpi-icon-container blue"><DollarSign size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total GST Paid</span>
                  <span className="kpi-value" style={{ color: 'var(--color-warning-dark)' }}>{formatINR(totalPurchasesTax)}</span>
                  <span className="kpi-subtext">Input tax credit</span>
                </div>
                <div className="kpi-icon-container blue"><Percent size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Outward Cost</span>
                  <span className="kpi-value" style={{ color: 'var(--color-danger-dark)' }}>{formatINR(totalPurchasesVal)}</span>
                  <span className="kpi-subtext">Inclusive of GST</span>
                </div>
                <div className="kpi-icon-container rose"><TrendingDown size={20} /></div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bill Number</th>
                      <th>Supplier Name</th>
                      <th>Receipt Date</th>
                      <th style={{ textAlign: 'right' }}>Base Cost (₹)</th>
                      <th style={{ textAlign: 'right' }}>Tax paid (₹)</th>
                      <th style={{ textAlign: 'right' }}>Total Cost (₹)</th>
                      <th>Status</th>
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
                            {pur.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                      <td colSpan={3}>Report Summary Total:</td>
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
                      {pur.paymentStatus}
                    </span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Receipt Date</span>
                    <span className="mobile-list-card-val">{formatDate(pur.date)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Base Cost</span>
                    <span className="mobile-list-card-val">{formatINR(pur.subtotal)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Tax Paid</span>
                    <span className="mobile-list-card-val">{formatINR(pur.gstTotal)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Cost</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(pur.grandTotal)}</span>
                  </div>
                </div>
              ))}
              
              <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-info)', background: 'var(--bg-app)' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Report Summary Total</div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Base</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalPurchasesBase)}</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Tax</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalPurchasesTax)}</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Cost</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger-dark)', fontSize: '15px' }}>{formatINR(totalPurchasesVal)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'expense':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Expenses Spends</span>
                  <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>{formatINR(totalExpenses)}</span>
                  <span className="kpi-subtext">Cumulative operational spends</span>
                </div>
                <div className="kpi-icon-container rose"><TrendingDown size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Settled / Paid Expenses</span>
                  <span className="kpi-value" style={{ color: 'var(--primary)' }}>{formatINR(totalPaidExpensesVal)}</span>
                  <span className="kpi-subtext">Fully paid invoices</span>
                </div>
                <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Outstanding / Due Dues</span>
                  <span className="kpi-value" style={{ color: '#D97706' }}>{formatINR(totalDueExpensesVal)}</span>
                  <span className="kpi-subtext">Unsettled accounts due</span>
                </div>
                <div className="kpi-icon-container amber"><DollarSign size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Top Category</span>
                  <span className="kpi-value" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{topExpenseCategory.name}</span>
                  <span className="kpi-subtext">Total: {formatINR(topExpenseCategory.amount)}</span>
                </div>
                <div className="kpi-icon-container blue"><Layers size={20} /></div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '14px' }}>Expense Statement Breakdown</h4>
              
              {/* Desktop view */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Voucher ID</th>
                        <th>Category</th>
                        <th>Payee (Paid To)</th>
                        <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Ref Number</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((exp) => (
                        <tr key={exp.id}>
                          <td>{formatDate(exp.date)}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{exp.id}</td>
                          <td style={{ fontWeight: 700 }}>{exp.category}</td>
                          <td>{exp.payee || 'General'}</td>
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
                              {exp.status || 'Paid'}
                            </span>
                          </td>
                          <td>{exp.status === 'Due' ? '—' : exp.paymentMethod}</td>
                          <td style={{ fontFamily: 'monospace' }}>{exp.status === 'Due' ? '—' : (exp.referenceNumber || '—')}</td>
                          <td style={{ fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.notes || '—'}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                        <td colSpan={4}>Report Summary Total:</td>
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
                        <h4 className="mobile-list-card-title">{exp.category}</h4>
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
                        {exp.status || 'Paid'}
                      </span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Payee</span>
                      <span className="mobile-list-card-val">{exp.payee || 'General'}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Amount</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 700, color: exp.status === 'Due' ? '#D97706' : 'var(--color-danger-dark)' }}>{formatINR(exp.amount)}</span>
                    </div>
                    {exp.status !== 'Due' && (
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">Method</span>
                        <span className="mobile-list-card-val">{exp.paymentMethod}</span>
                      </div>
                    )}
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Remarks</span>
                      <span className="mobile-list-card-val" style={{ fontStyle: 'italic' }}>{exp.notes || '—'}</span>
                    </div>
                  </div>
                ))}
                
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-info)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Report Summary Total</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Expense</span>
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
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Sales Revenue (Taxable)</span>
                  <span className="kpi-value">{formatINR(totalSalesBase)}</span>
                  <span className="kpi-subtext">Goods value dispatched</span>
                </div>
                <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Cost of Goods Sold (COGS)</span>
                  <span className="kpi-value">{formatINR(coGS)}</span>
                  <span className="kpi-subtext">Original inventory purchase cost</span>
                </div>
                <div className="kpi-icon-container rose"><TrendingDown size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Operational Expenses</span>
                  <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>{formatINR(totalExpenses)}</span>
                  <span className="kpi-subtext">Rent, utility bills, salary, etc.</span>
                </div>
                <div className="kpi-icon-container rose"><TrendingDown size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Net Profit (Loss)</span>
                  <span className="kpi-value" style={{ color: netProfit >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>{formatINR(netProfit)}</span>
                  <span className="kpi-subtext">Margin percentage: {profitMarginPercent.toFixed(1)}%</span>
                </div>
                <div className="kpi-icon-container emerald"><Percent size={20} /></div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '14px' }}>Sales Profit Breakdown by Invoices</h4>
              {/* Desktop View */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th style={{ textAlign: 'right' }}>Taxable Sales (₹)</th>
                        <th style={{ textAlign: 'right' }}>Cost Price (₹)</th>
                        <th style={{ textAlign: 'right' }}>Net Profit (₹)</th>
                        <th style={{ textAlign: 'center' }}>Margin (%)</th>
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
                        <td colSpan={3}>Report Summary Total:</td>
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
                        <span className="badge" style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>{invMargin.toFixed(1)}% Margin</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">Date</span>
                        <span className="mobile-list-card-val">{formatDate(inv.date)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">Taxable Sales</span>
                        <span className="mobile-list-card-val">{formatINR(inv.subtotal)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">Cost Price</span>
                        <span className="mobile-list-card-val">{formatINR(invoiceCOGS)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">Net Profit</span>
                        <span className="mobile-list-card-val" style={{ fontWeight: 700, color: invProfit >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>{formatINR(invProfit)}</span>
                      </div>
                    </div>
                  );
                })}
                
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--primary-dark)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Report Summary Total</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Sales</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalSalesBase)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Cost</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(coGS)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Profit</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '15px' }}>{formatINR(grossProfit)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Average Margin</span>
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
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Stock Quantity</span>
                  <span className="kpi-value">{totalStockQty} items</span>
                  <span className="kpi-subtext">Available in warehouse</span>
                </div>
                <div className="kpi-icon-container blue"><Layers size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Stock Valuation (Asset Cost)</span>
                  <span className="kpi-value" style={{ color: 'var(--primary-dark)' }}>{formatINR(totalAssetVal)}</span>
                  <span className="kpi-subtext">Valued at base purchase price</span>
                </div>
                <div className="kpi-icon-container emerald"><DollarSign size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Potential Value (Retail)</span>
                  <span className="kpi-value">{formatINR(totalRetailVal)}</span>
                  <span className="kpi-subtext">Valued at sales retail price</span>
                </div>
                <div className="kpi-icon-container blue"><TrendingUp size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Potential Markup Margin</span>
                  <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}>{formatINR(totalRetailVal - totalAssetVal)}</span>
                  <span className="kpi-subtext">Valued at sales markup profit</span>
                </div>
                <div className="kpi-icon-container emerald"><Briefcase size={20} /></div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU Code</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Available Qty</th>
                      <th style={{ textAlign: 'right' }}>Cost Price (₹)</th>
                      <th style={{ textAlign: 'right' }}>Asset Valuation (₹)</th>
                      <th style={{ textAlign: 'right' }}>Retail Rate (₹)</th>
                      <th style={{ textAlign: 'right' }}>Retail Valuation (₹)</th>
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
                          <td>{p.category}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.stock}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(p.purchasePrice).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(itemAssetVal).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(p.sellingPrice).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(itemRetailVal).replace('₹', '')}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                      <td colSpan={3}>Stock Summary Total:</td>
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
                        <span className="mobile-list-card-subtitle">{p.category} • SKU: {p.sku}</span>
                      </div>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>{p.stock} Units</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Cost / Retail Rate</span>
                      <span className="mobile-list-card-val">{formatINR(p.purchasePrice)} / {formatINR(p.sellingPrice)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Asset Valuation</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{formatINR(itemAssetVal)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Retail Valuation</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{formatINR(itemRetailVal)}</span>
                    </div>
                  </div>
                );
              })}
              
              <div className="mobile-list-card" style={{ borderLeftColor: 'var(--primary-dark)', background: 'var(--bg-app)' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Stock Summary Total</div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Qty</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{totalStockQty} items</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Asset Value</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{formatINR(totalAssetVal)}</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Retail Value</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800 }}>{formatINR(totalRetailVal)}</span>
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
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Gross Taxable Turnover</span>
                  <span className="kpi-value">{formatINR(totalSalesBase)}</span>
                  <span className="kpi-subtext">Excluding tax value</span>
                </div>
                <div className="kpi-icon-container blue"><DollarSign size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Output GST (Collected)</span>
                  <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}>{formatINR(totalSalesTax)}</span>
                  <span className="kpi-subtext">CGST: {formatINR(totalCGSTCollected)} | SGST: {formatINR(totalSGSTCollected)}</span>
                </div>
                <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Input GST (ITC Paid)</span>
                  <span className="kpi-value" style={{ color: 'var(--color-info-dark)' }}>{formatINR(totalPurchasesTax)}</span>
                  <span className="kpi-subtext">CGST: {formatINR(totalCGSTPaid)} | SGST: {formatINR(totalSGSTPaid)}</span>
                </div>
                <div className="kpi-icon-container blue"><TrendingDown size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Net GST Liability</span>
                  <span className="kpi-value" style={{ color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                    {formatINR(netGSTDue)}
                  </span>
                  <span className="kpi-subtext">{netGSTDue >= 0 ? 'Cash Payable to Govt' : 'Carry Forward Credit'}</span>
                </div>
                <div className="kpi-icon-container rose"><Percent size={20} /></div>
              </div>
            </div>

            {/* GST summary log */}
            <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <h3 className="card-title" style={{ padding: '20px 20px 0 20px', margin: 0, fontWeight: 700 }}>GSTR Summary Ledger Logs</h3>
              <div style={{ padding: '20px' }}>
                {/* Desktop View */}
                <div className="desktop-only-table">
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Transaction Type</th>
                          <th>Document Count</th>
                          <th style={{ textAlign: 'right' }}>Goods Value (Base cost)</th>
                          <th style={{ textAlign: 'right' }}>Central GST (CGST)</th>
                          <th style={{ textAlign: 'right' }}>State GST (SGST)</th>
                          <th style={{ textAlign: 'right' }}>Total Tax Liability (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600, color: 'var(--color-success-dark)' }}>Outward Supply (Sales Invoices)</td>
                          <td>{filteredInvoices.length}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalCGSTCollected).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalSGSTCollected).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success-dark)' }}>
                            {formatINR(totalSalesTax).replace('₹', '')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                          <td style={{ fontWeight: 600, color: 'var(--color-info-dark)' }}>Inward Supply (Supplier Bills)</td>
                          <td>{filteredPurchases.length}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalPurchasesBase).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalCGSTPaid).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(totalSGSTPaid).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-info-dark)' }}>
                            {formatINR(totalPurchasesTax).replace('₹', '')}
                          </td>
                        </tr>
                        <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                          <td colSpan={2}>Net Payable Tax Dues:</td>
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
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--color-success-dark)' }}>Outward Supply (Sales)</div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Document Count</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{filteredInvoices.length}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Goods Value (Base)</span>
                      <span className="mobile-list-card-val">{formatINR(totalSalesBase)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">CGST collected</span>
                      <span className="mobile-list-card-val">{formatINR(totalCGSTCollected)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">SGST collected</span>
                      <span className="mobile-list-card-val">{formatINR(totalSGSTCollected)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Total Output GST</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 700, color: 'var(--color-success-dark)' }}>{formatINR(totalSalesTax)}</span>
                    </div>
                  </div>

                  <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-info-dark)' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--color-info-dark)' }}>Inward Supply (Purchases)</div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Document Count</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{filteredPurchases.length}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Goods Value (Base)</span>
                      <span className="mobile-list-card-val">{formatINR(totalPurchasesBase)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">CGST Paid</span>
                      <span className="mobile-list-card-val">{formatINR(totalCGSTPaid)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">SGST Paid</span>
                      <span className="mobile-list-card-val">{formatINR(totalSGSTPaid)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Total Input ITC</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 700, color: 'var(--color-info-dark)' }}>{formatINR(totalPurchasesTax)}</span>
                    </div>
                  </div>

                  <div className="mobile-list-card" style={{ borderLeftColor: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', background: 'var(--bg-app)' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Net Payable Tax Dues</div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Net Goods Difference</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{formatINR(totalSalesBase - totalPurchasesBase)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Net CGST</span>
                      <span className="mobile-list-card-val" style={{ color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>{formatINR(totalCGSTCollected - totalCGSTPaid)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Net SGST</span>
                      <span className="mobile-list-card-val" style={{ color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>{formatINR(totalSGSTCollected - totalSGSTPaid)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Net Liability</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 800, color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', fontSize: '15px' }}>{formatINR(netGSTDue)}</span>
                    </div>
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
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Registered Customers</span>
                  <span className="kpi-value">{totalCustomers}</span>
                  <span className="kpi-subtext">Active accounts</span>
                </div>
                <div className="kpi-icon-container blue"><Users size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Accounts with Dues</span>
                  <span className="kpi-value" style={{ color: 'var(--color-warning-dark)' }}>{customersWithDues} accounts</span>
                  <span className="kpi-subtext">Customers owing payments</span>
                </div>
                <div className="kpi-icon-container amber"><Users size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Outstanding Dues</span>
                  <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>{formatINR(pendingReceivables)}</span>
                  <span className="kpi-subtext">Collectable assets</span>
                </div>
                <div className="kpi-icon-container rose"><TrendingUp size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Average Outstanding</span>
                  <span className="kpi-value">{formatINR(averageReceivable)}</span>
                  <span className="kpi-subtext">Per active customer account</span>
                </div>
                <div className="kpi-icon-container blue"><DollarSign size={20} /></div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Customer Name</th>
                      <th>Phone Number</th>
                      <th>GSTIN Identification</th>
                      <th style={{ textAlign: 'right' }}>Outstanding Balance (₹)</th>
                      <th>Status</th>
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
                            {c.outstanding === 0 ? 'Settled' : c.outstanding > 0 ? 'Dues Pending' : 'Advance Credit'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                      <td colSpan={4}>Accumulated Customer Dues:</td>
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
                      {c.outstanding === 0 ? 'Settled' : c.outstanding > 0 ? 'Dues Pending' : 'Advance Credit'}
                    </span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">GSTIN</span>
                    <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{c.gstin || '—'}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Outstanding Balance</span>
                    <span className="mobile-list-card-val" style={{
                      fontWeight: 700,
                      color: c.outstanding > 0 ? 'var(--color-danger)' : c.outstanding < 0 ? 'var(--color-success-dark)' : 'inherit',
                    }}>{formatINR(c.outstanding)}</span>
                  </div>
                </div>
              ))}
              
              <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-danger)', background: 'var(--bg-app)' }}>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label" style={{ fontWeight: 700 }}>Accumulated Customer Dues</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '15px' }}>
                    {formatINR(pendingReceivables)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'suppLedger':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Registered Suppliers</span>
                  <span className="kpi-value">{totalSuppliers}</span>
                  <span className="kpi-subtext">Active accounts</span>
                </div>
                <div className="kpi-icon-container blue"><Truck size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Accounts with Balance</span>
                  <span className="kpi-value" style={{ color: 'var(--color-warning-dark)' }}>{suppliersWithDues} accounts</span>
                  <span className="kpi-subtext">Suppliers we owe money</span>
                </div>
                <div className="kpi-icon-container amber"><Truck size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Balance Owed</span>
                  <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>{formatINR(pendingPayables)}</span>
                  <span className="kpi-subtext">Accounts payable cost</span>
                </div>
                <div className="kpi-icon-container rose"><TrendingDown size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Average Payable</span>
                  <span className="kpi-value">{formatINR(averagePayable)}</span>
                  <span className="kpi-subtext">Per active supplier account</span>
                </div>
                <div className="kpi-icon-container blue"><DollarSign size={20} /></div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Supplier ID</th>
                      <th>Company / Supplier Name</th>
                      <th>Phone / Contact</th>
                      <th>GSTIN Identification</th>
                      <th style={{ textAlign: 'right' }}>Balance Owed (₹)</th>
                      <th>Status</th>
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
                            {s.outstanding === 0 ? 'Settled' : 'Payable Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                      <td colSpan={4}>Accumulated We Owe Suppliers:</td>
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
                      {s.outstanding === 0 ? 'Settled' : 'Payable Pending'}
                    </span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">GSTIN</span>
                    <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{s.gstin || '—'}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Balance Owed</span>
                    <span className="mobile-list-card-val" style={{
                      fontWeight: 700,
                      color: s.outstanding > 0 ? 'var(--color-danger)' : 'inherit',
                    }}>{formatINR(s.outstanding)}</span>
                  </div>
                </div>
              ))}
              
              <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-danger)', background: 'var(--bg-app)' }}>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label" style={{ fontWeight: 700 }}>Accumulated Owed Balance</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '15px' }}>
                    {formatINR(pendingPayables)}
                  </span>
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
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">B2B Invoices (Registered)</span>
                  <span className="kpi-value">{gstr1B2BList.length} Rows</span>
                  <span className="kpi-subtext">Taxable: {formatINR(gstr1B2BList.reduce((acc, x) => acc + x.taxableValue, 0))}</span>
                </div>
                <div className="kpi-icon-container emerald"><BookOpen size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">B2CS (Unregistered OE)</span>
                  <span className="kpi-value">{gstr1B2CSList.length} Groups</span>
                  <span className="kpi-subtext">Taxable: {formatINR(gstr1B2CSList.reduce((acc, x) => acc + x.taxable, 0))}</span>
                </div>
                <div className="kpi-icon-container blue"><Users size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">HSN Summary (Table 12)</span>
                  <span className="kpi-value">{gstr1HSNList.length} Categories</span>
                  <span className="kpi-subtext">Taxable: {formatINR(gstr1HSNList.reduce((acc, x) => acc + x.taxable, 0))}</span>
                </div>
                <div className="kpi-icon-container amber"><Layers size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Documents Issued (Table 13)</span>
                  <span className="kpi-value">{gstr1DocsSummary.total} Invoices</span>
                  <span className="kpi-subtext">Range: {gstr1DocsSummary.from} - {gstr1DocsSummary.to}</span>
                </div>
                <div className="kpi-icon-container rose"><FileText size={20} /></div>
              </div>
            </div>

            {/* GSTR-1 Main Section Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* 1. B2B Outward Supplies */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      1. B2B Registered Outward Supplies (4A, 4B, 4C, 6B, 6C)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Outward supplies made to GST registered entities. Grouped by invoice number and tax rate.
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr1B2B} disabled={gstr1B2BList.length === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> Download B2B CSV
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">Recipient GSTIN</th>
                        <th className="text-nowrap">Recipient Name</th>
                        <th className="text-nowrap">Invoice No</th>
                        <th className="text-nowrap">Invoice Date</th>
                        <th className="text-nowrap align-right">Total Value</th>
                        <th className="text-nowrap">POS</th>
                        <th className="text-nowrap align-center">Rate</th>
                        <th className="text-nowrap align-right">Taxable Value</th>
                        <th className="text-nowrap align-right">CGST</th>
                        <th className="text-nowrap align-right">SGST</th>
                        <th className="text-nowrap align-right">IGST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1B2BList.length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            No registered B2B supplies found in this period.
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
                      2. B2C Small Outward Supplies (7 - Consolidated)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Consolidated taxable outward supplies to unregistered customers. Grouped by Place of Supply (POS) and Tax Rate.
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr1B2CS} disabled={gstr1B2CSList.length === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> Download B2CS CSV
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">Type</th>
                        <th className="text-nowrap">Place of Supply (POS)</th>
                        <th className="text-nowrap align-center">GST Rate</th>
                        <th className="text-nowrap align-right">Total Taxable Value</th>
                        <th className="text-nowrap align-right">CGST Amount</th>
                        <th className="text-nowrap align-right">SGST Amount</th>
                        <th className="text-nowrap align-right">IGST Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1B2CSList.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            No unregistered B2C supplies found in this period.
                          </td>
                        </tr>
                      ) : (
                        gstr1B2CSList.map((item, idx) => (
                          <tr key={idx}>
                            <td className="text-nowrap">OE (Other)</td>
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
                      3. HSN Summary of Outward Supplies (Table 12)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      HSN-code summary of agricultural goods supplied. Required for return filing.
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr1HSN} disabled={gstr1HSNList.length === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> Download HSN CSV
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">HSN/SAC</th>
                        <th className="text-nowrap">Product Description</th>
                        <th className="text-nowrap">Unit (UQC)</th>
                        <th className="text-nowrap align-center">Total Qty</th>
                        <th className="text-nowrap align-right">Total Value</th>
                        <th className="text-nowrap align-right">Taxable Value</th>
                        <th className="text-nowrap align-right">CGST Paid</th>
                        <th className="text-nowrap align-right">SGST Paid</th>
                        <th className="text-nowrap align-right">IGST Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1HSNList.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            No items found in this period.
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
                      4. Summary of Documents Issued (Table 13)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Serial number range and counts of tax invoices issued during the period.
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr1Docs} disabled={gstr1DocsSummary.total === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> Download Docs CSV
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">Nature of Document</th>
                        <th className="text-nowrap">Sr. No. From</th>
                        <th className="text-nowrap">Sr. No. To</th>
                        <th className="text-nowrap align-center">Total Count</th>
                        <th className="text-nowrap align-center">Cancelled</th>
                        <th className="text-nowrap align-center">Net Issued</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1DocsSummary.total === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            No invoice documents issued in this period.
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="text-nowrap" style={{ fontWeight: 600 }}>Invoices for outward supply</td>
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
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">B2B Purchases (Registered)</span>
                  <span className="kpi-value">{gstr2B2BList.length} Rows</span>
                  <span className="kpi-subtext">Taxable: {formatINR(gstr2B2BList.reduce((acc, x) => acc + x.taxableValue, 0))}</span>
                </div>
                <div className="kpi-icon-container emerald"><Briefcase size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">HSN Inward Summary (Table 13)</span>
                  <span className="kpi-value">{gstr2HSNList.length} Categories</span>
                  <span className="kpi-subtext">Taxable: {formatINR(gstr2HSNList.reduce((acc, x) => acc + x.taxable, 0))}</span>
                </div>
                <div className="kpi-icon-container amber"><Layers size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Eligible Input Tax Credit</span>
                  <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}>{formatINR(totalGstr2ITC)}</span>
                  <span className="kpi-subtext">Claimable CGST+SGST+IGST</span>
                </div>
                <div className="kpi-icon-container blue"><Percent size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Documents Received</span>
                  <span className="kpi-value">{gstr2DocsSummary.total} Invoices</span>
                  <span className="kpi-subtext">Range: {gstr2DocsSummary.from} - {gstr2DocsSummary.to}</span>
                </div>
                <div className="kpi-icon-container rose"><FileText size={20} /></div>
              </div>
            </div>

            {/* GSTR-2 Main Section Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* 1. B2B Inward Supplies */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      1. B2B Inward Supplies Received from Registered Suppliers (3, 4A)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Inward supplies received from GST registered suppliers. Grouped by invoice number and tax rate.
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr2B2B} disabled={gstr2B2BList.length === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> Download B2B CSV
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">Supplier GSTIN</th>
                        <th className="text-nowrap">Supplier Name</th>
                        <th className="text-nowrap">Bill No</th>
                        <th className="text-nowrap">Bill Date</th>
                        <th className="text-nowrap align-right">Total Value</th>
                        <th className="text-nowrap">POS</th>
                        <th className="text-nowrap align-center">Rate</th>
                        <th className="text-nowrap align-right">Taxable Value</th>
                        <th className="text-nowrap align-right">CGST</th>
                        <th className="text-nowrap align-right">SGST</th>
                        <th className="text-nowrap align-right">IGST</th>
                        <th className="text-nowrap align-center">ITC Eligible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr2B2BList.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            No registered inward supplies found in this period.
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
                      2. HSN Summary of Inward Supplies (Table 13)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      HSN-code summary of goods received (purchases). Required to audit input tax credit.
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr2HSN} disabled={gstr2HSNList.length === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> Download HSN CSV
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">HSN/SAC</th>
                        <th className="text-nowrap">Product Description</th>
                        <th className="text-nowrap">Unit (UQC)</th>
                        <th className="text-nowrap align-center">Total Qty</th>
                        <th className="text-nowrap align-right">Total Value</th>
                        <th className="text-nowrap align-right">Taxable Value</th>
                        <th className="text-nowrap align-right">CGST Paid</th>
                        <th className="text-nowrap align-right">SGST Paid</th>
                        <th className="text-nowrap align-right">IGST Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr2HSNList.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            No inward items found in this period.
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
                      3. Summary of Documents Received
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Serial numbers and counts of supplier inward bills received during the period.
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportGstr2Docs} disabled={gstr2DocsSummary.total === 0}>
                    <Percent size={14} style={{ marginRight: '6px' }} /> Download Docs CSV
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-nowrap">Nature of Document</th>
                        <th className="text-nowrap">Sr. No. From</th>
                        <th className="text-nowrap">Sr. No. To</th>
                        <th className="text-nowrap align-center">Total Count</th>
                        <th className="text-nowrap align-center">Cancelled</th>
                        <th className="text-nowrap align-center">Net Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr2DocsSummary.total === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>
                            No invoice documents received in this period.
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="text-nowrap" style={{ fontWeight: 600 }}>Invoices for inward supply</td>
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
              Sales Transaction Statement
            </h2>
            
            {/* Summary metrics block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Invoices count:</strong> {filteredInvoices.length} bills</div>
              <div><strong>Taxable Amount:</strong> {formatINR(totalSalesBase)}</div>
              <div><strong>GST Tax Collected:</strong> {formatINR(totalSalesTax)}</div>
              <div><strong>Total Sales (Inc. GST):</strong> {formatINR(totalSalesVal)}</div>
            </div>

            {/* Print Grid Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Invoice No</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Customer Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Date</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Taxable Amt (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Tax (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Grand Total (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Status</th>
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
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{inv.paymentStatus}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Report Summary Total:</td>
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
              Purchase Transaction Statement
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Bills Logged:</strong> {filteredPurchases.length} invoices</div>
              <div><strong>Taxable Purchases:</strong> {formatINR(totalPurchasesBase)}</div>
              <div><strong>GST Tax Paid:</strong> {formatINR(totalPurchasesTax)}</div>
              <div><strong>Total Cost (Inc. GST):</strong> {formatINR(totalPurchasesVal)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Bill Number</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Supplier Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Date</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Base Cost (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Tax Paid (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Total Cost (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Status</th>
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
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{pur.paymentStatus}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Report Summary Total:</td>
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
              Operational Expense Statement
            </h2>
            
            {/* Summary metrics block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '10px' }}>
              <div><strong>Total Operational Spends:</strong> {formatINR(totalExpenses)}</div>
              <div><strong>Settled Spends:</strong> {formatINR(totalPaidExpensesVal)}</div>
              <div><strong>Outstanding Dues:</strong> {formatINR(totalDueExpensesVal)}</div>
              <div><strong>Top Category:</strong> {topExpenseCategory.name}</div>
            </div>

            {/* Print Grid Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Date</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Voucher ID</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Category</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Payee (Paid To)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Amount (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Status</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Method</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Ref Number</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{formatDate(exp.date)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{exp.id}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{exp.category}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{exp.payee || 'General'}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(exp.amount).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center', fontWeight: 'bold', color: exp.status === 'Due' ? '#D97706' : 'var(--primary)' }}>{exp.status || 'Paid'}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{exp.status === 'Due' ? '—' : exp.paymentMethod}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{exp.status === 'Due' ? '—' : (exp.referenceNumber || '—')}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Report Summary Total:</td>
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
              Sales Profit & Loss Statement
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '9px' }}>
              <div><strong>Sales Revenue:</strong> {formatINR(totalSalesBase)}</div>
              <div><strong>Cost of Goods:</strong> {formatINR(coGS)}</div>
              <div><strong>Gross Profit:</strong> {formatINR(grossProfit)}</div>
              <div><strong>Operating Expenses:</strong> {formatINR(totalExpenses)}</div>
              <div><strong>Net Profit (Loss):</strong> {formatINR(netProfit)} ({profitMarginPercent.toFixed(1)}%)</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Invoice No</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Date</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Customer</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Taxable Sales (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Cost Price (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Net Profit (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Margin</th>
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
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Report Summary (Net Profit):</td>
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
              Stock Inventory Asset Valuation
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Total Items:</strong> {totalStockQty} units</div>
              <div><strong>Asset Value (Cost):</strong> {formatINR(totalAssetVal)}</div>
              <div><strong>Retail Value (Potential):</strong> {formatINR(totalRetailVal)}</div>
              <div><strong>Potential Margin:</strong> {formatINR(totalRetailVal - totalAssetVal)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>SKU</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Product Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Category</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Qty</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Cost Price (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Asset Value (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Retail Price (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Retail Value (₹)</th>
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
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Stock Summary Total:</td>
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
              GST Tax Ledger Summary
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Taxable Turnover:</strong> {formatINR(totalSalesBase)}</div>
              <div><strong>Output GST Collected:</strong> {formatINR(totalSalesTax)}</div>
              <div><strong>Input GST ITC Paid:</strong> {formatINR(totalPurchasesTax)}</div>
              <div><strong>Net GST Payable:</strong> {formatINR(netGSTDue)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Transaction Supply Type</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Doc Count</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Base Goods Value (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Central GST (CGST) (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>State GST (SGST) (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Total Tax Liability (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>Outward Supply (Sales Invoices)</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{filteredInvoices.length}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalCGSTCollected).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalSGSTCollected).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(totalSalesTax).replace('₹', '')}</td>
                </tr>
                <tr style={{ backgroundColor: '#F9FAF9' }}>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>Inward Supply (Supplier Bills)</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{filteredPurchases.length}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalPurchasesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalCGSTPaid).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalSGSTPaid).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(totalPurchasesTax).replace('₹', '')}</td>
                </tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Net Payable Tax Dues:</td>
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
              Customer Outstanding Balances Statement
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Registered Customers:</strong> {totalCustomers} accounts</div>
              <div><strong>Accounts with Dues:</strong> {customersWithDues} accounts</div>
              <div><strong>Accumulated Dues:</strong> {formatINR(pendingReceivables)}</div>
              <div><strong>Average Dues:</strong> {formatINR(averageReceivable)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Customer ID</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Customer Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Phone Number</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>GSTIN</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Outstanding (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Status</th>
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
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{c.outstanding === 0 ? 'Settled' : c.outstanding > 0 ? 'Dues' : 'Advance'}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Accumulated Outstanding Dues Total:</td>
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
              Supplier Account Payables Statement
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Registered Suppliers:</strong> {totalSuppliers} accounts</div>
              <div><strong>Accounts Owed:</strong> {suppliersWithDues} accounts</div>
              <div><strong>Accumulated Owed:</strong> {formatINR(pendingPayables)}</div>
              <div><strong>Average Payables:</strong> {formatINR(averagePayable)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Supplier ID</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Company / Supplier Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Phone Number</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>GSTIN</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Balance Owed (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Status</th>
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
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{s.outstanding === 0 ? 'Settled' : 'Payable'}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Accumulated Supplier Payables Total:</td>
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
              GSTR-1 Outward Supplies Audit Summary (CA-Ready)
            </h2>

            {/* Overall summary block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '10px' }}>
              <div><strong>B2B Invoices:</strong> {gstr1B2BList.length} Rows</div>
              <div><strong>B2CS Groups:</strong> {gstr1B2CSList.length} Groups</div>
              <div><strong>HSN Categories:</strong> {gstr1HSNList.length} Codes</div>
              <div><strong>Docs Issued:</strong> {gstr1DocsSummary.total} Bills</div>
            </div>

            {/* 1. B2B Table */}
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', borderBottom: '1px solid #2F3E33', paddingBottom: '3px' }}>
              1. B2B Registered Supplies (4A, 4B, 4C, 6B, 6C)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>GSTIN</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Inv No</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>POS</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>Rate</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>Taxable Amt (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>CGST (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>SGST (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>IGST (₹)</th>
                </tr>
              </thead>
              <tbody>
                {gstr1B2BList.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>No registered B2B supplies found.</td>
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
              2. B2C Small Supplies (7 - Consolidated)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Place of Supply (POS)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>GST Rate</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>Taxable Value (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>CGST Amount (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>SGST Amount (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>IGST Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {gstr1B2CSList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>No unregistered B2C supplies found.</td>
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
              3. HSN Summary of Outward Supplies (Table 12)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>HSN</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>UQC</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>Total Value (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>Taxable Value (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>CGST (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>SGST (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>IGST (₹)</th>
                </tr>
              </thead>
              <tbody>
                {gstr1HSNList.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>No HSN details found.</td>
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
              4. Documents Issued Summary (Table 13)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Nature of Document</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>From</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>To</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>Total Number</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>Cancelled</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>Net Issued</th>
                </tr>
              </thead>
              <tbody>
                {gstr1DocsSummary.total === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>No document summary found.</td>
                  </tr>
                ) : (
                  <tr>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>Invoices for outward supply</td>
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
              GSTR-2 Inward Supplies Audit Summary (CA-Ready)
            </h2>

            {/* Overall summary block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '10px' }}>
              <div><strong>B2B Purchases:</strong> {gstr2B2BList.length} Rows</div>
              <div><strong>HSN Categories:</strong> {gstr2HSNList.length} Codes</div>
              <div><strong>Eligible ITC:</strong> {formatINR(totalGstr2ITC)}</div>
              <div><strong>Docs Received:</strong> {gstr2DocsSummary.total} Bills</div>
            </div>

            {/* 1. B2B Table */}
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', margin: '12px 0 6px 0', borderBottom: '1px solid #2F3E33', paddingBottom: '3px' }}>
              1. B2B Inward Supplies (3, 4A)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>GSTIN</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Supplier Name</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Bill No</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>Taxable Amt (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>CGST (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>SGST (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>IGST (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>ITC</th>
                </tr>
              </thead>
              <tbody>
                {gstr2B2BList.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>No registered inward supplies found.</td>
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
              2. HSN Summary of Inward Supplies (Table 13)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>HSN</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>UQC</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>Total Value (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>Taxable Value (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>CGST (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>SGST (₹)</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'right' }}>IGST (₹)</th>
                </tr>
              </thead>
              <tbody>
                {gstr2HSNList.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>No HSN details found.</td>
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
              3. Summary of Documents Received
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F0F4F1', fontWeight: 'bold' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>Nature of Document</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>From</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'left' }}>To</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>Total Number</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>Cancelled</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #C8D3C5', textAlign: 'center' }}>Net Received</th>
                </tr>
              </thead>
              <tbody>
                {gstr2DocsSummary.total === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px', textAlign: 'center', border: '1px solid #C8D3C5' }}>No document summary found.</td>
                  </tr>
                ) : (
                  <tr>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>Invoices for inward supply</td>
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
    { id: 'sales', label: 'Sales Report', icon: <FileText size={18} /> },
    { id: 'purchase', label: 'Purchase Report', icon: <FileText size={18} /> },
    { id: 'expense', label: 'Expense Report', icon: <TrendingDown size={18} /> },
    { id: 'profit', label: 'Profit & Loss Summary', icon: <Briefcase size={18} /> },
    { id: 'stock', label: 'Stock Asset Value', icon: <Layers size={18} /> },
    { id: 'gst', label: 'GST Tax Summary', icon: <Percent size={18} /> },
    { id: 'custLedger', label: 'Customer Dues Ledger', icon: <Users size={18} /> },
    { id: 'suppLedger', label: 'Supplier Payables Ledger', icon: <Truck size={18} /> },
    { id: 'gstr1', label: 'GSTR-1 Return (CA-Ready)', icon: <Percent size={18} /> },
    { id: 'gstr2', label: 'GSTR-2 Inward (CA-Ready)', icon: <Percent size={18} /> },
    { id: 'gstr3b', label: 'GSTR-3B Return (CA-Ready)', icon: <Percent size={18} /> },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Top filter row */}
      <div className="filters-row-unified no-print">
        <div className="filters-group-one" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {/* Preset Ranges */}
          <div className="reports-preset-select-wrapper" style={{ minWidth: '160px' }}>
            <select className="filter-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="All">All Historical Records</option>
              <option value="Custom">Custom Date Range</option>
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
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>to</span>
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
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-secondary reports-save-btn" onClick={handleDownloadPDF}>
            <FileText size={16} /> Save PDF
          </button>
          <button className="btn btn-primary reports-print-btn" onClick={handlePrint}>
            <Printer size={16} /> Print Report
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
                    {settings.email && <span style={{ whiteSpace: 'nowrap' }}>Email: {settings.email}</span>}
                    {settings.email && (settings.phone || settings.website) && <span style={{ opacity: 0.5 }}>|</span>}
                    {settings.phone && <span style={{ whiteSpace: 'nowrap' }}>Mob: {settings.phone}</span>}
                    {settings.phone && settings.website && <span style={{ opacity: 0.5 }}>|</span>}
                    {settings.website && <span style={{ whiteSpace: 'nowrap' }}>Web: {settings.website}</span>}
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
                  <h1 className="invoice-main-title">GSTR-3B WORKING REPORT</h1>
                  <p className="invoice-company-sub" style={{ margin: '3px 0 0 0', fontWeight: 600 }}>Return Period: {returnPeriod()}</p>
                  <p className="invoice-company-sub" style={{ margin: '2px 0 0 0' }}>Generated On: {generatedOn}</p>
                  <p className="invoice-company-sub" style={{ margin: '2px 0 0 0' }}>Generated By: {settings.ownerName || 'Kunal Chaudhari'}</p>
                </>
              ) : (
                <>
                  <h1 className="invoice-main-title">{activeReport.toUpperCase()} REPORT</h1>
                  <p className="invoice-company-sub" style={{ margin: '3px 0 0 0' }}>
                    Period: {dateRange === 'All' ? 'All Historical Records' : `${formatDate(startDate)} to ${formatDate(endDate)}`}
                  </p>
                  <p className="invoice-company-sub" style={{ margin: '2px 0 0 0' }}>
                    Date Generated: {formatDate(new Date().toISOString())}
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
              <div>Prepared By: ___________________________</div>
              <div>Authorized Signatory: ___________________________</div>
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
