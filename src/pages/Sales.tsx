import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { CustomerModal } from '../components/CustomerModal';
import { formatINR, formatDate, getFullAddress } from '../utils/dummyData';
import type { Invoice, Quotation } from '../types';
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
  Calendar,
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
    quotations,
    customers,
    products,
    addInvoice,
    editInvoice,
    deleteInvoice,
    addQuotation,
    editQuotation,
    deleteQuotation,
    convertQuotationToInvoice,
    searchQuery,
    setSearchQuery,
    currentInvoiceId,
    setViewInvoice,
    currentQuotationId,
    setViewQuotation,
    isCreatingInvoice,
    setIsCreatingInvoice,
    isCreatingQuotation,
    setIsCreatingQuotation,
    salesActiveTab,
    setSalesActiveTab,
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

  const totalQuoted = quotations.filter(q => q.status !== 'Declined').reduce((sum, q) => sum + q.grandTotal, 0);
  const approvedQuoted = quotations.filter(q => q.status === 'Approved' || q.status === 'Converted').reduce((sum, q) => sum + q.grandTotal, 0);
  const openQuotedCount = quotations.filter(q => q.status === 'Draft' || q.status === 'Sent').length;
  const totalQuotedCount = quotations.length;

  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<{ id: string; invoiceNumber: string } | null>(null);
  const [activeMenuInvoiceId, setActiveMenuInvoiceId] = useState<string | null>(null);

  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  const [deletingQuotation, setDeletingQuotation] = useState<{ id: string; quotationNumber: string } | null>(null);
  const [activeMenuQuotationId, setActiveMenuQuotationId] = useState<string | null>(null);

  // Local state for quotation validity
  const [validUntil, setValidUntil] = useState('2026-07-31');

  // Convert Quotation to Invoice Modal State
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertQuotationId, setConvertQuotationId] = useState<string | null>(null);
  const [convertAmountPaid, setConvertAmountPaid] = useState(0);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState('UPI');

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
    if ((currentInvoiceId || currentQuotationId) && printTemplate === 'Thermal') {
      document.body.classList.add('print-thermal-mode');
    } else {
      document.body.classList.remove('print-thermal-mode');
    }
    return () => {
      document.body.classList.remove('print-thermal-mode');
    };
  }, [printTemplate, currentInvoiceId, currentQuotationId]);

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
      showToast('Could not find layout element.', 'error');
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

      const fileName = selectedInvoice 
        ? `${selectedInvoice.invoiceNumber}.pdf` 
        : `${selectedQuotation?.quotationNumber || 'estimate'}.pdf`;

      const opt = {
        margin:       printTemplate === 'A5' ? 0 : 2,
        filename:     fileName,
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
    const activeDoc = selectedInvoice 
      ? { 
          id: selectedInvoice.id, 
          number: selectedInvoice.invoiceNumber, 
          customerId: selectedInvoice.customerId,
          customerName: selectedInvoice.customerName,
          grandTotal: selectedInvoice.grandTotal,
          isQuotation: false,
          msgText: `Your invoice *${selectedInvoice.invoiceNumber}* from *${settings.businessName}* has been generated.

*Summary of Transactions:*
---------------------------------------
*Total Amount:* ${formatINR(selectedInvoice.grandTotal)}
*Amount Collected:* ${formatINR(selectedInvoice.amountPaid)}
*Balance Dues:* ${formatINR(selectedInvoice.balanceDue)}
---------------------------------------`
        }
      : selectedQuotation 
      ? {
          id: selectedQuotation.id,
          number: selectedQuotation.quotationNumber,
          customerId: selectedQuotation.customerId,
          customerName: selectedQuotation.customerName,
          grandTotal: selectedQuotation.grandTotal,
          isQuotation: true,
          msgText: `Your quotation *${selectedQuotation.quotationNumber}* from *${settings.businessName}* has been generated.

*Summary of Estimate:*
---------------------------------------
*Total Amount:* ${formatINR(selectedQuotation.grandTotal)}
*Valid Until:* ${formatDate(selectedQuotation.validUntil)}
---------------------------------------`
        }
      : null;

    if (!activeDoc) return;
    const customerDetail = customers.find((c) => c.id === activeDoc.customerId);
    const element = document.querySelector('.print-invoice-layout');
    if (!element) {
      showToast('Could not find layout element.', 'error');
      return;
    }

    showToast('Compiling PDF for sharing...', 'info');

    const sharePDF = (html2pdfLib: any) => {
      const htmlElement = element as HTMLElement;
      const originalZoom = htmlElement.style.zoom;
      const originalTransform = htmlElement.style.transform;
      
      htmlElement.style.setProperty('zoom', '1', 'important');
      htmlElement.style.setProperty('transform', 'none', 'important');

      const opt = {
        margin:       printTemplate === 'A5' ? 0 : 2,
        filename:     `${activeDoc.number}.pdf`,
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
        const pdfFile = new File([pdfBlob], `${activeDoc.number}.pdf`, { type: 'application/pdf' });
        
        const nav = navigator as any;
        if (nav.canShare && nav.canShare({ files: [pdfFile] })) {
          nav.share({
            files: [pdfFile],
            title: `${activeDoc.isQuotation ? 'Quotation' : 'Invoice'} ${activeDoc.number}`,
            text: `${activeDoc.isQuotation ? 'Quotation' : 'Invoice'} from ${settings.businessName}`
          }).then(() => {
            showToast('Document shared successfully!');
          }).catch((err: any) => {
            console.log('Share canceled', err);
          });
        } else {
          const downloadUrl = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${activeDoc.number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);

          const message = `Hello ${activeDoc.customerName},

${activeDoc.msgText}

We have downloaded the PDF document to your device. Please attach it in the chat.`;

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

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      showToast('Please select a customer first.', 'error');
      return;
    }

    if (items.some((item) => !item.productId || item.quantity <= 0 || item.price < 0)) {
      showToast('Please ensure all items have valid products, quantities, and prices.', 'error');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return;

    const quotationItems = items.map((item) => {
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

    if (editingQuotationId) {
      const originalQuotation = quotations.find((q) => q.id === editingQuotationId);
      if (!originalQuotation) return;

      editQuotation({
        ...originalQuotation,
        date: invoiceDate,
        validUntil,
        customerId: selectedCustomerId,
        customerName: customer.name,
        items: quotationItems,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        gstTotal: totals.gstTotal,
        grandTotal: totals.grandTotal,
        notes: notes.trim() || undefined,
      });

      showToast(`Quotation ${originalQuotation.quotationNumber} updated successfully!`);

      // Reset states
      setEditingQuotationId(null);
      setSelectedCustomerId('');
      setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
      setNotes('');
      setIsCreatingQuotation(false);
      setViewQuotation(originalQuotation.id);
    } else {
      const newQuotation = addQuotation({
        date: invoiceDate,
        validUntil,
        customerId: selectedCustomerId,
        customerName: customer.name,
        items: quotationItems,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        gstTotal: totals.gstTotal,
        grandTotal: totals.grandTotal,
        status: 'Draft',
        notes: notes.trim() || undefined,
      });

      showToast(`Quotation created successfully for ${customer.name}!`);

      // Reset states
      setSelectedCustomerId('');
      setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
      setNotes('');
      setIsCreatingQuotation(false);
      setViewQuotation(newQuotation.id);
    }
  };

  const handleStartEditQuotation = (q: Quotation) => {
    setEditingQuotationId(q.id);
    setSelectedCustomerId(q.customerId);
    setInvoiceDate(q.date);
    setValidUntil(q.validUntil);
    setNotes(q.notes || '');
    setItems(
      q.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
      }))
    );
    setIsCreatingQuotation(true);
  };

  const handleDeleteQuotation = (id: string, quotationNo: string) => {
    setDeletingQuotation({ id, quotationNumber: quotationNo });
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

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedQuotations = [...filteredQuotations].sort((a, b) => {
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
  const totalPages = salesActiveTab === 'invoices' 
    ? Math.ceil(sortedInvoices.length / itemsPerPage)
    : Math.ceil(sortedQuotations.length / itemsPerPage);

  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedQuotations = sortedQuotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedInvoice = invoices.find((inv) => inv.id === currentInvoiceId || inv.invoiceNumber === currentInvoiceId);
  const selectedQuotation = quotations.find((q) => q.id === currentQuotationId || q.quotationNumber === currentQuotationId);

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
        <div className="invoice-detail-nav-panel no-print">
          <div className="invoice-detail-top-row">
            <button className="btn btn-secondary back-to-invoices-btn" onClick={() => setViewInvoice(null)}>
              <ArrowLeft size={16} /> Back<span className="desktop-only-text"> to Invoices</span>
            </button>
            <div className="template-selector-group">
              <span className="template-label">Print Template:</span>
              <select className="filter-select template-select-field" value={printTemplate} onChange={(e) => setPrintTemplate(e.target.value as "A5" | "Thermal")}>
                <option value="A5">Standard A5 Bill Book</option>
                <option value="Thermal">Thermal 3-Inch roll POS</option>
              </select>
            </div>
          </div>
          <div className="action-buttons-grid">
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
            <div className={`print-invoice-layout invoice-print-container ${selectedInvoice.items.length > 3 ? "dense-layout" : ""} ${(settings.showLogo && (settings.watermarkLogo || settings.logo)) ? "has-custom-watermark" : ""}`}>
              {/* Dynamic Logo Watermark in Center */}
              {settings.showLogo && (settings.watermarkLogo || settings.logo) && (
                <div className="print-watermark-logo">
                  <img src={settings.watermarkLogo || settings.logo} alt="Watermark" />
                </div>
              )}
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
                    <h2 className="invoice-company-name">{settings.businessName}</h2>
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
                {settings.showBankDetails && settings.bankName && (
                  <div style={{ marginBottom: "8px" }}>
                    <h5 className="invoice-terms-title" style={{ marginBottom: "4px" }}>BANK DETAILS:</h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                      <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 700, color: "#2F3E33" }}>Bank:</span> {settings.bankName}
                        </div>
                        <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 700, color: "#2F3E33" }}>A/c Name:</span> {settings.accountHolderName}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 700, color: "#2F3E33" }}>A/c No:</span> {settings.accountNumber}
                        </div>
                        <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 700, color: "#2F3E33" }}>IFSC:</span> {settings.ifscCode}
                        </div>
                      </div>
                      {(settings.branchName || settings.upiId) && (
                        <div style={{ display: "flex", gap: "16px" }}>
                          <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {settings.branchName ? <><span style={{ fontWeight: 700, color: "#2F3E33" }}>Branch:</span> {settings.branchName}</> : null}
                          </div>
                          <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {settings.upiId ? <><span style={{ fontWeight: 700, color: "#2F3E33" }}>UPI ID:</span> {settings.upiId}</> : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {settings.showTerms && (settings.invoiceTerms || settings.defaultTerms) && (
                  <>
                    <h5 className="invoice-terms-title">TERMS & CONDITIONS:</h5>
                    <p className="invoice-terms-text" style={{ whiteSpace: "pre-wrap" }}>
                      {settings.invoiceTerms || settings.defaultTerms}
                    </p>
                  </>
                )}
                {selectedInvoice.notes && (
                  <>
                    <h5 className="invoice-terms-title" style={{ marginTop: "8px" }}>NOTE:</h5>
                    <p className="invoice-terms-text">{selectedInvoice.notes}</p>
                  </>
                )}
              </div>
              <div style={{ width: "220px", flexShrink: 0 }}>
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
              <div style={{ flex: 1, maxWidth: "45%" }}>
                {/* Custom Inline SVG Illustration */}
                <svg viewBox="0 0 500 110" width="100%" height={selectedInvoice.items.length > 3 ? "40" : "60"} style={{ display: "block" }}>
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
              {/* Bottom Footer block containing SVG, Signatures, and Footer message */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", flexShrink: 0, marginTop: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div style={{ flex: 1, maxWidth: "45%" }}>
                    {/* Custom Inline SVG Illustration */}
                    <svg viewBox="0 0 500 110" width="100%" height={selectedInvoice.items.length > 3 ? "40" : "60"} style={{ display: "block" }}>
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
                      <ellipse cx="204" cy="72" rx="3" ry="6" fill="#F2C94C" stroke="#27AE60" strokeWidth="1" />
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
                  <div style={{ display: "flex", gap: "28px", alignItems: "flex-end", flexShrink: 0 }}>
                    <div style={{ textAlign: "center", minWidth: "110px" }}>
                      <div style={{ height: selectedInvoice.items.length > 3 ? "25px" : "35px" }}></div>
                      <p style={{ borderTop: "1.5px solid #EAE3D2", paddingTop: "6px", fontSize: "11px", fontWeight: 700, color: "#4E6C50", whiteSpace: "nowrap" }}>
                        Receiver's Signature
                      </p>
                    </div>
                    <div style={{ textAlign: "center", minWidth: "110px" }}>
                      <div style={{ height: selectedInvoice.items.length > 3 ? "25px" : "35px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                        {settings.signature ? (
                          <img src={settings.signature} alt="E-Signature" style={{ maxHeight: selectedInvoice.items.length > 3 ? "22px" : "30px", maxWidth: "100px", objectFit: "contain", mixBlendMode: "multiply" }} />
                        ) : null}
                      </div>
                      <p style={{ borderTop: "1.5px solid #EAE3D2", paddingTop: "6px", fontSize: "11px", fontWeight: 700, color: "#4E6C50", whiteSpace: "nowrap" }}>
                        Authorized Signatory
                      </p>
                    </div>
                  </div>
                </div>
                {settings.footerMessage && (
                  <div style={{
                    textAlign: "center",
                    fontSize: selectedInvoice.items.length > 3 ? "9px" : "10px",
                    color: "var(--text-muted)",
                    borderTop: "1px dashed var(--border-color)",
                    paddingTop: selectedInvoice.items.length > 3 ? "4px" : "8px",
                    width: "100%"
                  }}>
                    {settings.footerMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="print-invoice-layout thermal">
              <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>{(settings.businessName || "AgriBiz").toUpperCase()}</h3>
                {settings.showAddress && <p style={{ margin: "2px 0 0 0", fontSize: "11px" }}>{getFullAddress(settings)}</p>}
                {settings.showContact && (
                  <p style={{ margin: 0, fontSize: "11px" }}>
                    {[settings.phone, settings.email].filter(Boolean).join(' • ')}
                  </p>
                )}
                {settings.showGstin && settings.gstin && <p style={{ margin: "4px 0 0 0", fontSize: "11px", fontWeight: "bold" }}>GSTIN: {settings.gstin}</p>}
              </div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "2px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Bill No: <strong>{selectedInvoice.invoiceNumber}</strong></span><span>Date: {formatDate(selectedInvoice.date)}</span></div><div>Customer: <strong>{customerDetail?.name || "Walk-in"}</strong></div>{customerDetail?.phone && <div>Phone: {customerDetail.phone}</div>}</div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ fontSize: "11px" }}><div style={{ fontWeight: "bold", display: "grid", gridTemplateColumns: "3fr 1fr 1fr", paddingBottom: "4px" }}><span>ITEM</span><span style={{ textAlign: "center" }}>QTY</span><span style={{ textAlign: "right" }}>AMT({settings.currencySymbol || "₹"})</span></div><div style={{ borderTop: "1px solid #eee", margin: "4px 0" }}></div>{selectedInvoice.items.map((item, index) => (<div key={index} style={{ marginBottom: "6px", display: "grid", gridTemplateColumns: "3fr 1fr 1fr" }}><div><span style={{ fontWeight: "bold" }}>{item.productName}</span><div style={{ fontSize: "10px", color: "#555" }}>Rate: {settings.currencySymbol || "₹"}{item.price} | GST: {item.gstRate}%</div></div><span style={{ textAlign: "center", fontWeight: "bold" }}>{item.quantity}</span><span style={{ textAlign: "right", fontWeight: "bold" }}>{item.total.toFixed(2)}</span></div>))}</div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "3px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Total Taxable</span><span>{settings.currencySymbol || "₹"}{invoiceTotals.subtotal.toFixed(2)}</span></div>{invoiceTotals.discountTotal > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Discount (-)</span><span>{settings.currencySymbol || "₹"}{invoiceTotals.discountTotal.toFixed(2)}</span></div>}{isInterState ? <div style={{ display: "flex", justifyContent: "space-between" }}><span>IGST ({(selectedInvoice.items[0]?.gstRate || 18)}%)</span><span>{settings.currencySymbol || "₹"}{invoiceTotals.gstTotal.toFixed(2)}</span></div> : <><div style={{ display: "flex", justifyContent: "space-between" }}><span>CGST ({(selectedInvoice.items[0]?.gstRate || 18) / 2}%)</span><span>{settings.currencySymbol || "₹"}{(invoiceTotals.gstTotal / 2).toFixed(2)}</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>SGST ({(selectedInvoice.items[0]?.gstRate || 18) / 2}%)</span><span>{settings.currencySymbol || "₹"}{(invoiceTotals.gstTotal / 2).toFixed(2)}</span></div></>}<div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "4px 0" }}><span>GRAND TOTAL</span><span>{settings.currencySymbol || "₹"}{invoiceTotals.grandTotal.toFixed(2)}</span></div><div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "green" }}><span>CASH COLLECTED</span><span>{settings.currencySymbol || "₹"}{invoiceTotals.amountPaid.toFixed(2)}</span></div>{invoiceTotals.balanceDue > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "red" }}><span>BALANCE DUE</span><span>{settings.currencySymbol || "₹"}{invoiceTotals.balanceDue.toFixed(2)}</span></div>}</div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ textAlign: "center", fontSize: "10px", display: "flex", flexDirection: "column", gap: "2px" }}><div>{settings.footerMessage || "THANK YOU! VISIT AGAIN."}</div>{selectedInvoice.notes && <div style={{ fontStyle: "italic" }}>"{selectedInvoice.notes}"</div>}<div style={{ fontSize: "8px", color: "#777", marginTop: "4px" }}>Powered by {settings.businessName || "AgriBiz"} POS software</div></div>
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

  if (selectedQuotation) {
    const customerDetail = customers.find((c) => c.id === selectedQuotation.customerId);
    const isInterState = customerDetail && customerDetail.state && settings.state && customerDetail.state !== settings.state;
    const quotationTotals = {
      subtotal: selectedQuotation.subtotal,
      discountTotal: selectedQuotation.discountTotal,
      gstTotal: selectedQuotation.gstTotal,
      grandTotal: selectedQuotation.grandTotal,
    };

    return (
      <div style={{ animation: "fadeIn 0.2s ease-out" }}>
        {/* Navigation Action header */}
        <div className="invoice-detail-nav-panel no-print">
          <div className="invoice-detail-top-row">
            <button className="btn btn-secondary back-to-invoices-btn" onClick={() => setViewQuotation(null)}>
              <ArrowLeft size={16} /> Back<span className="desktop-only-text"> to Quotations</span>
            </button>
            <div className="template-selector-group">
              <span className="template-label">Print Template:</span>
              <select className="filter-select template-select-field" value={printTemplate} onChange={(e) => setPrintTemplate(e.target.value as "A5" | "Thermal")}>
                <option value="A5">Standard A5 Bill Book</option>
                <option value="Thermal">Thermal 3-Inch roll POS</option>
              </select>
            </div>
          </div>
          <div className="action-buttons-grid">
            <button className="btn btn-secondary" onClick={handleDownload} title="Export quotation as PDF">
              <Download size={16} /> Save as PDF
            </button>
            <button className="btn btn-secondary" style={{ borderColor: "#25D366", color: "#25D366" }} onClick={handleWhatsAppShare} title="Share quotation details on WhatsApp">
              <Share2 size={16} /> Share on WhatsApp
            </button>
            <button className="btn btn-primary" onClick={handlePrint} title="Print paper voucher">
              <Printer size={16} /> Print Estimate
            </button>
          </div>
        </div>

        {printTemplate === "A5" ? (
          <div className="invoice-mockup-wrapper">
            <div className={`print-invoice-layout invoice-print-container ${selectedQuotation.items.length > 3 ? "dense-layout" : ""} ${(settings.showLogo && (settings.watermarkLogo || settings.logo)) ? "has-custom-watermark" : ""}`}>
              {/* Dynamic Logo Watermark in Center */}
              {settings.showLogo && (settings.watermarkLogo || settings.logo) && (
                <div className="print-watermark-logo">
                  <img src={settings.watermarkLogo || settings.logo} alt="Watermark" />
                </div>
              )}
              {/* Elegant leafy branch corner watermark */}
              <div style={{ position: "absolute", top: "8px", right: "8px", opacity: 0.08, pointerEvents: "none", zIndex: 1 }}>
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="#4E6C50" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 90 Q 50 50 90 10" />
                  <path d="M90 10 C80 20 65 25 60 15 C55 5 70 0 90 10" fill="#4E6C50" />
                  <path d="M70 30 C60 40 45 45 40 35 C35 25 50 20 70 30" fill="#4E6C50" />
                  <path d="M50 50 C40 60 25 65 20 55 C15 45 30 40 50 50" fill="#4E6C50" />
                </svg>
              </div>

              {/* Header: Logo, Company Info, Title */}
              <div className="invoice-header-bar">
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
                    <h2 className="invoice-company-name">{settings.businessName}</h2>
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
                  <h1 className="invoice-main-title" style={{ color: 'var(--primary)' }}>ESTIMATE</h1>
                  <h3 className="invoice-number-text">#{selectedQuotation.quotationNumber}</h3>
                  <p className="invoice-date-text">Date: {formatDate(selectedQuotation.date)}</p>
                </div>
              </div>

              {/* Billed To and Payment details */}
              <div className="invoice-billing-details">
                <div>
                  <h4 className="invoice-detail-header">Estimate for:</h4>
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
                  <h4 className="invoice-detail-header">Validity Info:</h4>
                  <span className="invoice-payment-badge paid" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                    VALID UNTIL: {formatDate(selectedQuotation.validUntil)}
                  </span>
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
                  {selectedQuotation.items.map((item, index) => (
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
                  {settings.showBankDetails && settings.bankName && (
                    <div style={{ marginBottom: "8px" }}>
                      <h5 className="invoice-terms-title" style={{ marginBottom: "4px" }}>BANK DETAILS:</h5>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                        <div style={{ display: "flex", gap: "16px" }}>
                          <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            <span style={{ fontWeight: 700, color: "#2F3E33" }}>Bank:</span> {settings.bankName}
                          </div>
                          <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            <span style={{ fontWeight: 700, color: "#2F3E33" }}>A/c Name:</span> {settings.accountHolderName}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "16px" }}>
                          <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            <span style={{ fontWeight: 700, color: "#2F3E33" }}>A/c No:</span> {settings.accountNumber}
                          </div>
                          <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            <span style={{ fontWeight: 700, color: "#2F3E33" }}>IFSC:</span> {settings.ifscCode}
                          </div>
                        </div>
                        {(settings.branchName || settings.upiId) && (
                          <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                              {settings.branchName ? <><span style={{ fontWeight: 700, color: "#2F3E33" }}>Branch:</span> {settings.branchName}</> : null}
                            </div>
                            <div style={{ flex: 1, fontSize: "9.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                              {settings.upiId ? <><span style={{ fontWeight: 700, color: "#2F3E33" }}>UPI ID:</span> {settings.upiId}</> : null}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {settings.showTerms && (settings.quotationTerms || settings.defaultTerms) && (
                    <>
                      <h5 className="invoice-terms-title">TERMS & CONDITIONS:</h5>
                      <p className="invoice-terms-text" style={{ whiteSpace: "pre-wrap" }}>
                        {settings.quotationTerms || settings.defaultTerms}
                      </p>
                    </>
                  )}
                  {selectedQuotation.notes && (
                    <>
                      <h5 className="invoice-terms-title" style={{ marginTop: "8px" }}>NOTE:</h5>
                      <p className="invoice-terms-text">{selectedQuotation.notes}</p>
                    </>
                  )}
                </div>
                <div style={{ width: "220px", flexShrink: 0 }}>
                  <table className="invoice-summary-table">
                    <tbody>
                      <tr>
                        <td>Subtotal</td>
                        <td>{formatINR(quotationTotals.subtotal)}</td>
                      </tr>
                      {quotationTotals.discountTotal > 0 && (
                        <tr className="discount-row">
                          <td>Discount (-)</td>
                          <td>{formatINR(quotationTotals.discountTotal)}</td>
                        </tr>
                      )}
                      {isInterState ? (
                        <tr>
                          <td>IGST ({selectedQuotation.items[0]?.gstRate || 18}%)</td>
                          <td>{formatINR(quotationTotals.gstTotal)}</td>
                        </tr>
                      ) : (
                        <>
                          <tr>
                            <td>CGST ({(selectedQuotation.items[0]?.gstRate || 18) / 2}%)</td>
                            <td>{formatINR(quotationTotals.gstTotal / 2)}</td>
                          </tr>
                          <tr>
                            <td>SGST ({(selectedQuotation.items[0]?.gstRate || 18) / 2}%)</td>
                            <td>{formatINR(quotationTotals.gstTotal / 2)}</td>
                          </tr>
                        </>
                      )}
                      <tr className="grand-total-row">
                        <td>TOTAL</td>
                        <td>{formatINR(quotationTotals.grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SVG Illustration and Signature */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "20px" }}>
                <div style={{ flex: 1, maxWidth: "45%" }}>
                  {/* Custom Inline SVG Illustration */}
                  <svg viewBox="0 0 500 110" width="100%" height={selectedQuotation.items.length > 3 ? "40" : "60"} style={{ display: "block" }}>
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
              {/* Bottom Footer block containing SVG, Signatures, and Footer message */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", flexShrink: 0, marginTop: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div style={{ flex: 1, maxWidth: "45%" }}>
                    {/* Custom Inline SVG Illustration */}
                    <svg viewBox="0 0 500 110" width="100%" height={selectedQuotation.items.length > 3 ? "40" : "60"} style={{ display: "block" }}>
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
                      <ellipse cx="204" cy="72" rx="3" ry="6" fill="#F2C94C" stroke="#27AE60" strokeWidth="1" />
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
                  <div style={{ display: "flex", gap: "28px", alignItems: "flex-end", flexShrink: 0 }}>
                    <div style={{ textAlign: "center", minWidth: "110px" }}>
                      <div style={{ height: selectedQuotation.items.length > 3 ? "25px" : "35px" }}></div>
                      <p style={{ borderTop: "1.5px solid #EAE3D2", paddingTop: "6px", fontSize: "11px", fontWeight: 700, color: "#4E6C50", whiteSpace: "nowrap" }}>
                        Receiver's Signature
                      </p>
                    </div>
                    <div style={{ textAlign: "center", minWidth: "110px" }}>
                      <div style={{ height: selectedQuotation.items.length > 3 ? "25px" : "35px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                        {settings.signature ? (
                          <img src={settings.signature} alt="E-Signature" style={{ maxHeight: selectedQuotation.items.length > 3 ? "22px" : "30px", maxWidth: "100px", objectFit: "contain", mixBlendMode: "multiply" }} />
                        ) : null}
                      </div>
                      <p style={{ borderTop: "1.5px solid #EAE3D2", paddingTop: "6px", fontSize: "11px", fontWeight: 700, color: "#4E6C50", whiteSpace: "nowrap" }}>
                        Authorized Signatory
                      </p>
                    </div>
                  </div>
                </div>
                {settings.footerMessage && (
                  <div style={{
                    textAlign: "center",
                    fontSize: selectedQuotation.items.length > 3 ? "9px" : "10px",
                    color: "var(--text-muted)",
                    borderTop: "1px dashed var(--border-color)",
                    paddingTop: selectedQuotation.items.length > 3 ? "4px" : "8px",
                    width: "100%"
                  }}>
                    {settings.footerMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="print-invoice-layout thermal">
              <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>{(settings.businessName || "AgriBiz").toUpperCase()}</h3>
                {settings.showAddress && <p style={{ margin: "2px 0 0 0", fontSize: "11px" }}>{getFullAddress(settings)}</p>}
                {settings.showContact && (
                  <p style={{ margin: 0, fontSize: "11px" }}>
                    {[settings.phone, settings.email].filter(Boolean).join(' • ')}
                  </p>
                )}
                {settings.showGstin && settings.gstin && <p style={{ margin: "4px 0 0 0", fontSize: "11px", fontWeight: "bold" }}>GSTIN: {settings.gstin}</p>}
              </div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Est No: <strong>{selectedQuotation.quotationNumber}</strong></span>
                  <span>Date: {formatDate(selectedQuotation.date)}</span>
                </div>
                <div>Customer: <strong>{customerDetail?.name || "Walk-in"}</strong></div>
                {customerDetail?.phone && <div>Phone: {customerDetail.phone}</div>}
              </div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ fontSize: "11px" }}>
                <div style={{ fontWeight: "bold", display: "grid", gridTemplateColumns: "3fr 1fr 1fr", paddingBottom: "4px" }}>
                  <span>ITEM</span>
                  <span style={{ textAlign: "center" }}>QTY</span>
                  <span style={{ textAlign: "right" }}>AMT(₹)</span>
                </div>
                <div style={{ borderTop: "1px solid #eee", margin: "4px 0" }}></div>
                {selectedQuotation.items.map((item, index) => (
                  <div key={index} style={{ marginBottom: "6px", display: "grid", gridTemplateColumns: "3fr 1fr 1fr" }}>
                    <div>
                      <span style={{ fontWeight: "bold" }}>{item.productName}</span>
                      <div style={{ fontSize: "10px", color: "#555" }}>Rate: ₹{item.price} | GST: {item.gstRate}%</div>
                    </div>
                    <span style={{ textAlign: "center", fontWeight: "bold" }}>{item.quantity}</span>
                    <span style={{ textAlign: "right", fontWeight: "bold" }}>{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Taxable</span>
                  <span>₹{quotationTotals.subtotal.toFixed(2)}</span>
                </div>
                {quotationTotals.discountTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Discount (-)</span>
                    <span>₹{quotationTotals.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                {isInterState ? (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>IGST ({selectedQuotation.items[0]?.gstRate || 18}%)</span>
                    <span>₹{quotationTotals.gstTotal.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>CGST ({(selectedQuotation.items[0]?.gstRate || 18) / 2}%)</span>
                      <span>₹{(quotationTotals.gstTotal / 2).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>SGST ({(selectedQuotation.items[0]?.gstRate || 18) / 2}%)</span>
                      <span>₹{(quotationTotals.gstTotal / 2).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "4px 0" }}>
                  <span>GRAND TOTAL EST</span>
                  <span>₹{quotationTotals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
              <div style={{ textAlign: "center", fontSize: "10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <div>{settings.footerMessage || "THANK YOU!"}</div>
                {selectedQuotation.notes && <div style={{ fontStyle: "italic" }}>"{selectedQuotation.notes}"</div>}
                <div style={{ fontSize: "8px", color: "#777", marginTop: "4px" }}>Powered by {settings.businessName || "AgriBiz"} POS software</div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="no-print preview-actions-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
          {selectedQuotation.status !== 'Converted' && (
            <button 
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
              onClick={() => {
                setConvertQuotationId(selectedQuotation.id);
                setConvertAmountPaid(selectedQuotation.grandTotal);
                setIsConvertModalOpen(true);
              }}
            >
              <Store size={15} /> Convert to Invoice
            </button>
          )}
          {selectedQuotation.status !== 'Converted' && (
            <button className="btn btn-secondary" onClick={() => handleStartEditQuotation(selectedQuotation)}>
              <Edit2 size={15} /> Edit Quotation
            </button>
          )}
          
          {/* Status Actions */}
          {selectedQuotation.status === 'Draft' && (
            <>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  editQuotation({ ...selectedQuotation, status: 'Sent' });
                  showToast('Quotation marked as Sent', 'success');
                }}
              >
                Mark as Sent
              </button>
              <button 
                className="btn btn-secondary"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                onClick={() => {
                  editQuotation({ ...selectedQuotation, status: 'Approved' });
                  showToast('Quotation Approved successfully', 'success');
                }}
              >
                Approve
              </button>
            </>
          )}
          
          {selectedQuotation.status === 'Sent' && (
            <>
              <button 
                className="btn btn-secondary"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                onClick={() => {
                  editQuotation({ ...selectedQuotation, status: 'Approved' });
                  showToast('Quotation Approved successfully', 'success');
                }}
              >
                Approve
              </button>
              <button 
                className="btn btn-secondary"
                style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                onClick={() => {
                  editQuotation({ ...selectedQuotation, status: 'Declined' });
                  showToast('Quotation marked as Declined', 'info');
                }}
              >
                Decline
              </button>
            </>
          )}
          
          {selectedQuotation.status === 'Approved' && (
            <>
              <button 
                className="btn btn-secondary"
                style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                onClick={() => {
                  editQuotation({ ...selectedQuotation, status: 'Declined' });
                  showToast('Quotation marked as Declined', 'info');
                }}
              >
                Decline
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  editQuotation({ ...selectedQuotation, status: 'Draft' });
                  showToast('Quotation reverted to Draft', 'info');
                }}
              >
                Revert to Draft
              </button>
            </>
          )}
          
          {selectedQuotation.status === 'Declined' && (
            <>
              <button 
                className="btn btn-secondary"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                onClick={() => {
                  editQuotation({ ...selectedQuotation, status: 'Approved' });
                  showToast('Quotation Approved successfully', 'success');
                }}
              >
                Approve
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  editQuotation({ ...selectedQuotation, status: 'Draft' });
                  showToast('Quotation reverted to Draft', 'info');
                }}
              >
                Revert to Draft
              </button>
            </>
          )}

          <button className="btn btn-secondary" style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)" }} onClick={() => handleDeleteQuotation(selectedQuotation.id, selectedQuotation.quotationNumber)}>
            <Trash2 size={16} /> Delete Quotation
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
      <div style={{ animation: 'fadeIn 0.2s ease-out', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <form onSubmit={handleSaveInvoice}>
          
          {/* Section 1 & 2: Designed Banner Header */}
          <div className="creator-banner-header" style={{
            background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 60%, #34d399 100%)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.25)',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* decorative circles for aesthetic premium feeling */}
            <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 60, bottom: -60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsCreatingInvoice(false);
                  setEditingInvoiceId(null);
                  setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
                }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s',
                  height: '42px',
                }}
              >
                <ArrowLeft size={16} /> Cancel
              </button>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  New Invoice
                </span>
                <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
                  Create Sales Invoice
                </h1>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '10px 18px',
              textAlign: 'right',
              backdropFilter: 'blur(8px)',
              zIndex: 1,
            }} className="voucher-section-box">
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Voucher Number
              </span>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px', display: 'block', marginTop: '2px' }}>
                {invoiceNumber}
              </span>
            </div>
          </div>

          {/* Section 3: Customer Section */}
          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>1</span>
              Customer &amp; Date
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Customer Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Customer *</label>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <select
                    className="form-control"
                    style={{ flex: 1, minWidth: 0, height: '42px', fontSize: '13px' }}
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    <option value="">— Select Customer —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} — Bal: {formatINR(c.outstanding)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsCustomerModalOpen(true)}
                    style={{ height: '42px', padding: '0 12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <Plus size={16} /> <span className="hide-on-mobile-inline">New Customer</span>
                  </button>
                </div>
              </div>

              {/* Billing Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Billing Date *</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: '100%', height: '42px', fontSize: '13px' }}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Active Customer Chip */}
            {activeCustomer && (
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                  {activeCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{activeCustomer.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeCustomer.phone} {activeCustomer.address ? `· ${activeCustomer.address}` : ''}</div>
                </div>
                {activeCustomer.outstanding > 0 && (
                  <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}>
                    Outstanding: {formatINR(activeCustomer.outstanding)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Product Section */}
          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>2</span>
                Billed Products
              </h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddItemRow}
                style={{ padding: '8px 14px', height: '36px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Add Row
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Desktop table header row */}
              <div className="billed-items-header-row">
                <div>Product *</div>
                <div style={{ textAlign: 'center' }}>Stock</div>
                <div style={{ textAlign: 'right' }}>Unit Price (₹) *</div>
                <div style={{ textAlign: 'center' }}>Qty *</div>
                <div style={{ textAlign: 'center' }}>Disc %</div>
                <div style={{ textAlign: 'right' }}>Net Total</div>
                <div></div>
              </div>

              <div className="billed-items-list">
                {items.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId);
                  const calcs = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
                  return (
                    <div key={index} className="billed-item-card">
                      {/* Mobile card header with Item number and delete action */}
                      <div className="mobile-item-header">
                        <span className="mobile-item-title">Item #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                          title="Remove row"
                        >
                          <Trash2 size={16} style={{ color: 'var(--color-danger)' }} />
                        </button>
                      </div>

                      {/* Product Selector */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="mobile-field-label">Product *</span>
                        <select
                          className="form-control"
                          style={{ width: '100%', height: '40px', fontSize: '13px' }}
                          value={item.productId}
                          onChange={(e) => handleUpdateItemRow(index, 'productId', e.target.value)}
                          required
                        >
                          <option value="">— Choose Product —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                              {p.name} [{p.category}]{p.stock <= 0 ? ' (Out of Stock)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Stock & Unit Price grid row */}
                      <div className="mobile-grid-2">
                        <div>
                          <span className="mobile-field-label">Stock</span>
                          <div style={{
                            height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)',
                            borderRadius: '8px', fontWeight: 600, fontSize: '13px'
                          }}>
                            {product ? (
                              <span style={{
                                padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                                background: product.stock <= product.minStock ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                color: product.stock <= product.minStock ? 'var(--color-danger)' : 'var(--color-success-dark)',
                              }}>
                                {product.stock}
                              </span>
                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </div>
                        </div>
                        <div>
                          <span className="mobile-field-label">Unit Price (₹) *</span>
                          <input
                            type="number"
                            className="form-control"
                            style={{ textAlign: 'right', height: '40px', fontSize: '13px' }}
                            placeholder="0.00"
                            min="0"
                            step="any"
                            value={item.price || ''}
                            onChange={(e) => handleUpdateItemRow(index, 'price', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                      </div>

                      {/* Qty & Discount grid row */}
                      <div className="mobile-grid-2">
                        <div>
                          <span className="mobile-field-label">Qty *</span>
                          <input
                            type="number"
                            className="form-control"
                            style={{ textAlign: 'center', height: '40px', fontSize: '13px' }}
                            placeholder="1"
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => handleUpdateItemRow(index, 'quantity', parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div>
                          <span className="mobile-field-label">Disc %</span>
                          <div style={{ position: 'relative' }}>
                            <Percent size={11} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <input
                              type="number"
                              className="form-control"
                              style={{ textAlign: 'center', paddingRight: '22px', height: '40px', fontSize: '13px' }}
                              placeholder="0"
                              min="0"
                              max="100"
                              value={item.discount || ''}
                              onChange={(e) => handleUpdateItemRow(index, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Net Total display */}
                      <div className="mobile-total-row">
                        <span className="mobile-total-label">Net Total:</span>
                        <span className="mobile-total-value">
                          {formatINR(calcs.total)}
                        </span>
                      </div>

                      {/* Desktop-only delete button */}
                      <div style={{ display: 'flex', justifyContent: 'center' }} className="desktop-delete-btn-col">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          title="Remove row"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', borderRadius: '6px', padding: '6px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid layout for Payment & Summary side-by-side on desktop, stacked on mobile */}
          <div className="invoice-creator-container" style={{ gap: '20px', alignItems: 'start', marginBottom: '24px' }}>
            
            {/* Section 5: Payment Section */}
            <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>3</span>
                Payment &amp; Notes
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Amount Collected (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    min="0"
                    max={totals.grandTotal}
                    value={amountPaid || ''}
                    onChange={(e) => setAmountPaid(Math.min(totals.grandTotal, Math.max(0, parseFloat(e.target.value) || 0)))}
                    style={{ height: '42px', fontSize: '13px' }}
                  />
                </div>

                {amountPaid > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Payment Method *</label>
                    <select
                      className="form-control"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ height: '42px', fontSize: '13px' }}
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Billing Remarks / Notes</label>
                  <textarea
                    className="form-control"
                    placeholder="Remarks printed on customer invoice..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ fontSize: '13px', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Billing Summary */}
            <div style={{
              borderRadius: '12px',
              background: 'linear-gradient(145deg, var(--bg-card) 0%, color-mix(in srgb, var(--bg-card) 90%, var(--primary) 10%) 100%)',
              border: '1.5px solid color-mix(in srgb, var(--primary) 20%, var(--border-color))',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(16,185,129,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                Billing Summary
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatINR(totals.subtotal)}</span>
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
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatINR(totals.gstTotal)}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CGST ({currentGstRate / 2}%)</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatINR(totals.gstTotal / 2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>SGST ({currentGstRate / 2}%)</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatINR(totals.gstTotal / 2)}</span>
                  </div>
                </>
              )}

              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

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
                display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700,
                padding: '8px 12px', borderRadius: '8px', marginTop: '4px',
                background: balanceDue > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                color: balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)',
                border: `1px solid ${balanceDue > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
              }}>
                <span>{balanceDue > 0 ? 'Balance Due' : '✓ Fully Paid'}</span>
                <span>{formatINR(balanceDue)}</span>
              </div>

              {/* Payment Status badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                background: amountPaid === 0 
                  ? 'rgba(239, 68, 68, 0.08)' 
                  : amountPaid < totals.grandTotal 
                    ? 'rgba(245, 158, 11, 0.08)' 
                    : 'rgba(16, 185, 129, 0.08)',
                color: amountPaid === 0 
                  ? 'var(--color-danger)' 
                  : amountPaid < totals.grandTotal 
                    ? '#b45309' 
                    : 'var(--color-success-dark)',
                border: `1px solid ${
                  amountPaid === 0 
                    ? 'rgba(239, 68, 68, 0.2)' 
                    : amountPaid < totals.grandTotal 
                      ? 'rgba(245, 158, 11, 0.2)' 
                      : 'rgba(16, 185, 129, 0.2)'
                }`
              }}>
                <span>Payment Status</span>
                <span>
                  {amountPaid === 0 
                    ? 'Pending' 
                    : amountPaid < totals.grandTotal 
                      ? 'Partially Paid' 
                      : 'Fully Paid'}
                </span>
              </div>

              {/* Section 7: Footer Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '14px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  disabled={items.length === 0 || !items[0].productId}
                >
                  {editingInvoiceId ? '✓ Update Invoice' : '✓ Save & Print Invoice'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsCreatingInvoice(false);
                    setEditingInvoiceId(null);
                    setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
                  }}
                  style={{
                    width: '100%',
                    height: '42px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Discard Draft
                </button>
              </div>
            </div>

          </div>
        </form>

        <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSaveCallback={(c) => setSelectedCustomerId(c.id)} />
      </div>
    );
  }

  if (isCreatingQuotation) {
    const originalQuotation = editingQuotationId ? quotations.find((q) => q.id === editingQuotationId) : null;
    const quotationNumber = originalQuotation ? originalQuotation.quotationNumber : `QT-${(quotations.length + 1).toString().padStart(3, '0')}`;
    const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
    const isCreatorInterState = activeCustomer && activeCustomer.state && settings.state && activeCustomer.state !== settings.state;
    const currentGstRate = (items[0]?.productId ? products.find((p) => p.id === items[0].productId)?.gstRate : 18) ?? 18;

    return (
      <div style={{ animation: 'fadeIn 0.2s ease-out', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <form onSubmit={handleSaveQuotation}>

          {/* Section 1 & 2: Designed Banner Header */}
          <div className="creator-banner-header" style={{
            background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 60%, #8b5cf6 100%)',
            boxShadow: '0 8px 32px rgba(139,92,246,0.25)',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* decorative circles for aesthetic premium feeling */}
            <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 60, bottom: -60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsCreatingQuotation(false);
                  setEditingQuotationId(null);
                  setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
                }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s',
                  height: '42px',
                }}
              >
                <ArrowLeft size={16} /> Cancel
              </button>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {editingQuotationId ? 'Edit Quotation' : 'New Quotation'}
                </span>
                <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
                  {editingQuotationId ? 'Update Quotation' : 'Create Sales Estimate'}
                </h1>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '10px 18px',
              textAlign: 'right',
              backdropFilter: 'blur(8px)',
              zIndex: 1,
            }} className="voucher-section-box">
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Estimate Number
              </span>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px', display: 'block', marginTop: '2px' }}>
                {quotationNumber}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {/* Step 1: Customer & Dates */}
            <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'rgba(139,92,246,0.1)', color: 'var(--primary-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>1</span>
                Customer &amp; Dates
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Customer selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Customer *</label>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <select
                      className="form-control"
                      style={{ flex: 1, minWidth: 0, height: '42px', fontSize: '13px' }}
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                    >
                      <option value="">— Select Customer —</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''} — Bal: {formatINR(c.outstanding)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsCustomerModalOpen(true)}
                      style={{ height: '42px', padding: '0 12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                    >
                      <Plus size={16} /> <span className="hide-on-mobile-inline">New Customer</span>
                    </button>
                  </div>
                </div>

                {/* Dates grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Quote Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      style={{ width: '100%', height: '42px', fontSize: '13px' }}
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Valid Until *</label>
                    <input
                      type="date"
                      className="form-control"
                      style={{ width: '100%', height: '42px', fontSize: '13px' }}
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Active Customer Chip */}
              {activeCustomer && (
                <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                    {activeCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{activeCustomer.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeCustomer.phone} {activeCustomer.address ? `· ${activeCustomer.address}` : ''}</div>
                  </div>
                  {activeCustomer.outstanding > 0 && (
                    <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}>
                      Outstanding: {formatINR(activeCustomer.outstanding)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Quoted Products */}
            <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'rgba(139,92,246,0.1)', color: 'var(--primary-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>2</span>
                  Quoted Products
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddItemRow}
                  style={{ padding: '8px 14px', height: '36px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Row
                </button>
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Desktop header row */}
                <div className="billed-items-header-row" style={{ gridTemplateColumns: '3.5fr 1fr 1.5fr 1.5fr 1fr 1.5fr 0.5fr' }}>
                  <div>Product *</div>
                  <div style={{ textAlign: 'center' }}>GST %</div>
                  <div style={{ textAlign: 'right' }}>Unit Price (₹) *</div>
                  <div style={{ textAlign: 'center' }}>Qty *</div>
                  <div style={{ textAlign: 'center' }}>Disc %</div>
                  <div style={{ textAlign: 'right' }}>Net Total</div>
                  <div></div>
                </div>

                <div className="billed-items-list">
                  {items.map((item, index) => {
                    const product = products.find((p) => p.id === item.productId);
                    const calcs = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
                    return (
                      <div key={index} className="billed-item-card" style={{ gridTemplateColumns: '3.5fr 1fr 1.5fr 1.5fr 1fr 1.5fr 0.5fr' }}>
                        {/* Mobile item header */}
                        <div className="mobile-item-header">
                          <span className="mobile-item-title">Item #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            title="Remove row"
                          >
                            <Trash2 size={16} style={{ color: 'var(--color-danger)' }} />
                          </button>
                        </div>

                        {/* Product dropdown */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span className="mobile-field-label">Product *</span>
                          <select
                            className="form-control"
                            style={{ width: '100%', height: '40px', fontSize: '13px' }}
                            value={item.productId}
                            onChange={(e) => handleUpdateItemRow(index, 'productId', e.target.value)}
                            required
                          >
                            <option value="">— Choose Product —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.stock})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* GST & Unit Price grid row */}
                        <div className="mobile-grid-2">
                          <div>
                            <span className="mobile-field-label">GST %</span>
                            <div style={{
                              height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)',
                              borderRadius: '8px', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)'
                            }}>
                              {product ? `${product.gstRate}%` : '—'}
                            </div>
                          </div>
                          <div>
                            <span className="mobile-field-label">Unit Price (₹) *</span>
                            <input
                              type="number"
                              className="form-control"
                              style={{ textAlign: 'right', height: '40px', fontSize: '13px' }}
                              placeholder="0.00"
                              min="0"
                              step="any"
                              value={item.price || ''}
                              onChange={(e) => handleUpdateItemRow(index, 'price', parseFloat(e.target.value) || 0)}
                              required
                            />
                          </div>
                        </div>

                        {/* Qty & Discount grid row */}
                        <div className="mobile-grid-2">
                          <div>
                            <span className="mobile-field-label">Qty *</span>
                            <input
                              type="number"
                              className="form-control"
                              style={{ textAlign: 'center', height: '40px', fontSize: '13px' }}
                              placeholder="1"
                              min="1"
                              value={item.quantity || ''}
                              onChange={(e) => handleUpdateItemRow(index, 'quantity', parseInt(e.target.value) || 0)}
                              required
                            />
                          </div>
                          <div>
                            <span className="mobile-field-label">Disc %</span>
                            <div style={{ position: 'relative' }}>
                              <Percent size={11} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                              <input
                                type="number"
                                className="form-control"
                                style={{ textAlign: 'center', paddingRight: '22px', height: '40px', fontSize: '13px' }}
                                placeholder="0"
                                min="0"
                                max="100"
                                value={item.discount || ''}
                                onChange={(e) => handleUpdateItemRow(index, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Net Total display */}
                        <div className="mobile-total-row">
                          <span className="mobile-total-label">Net Total:</span>
                          <span className="mobile-total-value">
                            {formatINR(calcs.total)}
                          </span>
                        </div>

                        {/* Desktop-only delete button */}
                        <div style={{ display: 'flex', justifyContent: 'center' }} className="desktop-delete-btn-col">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            title="Remove row"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--text-muted)', borderRadius: '6px', padding: '6px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Notes & Terms + Summary */}
            <div className="invoice-creator-container" style={{ gap: '20px', alignItems: 'start', marginBottom: '24px' }}>
              
              {/* Remarks card */}
              <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'rgba(139,92,246,0.1)', color: 'var(--primary-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>3</span>
                  Remarks &amp; Terms
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Internal Remarks / Terms</label>
                  <textarea
                    className="form-control"
                    style={{ fontSize: '13px', resize: 'vertical', minHeight: '130px' }}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., Validity extensions, special dealer terms, packaging notes..."
                  />
                </div>
              </div>

              {/* Estimate Summary card */}
              <div style={{
                borderRadius: '12px',
                background: 'linear-gradient(145deg, var(--bg-card) 0%, color-mix(in srgb, var(--bg-card) 90%, var(--primary) 10%) 100%)',
                border: '1.5px solid color-mix(in srgb, var(--primary) 20%, var(--border-color))',
                padding: '20px',
                boxShadow: '0 8px 24px rgba(16,185,129,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  Estimate Summary
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatINR(totals.subtotal)}</span>
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
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatINR(totals.gstTotal)}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>CGST ({currentGstRate / 2}%)</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatINR(totals.gstTotal / 2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>SGST ({currentGstRate / 2}%)</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatINR(totals.gstTotal / 2)}</span>
                    </div>
                  </>
                )}

                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                  <span style={{ color: 'var(--primary-dark)' }}>{formatINR(totals.grandTotal)}</span>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      height: '46px',
                      fontSize: '14px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {editingQuotationId ? '✓ Update Quotation' : '✓ Save Quotation'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsCreatingQuotation(false);
                      setEditingQuotationId(null);
                      setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
                    }}
                    style={{
                      width: '100%',
                      height: '42px',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
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


  // 3. INVOICES / QUOTATIONS TABLE LIST VIEW (DEFAULT)
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Segmented Tab Control */}
      <div className="no-print" style={{ 
        display: 'flex', 
        gap: '8px', 
        borderBottom: '1px solid var(--border-color)', 
        marginBottom: '24px',
        paddingBottom: '2px'
      }}>
        <button
          type="button"
          onClick={() => {
            setSalesActiveTab('invoices');
            setStatusFilter('All');
            setCurrentPage(1);
          }}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            color: salesActiveTab === 'invoices' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: salesActiveTab === 'invoices' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileText size={16} /> Sales Invoices
        </button>
        <button
          type="button"
          onClick={() => {
            setSalesActiveTab('quotations');
            setStatusFilter('All');
            setCurrentPage(1);
          }}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            color: salesActiveTab === 'quotations' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: salesActiveTab === 'quotations' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Calendar size={16} /> Estimates & Quotations
        </button>
      </div>

      {/* KPI Cards section */}
      {salesActiveTab === 'invoices' ? (
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
      ) : (
        <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
          <div className="kpi-card" style={{ cursor: 'default' }}>
            <div className="kpi-info" style={{ gap: '2px' }}>
              <span className="kpi-label" style={{ fontSize: '11px' }}>Total Estimates</span>
              <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800 }}>
                {formatINR(totalQuoted)}
              </span>
              <span className="kpi-subtext" style={{ fontSize: '10px' }}>
                Active quoted value
              </span>
            </div>
          </div>
          <div className="kpi-card" style={{ cursor: 'default' }}>
            <div className="kpi-info" style={{ gap: '2px' }}>
              <span className="kpi-label" style={{ fontSize: '11px' }}>Approved Value</span>
              <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-success-dark)' }}>
                {formatINR(approvedQuoted)}
              </span>
              <span className="kpi-subtext" style={{ fontSize: '10px' }}>
                Estimates won or converted
              </span>
            </div>
          </div>
          <div className="kpi-card" style={{ cursor: 'default' }}>
            <div className="kpi-info" style={{ gap: '2px' }}>
              <span className="kpi-label" style={{ fontSize: '11px' }}>Open Quotations</span>
              <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-warning-dark, #b45309)' }}>
                {openQuotedCount} drafts
              </span>
              <span className="kpi-subtext" style={{ fontSize: '10px' }}>
                Drafts and sent estimates
              </span>
            </div>
          </div>
          <div className="kpi-card" style={{ cursor: 'default' }}>
            <div className="kpi-info" style={{ gap: '2px' }}>
              <span className="kpi-label" style={{ fontSize: '11px' }}>Estimate Count</span>
              <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-info)' }}>
                {totalQuotedCount} estimates
              </span>
              <span className="kpi-subtext" style={{ fontSize: '10px' }}>
                Total quotations logged
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Filter and Action Button */}
      <div className="filters-row-unified">
        <div className="filters-group-one">
          <div className="search-input-wrapper sales-search-wrapper">
            <Search size={16} className="search-input-icon" />
            <input 
              type="text" 
              placeholder={salesActiveTab === 'invoices' ? "Search invoice or customer..." : "Search quotation or customer..."} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          {/* Desktop Segmented Filter Control */}
          <div className="desktop-status-filters" style={{ backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '10px', border: '1.5px solid var(--border-color)', gap: '2px', flexShrink: 0, overflowX: 'auto' }}>
            {(salesActiveTab === 'invoices' 
              ? ['All', 'Paid', 'Partial', 'Unpaid'] 
              : ['All', 'Draft', 'Sent', 'Approved', 'Declined', 'Converted']
            ).map((status) => {
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
                  {status}
                </button>
              );
            })}
          </div>

          {/* Mobile Status Select Dropdown */}
          <div className="mobile-status-select-wrapper">
            <select
              className="filter-select status-select-field"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {(salesActiveTab === 'invoices' 
                ? ['All', 'Paid', 'Partial', 'Unpaid'] 
                : ['All', 'Draft', 'Sent', 'Approved', 'Declined', 'Converted']
              ).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
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

          {/* Action button */}
          {salesActiveTab === 'invoices' ? (
            <button className="btn btn-primary" onClick={handleStartNewInvoice}>
              <Plus size={16} /> New Invoice
            </button>
          ) : (
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }} onClick={() => {
              setSelectedCustomerId('');
              setInvoiceDate(new Date().toISOString().split('T')[0]);
              setValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
              setItems([{ productId: '', quantity: 1, price: 0, discount: 0 }]);
              setNotes('');
              setIsCreatingQuotation(true);
            }}>
              <Plus size={16} /> New Quotation
            </button>
          )}
        </div>
      </div>

      {/* Main List Card Container */}
      <div className="card">
        {salesActiveTab === 'invoices' ? (
          sortedInvoices.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} className="empty-state-icon" />
              <h4 className="empty-state-title">No Invoices Found</h4>
              <p className="empty-state-text" style={{ maxWidth: '320px', margin: '8px auto 0 auto' }}>
                Create a billing voucher by clicking 'New Invoice' to sell implements and parts.
              </p>
            </div>
          ) : (
            <div>
              {/* Invoices Desktop Table */}
              <div className="desktop-only-table">
                <div className="table-wrapper" style={{ overflow: 'visible' }}>
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ whiteSpace: 'nowrap' }}>Inv No</th>
                        <th>Customer</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Date</th>
                        <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Total (₹)</th>
                        <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Paid (₹)</th>
                        <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Due (₹)</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                        <th className="no-print" style={{ whiteSpace: 'nowrap', textAlign: 'center', width: '60px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td 
                            style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            onClick={() => setViewInvoice(inv.id || inv.invoiceNumber)}
                            title="View details"
                          >
                            {inv.invoiceNumber}
                          </td>
                          <td 
                            style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}
                            onClick={() => {
                              if (inv.customerId) {
                                setViewCustomer(inv.customerId);
                                setCurrentTab('customers');
                              }
                            }}
                          >
                            {inv.customerName}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(inv.date)}</td>
                          <td style={{ fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>{formatINR(inv.grandTotal).replace('₹', '')}</td>
                          <td style={{ color: 'var(--color-success-dark)', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'right' }}>{formatINR(inv.amountPaid).replace('₹', '')}</td>
                          <td style={{ color: inv.balanceDue > 0 ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'right' }}>
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
                            >
                              <MoreVertical size={16} />
                            </button>
                            {activeMenuInvoiceId === inv.id && (
                              <>
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuInvoiceId(null)} />
                                <div className="card" style={{
                                  position: 'absolute', right: '100%', top: '0', marginRight: '8px', zIndex: 999,
                                  minWidth: '130px', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '2px',
                                  backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                                }}>
                                  <button 
                                    className="dropdown-item" 
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}
                                    onClick={() => { setViewInvoice(inv.id || inv.invoiceNumber); setActiveMenuInvoiceId(null); }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <Eye size={14} /> View
                                  </button>
                                  <button 
                                    className="dropdown-item" 
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}
                                    onClick={() => { handleStartEditInvoice(inv); setActiveMenuInvoiceId(null); }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <Edit2 size={14} /> Edit
                                  </button>
                                  <button 
                                    className="dropdown-item danger" 
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                    onClick={() => { handleDeleteInvoice(inv.id || inv.invoiceNumber, inv.invoiceNumber); setActiveMenuInvoiceId(null); }}
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

              {/* Invoices Mobile list */}
              <div className="mobile-card-list">
                {paginatedInvoices.map((inv) => (
                  <div key={inv.id} className="mobile-list-card">
                    <div className="mobile-list-card-header">
                      <div>
                        <h4 className="mobile-list-card-title">
                          <button type="button" className="table-link-btn bill-link" onClick={() => setViewInvoice(inv.id || inv.invoiceNumber)}>
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
                              position: 'absolute', right: '0', top: '100%', marginTop: '4px', zIndex: 999,
                              minWidth: '140px', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '2px',
                              backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
                            }}>
                              <button 
                                className="dropdown-item" 
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}
                                onClick={() => { setViewInvoice(inv.id || inv.invoiceNumber); setActiveMenuInvoiceId(null); }}
                              >
                                <Eye size={14} /> View
                              </button>
                              <button 
                                className="dropdown-item" 
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}
                                onClick={() => { handleStartEditInvoice(inv); setActiveMenuInvoiceId(null); }}
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                              <button 
                                className="dropdown-item danger" 
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                onClick={() => { handleDeleteInvoice(inv.id || inv.invoiceNumber, inv.invoiceNumber); setActiveMenuInvoiceId(null); }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Date: {formatDate(inv.date)}</span>
                      <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-success' : inv.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>{inv.paymentStatus}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '8px' }}>
                      <span>Total: {formatINR(inv.grandTotal)}</span>
                      <span style={{ color: inv.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                        Due: {formatINR(inv.balanceDue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invoices Pagination */}
              {totalPages > 1 && (
                <div className="pagination-row">
                  <span>
                    Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * itemsPerPage, filteredInvoices.length)}</strong> of{' '}
                    <strong>{filteredInvoices.length}</strong> invoices
                  </span>
                  <div className="pagination-btn-group">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft size={16} />
                    </button>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          sortedQuotations.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} className="empty-state-icon" />
              <h4 className="empty-state-title">No Quotations Found</h4>
              <p className="empty-state-text" style={{ maxWidth: '320px', margin: '8px auto 0 auto' }}>
                Log commercial sales estimates and quotations by clicking 'New Quotation'.
              </p>
            </div>
          ) : (
            <div>
              {/* Quotations Desktop Table */}
              <div className="desktop-only-table">
                <div className="table-wrapper" style={{ overflow: 'visible' }}>
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ whiteSpace: 'nowrap' }}>Est No</th>
                        <th>Customer</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Date</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Valid Until</th>
                        <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Total (₹)</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                        <th className="no-print" style={{ whiteSpace: 'nowrap', textAlign: 'center', width: '60px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedQuotations.map((q) => (
                        <tr key={q.id}>
                          <td 
                            style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            onClick={() => setViewQuotation(q.id || q.quotationNumber)}
                            title="View details"
                          >
                            {q.quotationNumber}
                          </td>
                          <td 
                            style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}
                            onClick={() => {
                              if (q.customerId) {
                                setViewCustomer(q.customerId);
                                setCurrentTab('customers');
                              }
                            }}
                          >
                            {q.customerName}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(q.date)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(q.validUntil)}</td>
                          <td style={{ fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>{formatINR(q.grandTotal).replace('₹', '')}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span className={`badge ${
                              q.status === 'Converted' ? 'badge-success' : 
                              q.status === 'Approved' ? 'badge-info' : 
                              q.status === 'Declined' ? 'badge-danger' : 
                              'badge-secondary'
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="no-print" style={{ position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuQuotationId(activeMenuQuotationId === q.id ? null : q.id);
                              }}
                            >
                              <MoreVertical size={16} />
                            </button>
                            {activeMenuQuotationId === q.id && (
                              <>
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuQuotationId(null)} />
                                <div className="card" style={{
                                  position: 'absolute', right: '100%', top: '0', marginRight: '8px', zIndex: 999,
                                  minWidth: '140px', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '2px',
                                  backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                                }}>
                                  <button 
                                    className="dropdown-item" 
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}
                                    onClick={() => { setViewQuotation(q.id || q.quotationNumber); setActiveMenuQuotationId(null); }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <Eye size={14} /> View
                                  </button>
                                  {q.status !== 'Converted' && (
                                    <button 
                                      className="dropdown-item" 
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}
                                      onClick={() => { handleStartEditQuotation(q); setActiveMenuQuotationId(null); }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                      <Edit2 size={14} /> Edit
                                    </button>
                                  )}
                                  {q.status !== 'Converted' && (
                                    <button 
                                      className="dropdown-item" 
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#10b981' }}
                                      onClick={() => {
                                        setConvertQuotationId(q.id);
                                        setConvertAmountPaid(q.grandTotal);
                                        setIsConvertModalOpen(true);
                                        setActiveMenuQuotationId(null);
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                      <Store size={14} /> Convert
                                    </button>
                                  )}
                                  <button 
                                    className="dropdown-item danger" 
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                    onClick={() => { handleDeleteQuotation(q.id, q.quotationNumber); setActiveMenuQuotationId(null); }}
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

              {/* Quotations Mobile list */}
              <div className="mobile-card-list">
                {paginatedQuotations.map((q) => (
                  <div key={q.id} className="mobile-list-card">
                    <div className="mobile-list-card-header">
                      <div>
                        <h4 className="mobile-list-card-title">
                          <button type="button" className="table-link-btn bill-link" onClick={() => setViewQuotation(q.id || q.quotationNumber)}>
                            {q.quotationNumber}
                          </button>
                        </h4>
                        <span className="mobile-list-card-subtitle">{q.customerName}</span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={(e) => { e.stopPropagation(); setActiveMenuQuotationId(activeMenuQuotationId === q.id ? null : q.id); }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenuQuotationId === q.id && (
                          <>
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuQuotationId(null)} />
                            <div className="card" style={{
                              position: 'absolute', right: '0', top: '100%', marginTop: '4px', zIndex: 999,
                              minWidth: '140px', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '2px',
                              backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
                            }}>
                              <button 
                                className="dropdown-item" 
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}
                                onClick={() => { setViewQuotation(q.id || q.quotationNumber); setActiveMenuQuotationId(null); }}
                              >
                                <Eye size={14} /> View
                              </button>
                              {q.status !== 'Converted' && (
                                <button 
                                  className="dropdown-item" 
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}
                                  onClick={() => { handleStartEditQuotation(q); setActiveMenuQuotationId(null); }}
                                >
                                  <Edit2 size={14} /> Edit
                                </button>
                              )}
                              {q.status !== 'Converted' && (
                                <button 
                                  className="dropdown-item" 
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#10b981' }}
                                  onClick={() => {
                                    setConvertQuotationId(q.id);
                                    setConvertAmountPaid(q.grandTotal);
                                    setIsConvertModalOpen(true);
                                    setActiveMenuQuotationId(null);
                                  }}
                                >
                                  <Store size={14} /> Convert
                                </button>
                              )}
                              <button 
                                className="dropdown-item danger" 
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                onClick={() => { handleDeleteQuotation(q.id, q.quotationNumber); setActiveMenuQuotationId(null); }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Date: {formatDate(q.date)}</span>
                      <span className={`badge ${
                        q.status === 'Converted' ? 'badge-success' : 
                        q.status === 'Approved' ? 'badge-info' : 
                        q.status === 'Declined' ? 'badge-danger' : 
                        'badge-secondary'
                      }`}>{q.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '8px' }}>
                      <span>Total Value: {formatINR(q.grandTotal)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Valid: {formatDate(q.validUntil)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quotations Pagination */}
              {totalPages > 1 && (
                <div className="pagination-row">
                  <span>
                    Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * itemsPerPage, filteredQuotations.length)}</strong> of{' '}
                    <strong>{filteredQuotations.length}</strong> estimates
                  </span>
                  <div className="pagination-btn-group">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft size={16} />
                    </button>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* PORTAL MODALS */}

      {/* Delete Invoice modal */}
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

      {/* Delete Quotation modal */}
      {deletingQuotation && createPortal(
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="card modal-content" style={{ maxWidth: '400px', padding: '28px', animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: '#fee2e2', color: 'var(--color-danger)' }}>
                <AlertTriangle size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Delete Quotation</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete quotation <strong>{deletingQuotation.quotationNumber}</strong>? This action will permanently remove this estimate record.
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeletingQuotation(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, var(--color-danger) 0%, var(--color-danger-dark) 100%)' }}
                  onClick={() => {
                    deleteQuotation(deletingQuotation.id);
                    showToast(`Quotation ${deletingQuotation.quotationNumber} deleted successfully.`, 'info');
                    setDeletingQuotation(null);
                    setViewQuotation(null);
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

      {/* Convert Quotation to Invoice Modal */}
      {isConvertModalOpen && convertQuotationId && createPortal(
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="card modal-content" style={{ maxWidth: '450px', padding: '28px', animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Convert to Invoice</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Create a sales invoice from this quotation. Please confirm payment collection details.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Amount Collected (₹)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={convertAmountPaid || ''} 
                  onChange={(e) => setConvertAmountPaid(parseFloat(e.target.value) || 0)} 
                  placeholder="0.00" 
                />
              </div>
              {convertAmountPaid > 0 && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Payment Method</label>
                  <select 
                    className="form-control" 
                    value={convertPaymentMethod} 
                    onChange={(e) => setConvertPaymentMethod(e.target.value)}
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setIsConvertModalOpen(false); setConvertQuotationId(null); }}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={() => {
                  try {
                    const invoiceId = convertQuotationToInvoice(convertQuotationId, convertAmountPaid, convertPaymentMethod);
                    showToast("Quotation converted to Invoice successfully!");
                    setIsConvertModalOpen(false);
                    setConvertQuotationId(null);
                    setSalesActiveTab('invoices');
                    setViewInvoice(invoiceId);
                    setViewQuotation(null);
                  } catch (err: any) {
                    showToast(err.message || "Failed to convert quotation", "error");
                  }
                }}
              >
                Convert
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
