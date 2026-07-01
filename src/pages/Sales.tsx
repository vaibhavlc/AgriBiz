import React, { useState, useEffect } from 'react';
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
  Calendar,
  Percent,
  Share2,
  Edit2,
  AlertTriangle,
  MoreVertical,
  ArrowUpDown,
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
  } = useApp();

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

  // Print Template Selector (A4 standard vs Thermal receipt POS roll)
  const [printTemplate, setPrintTemplate] = useState<'A4' | 'Thermal'>('A4');

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
      const opt = {
        margin:       printTemplate === 'A4' ? 10 : 2,
        filename:     `${selectedInvoice?.invoiceNumber || 'invoice'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { 
          unit: 'mm', 
          format: printTemplate === 'A4' ? 'a4' : [80, 200], 
          orientation: 'portrait' 
        }
      };
      
      html2pdfLib().from(element).set(opt).save().then(() => {
        showToast('PDF downloaded successfully!');
      }).catch((err: any) => {
        console.error(err);
        showToast('Error exporting PDF document.', 'error');
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
      const opt = {
        margin:       printTemplate === 'A4' ? 10 : 2,
        filename:     `${invoice.invoiceNumber}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { 
          unit: 'mm', 
          format: printTemplate === 'A4' ? 'a4' : [80, 200], 
          orientation: 'portrait' 
        }
      };
      
      html2pdfLib().from(element).set(opt).outputPdf('blob').then((pdfBlob: Blob) => {
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
      <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
        {/* Navigation Action header */}
        <div className="no-print" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px', 
          marginBottom: '24px', 
          backgroundColor: 'var(--bg-card)', 
          padding: '16px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)' 
        }}>
          <button className="btn btn-secondary" onClick={() => setViewInvoice(null)}>
            <ArrowLeft size={16} /> Back to Invoices
          </button>
          
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            justifyContent: 'flex-end' 
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Print Template:</span>
            <select className="filter-select" style={{ padding: '6px 12px' }} value={printTemplate} onChange={(e) => setPrintTemplate(e.target.value as 'A4' | 'Thermal')}>
              <option value="A4">Standard A4 Tax Sheet</option>
              <option value="Thermal">Thermal 3-Inch roll POS</option>
            </select>
            <button className="btn btn-secondary" onClick={handleDownload} title="Export invoice as PDF">
              <Download size={16} /> Save as PDF
            </button>
            <button className="btn btn-secondary" style={{ borderColor: '#25D366', color: '#25D366' }} onClick={handleWhatsAppShare} title="Share invoice details on WhatsApp">
              <Share2 size={16} /> Share on WhatsApp
            </button>
            <button className="btn btn-primary" onClick={handlePrint} title="Print paper voucher">
              <Printer size={16} /> Print Receipt
            </button>
          </div>
        </div>

        {/* CONDITIONALLY RENDER THE TEMPLATE CHOICE */}
        {printTemplate === 'A4' ? (
          /* STANDARD A4 SHEET LAYOUT */
          <div className="print-invoice-layout card">
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '24px', color: 'var(--primary-dark)' }}>AgriBiz Dealers</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Main Market Road, Agri Industrial Zone, Ganganagar
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email: support@agribiz.com | Mob: +91 98765 43210</p>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, marginTop: '8px' }}>GSTIN: 08AAAAA1111A1Z1</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-success" style={{ textTransform: 'uppercase', padding: '4px 10px', fontSize: '11px', letterSpacing: '0.5px' }}>TAX INVOICE</span>
                <h3 style={{ marginTop: '8px', fontSize: '18px', fontWeight: 700 }}>{selectedInvoice.invoiceNumber}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Date: {formatDate(selectedInvoice.date)}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>F.Y. 2026-27</p>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: '24px' }}>
              <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-app)', border: 'none' }}>
                <h4 style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>Billed To (Customer):</h4>
                {customerDetail ? (
                  <>
                    <h4 style={{ fontWeight: 700 }}>{customerDetail.name}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{customerDetail.address || 'Address: N/A'}</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Phone: {customerDetail.phone}</p>
                    {customerDetail.gstin && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>GSTIN: {customerDetail.gstin}</p>}
                  </>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Walk-in Customer</p>
                )}
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>Payment Status:</h4>
                <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                  <span className={`badge ${selectedInvoice.paymentStatus === 'Paid' ? 'badge-success' : selectedInvoice.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`} style={{ alignSelf: 'flex-end', padding: '4px 12px' }}>
                    {selectedInvoice.paymentStatus.toUpperCase()}
                  </span>
                  {selectedInvoice.paymentMethod && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Method: {selectedInvoice.paymentMethod}</p>}
                </div>
              </div>
            </div>

            <table className="print-items-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '13px' }}>Sr</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '13px' }}>Product / Description</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '13px' }}>GST Rate</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px' }}>Price (₹)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '13px' }}>Qty</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px' }}>Disc (%)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px' }}>Tax Amount (₹)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px' }}>Net Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '13px' }}>{index + 1}</td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: 600 }}>{item.productName}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '13px' }}>{item.gstRate}%</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px' }}>{item.price.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '13px' }}>{item.quantity}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px' }}>{item.discount}%</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px' }}>{item.gstAmount.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ maxWidth: '60%' }}>
                <h5 style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Invoice Remarks:</h5>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {selectedInvoice.notes || 'Goods once sold are subject to standard industrial dealer warranties.'}
                </p>
              </div>
              <div style={{ minWidth: '280px' }}>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>Taxable Value</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{formatINR(invoiceTotals.subtotal)}</td>
                    </tr>
                    {invoiceTotals.discountTotal > 0 && (
                      <tr>
                        <td style={{ padding: '4px 0', color: 'var(--color-success-dark)' }}>Discount (-)</td>
                        <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: 'var(--color-success-dark)' }}>{formatINR(invoiceTotals.discountTotal)}</td>
                      </tr>
                    )}
                    {isInterState ? (
                      <tr>
                        <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>IGST ({ selectedInvoice.items[0]?.gstRate || 18 }%)</td>
                        <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{formatINR(invoiceTotals.gstTotal)}</td>
                      </tr>
                    ) : (
                      <>
                        <tr>
                          <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>CGST ({ (selectedInvoice.items[0]?.gstRate || 18) / 2 }%)</td>
                          <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{formatINR(invoiceTotals.gstTotal / 2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>SGST ({ (selectedInvoice.items[0]?.gstRate || 18) / 2 }%)</td>
                          <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{formatINR(invoiceTotals.gstTotal / 2)}</td>
                        </tr>
                      </>
                    )}
                    <tr style={{ borderTop: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', fontSize: '15px', fontWeight: 800 }}>
                      <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>Grand Total</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--primary-dark)' }}>{formatINR(invoiceTotals.grandTotal)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0 4px 0', color: 'var(--text-secondary)' }}>Amount Collected</td>
                      <td style={{ padding: '8px 0 4px 0', textAlign: 'right', fontWeight: 600, color: 'var(--color-success-dark)' }}>{formatINR(invoiceTotals.amountPaid)}</td>
                    </tr>
                    <tr style={{ fontSize: '13px', fontWeight: 700 }}>
                      <td style={{ padding: '4px 0', color: 'var(--color-danger)' }}>Balance Due</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--color-danger)' }}>{formatINR(invoiceTotals.balanceDue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                1. Warranty is managed directly by equipment manufacturer.<br />
                2. Delayed payment will attract interest @1.5% per month.
              </div>
              <div style={{ textAlign: 'center', minWidth: '150px' }}>
                <div style={{ height: '40px' }}></div>
                <p style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', fontSize: '12px', fontWeight: 700 }}>Customer Signature</p>
              </div>
            </div>
          </div>
        ) : (
          /* THERMAL POS RECEIPT LAYOUT */
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="print-invoice-layout thermal">
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px' }}>AGRIBIZ DEALERS</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px' }}>Industrial Zone, Ganganagar</p>
                <p style={{ margin: 0, fontSize: '11px' }}>Mob: +91 98765 43210</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 'bold' }}>GSTIN: 08AAAAA1111A1Z1</p>
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

              {/* Invoice Metadata */}
              <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bill No: <strong>{selectedInvoice.invoiceNumber}</strong></span>
                  <span>Date: {formatDate(selectedInvoice.date)}</span>
                </div>
                <div>Customer: <strong>{customerDetail?.name || 'Walk-in'}</strong></div>
                {customerDetail?.phone && <div>Phone: {customerDetail.phone}</div>}
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

              {/* Items Summary */}
              <div style={{ fontSize: '11px' }}>
                <div style={{ fontWeight: 'bold', display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', paddingBottom: '4px' }}>
                  <span>ITEM</span>
                  <span style={{ textAlign: 'center' }}>QTY</span>
                  <span style={{ textAlign: 'right' }}>AMT(₹)</span>
                </div>
                <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }}></div>
                {selectedInvoice.items.map((item, index) => (
                  <div key={index} style={{ marginBottom: '6px', display: 'grid', gridTemplateColumns: '3fr 1fr 1fr' }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{item.productName}</span>
                      <div style={{ fontSize: '10px', color: '#555' }}>
                        Rate: ₹{item.price} | GST: {item.gstRate}%
                      </div>
                    </div>
                    <span style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                    <span style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

              {/* Totals Table */}
              <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Taxable</span>
                  <span>₹{invoiceTotals.subtotal.toFixed(2)}</span>
                </div>
                {invoiceTotals.discountTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discount (-)</span>
                    <span>₹{invoiceTotals.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                {isInterState ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>IGST ({(selectedInvoice.items[0]?.gstRate || 18)}%)</span>
                    <span>₹{invoiceTotals.gstTotal.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>CGST ({(selectedInvoice.items[0]?.gstRate || 18) / 2}%)</span>
                      <span>₹{(invoiceTotals.gstTotal / 2).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SGST ({(selectedInvoice.items[0]?.gstRate || 18) / 2}%)</span>
                      <span>₹{(invoiceTotals.gstTotal / 2).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 0' }}>
                  <span>GRAND TOTAL</span>
                  <span>₹{invoiceTotals.grandTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'green' }}>
                  <span>CASH COLLECTED</span>
                  <span>₹{invoiceTotals.amountPaid.toFixed(2)}</span>
                </div>
                {invoiceTotals.balanceDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'red' }}>
                    <span>BALANCE DUE</span>
                    <span>₹{invoiceTotals.balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

              {/* Thermal footer */}
              <div style={{ textAlign: 'center', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div>THANK YOU! VISIT AGAIN.</div>
                {selectedInvoice.notes && <div style={{ fontStyle: 'italic' }}>"{selectedInvoice.notes}"</div>}
                <div style={{ fontSize: '8px', color: '#777', marginTop: '4px' }}>Powered by AgriBiz POS software</div>
              </div>
            </div>
          </div>
        )}

        {/* Delete danger button no-print */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="btn btn-secondary" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => handleDeleteInvoice(selectedInvoice.id || selectedInvoice.invoiceNumber, selectedInvoice.invoiceNumber)}>
            <Trash2 size={16} /> Delete & Reset Stock
          </button>
        </div>
      </div>
    );
  }

  // 2. FORM VIEW (INVOICE CREATOR SHEET EDITOR)
  if (isCreatingInvoice) {
    const originalInvoice = editingInvoiceId ? invoices.find((i) => i.id === editingInvoiceId) : null;
    const invoiceNumber = originalInvoice ? originalInvoice.invoiceNumber : `INV-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(4, '0')}`;
    const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
    const isCreatorInterState = activeCustomer && activeCustomer.state && settings.state && activeCustomer.state !== settings.state;
    const currentGstRate = (items[0]?.productId ? products.find((p) => p.id === items[0].productId)?.gstRate : 18) ?? 18;

    return (
      <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
        {/* Top Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => {
            setIsCreatingInvoice(false);
            setEditingInvoiceId(null);
            setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]); // reset
          }}>
            <ArrowLeft size={16} /> {editingInvoiceId ? 'Back to Invoices' : 'Cancel Draft'}
          </button>
          <div>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginRight: '8px' }}>Voucher Serial:</span>
            <strong style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-dark)' }}>{invoiceNumber}</strong>
          </div>
        </div>

        <form onSubmit={handleSaveInvoice}>
          {/* Main Visual Sheet */}
          <div className="card" style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', boxShadow: 'var(--shadow-lg)' }}>
            
            {/* Header info row */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>Invoice Info</h3>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Select Customer *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <select className="form-control" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required>
                        <option value="">-- Choose Customer --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''} — Bal: {formatINR(c.outstanding)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsCustomerModalOpen(true)} style={{ display: 'flex', gap: '6px' }}>
                      <Plus size={16} /> Add Customer
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Billing Date *</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="date" className="form-control" style={{ paddingLeft: '36px' }} value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Billed Items Section */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Billed Products</h4>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow}>
                  <Plus size={14} /> Add Product Line
                </button>
              </div>

              <div className="table-wrapper">
                <table className="data-table" style={{ border: 'none' }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '260px' }}>Product Selection *</th>
                      <th style={{ minWidth: '100px', textAlign: 'center' }}>Live Stock</th>
                      <th style={{ minWidth: '130px', textAlign: 'right' }}>Unit Price (₹) *</th>
                      <th style={{ minWidth: '90px', textAlign: 'center' }}>Quantity *</th>
                      <th style={{ minWidth: '100px', textAlign: 'center' }}>Discount %</th>
                      <th style={{ minWidth: '120px', textAlign: 'right' }}>Net Total (₹)</th>
                      <th style={{ minWidth: '50px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const product = products.find((p) => p.id === item.productId);
                      const calculations = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);

                      return (
                        <tr key={index}>
                          {/* Product Selection */}
                          <td>
                            <select className="form-control" style={{ width: '100%' }} value={item.productId} onChange={(e) => handleUpdateItemRow(index, 'productId', e.target.value)} required>
                              <option value="">-- Choose Product --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                  {p.name} [{p.category}] {p.stock <= 0 ? '(Out of Stock)' : ''}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Live Stock Display */}
                          <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>
                            {product ? (
                              <span style={{ color: product.stock <= product.minStock ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                                {product.stock} units
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>

                          {/* Price Input */}
                          <td>
                            <input type="number" className="form-control" style={{ textAlign: 'right', paddingLeft: '6px', paddingRight: '6px' }} placeholder="Price" min="0" step="any" value={item.price || ''} onChange={(e) => handleUpdateItemRow(index, 'price', parseFloat(e.target.value) || 0)} required />
                          </td>

                          {/* Qty Input */}
                          <td>
                            <input type="number" className="form-control" style={{ textAlign: 'center', paddingLeft: '4px', paddingRight: '4px' }} placeholder="Qty" min="1" value={item.quantity || ''} onChange={(e) => handleUpdateItemRow(index, 'quantity', parseInt(e.target.value) || 0)} required />
                          </td>

                          {/* Discount Input */}
                          <td>
                            <div style={{ position: 'relative' }}>
                              <Percent size={11} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                              <input type="number" className="form-control" style={{ textAlign: 'center', paddingRight: '20px', paddingLeft: '4px' }} placeholder="0" min="0" max="100" value={item.discount || ''} onChange={(e) => handleUpdateItemRow(index, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} />
                            </div>
                          </td>

                          {/* Total Row Amount */}
                          <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {formatINR(calculations.total).replace('₹', '')}
                          </td>

                          {/* Delete Action */}
                          <td style={{ textAlign: 'center' }}>
                            <button type="button" className="btn btn-secondary" style={{ padding: '6px', color: 'var(--color-danger)', borderColor: 'transparent', background: 'transparent' }} onClick={() => handleRemoveItemRow(index)} title="Delete row">
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Form Summary Section */}
            <div className="form-row" style={{ alignItems: 'flex-start', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              
              {/* Payment Details Form (Left) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Receipt Details</h4>
                
                <div className="form-group">
                  <label className="form-label">Cash Collected Now (₹)</label>
                  <input type="number" className="form-control" placeholder="0.00" min="0" max={totals.grandTotal} value={amountPaid || ''} onChange={(e) => setAmountPaid(Math.min(totals.grandTotal, Math.max(0, parseFloat(e.target.value) || 0)))} />
                </div>

                {amountPaid > 0 && (
                  <div className="form-group">
                    <label className="form-label">Payment Method *</label>
                    <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Billing Remarks / Notes</label>
                  <textarea className="form-control" placeholder="Remarks printed on customer invoice" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              {/* Totals Table Box (Right) */}
              <div className="card" style={{ flex: 1, backgroundColor: 'var(--bg-app)', border: 'none', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-dark)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '4px' }}>Billing Summary</h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Taxable base subtotal</span>
                  <span style={{ fontWeight: 600 }}>{formatINR(totals.subtotal)}</span>
                </div>
                
                {totals.discountTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-success-dark)' }}>
                    <span>Total Discount (-)</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(totals.discountTotal)}</span>
                  </div>
                )}

                {isCreatorInterState ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total IGST ({ currentGstRate }%)</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(totals.gstTotal)}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total CGST ({ currentGstRate / 2 }%)</span>
                      <span style={{ fontWeight: 600 }}>{formatINR(totals.gstTotal / 2)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total SGST ({ currentGstRate / 2 }%)</span>
                      <span style={{ fontWeight: 600 }}>{formatINR(totals.gstTotal / 2)}</span>
                    </div>
                  </>
                )}

                <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                  <span style={{ color: 'var(--primary-dark)' }}>{formatINR(totals.grandTotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, color: balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                  <span>Customer Outstanding Dues</span>
                  <span>{formatINR(balanceDue)}</span>
                </div>
              </div>

            </div>

            {/* Form actions footer bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setIsCreatingInvoice(false);
                setEditingInvoiceId(null);
                setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]); // reset
              }}>
                Discard
              </button>
              <button type="submit" className="btn btn-primary" style={{ minWidth: '180px', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }} disabled={items.length === 0 || !items[0].productId}>
                {editingInvoiceId ? 'Update & Save Invoice' : 'Save & Print Invoice'}
              </button>
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
      {/* Top Filter and New button */}
      <div className="filters-row">
        <div className="filters-left">
          <div className="search-input-wrapper">
            <Search size={16} className="search-input-icon" />
            <input type="text" placeholder="Search invoice or customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {/* Segmented Filter Control */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '4px', borderRadius: '12px', border: '1.5px solid var(--border-color)', gap: '4px' }}>
            {['All', 'Paid', 'Partial', 'Unpaid'].map((status) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  className="btn-sm"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: isActive ? 'var(--card-bg, #ffffff)' : 'transparent',
                    color: isActive ? 'var(--primary-dark)' : 'var(--text-secondary)',
                    boxShadow: isActive ? '0 4px 10px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)' : 'none',
                  }}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                >
                  {status === 'All' ? 'All Invoices' : status}
                </button>
              );
            })}
          </div>

          {/* Improved Sort Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <ArrowUpDown size={14} />
            </span>
            <select
              className="filter-select"
              style={{
                paddingLeft: '38px',
                paddingRight: '36px',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
            <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleStartNewInvoice}>
          <Plus size={16} /> New Invoice
        </button>
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
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">Invoice No</th>
                    <th>Customer Name</th>
                    <th className="text-nowrap">Date</th>
                    <th className="text-nowrap">Total Bill (₹)</th>
                    <th className="text-nowrap">Collected (₹)</th>
                    <th className="text-nowrap">Balance Due (₹)</th>
                    <th>Status</th>
                    <th className="no-print" style={{ textAlign: 'center', width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td 
                        style={{ fontWeight: 700, color: 'var(--primary-color, var(--primary-dark))', whiteSpace: 'nowrap', cursor: 'pointer' }}
                        onClick={() => setViewInvoice(inv.id || inv.invoiceNumber)}
                        title="Click to view details"
                        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                      >
                        {inv.invoiceNumber}
                      </td>
                      <td 
                        style={{ fontWeight: 600, color: 'var(--primary-color, var(--primary-dark))', cursor: 'pointer' }}
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
                        title="Click to view customer profile"
                        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                      >
                        {inv.customerName}
                      </td>
                      <td className="text-nowrap">{formatDate(inv.date)}</td>
                      <td style={{ fontWeight: 700 }}>{formatINR(inv.grandTotal).replace('₹', '')}</td>
                      <td style={{ color: 'var(--color-success-dark)', fontWeight: 600 }}>{formatINR(inv.amountPaid).replace('₹', '')}</td>
                      <td style={{ color: inv.balanceDue > 0 ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: 600 }}>
                        {formatINR(inv.balanceDue).replace('₹', '')}
                      </td>
                      <td>
                        <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-success' : inv.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="no-print" style={{ position: 'relative', textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                          onClick={() => setActiveMenuInvoiceId(activeMenuInvoiceId === inv.id ? null : inv.id)}
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
                                  color: 'var(--color-danger)',
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Page {currentPage} of {totalPages} ({filteredInvoices.length} invoices)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </button>
                  <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {deletingInvoice && (
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
        </div>
      )}
    </div>
  );
};
