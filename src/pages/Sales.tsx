import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { CustomerModal } from '../components/CustomerModal';
import { formatINR, formatDate } from '../utils/dummyData';
import type { Invoice } from '../types';
import {
  Plus,
  Search,
  FileText,
  Printer,
  Download,
  Trash2,
  Eye,
  ArrowLeft,
  Percent,
  Share2,
  Edit2,
  AlertTriangle,
  MoreVertical,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';

interface InvoiceItemLocal {
  productId: string;
  quantity: number;
  price: number;
  discount: number;
}

export const Sales: React.FC = () => {
  const {
    invoices,
    customers,
    products,
    addInvoice,
    editInvoice,
    deleteInvoice,
    searchQuery,
    setSearchQuery,
    currentInvoiceId,
    setViewInvoice,
    isCreatingInvoice,
    setIsCreatingInvoice,
    showToast,
    settings,
    setViewCustomer,
    setCurrentTab,
    salesFormPresetCustomerId,
    setSalesFormPresetCustomerId,
  } = useApp();

  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const invoiceCount = invoices.length;

  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<{ id: string; invoiceNumber: string } | null>(null);
  const [activeMenuInvoiceId, setActiveMenuInvoiceId] = useState<string | null>(null);

  // Local state for invoice creator - defaults to 1 pre-filled required row
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2026-07-01');
  const [items, setItems] = useState<InvoiceItemLocal[]>([
    { productId: '', quantity: 1, price: 0, discount: 0 }
  ]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');

  // Print Template Selector (A5 standard vs Thermal receipt POS roll)
  const [printTemplate, setPrintTemplate] = useState<'A5' | 'Thermal'>('A5');

  // Modals & Filters
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Toggle thermal printer style class on document body
  useEffect(() => {
    if (currentInvoiceId && printTemplate === 'Thermal') {
      document.body.classList.add('print-thermal-mode');
    } else {
      document.body.classList.remove('print-thermal-mode');
    }
    return () => {
      document.body.classList.remove('print-thermal-mode');
    };
  }, [printTemplate, currentInvoiceId]);

  useEffect(() => {
    if (salesFormPresetCustomerId) {
      // Clear forms
      setEditingInvoiceId(null);
      setSelectedCustomerId(salesFormPresetCustomerId);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
      setAmountPaid(0);
      setNotes('');
      // Open modal
      setIsCreatingInvoice(true);
      // Consume preset
      setSalesFormPresetCustomerId(null);
    }
  }, [salesFormPresetCustomerId, setSalesFormPresetCustomerId, setIsCreatingInvoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.querySelector('.print-invoice-layout');
    if (!element) {
      showToast('Could not find invoice layout element.', 'error');
      return;
    }

    showToast('Compiling high-definition PDF document...', 'info');

    const generatePDF = (html2pdfLib: any) => {
      // Temporarily clear mobile zoom styling to ensure html2pdf captures native A5/Thermal dimensions
      const htmlElement = element as HTMLElement;
      const originalZoom = htmlElement.style.zoom;
      const originalTransform = htmlElement.style.transform;
      
      htmlElement.style.setProperty('zoom', '1', 'important');
      htmlElement.style.setProperty('transform', 'none', 'important');

      const opt = {
        margin:       printTemplate === 'A5' ? 0 : 2,
        filename:     `${selectedInvoice?.invoiceNumber || 'invoice'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { 
          unit: 'mm', 
          format: printTemplate === 'A5' ? 'a5' : [80, 200], 
          orientation: 'portrait' 
        }
      };
      
      html2pdfLib().from(element).set(opt).save().then(() => {
        showToast('PDF downloaded successfully!');
        htmlElement.style.zoom = originalZoom;
        htmlElement.style.transform = originalTransform;
      }).catch((err: any) => {
        console.error(err);
        showToast('Error exporting PDF document.', 'error');
        htmlElement.style.zoom = originalZoom;
        htmlElement.style.transform = originalTransform;
      });
    };

    const globalWindow = window as any;
    if (globalWindow.html2pdf) {
      generatePDF(globalWindow.html2pdf);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (globalWindow.html2pdf) {
          generatePDF(globalWindow.html2pdf);
        }
      };
      script.onerror = () => {
        showToast('Failed to load PDF engine from CDN.', 'error');
      };
      document.body.appendChild(script);
    }
  };

  const handleWhatsAppShare = () => {
    const invoice = invoices.find((inv) => inv.id === currentInvoiceId);
    if (!invoice) return;
    const customerDetail = customers.find((c) => c.id === invoice.customerId);
    const element = document.querySelector('.print-invoice-layout');
    if (!element) {
      showToast('Could not find invoice layout element.', 'error');
      return;
    }

    showToast('Compiling PDF invoice for sharing...', 'info');

    const sharePDF = (html2pdfLib: any) => {
      // Temporarily clear mobile zoom styling to ensure html2pdf captures native A5/Thermal dimensions
      const htmlElement = element as HTMLElement;
      const originalZoom = htmlElement.style.zoom;
      const originalTransform = htmlElement.style.transform;
      
      htmlElement.style.setProperty('zoom', '1', 'important');
      htmlElement.style.setProperty('transform', 'none', 'important');

      const opt = {
        margin:       printTemplate === 'A5' ? 0 : 2,
        filename:     `${invoice.invoiceNumber}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { 
          unit: 'mm', 
          format: printTemplate === 'A5' ? 'a5' : [80, 200], 
          orientation: 'portrait' 
        }
      };
      
      html2pdfLib().from(element).set(opt).outputPdf('blob').then((pdfBlob: Blob) => {
        htmlElement.style.zoom = originalZoom;
        htmlElement.style.transform = originalTransform;
        const pdfFile = new File([pdfBlob], `${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });
        
        // Mobile share drawer check
        const nav = navigator as any;
        if (nav.canShare && nav.canShare({ files: [pdfFile] })) {
          nav.share({
            files: [pdfFile],
            title: `Invoice ${invoice.invoiceNumber}`,
            text: `Invoice from ${settings.businessName}`
          }).then(() => {
            showToast('Invoice shared successfully!');
          }).catch((err: any) => {
            console.log('Share canceled', err);
          });
        } else {
          // Desktop Fallback: Trigger file download + redirect to WhatsApp Web
          const downloadUrl = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${invoice.invoiceNumber}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);

          const message = `Hello ${invoice.customerName},

Your invoice *${invoice.invoiceNumber}* from *${settings.businessName}* has been generated.

*Summary of Transactions:*
---------------------------------------
*Total Amount:* ${formatINR(invoice.grandTotal)}
*Amount Collected:* ${formatINR(invoice.amountPaid)}
*Balance Dues:* ${formatINR(invoice.balanceDue)}
---------------------------------------

We have downloaded the PDF invoice to your device. Please attach it in the chat.`;

          const encoded = encodeURIComponent(message);
          const phoneNum = customerDetail?.phone ? customerDetail.phone.replace(/[^0-9]/g, '') : '';
          const targetPhone = phoneNum.length === 10 ? `91${phoneNum}` : phoneNum;
          
          const url = targetPhone 
            ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`
            : `https://api.whatsapp.com/send?text=${encoded}`;
            
          window.open(url, '_blank');
          showToast('PDF downloaded! Redirecting to WhatsApp...', 'info');
        }
      }).catch((err: any) => {
        console.error(err);
        showToast('Error generating PDF for WhatsApp sharing.', 'error');
        htmlElement.style.zoom = originalZoom;
        htmlElement.style.transform = originalTransform;
      });
    };

    const globalWindow = window as any;
    if (globalWindow.html2pdf) {
      sharePDF(globalWindow.html2pdf);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (globalWindow.html2pdf) {
          sharePDF(globalWindow.html2pdf);
        }
      };
      script.onerror = () => {
        showToast('Failed to load PDF engine from CDN.', 'error');
      };
      document.body.appendChild(script);
    }
  };

  // --- Calculations ---

  const calculateRowTotal = (productId: string, quantity: number, price: number, discountPercent: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return { subtotal: 0, discountAmount: 0, gstAmount: 0, total: 0, gstRate: 0 };

    const rawSubtotal = price * quantity;
    const discountAmount = rawSubtotal * (discountPercent / 100);
    const subtotal = rawSubtotal - discountAmount;
    
    const gstRate = product.gstRate;
    const gstAmount = subtotal * (gstRate / 100);
    const total = subtotal + gstAmount;

    return { subtotal, discountAmount, gstAmount, total, gstRate };
  };

  const getInvoiceTotals = () => {
    return items.reduce(
      (acc, item) => {
        const calcs = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
        acc.subtotal += calcs.subtotal;
        acc.discountTotal += calcs.discountAmount;
        acc.gstTotal += calcs.gstAmount;
        acc.grandTotal += calcs.total;
        return acc;
      },
      { subtotal: 0, discountTotal: 0, gstTotal: 0, grandTotal: 0 }
    );
  };

  const totals = getInvoiceTotals();
  const balanceDue = Math.max(0, totals.grandTotal - amountPaid);

  // --- Row Management ---

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, price: 0, discount: 0 }]);
  };

  const handleUpdateItemRow = (index: number, field: keyof InvoiceItemLocal, value: string | number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };

        // Auto-fill price from catalog if product changes
        if (field === 'productId') {
          const product = products.find((p) => p.id === value);
          updated.price = product ? product.sellingPrice : 0;
          updated.discount = 0;
        }
        return updated;
      })
    );
  };

  const handleRemoveItemRow = (index: number) => {
    // If only 1 row remains, don't delete but reset it to keep the fields visible
    if (items.length === 1) {
      setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
      showToast('Reset product row instead of deleting to keep inputs visible.', 'info');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // --- Save / Edit Invoice Handlers ---

  const handleStartNewInvoice = () => {
    setEditingInvoiceId(null);
    setSelectedCustomerId('');
    setInvoiceDate('2026-07-01');
    setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
    setAmountPaid(0);
    setPaymentMethod('UPI');
    setNotes('');
    setIsCreatingInvoice(true);
  };

  const handleStartEditInvoice = (inv: Invoice) => {
    setEditingInvoiceId(inv.id || inv.invoiceNumber);
    setSelectedCustomerId(inv.customerId);
    setInvoiceDate(inv.date);
    setItems(
      inv.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
      }))
    );
    setAmountPaid(inv.amountPaid);
    setPaymentMethod(inv.paymentMethod || 'UPI');
    setNotes(inv.notes || '');
    setIsCreatingInvoice(true);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      showToast('Please select a customer to generate billing invoice.', 'error');
      return;
    }
    if (items.length === 0 || !items[0].productId) {
      showToast('Please select at least one product line item to bill.', 'error');
      return;
    }

    // Double check item selections
    const hasEmptyItem = items.some((item) => !item.productId || item.quantity <= 0 || item.price < 0);
    if (hasEmptyItem) {
      showToast('Please ensure all product rows have valid selections, prices, and quantities.', 'error');
      return;
    }

    // Verify stock availability
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        // If we are editing, add back the quantity of this product from the original invoice
        const originalItem = editingInvoiceId
          ? invoices.find((inv) => inv.id === editingInvoiceId)?.items.find((i) => i.productId === item.productId)
          : null;
        const originalQty = originalItem ? originalItem.quantity : 0;
        const availableStock = product.stock + originalQty;

        if (availableStock < item.quantity) {
          showToast(`Insufficient stock for ${product.name}! Available: ${availableStock}`, 'error');
          return;
        }
      }
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return;

    const invoiceItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const calcs = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        gstRate: calcs.gstRate,
        gstAmount: calcs.gstAmount,
        subtotal: calcs.subtotal,
        total: calcs.total,
      };
    });

    const paymentStatus =
      amountPaid >= totals.grandTotal
        ? 'Paid'
        : amountPaid > 0
        ? 'Partial'
        : 'Unpaid';

    if (editingInvoiceId) {
      const originalInvoice = invoices.find((i) => i.id === editingInvoiceId);
      if (!originalInvoice) return;

      editInvoice({
        ...originalInvoice,
        date: invoiceDate,
        customerId: selectedCustomerId,
        customerName: customer.name,
        items: invoiceItems,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        gstTotal: totals.gstTotal,
        grandTotal: totals.grandTotal,
        amountPaid,
        balanceDue,
        paymentStatus,
        paymentMethod: amountPaid > 0 ? paymentMethod : '',
        notes: notes.trim() || undefined,
      });

      showToast(`Invoice ${originalInvoice.invoiceNumber} updated successfully!`);

      // Reset states
      setEditingInvoiceId(null);
      setSelectedCustomerId('');
      setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
      setAmountPaid(0);
      setNotes('');
      setIsCreatingInvoice(false);
      setViewInvoice(originalInvoice.id);
    } else {
      const newInvoice = addInvoice({
        date: invoiceDate,
        customerId: selectedCustomerId,
        customerName: customer.name,
        items: invoiceItems,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        gstTotal: totals.gstTotal,
        grandTotal: totals.grandTotal,
        amountPaid,
        balanceDue,
        paymentStatus,
        paymentMethod: amountPaid > 0 ? paymentMethod : '',
        notes: notes.trim() || undefined,
      });

      showToast(`Invoice created successfully for ${customer.name}!`);

      // Reset states and redirect to details print view
      setSelectedCustomerId('');
      setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
      setAmountPaid(0);
      setNotes('');
      setIsCreatingInvoice(false);
      setViewInvoice(newInvoice.id);
    }
  };

  const handleDeleteInvoice = (id: string, invoiceNo: string) => {
    setDeletingInvoice({ id, invoiceNumber: invoiceNo });
  };

  // --- Filtering & Sorting ---

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || inv.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === 'amount-desc') {
      return b.grandTotal - a.grandTotal;
    }
    if (sortBy === 'amount-asc') {
      return a.grandTotal - b.grandTotal;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);
  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedInvoice = invoices.find((inv) => inv.id === currentInvoiceId || inv.invoiceNumber === currentInvoiceId);

  // --- RENDERING ---


  // --- RENDERING ---

  // 1. DETAILS / PRINT VIEW (WITH TEMPLATE TOGGLING)
  if (selectedInvoice) {
    const customerDetail = customers.find((c) => c.id === selectedInvoice.customerId);
    const isInterState = customerDetail && customerDetail.state && settings.state && customerDetail.state !== settings.state;
    const invoiceTotals = {
      subtotal: selectedInvoice.subtotal,
      discountTotal: selectedInvoice.discountTotal,
      gstTotal: selectedInvoice.gstTotal,
      grandTotal: selectedInvoice.grandTotal,
      amountPaid: selectedInvoice.amountPaid,
      balanceDue: selectedInvoice.balanceDue,
    };

    return (
      <div style={{ animation: "fadeIn 0.2s ease-out" }}>
        {/* Navigation Action header */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px", backgroundColor: "var(--bg-card)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <button className="btn btn-secondary" onClick={() => setViewInvoice(null)}>
            <ArrowLeft size={16} /> Back to Invoices
          </button>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Print Template:</span>
            <select className="filter-select" style={{ padding: "6px 12px" }} value={printTemplate} onChange={(e) => setPrintTemplate(e.target.value as "A5" | "Thermal")}>
              <option value="A5">Standard A5 Bill Book</option>
              <option value="Thermal">Thermal 3-Inch roll POS</option>
            </select>
            <button className="btn btn-secondary" onClick={handleDownload} title="Export invoice as PDF">
              <Download size={16} /> Save as PDF
            </button>
            <button className="btn btn-secondary" style={{ borderColor: "#25D366", color: "#25D366" }} onClick={handleWhatsAppShare} title="Share invoice details on WhatsApp">
              <Share2 size={16} /> Share on WhatsApp
            </button>
            <button className="btn btn-primary" onClick={handlePrint} title="Print paper voucher">
              <Printer size={16} /> Print Receipt
            </button>
          </div>
        </div>

        {printTemplate === "A5" ? (
          <div className="invoice-mockup-wrapper">
            <div className="print-invoice-layout invoice-print-container">
              {/* Elegant leafy branch corner watermark */}
              <div style={{ position: "absolute", top: "8px", right: "8px", opacity: 0.08, pointerEvents: "none", zIndex: 1 }}>
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="#4E6C50" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 90 Q 50 50 90 10" />
                  <path d="M90 10 C80 20 65 25 60 15 C55 5 70 0 90 10" fill="#4E6C50" />
                  <path d="M70 30 C60 40 45 45 40 35 C35 25 50 20 70 30" fill="#4E6C50" />
                  <path d="M50 50 C40 60 25 65 20 55 C15 45 30 40 50 50" fill="#4E6C50" />
                </svg>
              </div>

              {/* Header: Logo, Company Info, Invoice Title */}
              <div className="invoice-header-bar">
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div className="invoice-logo-pill">
                  <Store size={22} className="invoice-logo-icon" />
                  <span style={{ fontSize: "9px", fontWeight: 900 }}>AGRI</span>
                </div>
                <div>
                  <h2 className="invoice-company-name">AgriBiz Dealers</h2>
                  <p className="invoice-company-sub">Main Market Road, Agri Industrial Zone, Ganganagar</p>
                  <p className="invoice-company-sub">Email: support@agribiz.com | Mob: +91 98765 43210</p>
                  <p className="invoice-company-gst">GSTIN: 08AAAAA1111A1Z1</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <h1 className="invoice-main-title">INVOICE</h1>
                <h3 className="invoice-number-text">#{selectedInvoice.invoiceNumber}</h3>
                <p className="invoice-date-text">Date: {formatDate(selectedInvoice.date)}</p>
              </div>
            </div>

            {/* Billed To and Payment details */}
            <div className="invoice-billing-details">
              <div>
                <h4 className="invoice-detail-header">Billing to:</h4>
                {customerDetail ? (
                  <>
                    <h3 className="invoice-customer-name">{customerDetail.name}</h3>
                    <p className="invoice-customer-sub">{customerDetail.address || "Address: N/A"}</p>
                    <p className="invoice-customer-sub">Phone: {customerDetail.phone}</p>
                    {customerDetail.gstin && (
                      <p className="invoice-customer-gst">GSTIN: {customerDetail.gstin}</p>
                    )}
                  </>
                ) : (
                  <h3 className="invoice-customer-name">Walk-in Customer</h3>
                )}
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-end" }}>
                <h4 className="invoice-detail-header">Payment Info:</h4>
                <span className={`invoice-payment-badge ${selectedInvoice.paymentStatus.toLowerCase()}`}>
                  {selectedInvoice.paymentStatus.toUpperCase()}
                </span>
                {selectedInvoice.paymentMethod && (
                  <p className="invoice-customer-sub" style={{ marginTop: "6px", fontWeight: 600 }}>
                    Method: {selectedInvoice.paymentMethod}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>Sr</th>
                  <th style={{ textAlign: "left" }}>Product / Description</th>
                  <th style={{ width: "80px", textAlign: "center" }}>GST</th>
                  <th style={{ width: "90px", textAlign: "right" }}>Price (₹)</th>
                  <th style={{ width: "60px", textAlign: "center" }}>Qty</th>
                  <th style={{ width: "70px", textAlign: "right" }}>Disc (%)</th>
                  <th style={{ width: "100px", textAlign: "right" }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.productName}</td>
                    <td style={{ textAlign: "center" }}>{item.gstRate}%</td>
                    <td style={{ textAlign: "right" }}>{item.price.toFixed(2)}</td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>{item.discount}%</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bottom summary and remarks */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px" }}>
              <div style={{ flex: 1, maxWidth: "55%" }}>
                <h5 className="invoice-terms-title">TERMS & CONDITIONS:</h5>
                <p className="invoice-terms-text">
                  {selectedInvoice.notes || "Goods once sold are subject to standard industrial dealer warranties."}
                  <br />
                  1. Warranty is managed directly by equipment manufacturer.
                  <br />
                  2. Delayed payment will attract interest @1.5% per month.
                </p>
                <div style={{ marginTop: "16px" }}>
                  <h5 className="invoice-terms-title" style={{ marginBottom: "4px" }}>PAYMENT DETAILS:</h5>
                  <p className="invoice-terms-text">
                    Bank: HDFC Bank | A/c No: 501004455667788
                    <br />
                    IFSC: HDFC0001234 | Branch: Agri Market
                  </p>
                </div>
              </div>
              <div style={{ minWidth: "280px" }}>
                <table className="invoice-summary-table">
                  <tbody>
                    <tr>
                      <td>Subtotal</td>
                      <td>{formatINR(invoiceTotals.subtotal)}</td>
                    </tr>
                    {invoiceTotals.discountTotal > 0 && (
                      <tr className="discount-row">
                        <td>Discount (-)</td>
                        <td>{formatINR(invoiceTotals.discountTotal)}</td>
                      </tr>
                    )}
                    {isInterState ? (
                      <tr>
                        <td>IGST ({selectedInvoice.items[0]?.gstRate || 18}%)</td>
                        <td>{formatINR(invoiceTotals.gstTotal)}</td>
                      </tr>
                    ) : (
                      <>
                        <tr>
                          <td>CGST ({(selectedInvoice.items[0]?.gstRate || 18) / 2}%)</td>
                          <td>{formatINR(invoiceTotals.gstTotal / 2)}</td>
                        </tr>
                        <tr>
                          <td>SGST ({(selectedInvoice.items[0]?.gstRate || 18) / 2}%)</td>
                          <td>{formatINR(invoiceTotals.gstTotal / 2)}</td>
                        </tr>
                      </>
                    )}
                    <tr className="grand-total-row">
                      <td>TOTAL</td>
                      <td>{formatINR(invoiceTotals.grandTotal)}</td>
                    </tr>
                    <tr className="collected-row">
                      <td>Collected</td>
                      <td>{formatINR(invoiceTotals.amountPaid)}</td>
                    </tr>
                    {invoiceTotals.balanceDue > 0 && (
                      <tr className="due-row">
                        <td>Balance Due</td>
                        <td>{formatINR(invoiceTotals.balanceDue)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SVG Illustration and Signature */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "20px" }}>
              <div style={{ flex: 1, maxWidth: "70%" }}>
                {/* Custom Inline SVG Illustration */}
                <svg viewBox="0 0 500 110" width="100%" height="60" style={{ display: "block" }}>
                  {/* Ground line */}
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#EAE3D2" strokeWidth="2.5" />
                  
                  {/* Left Side: Sun & Cloud */}
                  <circle cx="50" cy="20" r="7" fill="#F2C94C" opacity="0.35" />
                  <path d="M 45 20 Q 50 14 55 20" stroke="#F2C94C" strokeWidth="1" fill="none" opacity="0.4" />
                  <path d="M 38 18 Q 42 12 47 18" stroke="#F2C94C" strokeWidth="1" fill="none" opacity="0.4" />
                  <path d="M 80 18 C 75 18, 72 14, 78 10 C 84 6, 92 10, 92 14 C 98 14, 98 18, 92 18 Z" fill="#EAE3D2" opacity="0.3" />

                  {/* Left Side: Tractor & Plow */}
                  {/* Tractor Body */}
                  <rect x="110" y="65" width="38" height="22" fill="#4E6C50" rx="3" />
                  <rect x="120" y="52" width="24" height="14" fill="none" stroke="#4E6C50" strokeWidth="2" rx="1.5" />
                  <rect x="122" y="54" width="20" height="10" fill="#FCFAF6" rx="1" />
                  {/* Engine front */}
                  <rect x="148" y="70" width="20" height="17" fill="#4E6C50" />
                  <line x1="168" y1="72" x2="168" y2="85" stroke="#EAE3D2" strokeWidth="1.5" />
                  {/* Exhaust pipe */}
                  <line x1="154" y1="70" x2="154" y2="48" stroke="#2F3E33" strokeWidth="1.5" />
                  {/* Smoke puffs */}
                  <circle cx="154" cy="42" r="2.5" fill="#EAE3D2" opacity="0.4" />
                  <circle cx="157" cy="36" r="3.5" fill="#EAE3D2" opacity="0.25" />
                  
                  {/* Wheels */}
                  <circle cx="120" cy="86" r="11" fill="#2F3E33" />
                  <circle cx="120" cy="86" r="4.5" fill="#EAE3D2" />
                  
                  <circle cx="158" cy="89" r="8" fill="#2F3E33" />
                  <circle cx="158" cy="89" r="3" fill="#EAE3D2" />

                  {/* Plow attachment */}
                  <path d="M 110 78 L 94 78 L 90 94 M 94 94 L 98 78" fill="none" stroke="#2F3E33" strokeWidth="1.5" />
                  <line x1="90" y1="94" x2="82" y2="99" stroke="#2F3E33" strokeWidth="1.5" />
                  <line x1="95" y1="94" x2="87" y2="99" stroke="#2F3E33" strokeWidth="1.5" />

                  {/* Middle: Crops & Bags */}
                  {/* Tall Corn Stalk */}
                  <path d="M 200 100 Q 198 60 202 45" fill="none" stroke="#27AE60" strokeWidth="2.5" />
                  <path d="M 200 80 Q 185 75 190 70" fill="none" stroke="#27AE60" strokeWidth="1.5" />
                  <path d="M 201 65 Q 215 60 210 55" fill="none" stroke="#27AE60" strokeWidth="1.5" />
                  <ellipse cx="204" cy="72" rx="3" ry="6" fill="#F2C94C" stroke="#27AE60" strokeWidth="1" /> {/* Corn cob */}
                  <ellipse cx="197" cy="57" rx="3" ry="6" fill="#F2C94C" stroke="#27AE60" strokeWidth="1" />

                  {/* Stack of Bags */}
                  <rect x="225" y="76" width="24" height="24" fill="#EAE3D2" stroke="#4E6C50" strokeWidth="1.5" rx="3" />
                  <line x1="225" y1="88" x2="249" y2="88" stroke="#4E6C50" strokeWidth="1.5" />
                  <text x="229" y="85" fill="#2F3E33" fontSize="6" fontWeight="900">SEED</text>
                  
                  <rect x="242" y="81" width="24" height="19" fill="#FCFAF6" stroke="#4E6C50" strokeWidth="1.5" rx="3" />
                  <line x1="242" y1="91" x2="266" y2="91" stroke="#4E6C50" strokeWidth="1.5" />
                  <text x="246" y="89" fill="#2F3E33" fontSize="5" fontWeight="900">FERT</text>

                  {/* Pumpkin */}
                  <path d="M 282 100 C 275 100, 268 93, 268 83 C 268 72, 278 68, 285 68 C 292 68, 302 72, 302 83 C 302 93, 295 100, 288 100 Z" fill="#F2994A" />
                  <path d="M 285 100 C 280 100, 276 93, 276 83 C 276 72, 281 70, 285 70 C 289 70, 294 72, 294 83 C 294 93, 290 100, 285 100 Z" fill="#F2C94C" />
                  <path d="M 285 68 C 285 63, 288 60, 291 60" stroke="#27AE60" strokeWidth="2" fill="none" />

                  {/* Right Side: Plant Shop & Fence */}
                  {/* Picket Fence */}
                  <rect x="320" y="70" width="4" height="30" fill="#EAE3D2" rx="0.5" />
                  <rect x="328" y="70" width="4" height="30" fill="#EAE3D2" rx="0.5" />
                  <rect x="336" y="70" width="4" height="30" fill="#EAE3D2" rx="0.5" />
                  <line x1="316" y1="78" x2="340" y2="78" stroke="#EAE3D2" strokeWidth="1.5" />
                  <line x1="316" y1="90" x2="340" y2="90" stroke="#EAE3D2" strokeWidth="1.5" />

                  {/* Plant Shop storefront */}
                  <rect x="355" y="40" width="115" height="60" fill="#FCFAF6" stroke="#4E6C50" strokeWidth="2.5" />
                  <rect x="345" y="30" width="135" height="10" fill="#BE3144" rx="2" />
                  {/* Roof stripes */}
                  <line x1="360" y1="30" x2="360" y2="40" stroke="#4E6C50" strokeWidth="1.5" />
                  <line x1="385" y1="30" x2="385" y2="40" stroke="#4E6C50" strokeWidth="1.5" />
                  <line x1="410" y1="30" x2="410" y2="40" stroke="#4E6C50" strokeWidth="1.5" />
                  <line x1="435" y1="30" x2="435" y2="40" stroke="#4E6C50" strokeWidth="1.5" />
                  <line x1="460" y1="30" x2="460" y2="40" stroke="#4E6C50" strokeWidth="1.5" />
                  
                  {/* Window with OPEN sign */}
                  <rect x="370" y="55" width="28" height="20" fill="#4E6C50" opacity="0.1" />
                  <rect x="370" y="55" width="28" height="20" fill="none" stroke="#4E6C50" strokeWidth="1.5" />
                  <text x="374" y="68" fill="#BE3144" fontSize="8" fontWeight="900">OPEN</text>
                  
                  {/* Door */}
                  <rect x="415" y="58" width="24" height="42" fill="#EAE3D2" stroke="#4E6C50" strokeWidth="1.5" />
                  <circle cx="421" cy="79" r="1.5" fill="#2F3E33" />
                  
                  {/* Street Lamp */}
                  <line x1="478" y1="100" x2="478" y2="40" stroke="#2F3E33" strokeWidth="2.5" />
                  <circle cx="478" cy="35" r="7" fill="#F2C94C" />
                  <path d="M 474 35 Q 478 31 482 35" stroke="#2F3E33" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <div style={{ textAlign: "center", minWidth: "150px" }}>
                <div style={{ height: "45px" }}></div>
                <p style={{ borderTop: "1.5px solid #EAE3D2", paddingTop: "6px", fontSize: "12px", fontWeight: 700, color: "#4E6C50" }}>
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="print-invoice-layout thermal">
              <div style={{ textAlign: "center", marginBottom: "12px" }}><h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>AGRIBIZ DEALERS</h3><p style={{ margin: "2px 0 0 0", fontSize: "11px" }}>Industrial Zone, Ganganagar</p><p style={{ margin: 0, fontSize: "11px" }}>Mob: +91 98765 43210</p><p style={{ margin: "4px 0 0 0", fontSize: "11px", fontWeight: "bold" }}>GSTIN: 08AAAAA1111A1Z1</p></div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "2px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Bill No: <strong>{selectedInvoice.invoiceNumber}</strong></span><span>Date: {formatDate(selectedInvoice.date)}</span></div><div>Customer: <strong>{customerDetail?.name || "Walk-in"}</strong></div>{customerDetail?.phone && <div>Phone: {customerDetail.phone}</div>}</div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ fontSize: "11px" }}><div style={{ fontWeight: "bold", display: "grid", gridTemplateColumns: "3fr 1fr 1fr", paddingBottom: "4px" }}><span>ITEM</span><span style={{ textAlign: "center" }}>QTY</span><span style={{ textAlign: "right" }}>AMT(₹)</span></div><div style={{ borderTop: "1px solid #eee", margin: "4px 0" }}></div>{selectedInvoice.items.map((item, index) => (<div key={index} style={{ marginBottom: "6px", display: "grid", gridTemplateColumns: "3fr 1fr 1fr" }}><div><span style={{ fontWeight: "bold" }}>{item.productName}</span><div style={{ fontSize: "10px", color: "#555" }}>Rate: ₹{item.price} | GST: {item.gstRate}%</div></div><span style={{ textAlign: "center", fontWeight: "bold" }}>{item.quantity}</span><span style={{ textAlign: "right", fontWeight: "bold" }}>{item.total.toFixed(2)}</span></div>))}</div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "3px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Total Taxable</span><span>₹{invoiceTotals.subtotal.toFixed(2)}</span></div>{invoiceTotals.discountTotal > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Discount (-)</span><span>₹{invoiceTotals.discountTotal.toFixed(2)}</span></div>}{isInterState ? <div style={{ display: "flex", justifyContent: "space-between" }}><span>IGST ({(selectedInvoice.items[0]?.gstRate || 18)}%)</span><span>₹{invoiceTotals.gstTotal.toFixed(2)}</span></div> : <><div style={{ display: "flex", justifyContent: "space-between" }}><span>CGST ({(selectedInvoice.items[0]?.gstRate || 18) / 2}%)</span><span>₹{(invoiceTotals.gstTotal / 2).toFixed(2)}</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>SGST ({(selectedInvoice.items[0]?.gstRate || 18) / 2}%)</span><span>₹{(invoiceTotals.gstTotal / 2).toFixed(2)}</span></div></>}<div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "4px 0" }}><span>GRAND TOTAL</span><span>₹{invoiceTotals.grandTotal.toFixed(2)}</span></div><div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "green" }}><span>CASH COLLECTED</span><span>₹{invoiceTotals.amountPaid.toFixed(2)}</span></div>{invoiceTotals.balanceDue > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "red" }}><span>BALANCE DUE</span><span>₹{invoiceTotals.balanceDue.toFixed(2)}</span></div>}</div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ textAlign: "center", fontSize: "10px", display: "flex", flexDirection: "column", gap: "2px" }}><div>THANK YOU! VISIT AGAIN.</div>{selectedInvoice.notes && <div style={{ fontStyle: "italic" }}>"{selectedInvoice.notes}"</div>}<div style={{ fontSize: "8px", color: "#777", marginTop: "4px" }}>Powered by AgriBiz POS software</div></div>
            </div>
          </div>
        )}
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
          <button className="btn btn-secondary" style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)" }} onClick={() => handleDeleteInvoice(selectedInvoice.id || selectedInvoice.invoiceNumber, selectedInvoice.invoiceNumber)}>
            <Trash2 size={16} /> Delete & Reset Stock
          </button>
        </div>
      </div>
    );
  }

  // 2. FORM VIEW (INVOICE CREATOR)
  if (isCreatingInvoice) {
    const originalInvoice = editingInvoiceId ? invoices.find((i) => i.id === editingInvoiceId) : null;
    const invoiceNumber = originalInvoice ? originalInvoice.invoiceNumber : `INV-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(4, "0")}`;
    const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
    const isCreatorInterState = activeCustomer && activeCustomer.state && settings.state && activeCustomer.state !== settings.state;
    const currentGstRate = (items[0]?.productId ? products.find((p) => p.id === items[0].productId)?.gstRate : 18) ?? 18;

    return (
      <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
        {/* ── Gradient Banner Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 60%, #34d399 100%)',
        borderRadius: '16px',
        padding: '20px 28px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(16,185,129,0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative circle */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button type="button" onClick={() => {
            setIsCreatingInvoice(false);
            setEditingInvoiceId(null);
            setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
          }} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
            borderRadius: '10px',
            padding: '8px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            backdropFilter: 'blur(8px)',
            transition: 'background 0.2s',
          }}>
            <ArrowLeft size={15} /> {editingInvoiceId ? 'Back' : 'Cancel'}
          </button>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {editingInvoiceId ? 'Edit Invoice' : 'New Invoice'}
            </div>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: 800, lineHeight: 1.2 }}>
              {editingInvoiceId ? 'Update Billing Record' : 'Create Sales Invoice'}
            </div>
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '10px 18px',
          textAlign: 'right',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Voucher No</div>
          <div style={{ color: '#fff', fontSize: '17px', fontWeight: 800, letterSpacing: '0.5px' }}>{invoiceNumber}</div>
        </div>
      </div>

      <form onSubmit={handleSaveInvoice}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>

          {/* ── Step 1: Customer & Date ── */}
          <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '14px', fontWeight: 800, flexShrink: 0,
              }}>1</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Customer & Date</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Select customer and billing date</div>
              </div>
            </div>

            <div className="form-row-1-auto-auto" style={{ gap: '12px', alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Customer *</label>
                <select className="form-control" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required>
                  <option value="">— Select Customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} — Bal: {formatINR(c.outstanding)}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCustomerModalOpen(true)} style={{ whiteSpace: 'nowrap', height: '42px' }}>
                <Plus size={15} /> New Customer
              </button>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Billing Date *</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: '160px' }}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Active customer chip */}
            {activeCustomer && (
              <div style={{
                marginTop: '14px',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, transparent), color-mix(in srgb, var(--primary) 3%, transparent))',
                border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
              }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
                  {activeCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{activeCustomer.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{activeCustomer.phone} {activeCustomer.address ? `· ${activeCustomer.address}` : ''}</div>
                </div>
                {activeCustomer.outstanding > 0 && (
                  <div style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}>
                    ⚠ Due: {formatINR(activeCustomer.outstanding)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Step 2: Products Table ── */}
          <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '14px', fontWeight: 800,
                }}>2</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Billed Products</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{items.length} line item{items.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <button type="button" className="btn btn-secondary" onClick={handleAddItemRow} style={{ fontSize: '13px' }}>
                <Plus size={14} /> Add Row
              </button>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-app)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '220px' }}>Product</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '90px' }}>Stock</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '120px' }}>Unit Price (₹)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '80px' }}>Qty</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '80px' }}>Disc %</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '110px' }}>Net Total</th>
                    <th style={{ padding: '10px 12px', width: '44px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const product = products.find((p) => p.id === item.productId);
                    const calculations = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
                    const isEven = index % 2 === 0;
                    return (
                      <tr key={index} style={{ background: isEven ? 'transparent' : 'color-mix(in srgb, var(--bg-app) 60%, transparent)', borderTop: '1px solid var(--border-color)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <select className="form-control" style={{ width: '100%', fontSize: '13px' }} value={item.productId} onChange={(e) => handleUpdateItemRow(index, 'productId', e.target.value)} required>
                            <option value="">— Choose Product —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                {p.name} [{p.category}]{p.stock <= 0 ? ' (Out of Stock)' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>
                          {product ? (
                            <span style={{
                              padding: '3px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                              background: product.stock <= product.minStock ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                              color: product.stock <= product.minStock ? 'var(--color-danger)' : 'var(--color-success-dark)',
                            }}>
                              {product.stock}
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="number" className="form-control" style={{ textAlign: 'right', fontSize: '13px' }} placeholder="0.00" min="0" step="any" value={item.price || ''} onChange={(e) => handleUpdateItemRow(index, 'price', parseFloat(e.target.value) || 0)} required />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input type="number" className="form-control" style={{ textAlign: 'center', fontSize: '13px' }} placeholder="1" min="1" value={item.quantity || ''} onChange={(e) => handleUpdateItemRow(index, 'quantity', parseInt(e.target.value) || 0)} required />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ position: 'relative' }}>
                            <Percent size={11} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <input type="number" className="form-control" style={{ textAlign: 'center', paddingRight: '22px', fontSize: '13px' }} placeholder="0" min="0" max="100" value={item.discount || ''} onChange={(e) => handleUpdateItemRow(index, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} />
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontSize: '14px', color: 'var(--primary-dark)', whiteSpace: 'nowrap' }}>
                          {formatINR(calculations.total).replace('₹', '')}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button type="button" onClick={() => handleRemoveItemRow(index)} title="Remove row" style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', borderRadius: '6px', padding: '4px 6px',
                            transition: 'color 0.2s, background 0.2s',
                          }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Step 3: Payment + Summary ── */}
          <div className="invoice-creator-container" style={{ gap: '20px', alignItems: 'start' }}>

            {/* Payment Details */}
            <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '14px', fontWeight: 800,
                }}>3</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Payment & Notes</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Record collection and remarks</div>
                </div>
              </div>

              <div className={amountPaid > 0 ? "form-row" : ""} style={{ gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Amount Collected (₹)</label>
                  <input type="number" className="form-control" placeholder="0.00" min="0" max={totals.grandTotal} value={amountPaid || ''} onChange={(e) => setAmountPaid(Math.min(totals.grandTotal, Math.max(0, parseFloat(e.target.value) || 0)))} />
                </div>
                {amountPaid > 0 && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Payment Method *</label>
                    <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Billing Remarks / Notes</label>
                <textarea className="form-control" placeholder="Remarks printed on customer invoice..." rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            </div>

            {/* Glassy Billing Summary */}
            <div style={{
              borderRadius: '16px',
              background: 'linear-gradient(145deg, var(--bg-card) 0%, color-mix(in srgb, var(--bg-card) 90%, var(--primary) 10%) 100%)',
              border: '1.5px solid color-mix(in srgb, var(--primary) 20%, var(--border-color))',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(16,185,129,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                Billing Summary
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{formatINR(totals.subtotal)}</span>
              </div>

              {totals.discountTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-success-dark)' }}>
                  <span>Discount (−)</span>
                  <span style={{ fontWeight: 600 }}>−{formatINR(totals.discountTotal)}</span>
                </div>
              )}

              {isCreatorInterState ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>IGST ({currentGstRate}%)</span>
                  <span style={{ fontWeight: 600 }}>{formatINR(totals.gstTotal)}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CGST ({currentGstRate / 2}%)</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(totals.gstTotal / 2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>SGST ({currentGstRate / 2}%)</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(totals.gstTotal / 2)}</span>
                  </div>
                </>
              )}

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800 }}>
                <span style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                <span style={{ color: 'var(--primary-dark)' }}>{formatINR(totals.grandTotal)}</span>
              </div>

              {amountPaid > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Collected</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success-dark)' }}>{formatINR(amountPaid)}</span>
                </div>
              )}

              <div style={{
                display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700,
                padding: '10px 14px', borderRadius: '10px', marginTop: '4px',
                background: balanceDue > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                color: balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)',
                border: `1px solid ${balanceDue > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
              }}>
                <span>{balanceDue > 0 ? 'Balance Due' : '✓ Fully Paid'}</span>
                <span>{formatINR(balanceDue)}</span>
              </div>

              {/* Action buttons inside summary card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                }} disabled={items.length === 0 || !items[0].productId}>
                  {editingInvoiceId ? '✓ Update Invoice' : '✓ Save & Print Invoice'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setIsCreatingInvoice(false);
                  setEditingInvoiceId(null);
                  setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
                }} style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '10px' }}>
                  Discard Draft
                </button>
              </div>
            </div>

          </div>
        </div>
      </form>

      <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSaveCallback={(c) => setSelectedCustomerId(c.id)} />
    </div>
    );
  }


  // 3. INVOICES TABLE LIST VIEW (DEFAULT)
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Sales KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Total Sales</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800 }}>
              {formatINR(totalSales)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Total billing revenue
            </span>
          </div>
        </div>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Total Collected</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-success-dark)' }}>
              {formatINR(totalCollected)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Cash and digital collection
            </span>
          </div>
        </div>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Outstanding Dues</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-danger-dark)' }}>
              {formatINR(totalOutstanding)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Accounts receivable dues
            </span>
          </div>
        </div>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Voucher Count</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-info)' }}>
              {invoiceCount} invoices
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Total sales transactions
            </span>
          </div>
        </div>
      </div>

      {/* Top Filter and New button */}
      <div className="filters-row-unified">
        <div className="filters-group-one">
          <div className="search-input-wrapper">
            <Search size={16} className="search-input-icon" />
            <input type="text" placeholder="Search invoice or customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {/* Segmented Filter Control */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '10px', border: '1.5px solid var(--border-color)', gap: '2px', flexShrink: 0 }}>
            {['All', 'Paid', 'Partial', 'Unpaid'].map((status) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  className="btn-sm"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '7px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: isActive ? 'var(--card-bg, #ffffff)' : 'transparent',
                    color: isActive ? 'var(--primary-dark)' : 'var(--text-secondary)',
                    boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                >
                  {status === 'All' ? 'All' : status}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filters-group-two">
          {/* Sort Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <ArrowUpDown size={13} />
            </span>
            <select
              className="filter-select"
              style={{ paddingLeft: '36px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
            <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>

          {/* New Invoice Button — same row */}
          <button className="btn btn-primary" onClick={handleStartNewInvoice}>
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      {/* Invoices List Table - optimized to 7 columns to completely eliminate horizontal scrolling */}
      <div className="card">
        {sortedInvoices.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Invoices Found</h4>
            <p className="empty-state-text" style={{ maxWidth: '320px', margin: '8px auto 0 auto' }}>
              Create a billing voucher by clicking 'New Invoice' to sell implements and parts.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ whiteSpace: 'nowrap' }}>Inv No</th>
                      <th style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Customer</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Date</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Total (₹)</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Paid (₹)</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Due (₹)</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                      <th className="no-print" style={{ whiteSpace: 'nowrap', textAlign: 'center', width: '60px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td 
                          style={{ 
                            fontWeight: 700, 
                            color: 'var(--primary-color, var(--primary-dark))', 
                            whiteSpace: 'nowrap', 
                            cursor: 'pointer' 
                          }}
                          onClick={() => setViewInvoice(inv.id || inv.invoiceNumber)}
                          title="Click to view details"
                          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                        >
                          {inv.invoiceNumber}
                        </td>
                        <td 
                          style={{ 
                            fontWeight: 600, 
                            color: 'var(--primary-color, var(--primary-dark))', 
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          onClick={() => {
                            if (inv.customerId) {
                              setViewCustomer(inv.customerId);
                              setCurrentTab('customers');
                            } else {
                              // If customer ID is missing, try matching by name
                              const matchedCustomer = customers.find(c => c.name === inv.customerName);
                              if (matchedCustomer) {
                                setViewCustomer(matchedCustomer.id);
                                setCurrentTab('customers');
                              } else {
                                showToast(`Customer profile not found for: ${inv.customerName}`, 'info');
                              }
                            }
                          }}
                          title={inv.customerName}
                          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                        >
                          {inv.customerName}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(inv.date)}</td>
                        <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatINR(inv.grandTotal).replace('₹', '')}</td>
                        <td style={{ color: 'var(--color-success-dark)', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatINR(inv.amountPaid).replace('₹', '')}</td>
                        <td style={{ color: inv.balanceDue > 0 ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {formatINR(inv.balanceDue).replace('₹', '')}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-success' : inv.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="no-print" style={{ position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuInvoiceId(activeMenuInvoiceId === inv.id ? null : inv.id);
                            }}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenuInvoiceId === inv.id && (
                            <>
                              {/* Overlay to close the menu on clicking outside */}
                              <div 
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                                onClick={() => setActiveMenuInvoiceId(null)}
                              />
                              
                              {/* Dropdown Menu */}
                              <div className="card" style={{
                                position: 'absolute',
                                right: '100%',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                marginRight: '8px',
                                zIndex: 999,
                                minWidth: '130px',
                                padding: '6px 0',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                backgroundColor: 'var(--card-bg, #ffffff)',
                                border: '1px solid var(--border-color)',
                              }}>
                                <button 
                                  className="dropdown-item" 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                  }}
                                  onClick={() => {
                                    setViewInvoice(inv.id || inv.invoiceNumber);
                                    setActiveMenuInvoiceId(null);
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Eye size={14} /> View Details
                                </button>
                                <button 
                                  className="dropdown-item" 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                  }}
                                  onClick={() => {
                                    handleStartEditInvoice(inv);
                                    setActiveMenuInvoiceId(null);
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Edit2 size={14} /> Edit Invoice
                                </button>
                                <button 
                                  className="dropdown-item text-danger" 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                  }}
                                  onClick={() => {
                                    handleDeleteInvoice(inv.id || inv.invoiceNumber, inv.invoiceNumber);
                                    setActiveMenuInvoiceId(null);
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="mobile-card-list">
              {paginatedInvoices.map((inv) => (
                <div key={inv.id} className="mobile-list-card">
                  <div className="mobile-list-card-header">
                    <div>
                      <h4 className="mobile-list-card-title">
                        <button
                          type="button"
                          className="table-link-btn bill-link"
                          onClick={() => setViewInvoice(inv.id || inv.invoiceNumber)}
                        >
                          {inv.invoiceNumber}
                        </button>
                      </h4>
                      <span className="mobile-list-card-subtitle">{inv.customerName}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={(e) => { e.stopPropagation(); setActiveMenuInvoiceId(activeMenuInvoiceId === inv.id ? null : inv.id); }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenuInvoiceId === inv.id && (
                        <>
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuInvoiceId(null)} />
                          <div className="card" style={{
                            position: 'absolute', right: '0', top: '100%', marginTop: '4px',
                            zIndex: 999, minWidth: '150px', padding: '6px 0',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                            display: 'flex', flexDirection: 'column', gap: '2px',
                            backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                          }}>
                            <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                              onClick={() => { setViewInvoice(inv.id || inv.invoiceNumber); setActiveMenuInvoiceId(null); }}>
                              <Eye size={14} /> View Details
                            </button>
                            <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                              onClick={() => { handleStartEditInvoice(inv); setActiveMenuInvoiceId(null); }}>
                              <Edit2 size={14} /> Edit Invoice
                            </button>
                            <button className="dropdown-item danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--color-danger)' }}
                              onClick={() => { handleDeleteInvoice(inv.id || inv.invoiceNumber, inv.invoiceNumber); setActiveMenuInvoiceId(null); }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Billing Date</span>
                    <span className="mobile-list-card-val">{formatDate(inv.date)}</span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Status</span>
                    <span className="mobile-list-card-val">
                      <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-success' : inv.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                        {inv.paymentStatus}
                      </span>
                    </span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Grand Total</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>
                      {formatINR(inv.grandTotal)}
                    </span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Paid Amount</span>
                    <span className="mobile-list-card-val" style={{ color: 'var(--color-success-dark)', fontWeight: 600 }}>
                      {formatINR(inv.amountPaid)}
                    </span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Due Amount</span>
                    <span className="mobile-list-card-val" style={{ color: inv.balanceDue > 0 ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: 600 }}>
                      {formatINR(inv.balanceDue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-row">
                <span>
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, filteredInvoices.length)}</strong> of{' '}
                  <strong>{filteredInvoices.length}</strong> invoices
                </span>
                <div className="pagination-btn-group">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    title="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    title="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {deletingInvoice && createPortal(
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="card modal-content" style={{ maxWidth: '400px', padding: '28px', animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: '#fee2e2', color: 'var(--color-danger)' }}>
                <AlertTriangle size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Delete Invoice</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete invoice <strong>{deletingInvoice.invoiceNumber}</strong>? This action will restore stock levels and adjust the customer balance.
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeletingInvoice(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, var(--color-danger) 0%, var(--color-danger-dark) 100%)' }}
                  onClick={async () => {
                    const idToDelete = deletingInvoice.id;
                    const invoiceNo = deletingInvoice.invoiceNumber;
                    setDeletingInvoice(null);
                    try {
                      deleteInvoice(idToDelete);
                      showToast(`Invoice ${invoiceNo} deleted successfully.`, 'info');
                      setViewInvoice(null);
                    } catch (error: any) {
                      console.error("Delete invoice error:", error);
                      showToast(`Failed to delete: ${error.message || error}`, 'error');
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
