import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import { SupplierModal } from '../components/SupplierModal';
import { ProductModal } from '../components/ProductModal';
import {
  Plus,
  Trash2,
  Printer,
  Download,
  ArrowLeft,
  Search,
  Eye,
  Trash,
  FileSpreadsheet,
  ArrowUpDown,
  Truck,
  Upload,
  X,
  FileText,
  CheckCircle2,
  MoreVertical,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import type { PurchaseItem, Product, Purchase } from '../types';

interface LocalPurchaseItem {
  productId: string;
  quantity: number;
  price: number;
  discount: number; // percentage
  gstRate: number;
}

export const Purchases: React.FC = () => {
  const {
    settings,
    purchases,
    suppliers,
    products,
    addPurchase,
    editPurchase,
    deletePurchase,
    searchQuery,
    setSearchQuery,
    currentPurchaseId,
    setViewPurchase,
    isEnteringPurchase,
    setIsEnteringPurchase,
    showToast,
    setCurrentTab,
    setViewSupplier,
    purchaseFormPresetSupplierId,
    setPurchaseFormPresetSupplierId,
  } = useApp();

  const totalPurchases = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalOwed = purchases.reduce((sum, p) => sum + p.balanceDue, 0);
  const purchaseCount = purchases.length;

  // Redesigned local states for rich Purchase Entry
  const [activeMenuPurchaseId, setActiveMenuPurchaseId] = useState<string | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [activePreviewPurchase, setActivePreviewPurchase] = useState<Purchase | null>(null);

  const [purchaseBillNumber, setPurchaseBillNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [purchaseType, setPurchaseType] = useState<'Cash' | 'Credit'>('Credit');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [purchaseStatus, setPurchaseStatus] = useState<'Received' | 'Ordered' | 'Pending'>('Received');

  // Products Table Row State
  const [items, setItems] = useState<LocalPurchaseItem[]>([
    { productId: '', quantity: 1, price: 0, discount: 0, gstRate: 0 }
  ]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeProductRowIndex, setActiveProductRowIndex] = useState<number | null>(null);

  // Additional Charges & Remarks
  const [transportCharges, setTransportCharges] = useState(0);
  const [loadingCharges, setLoadingCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [notes, setNotes] = useState('');

  // Outflow & Payments details
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Bank Transfer');
  const [amountPaid, setAmountPaid] = useState(0);
  const [transactionReference, setTransactionReference] = useState('');

  // GST Type Selection
  const [gstType, setGstType] = useState<'IntraState' | 'InterState'>('IntraState');

  // Attachments
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [attachedFileUrl, setAttachedFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (attachedFile) {
      const url = URL.createObjectURL(attachedFile);
      setAttachedFileUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAttachedFileUrl(null);
    }
  }, [attachedFile]);

  useEffect(() => {
    if (purchaseFormPresetSupplierId) {
      setEditingPurchaseId(null);
      setSelectedSupplierId(purchaseFormPresetSupplierId);
      setPurchaseBillNumber(`BILL-${Date.now().toString().slice(-4)}`);
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setItems([{ productId: '', quantity: 1, price: 0, discount: 0, gstRate: 0 }]);
      setAmountPaid(0);
      setNotes('');
      setIsEnteringPurchase(true);
      setPurchaseFormPresetSupplierId(null);
    }
  }, [purchaseFormPresetSupplierId, setPurchaseFormPresetSupplierId, setIsEnteringPurchase]);

  // Supplier quick add modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Listing filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const renderAttachmentPreviewModal = () => {
    if (!showAttachmentPreview) return null;

    if (attachedFile && attachedFileUrl) {
      const isPDF = attachedFile.type === 'application/pdf' || attachedFile.name.toLowerCase().endsWith('.pdf');
      const isImage = attachedFile.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(attachedFile.name);

      return createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card" style={{ width: '95%', maxWidth: '800px', height: '90%', maxHeight: '700px', padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button type="button" className="btn-icon" style={{ position: 'absolute', right: '16px', top: '16px', zIndex: 10 }} onClick={() => {
              setShowAttachmentPreview(false);
              setActivePreviewPurchase(null);
            }}>
              <X size={20} />
            </button>
            
            <h4 style={{ fontWeight: 700, fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <FileText size={18} style={{ color: 'var(--primary-dark)' }} /> Uploaded Invoice: {attachedFile.name}
            </h4>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9', borderRadius: '12px', padding: '10px' }}>
              {isPDF ? (
                <iframe src={attachedFileUrl} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }} title="PDF Preview" />
              ) : isImage ? (
                <img src={attachedFileUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} alt="Invoice Preview" />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <FileText size={48} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
                  <p style={{ fontWeight: 600 }}>Preview not supported for this file type.</p>
                  <a href={attachedFileUrl} download={attachedFile.name} className="btn btn-primary" style={{ marginTop: '12px' }}>
                    Download File
                  </a>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', flexShrink: 0 }}>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setShowAttachmentPreview(false);
                setActivePreviewPurchase(null);
              }}>
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      );
    }

    let modalSupplier = '';
    let modalAddress = 'Supplier Road, Sector-4';
    let modalGst = '23SUPPL7732D2Z1';
    let modalInvoiceNo = '';
    let modalInvoiceDate = '';
    let modalItems: { name: string; quantity: number; price: number; total: number }[] = [];
    let modalSubtotal = 0;
    let modalDiscount = 0;
    let modalGstTotal = 0;
    let modalGrandTotal = 0;

    if (activePreviewPurchase) {
      const supplierDetail = suppliers.find((s) => s.id === activePreviewPurchase.supplierId);
      modalSupplier = supplierDetail ? supplierDetail.name : activePreviewPurchase.supplierName;
      modalAddress = supplierDetail?.address || 'Supplier Road, Sector-4';
      modalGst = supplierDetail?.gstin || '23SUPPL7732D2Z1';

      const notesMatch = activePreviewPurchase.notes?.match(/Invoice Ref:\s*(.*?)\s*\(Date:\s*(.*?)\)/);
      modalInvoiceNo = notesMatch ? notesMatch[1] : activePreviewPurchase.purchaseNumber;
      modalInvoiceDate = notesMatch ? notesMatch[2] : activePreviewPurchase.date;

      modalItems = activePreviewPurchase.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }));

      modalSubtotal = activePreviewPurchase.subtotal;
      modalDiscount = 0; // Not stored per purchase item
      modalGstTotal = activePreviewPurchase.gstTotal;
      modalGrandTotal = activePreviewPurchase.grandTotal;
    } else {
      const supplierDetail = suppliers.find((s) => s.id === selectedSupplierId);
      modalSupplier = supplierDetail ? supplierDetail.name : 'SUPPLIER CORP';
      modalAddress = supplierDetail?.address || 'Supplier Road, Sector-4';
      modalGst = supplierDetail?.gstin || '23SUPPL7732D2Z1';

      modalInvoiceNo = supplierInvoiceNumber || 'INV-TEMP';
      modalInvoiceDate = supplierInvoiceDate;

      modalItems = items.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const name = prod ? prod.name : 'Unknown Product';
        const calc = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
        return {
          name,
          quantity: item.quantity,
          price: item.price,
          total: calc.total
        };
      });

      const totals = getPurchaseTotals();
      modalSubtotal = totals.subtotal;
      modalDiscount = totals.discountTotal;
      modalGstTotal = totals.gstTotal;
      modalGrandTotal = totals.grandTotal;
    }

    return createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, animation: 'fadeIn 0.2s ease-out'
      }}>
        <div className="card" style={{ width: '90%', maxWidth: '650px', padding: '24px', position: 'relative' }}>
          <button type="button" className="btn-icon" style={{ position: 'absolute', right: '16px', top: '16px' }} onClick={() => {
            setShowAttachmentPreview(false);
            setActivePreviewPurchase(null);
          }}>
            <X size={20} />
          </button>
          
          <h4 style={{ fontWeight: 700, fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--primary-dark)' }} /> Invoice Attachment Preview
          </h4>

          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'monospace', fontSize: '11px', color: '#334155' }}>
            {activePreviewPurchase && (
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#1e3a8a',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '10px',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                ℹ️ <strong>Simulated Invoice Preview:</strong> Showing structured voucher data reconstructed for the attached file <strong>"{getAttachmentName(activePreviewPurchase.notes)}"</strong>. (Actual binary file data is not persisted locally.)
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #cbd5e1', paddingBottom: '10px' }}>
              <div>
                <strong>{modalSupplier.toUpperCase()}</strong>
                <br />Address: {modalAddress}
                <br />GSTIN: {modalGst}
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>INVOICE BILL</strong>
                <br />Invoice No: {modalInvoiceNo}
                <br />Invoice Date: {modalInvoiceDate}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Item description</th>
                  <th style={{ textAlign: 'center', padding: '4px', width: '50px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '4px', width: '80px' }}>Rate (₹)</th>
                  <th style={{ textAlign: 'right', padding: '4px', width: '90px' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {modalItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '4px' }}>{item.name}</td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '4px' }}>{formatINR(item.price).replace('₹', '')}</td>
                    <td style={{ textAlign: 'right', padding: '4px' }}>{formatINR(item.total).replace('₹', '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 'auto', borderTop: '2px solid #cbd5e1', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: 'flex-end', width: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Goods Value:</span>
                <span>{formatINR(modalSubtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discounts:</span>
                <span>-{formatINR(modalDiscount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST Taxes:</span>
                <span>{formatINR(modalGstTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #e2e8f0', paddingTop: '4px', fontSize: '12px' }}>
                <span>Total Bill:</span>
                <span>{formatINR(modalGrandTotal)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => {
              setShowAttachmentPreview(false);
              setActivePreviewPurchase(null);
            }}>
              Close Preview
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Download PDF using html2pdf
  const handleDownload = (purchaseNo: string) => {
    const element = document.querySelector('.print-invoice-layout');
    if (!element) {
      showToast('Could not find purchase bill layout element.', 'error');
      return;
    }

    showToast('Compiling high-definition PDF bill...', 'info');

    const generatePDF = (html2pdfLib: any) => {
      const opt = {
        margin:       0,
        filename:     `${purchaseNo || 'purchase_bill'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { 
          unit: 'mm', 
          format: 'a5', 
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

  // --- Purchase Calculations ---
  const getProductUnit = (product: Product | undefined) => {
    if (!product) return 'Units';
    const cat = (product.category || '').toLowerCase();
    if (cat === 'seeds') return 'Bags (10kg)';
    if (cat.includes('fertil') || cat.includes('nutri')) return 'Bags (50kg)';
    if (cat.includes('pest') || cat.includes('chem') || cat.includes('liquid')) return 'Liters';
    if (cat.includes('irrig') || cat.includes('pipe')) return 'Meters';
    return 'Pieces';
  };

  const calculateRowTotal = (productId: string, qty: number, costPrice: number, discountPercent: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return { subtotal: 0, discountAmount: 0, gstAmount: 0, total: 0, gstRate: 0 };

    const baseAmount = costPrice * qty;
    const discountAmount = baseAmount * (discountPercent / 100);
    const subtotal = Math.max(0, baseAmount - discountAmount);
    const gstRate = product.gstRate;
    const gstAmount = subtotal * (gstRate / 100);
    const total = subtotal + gstAmount;

    return { subtotal, discountAmount, gstAmount, total, gstRate };
  };

  const getPurchaseTotals = () => {
    let subtotalTotal = 0;
    let discountTotal = 0;
    let gstTotal = 0;

    items.forEach((item) => {
      const calc = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
      subtotalTotal += item.price * item.quantity;
      discountTotal += calc.discountAmount;
      gstTotal += calc.gstAmount;
    });

    const taxableAmount = Math.max(0, subtotalTotal - discountTotal);
    const additionalCharges = (Number(transportCharges) || 0) + (Number(loadingCharges) || 0) + (Number(otherCharges) || 0);
    const finalGrandTotal = taxableAmount + gstTotal + additionalCharges;

    return {
      subtotal: subtotalTotal,
      discountTotal,
      taxableAmount,
      gstTotal,
      cgst: gstType === 'IntraState' ? gstTotal / 2 : 0,
      sgst: gstType === 'IntraState' ? gstTotal / 2 : 0,
      igst: gstType === 'InterState' ? gstTotal : 0,
      additionalCharges,
      grandTotal: finalGrandTotal,
      balanceDue: Math.max(0, finalGrandTotal - (Number(amountPaid) || 0)),
    };
  };

  const handleAddItemRow = () => {
    const defaultProduct = products[0];
    if (!defaultProduct) return;

    setItems((prev) => [
      ...prev,
      {
        productId: defaultProduct.id,
        quantity: 1,
        price: defaultProduct.purchasePrice,
        discount: 0,
        gstRate: defaultProduct.gstRate,
      },
    ]);
  };

  const handleUpdateItemRow = (index: number, field: keyof LocalPurchaseItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;

        const updated = { ...item, [field]: value };

        // If product changes, auto-update price to default purchase price
        if (field === 'productId') {
          const product = products.find((p) => p.id === value);
          if (product) {
            updated.price = product.purchasePrice;
            updated.gstRate = product.gstRate;
            updated.discount = 0;
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleResetForm = (exitEditor = true) => {
    setEditingPurchaseId(null);
    setSelectedSupplierId('');
    setSupplierInvoiceNumber('');
    setSupplierInvoiceDate(new Date().toISOString().split('T')[0]);
    setPurchaseType('Credit');
    setDueDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    });
    setPurchaseStatus('Received');
    setItems([{ productId: '', quantity: 1, price: 0, discount: 0, gstRate: 0 }]);
    setTransportCharges(0);
    setLoadingCharges(0);
    setOtherCharges(0);
    setNotes('');
    setAmountPaid(0);
    setTransactionReference('');
    setAttachedFileName('');
    setAttachedFile(null);
    if (exitEditor) {
      setIsEnteringPurchase(false);
    }
  };

  const getAttachmentName = (notes?: string) => {
    if (!notes) return null;
    const match = notes.match(/Attachment:\s*(.*?)(?:\r?\n|$)/);
    return match ? match[1] : null;
  };

  const handleStartEditPurchase = (pur: Purchase) => {
    setEditingPurchaseId(pur.id);
    setPurchaseBillNumber(pur.purchaseNumber);
    setPurchaseDate(pur.date);
    setSelectedSupplierId(pur.supplierId);
    
    // Parse notes
    let supplierInvoiceNo = '';
    let supplierInvoiceDt = pur.date;
    let type: 'Cash' | 'Credit' = 'Credit';
    let status: 'Received' | 'Ordered' | 'Pending' = 'Received';
    let dueDt = pur.date;
    let transport = 0;
    let loading = 0;
    let other = 0;
    let txnRef = '';
    let attachFileNm = '';
    let remarks = '';

    if (pur.notes) {
      const invRefMatch = pur.notes.match(/Invoice Ref:\s*(.*?)\s*\(Date:\s*(.*?)\)/);
      if (invRefMatch) {
        supplierInvoiceNo = invRefMatch[1];
        supplierInvoiceDt = invRefMatch[2];
      }

      const typeStatusMatch = pur.notes.match(/Type:\s*(.*?)\s*\|\s*Status:\s*(.*?)(?:\r?\n|$)/);
      if (typeStatusMatch) {
        type = typeStatusMatch[1] as 'Cash' | 'Credit';
        status = typeStatusMatch[2] as 'Received' | 'Ordered' | 'Pending';
      }

      const dueMatch = pur.notes.match(/Payment Due Date:\s*(.*?)(?:\r?\n|$)/);
      if (dueMatch) {
        dueDt = dueMatch[1];
      }

      const chargesMatch = pur.notes.match(/Charges:\s*Transport\s*₹([\d.]+),\s*Loading\s*₹([\d.]+),\s*Other\s*₹([\d.]+)/);
      if (chargesMatch) {
        transport = parseFloat(chargesMatch[1]) || 0;
        loading = parseFloat(chargesMatch[2]) || 0;
        other = parseFloat(chargesMatch[3]) || 0;
      }

      const txnMatch = pur.notes.match(/Txn Reference:\s*(.*?)(?:\r?\n|$)/);
      if (txnMatch) {
        txnRef = txnMatch[1];
      }

      const attachMatch = pur.notes.match(/Attachment:\s*(.*?)(?:\r?\n|$)/);
      if (attachMatch) {
        attachFileNm = attachMatch[1];
      }

      const remarksMatch = pur.notes.match(/Remarks:\s*([\s\S]*)/);
      if (remarksMatch) {
        remarks = remarksMatch[1];
      } else {
        remarks = pur.notes;
      }
    }

    setSupplierInvoiceNumber(supplierInvoiceNo);
    setSupplierInvoiceDate(supplierInvoiceDt);
    setPurchaseType(type);
    setPurchaseStatus(status);
    setDueDate(dueDt);
    setTransportCharges(transport);
    setLoadingCharges(loading);
    setOtherCharges(other);
    setTransactionReference(txnRef);
    setAttachedFileName(attachFileNm);
    setNotes(remarks);

    setItems(
      pur.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: 0,
        gstRate: item.gstRate,
      }))
    );
    setAmountPaid(pur.amountPaid);
    if (pur.paymentMethod) {
      setPaymentMethod(pur.paymentMethod as any);
    }
    setIsEnteringPurchase(true);
  };

  const handleSavePurchaseWrapper = (e: React.FormEvent, keepOpen = false) => {
    if (e) e.preventDefault();

    // Validations
    if (!selectedSupplierId) {
      showToast('Please select a supplier to log stock purchase.', 'error');
      return;
    }
    if (!supplierInvoiceNumber.trim()) {
      showToast('Please enter the Supplier Invoice / Bill Number.', 'error');
      return;
    }
    if (items.length === 0 || !items[0].productId) {
      showToast('Please add at least one product line item to voucher.', 'error');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;

    const totals = getPurchaseTotals();

    const purchaseItems: PurchaseItem[] = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const calc = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        gstRate: calc.gstRate,
        gstAmount: calc.gstAmount,
        subtotal: calc.subtotal,
        total: calc.total,
      };
    });

    const paymentStatus =
      (Number(amountPaid) || 0) >= totals.grandTotal
        ? 'Paid'
        : (Number(amountPaid) || 0) > 0
        ? 'Partial'
        : 'Unpaid';

    // Structured metadata inside notes to avoid database schema updates
    const serializedNotes = `Invoice Ref: ${supplierInvoiceNumber.trim()} (Date: ${supplierInvoiceDate})
Type: ${purchaseType} | Status: ${purchaseStatus}
${purchaseType === 'Credit' ? `Payment Due Date: ${dueDate}\n` : ''}Charges: Transport ₹${transportCharges}, Loading ₹${loadingCharges}, Other ₹${otherCharges}
${transactionReference ? `Txn Reference: ${transactionReference}\n` : ''}${attachedFileName ? `Attachment: ${attachedFileName}\n` : ''}Remarks: ${notes}`;

    if (editingPurchaseId) {
      const originalPurchase = purchases.find((p) => p.id === editingPurchaseId);
      if (!originalPurchase) return;

      editPurchase({
        ...originalPurchase,
        date: purchaseDate,
        supplierId: selectedSupplierId,
        supplierName: supplier.name,
        items: purchaseItems,
        subtotal: totals.taxableAmount, // subtotal after discounts
        gstTotal: totals.gstTotal,
        grandTotal: totals.grandTotal,
        amountPaid: Number(amountPaid) || 0,
        balanceDue: totals.balanceDue,
        paymentStatus,
        paymentMethod: amountPaid > 0 ? paymentMethod : '',
        notes: serializedNotes,
      });

      showToast(`Purchase bill ${originalPurchase.purchaseNumber} updated successfully!`);
      handleResetForm(!keepOpen);
      if (!keepOpen) {
        setViewPurchase(originalPurchase.id);
      }
    } else {
      const newPurchase = addPurchase({
        date: purchaseDate,
        supplierId: selectedSupplierId,
        supplierName: supplier.name,
        items: purchaseItems,
        subtotal: totals.taxableAmount, // subtotal after discounts
        gstTotal: totals.gstTotal,
        grandTotal: totals.grandTotal,
        amountPaid: Number(amountPaid) || 0,
        balanceDue: totals.balanceDue,
        paymentStatus,
        paymentMethod: amountPaid > 0 ? paymentMethod : '',
        notes: serializedNotes,
      });

      showToast(`Purchase bill ${supplierInvoiceNumber} saved successfully!`);
      handleResetForm(!keepOpen);
      if (!keepOpen && newPurchase) {
        setViewPurchase(newPurchase.id);
      }
    }
  };

  const handleDeletePurchase = (id: string, purchaseNo: string) => {
    if (confirm(`Are you sure you want to delete purchase voucher ${purchaseNo}? This will deduct the added stock levels and adjust supplier balance.`)) {
      deletePurchase(id);
      showToast(`Purchase bill ${purchaseNo} deleted successfully.`, 'info');
      setViewPurchase(null);
    }
  };

  // --- Filtering and Sorting List ---
  const filteredPurchases = purchases.filter((pur) => {
    const matchesSearch =
      pur.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pur.supplierName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || pur.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
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
    if (sortBy === 'number-desc') {
      return b.purchaseNumber.localeCompare(a.purchaseNumber);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedPurchases.length / itemsPerPage);
  const paginatedPurchases = sortedPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedPurchase = purchases.find((p) => p.id === currentPurchaseId);

  // --- RENDERING ---

  // 1. Voucher details A4 view
  if (selectedPurchase) {
    const supplierDetail = suppliers.find((s) => s.id === selectedPurchase.supplierId);
    const totals = {
      subtotal: selectedPurchase.subtotal,
      gstTotal: selectedPurchase.gstTotal,
      cgst: selectedPurchase.gstTotal / 2,
      sgst: selectedPurchase.gstTotal / 2,
      grandTotal: selectedPurchase.grandTotal,
      amountPaid: selectedPurchase.amountPaid,
      balanceDue: selectedPurchase.balanceDue,
    };

    return (
      <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px", backgroundColor: "var(--bg-card)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <button className="btn btn-secondary" onClick={() => setViewPurchase(null)}>
            <ArrowLeft size={16} /> Back to Purchases
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {getAttachmentName(selectedPurchase.notes) && (
              <button className="btn btn-secondary" onClick={() => {
                setActivePreviewPurchase(selectedPurchase);
                setShowAttachmentPreview(true);
              }}>
                <FileText size={16} /> View Invoice File
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => handleStartEditPurchase(selectedPurchase)}>
              <Edit2 size={16} /> Edit
            </button>
            <button className="btn btn-danger" onClick={() => handleDeletePurchase(selectedPurchase.id, selectedPurchase.purchaseNumber)}>
              <Trash2 size={16} /> Delete
            </button>
            <button className="btn btn-secondary" onClick={() => handleDownload(selectedPurchase.purchaseNumber)} title="Export bill as PDF">
              <Download size={16} /> Save as PDF
            </button>
            <button className="btn btn-primary" onClick={handlePrint} title="Print paper receipt">
              <Printer size={16} /> Print Receipt
            </button>
          </div>
        </div>
        {renderAttachmentPreviewModal()}

        {/* Voucher layout */}
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
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div className="invoice-logo-pill">
                  <Store size={22} className="invoice-logo-icon" />
                  <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.5px' }}>AGRI</span>
                </div>
                <div>
                  <h2 className="invoice-company-name">{settings.businessName}</h2>
                  <p className="invoice-company-sub">{settings.address}</p>
                  <p className="invoice-company-gst">GSTIN: {settings.gstin} (Recipient)</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h1 className="invoice-main-title">PURCHASE</h1>
                <p className="invoice-number-text">#{selectedPurchase.purchaseNumber}</p>
                <p className="invoice-date-text">Date: {formatDate(selectedPurchase.date)}</p>
              </div>
            </div>

            {/* Supplier details card */}
            <div className="invoice-billing-details">
              <div>
                <h4 className="invoice-detail-header">Supplier (Seller):</h4>
                <h3 className="invoice-customer-name">{selectedPurchase.supplierName}</h3>
                {supplierDetail ? (
                  <>
                    <p className="invoice-customer-sub">{supplierDetail.phone}</p>
                    <p className="invoice-customer-sub">{supplierDetail.address || "Address: N/A"}</p>
                    {supplierDetail.gstin && <p className="invoice-customer-gst">GSTIN: {supplierDetail.gstin}</p>}
                  </>
                ) : (
                  <p className="invoice-customer-sub">General Vendor</p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 className="invoice-detail-header">Voucher Status:</h4>
                <span className={`invoice-payment-badge ${
                  selectedPurchase.paymentStatus === 'Paid' ? 'paid' : selectedPurchase.paymentStatus === 'Partial' ? 'partial' : 'unpaid'
                }`}>
                  {selectedPurchase.paymentStatus.toUpperCase()}
                </span>
                {selectedPurchase.paymentMethod && (
                  <p className="invoice-customer-sub" style={{ marginTop: '6px' }}>Mode: {selectedPurchase.paymentMethod}</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>SR</th>
                  <th style={{ textAlign: 'left' }}>Product Inward Details</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>GST</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Cost (₹)</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {selectedPurchase.items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>
                      <strong>{item.productName}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.gstRate}%</td>
                    <td style={{ textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Terms and Summary block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: 'auto' }}>
              <div style={{ flex: 1, maxWidth: '55%' }}>
                <h4 className="invoice-terms-title">Voucher Details & Notes:</h4>
                <p className="invoice-terms-text">
                  {selectedPurchase.notes || "No additional comments recorded."}
                </p>
              </div>
              <div style={{ flex: 1, maxWidth: '42%' }}>
                <table className="invoice-summary-table">
                  <tbody>
                    <tr>
                      <td>Total Base Cost</td>
                      <td>{formatINR(totals.subtotal)}</td>
                    </tr>
                    {totals.cgst > 0 && (
                      <tr>
                        <td>Input CGST (50% of GST)</td>
                        <td>{formatINR(totals.cgst)}</td>
                      </tr>
                    )}
                    {totals.sgst > 0 && (
                      <tr>
                        <td>Input SGST (50% of GST)</td>
                        <td>{formatINR(totals.sgst)}</td>
                      </tr>
                    )}
                    <tr className="grand-total-row">
                      <td>Grand Total</td>
                      <td>{formatINR(totals.grandTotal)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#10B981' }}>Amount Paid</td>
                      <td style={{ color: '#10B981' }}>{formatINR(totals.amountPaid)}</td>
                    </tr>
                    {totals.balanceDue > 0 && (
                      <tr className="due-row">
                        <td>Balance Due</td>
                        <td>{formatINR(totals.balanceDue)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom SVG Illustration and signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
              <div style={{ flex: 1, maxWidth: '70%' }}>
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
              <div style={{ textAlign: 'center', minWidth: '150px' }}>
                <div style={{ height: '35px' }}></div>
                <p style={{ borderTop: '1.5px solid #EAE3D2', paddingTop: '4px', fontSize: '11px', fontWeight: 700, color: '#4E6C50' }}>
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Create Purchase Voucher view
  if (isEnteringPurchase) {
    const totals = getPurchaseTotals();
    const supplierDetail = suppliers.find((s) => s.id === selectedSupplierId);

    // Initial prefill for Purchase Bill Number if empty
    if (!purchaseBillNumber) {
      const generatedNo = `PUR-${(purchases.length + 1).toString().padStart(3, '0')}`;
      setPurchaseBillNumber(generatedNo);
    }

    return (
      <div style={{ animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards', paddingBottom: '40px' }}>
        
        {/* TOP BAR ACTION BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => {
                handleResetForm();
              }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} /> Exit Editor
              </button>
              <h3 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 }}>
                {editingPurchaseId ? 'Edit Inward Purchase Entry' : 'Log Inward Purchase Entry'}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Record goods receipt notes, tax divisions, and update inventory ledger.
            </p>
          </div>
          
        </div>

        <form onSubmit={(e) => handleSavePurchaseWrapper(e, false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Section 1: Purchase & Voucher Details */}
            <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '13px', fontWeight: 800,
                }}>1</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Purchase & Voucher Details</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enter inward references and dates</div>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Purchase Bill No. *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={purchaseBillNumber}
                    onChange={(e) => setPurchaseBillNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Purchase Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">GST Type *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <select
                      className="form-control"
                      style={{ paddingRight: '36px' }}
                      value={gstType}
                      onChange={(e) => setGstType(e.target.value as any)}
                      required
                    >
                      <option value="IntraState">Intra-State (CGST + SGST)</option>
                      <option value="InterState">Inter-State (IGST)</option>
                    </select>
                    <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Select Supplier *</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
                      <select
                        className="form-control"
                        style={{ paddingRight: '36px' }}
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Supplier --</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.phone ? `(${s.phone})` : ''}
                          </option>
                        ))}
                      </select>
                      <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsSupplierModalOpen(true)}
                      style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexShrink: 0 }}
                    >
                      <Plus size={16} /> Add Supplier
                    </button>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Supplier Invoice No. *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. INWARD-9842"
                      value={supplierInvoiceNumber}
                      onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Supplier Invoice Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={supplierInvoiceDate}
                      onChange={(e) => setSupplierInvoiceDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Purchase Status *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <select
                      className="form-control"
                      style={{ paddingRight: '36px' }}
                      value={purchaseStatus}
                      onChange={(e) => setPurchaseStatus(e.target.value as any)}
                      required
                    >
                      <option value="Received">Goods Received</option>
                      <option value="Ordered">Ordered / Transit</option>
                      <option value="Pending">Pending Audit</option>
                    </select>
                    <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Purchase Type *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <select
                      className="form-control"
                      style={{ paddingRight: '36px' }}
                      value={purchaseType}
                      onChange={(e) => setPurchaseType(e.target.value as any)}
                      required
                    >
                      <option value="Credit">Credit / Outstanding Account</option>
                      <option value="Cash">Cash replenishment</option>
                    </select>
                    <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>
                
                {purchaseType === 'Credit' ? (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Payment Due Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '10px', padding: '10px 14px', border: '1px solid var(--border-color)', height: '40px', marginTop: '22px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Voucher value settles automatically under Cash accounts.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Supplier Details Card */}
            {supplierDetail && (
              <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', border: '1px dashed var(--primary-dark)', backgroundColor: 'var(--card-bg)', display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.25s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={15} /> Active Supplier Ledger Profile
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '10px' }}>ID: {supplierDetail.id}</span>
                </div>
                
                <div className="supplier-ledger-grid">
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Supplier Name</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{supplierDetail.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>{supplierDetail.address || 'No Address Logged'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Contact Phone</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{supplierDetail.phone || 'N/A'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>GSTIN</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{supplierDetail.gstin || 'Unregistered'}</span>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Outstanding Balance</span>
                    <strong style={{ fontSize: '18px', fontWeight: 800, color: supplierDetail.outstanding > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', marginTop: '2px' }}>
                      {formatINR(supplierDetail.outstanding)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Product Details Table / Mobile Cards */}
            <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '4px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '13px', fontWeight: 800,
                  }}>2</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Agricultural Stock Inward Items</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Specify item lines, cost prices and trade discounts</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                    setActiveProductRowIndex(null);
                    setIsProductModalOpen(true);
                  }} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={13} /> New Product
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleAddItemRow} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={13} /> Add Row
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', border: '2px dashed var(--border-color)', borderRadius: '12px', background: 'var(--bg-app)' }}>
                  No products added to purchase draft. Click 'Add Row' to record items.
                </div>
              ) : (
                <>
                  {/* Desktop View Table */}
                  <div className="table-wrapper desktop-items-table" style={{ margin: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                    <table className="data-table" style={{ width: '100%', minWidth: '950px' }}>
                      <thead>
                        <tr>
                          <th>Product *</th>
                          <th style={{ width: '100px' }}>Category</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>Unit</th>
                          <th style={{ width: '85px', textAlign: 'center' }}>Qty *</th>
                          <th style={{ width: '115px', textAlign: 'right' }}>Cost Price (₹) *</th>
                          <th style={{ width: '85px', textAlign: 'center' }}>Discount (%)</th>
                          <th style={{ width: '70px', textAlign: 'center' }}>GST</th>
                          <th style={{ width: '100px', textAlign: 'right' }}>Tax Amt (₹)</th>
                          <th style={{ width: '110px', textAlign: 'right' }}>Total (₹)</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const product = products.find((p) => p.id === item.productId);
                          const unitLabel = getProductUnit(product);
                          const calc = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
                          const isEven = index % 2 === 0;

                          return (
                            <tr key={index} style={{ background: isEven ? 'transparent' : 'rgba(var(--primary-rgb), 0.01)' }}>
                              <td>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                                  <select
                                    className="form-control"
                                    style={{ fontSize: '13px', paddingRight: '24px', minWidth: '150px' }}
                                    value={item.productId}
                                    onChange={(e) => handleUpdateItemRow(index, 'productId', e.target.value)}
                                    required
                                  >
                                    <option value="">-- Choose --</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                  <span style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </span>
                                </div>
                                <button type="button" style={{ border: 'none', background: 'none', color: 'var(--primary-dark)', fontSize: '10px', fontWeight: 600, padding: '2px 0 0 0', cursor: 'pointer' }} onClick={() => {
                                  setActiveProductRowIndex(index);
                                  setIsProductModalOpen(true);
                                }}>
                                  + Create New
                                </button>
                              </td>

                              <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {product ? product.category : '—'}
                              </td>

                              <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <span className="badge badge-secondary" style={{ padding: '2px 6px', fontSize: '10px' }}>{unitLabel}</span>
                              </td>

                              <td>
                                <input
                                  type="number"
                                  className="form-control text-center"
                                  style={{ fontSize: '13px', textAlign: 'center', padding: '6px' }}
                                  min="1"
                                  value={item.quantity || ''}
                                  onChange={(e) => handleUpdateItemRow(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                  required
                                />
                              </td>

                              <td>
                                <input
                                  type="number"
                                  className="form-control text-right"
                                  style={{ fontSize: '13px', textAlign: 'right', padding: '6px' }}
                                  min="0"
                                  step="any"
                                  value={item.price || ''}
                                  onChange={(e) => handleUpdateItemRow(index, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                                  required
                                />
                              </td>

                              <td>
                                <input
                                  type="number"
                                  className="form-control text-center"
                                  style={{ fontSize: '13px', textAlign: 'center', padding: '6px' }}
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={item.discount || ''}
                                  onChange={(e) => handleUpdateItemRow(index, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                />
                              </td>

                              <td style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {calc.gstRate}%
                              </td>

                              <td style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {formatINR(calc.gstAmount).replace('₹', '')}
                              </td>

                              <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                                {formatINR(calc.total).replace('₹', '')}
                              </td>

                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-icon danger"
                                  onClick={() => handleRemoveItemRow(index)}
                                  title="Remove product line"
                                >
                                  <Trash size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View Cards */}
                  <div className="mobile-items-cards">
                    {items.map((item, index) => {
                      const product = products.find((p) => p.id === item.productId);
                      const unitLabel = getProductUnit(product);
                      const calc = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
                      return (
                        <div key={index} className="mobile-item-card">
                          <div className="mobile-item-card-header">
                            <span className="mobile-item-card-title">Item #{index + 1}</span>
                            <button
                              type="button"
                              className="btn-icon danger"
                              style={{ padding: '4px' }}
                              onClick={() => handleRemoveItemRow(index)}
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                          
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Product *</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <select
                                className="form-control"
                                style={{ fontSize: '13px' }}
                                value={item.productId}
                                onChange={(e) => handleUpdateItemRow(index, 'productId', e.target.value)}
                                required
                              >
                                <option value="">-- Choose Product --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button type="button" style={{ border: 'none', background: 'none', color: 'var(--primary-dark)', fontSize: '11px', fontWeight: 600, padding: '4px 0 0 0', cursor: 'pointer' }} onClick={() => {
                              setActiveProductRowIndex(index);
                              setIsProductModalOpen(true);
                            }}>
                              + Create New Product
                            </button>
                          </div>

                          <div className="mobile-item-card-grid">
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label">Qty *</label>
                              <input
                                type="number"
                                className="form-control"
                                style={{ textAlign: 'center' }}
                                min="1"
                                value={item.quantity || ''}
                                onChange={(e) => handleUpdateItemRow(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                required
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label">Cost (₹) *</label>
                              <input
                                type="number"
                                className="form-control"
                                style={{ textAlign: 'right' }}
                                min="0"
                                step="any"
                                value={item.price || ''}
                                onChange={(e) => handleUpdateItemRow(index, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                                required
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label">Disc (%)</label>
                              <input
                                type="number"
                                className="form-control"
                                style={{ textAlign: 'center' }}
                                min="0"
                                max="100"
                                placeholder="0"
                                value={item.discount || ''}
                                onChange={(e) => handleUpdateItemRow(index, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                              />
                            </div>
                          </div>

                          <div className="mobile-item-card-summary">
                            <span>Unit: <strong>{unitLabel}</strong></span>
                            <span>GST: <strong>{calc.gstRate}%</strong></span>
                            <span>Tax: <strong>{formatINR(calc.gstAmount)}</strong></span>
                            <span>Total: <strong>{formatINR(calc.total)}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Section 4: Additional Charges & Notes */}
            <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '13px', fontWeight: 800,
                }}>3</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Additional Charges & Transit Remarks</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Input logistics costs and notes</div>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Truck size={14} /> Transport Charges (₹)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    min="0"
                    value={transportCharges || ''}
                    onChange={(e) => setTransportCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Loading/Unloading Charges (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    min="0"
                    value={loadingCharges || ''}
                    onChange={(e) => setLoadingCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Other Extra Charges (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    min="0"
                    value={otherCharges || ''}
                    onChange={(e) => setOtherCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Transit Notes / General Remarks</label>
                <textarea
                  className="form-control"
                  placeholder="e.g. Weighbridge details, transport agent, freight receipt details"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Section 5: Payment Details */}
            <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '13px', fontWeight: 800,
                }}>4</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Payment & Settlements</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enter paid amounts and payment modes</div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Payment Mode *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <select
                      className="form-control"
                      style={{ paddingRight: '36px' }}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      required
                    >
                      <option value="Bank Transfer">Bank Transfer (RTGS/NEFT)</option>
                      <option value="UPI">UPI / QR Scan</option>
                      <option value="Cash">Cash Ledger</option>
                      <option value="Cheque">Cheque Payment</option>
                    </select>
                    <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Transaction Reference No. (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. UTR-9824874523"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ alignItems: 'center' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Amount Paid to Supplier (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="₹ 0.00"
                    min="0"
                    max={totals.grandTotal}
                    value={amountPaid || ''}
                    onChange={(e) => setAmountPaid(Math.min(totals.grandTotal, Math.max(0, parseFloat(e.target.value) || 0)))}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-app)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Remaining Due:</span>
                    <strong style={{ fontSize: '15px', color: totals.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                      {formatINR(totals.balanceDue)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Clearance Status:</span>
                    <span className={`badge ${totals.balanceDue === 0 ? 'badge-success' : amountPaid > 0 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {totals.balanceDue === 0 ? 'FULLY PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Attachments */}
            <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '4px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '13px', fontWeight: 800,
                }}>5</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Supplier Invoice Attachment</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Upload scans of purchase bills for document audits</div>
                </div>
              </div>

              <div className="form-grid-2" style={{ alignItems: 'center' }}>
                <div>
                  <input
                    type="file"
                    id="bill-attachment-upload"
                    style={{ display: 'none' }}
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAttachedFile(file);
                        setAttachedFileName(file.name);
                        showToast(`Document "${file.name}" uploaded successfully!`, 'success');
                      }
                    }}
                  />
                  <label htmlFor="bill-attachment-upload" className="btn btn-secondary" style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: '1px dashed var(--primary-dark)' }}>
                    <Upload size={16} /> Choose File
                  </label>
                </div>

                <div>
                  {attachedFileName ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', animation: 'fadeIn 0.2s ease-out' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <FileText size={18} style={{ color: 'var(--primary-dark)', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={attachedFileName}>
                          {attachedFileName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => setShowAttachmentPreview(true)}>
                          <Eye size={12} /> View
                        </button>
                        <button type="button" className="btn-icon danger" style={{ padding: '4px' }} onClick={() => {
                          setAttachedFileName('');
                          setAttachedFile(null);
                          showToast('Attachment removed.', 'info');
                        }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      No bill attachment uploaded yet. PDF or image receipts supported.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 7: Voucher Value Summary */}
            <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '4px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '13px', fontWeight: 800,
                }}>6</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Voucher Value Summary</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Review complete financial invoice calculations</div>
                </div>
              </div>

              <div className="form-grid-3" style={{ fontSize: '13px', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Product Subtotal</span>
                  <span style={{ fontWeight: 700 }}>{formatINR(totals.subtotal)}</span>
                </div>

                {totals.discountTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16,185,129,0.05)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Trade Discounts</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-success-dark)' }}>-{formatINR(totals.discountTotal)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Taxable Value</span>
                  <span style={{ fontWeight: 700 }}>{formatINR(totals.taxableAmount)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {gstType === 'IntraState' ? 'CGST + SGST (Intrastate)' : 'IGST (Interstate)'}
                  </span>
                  <span style={{ fontWeight: 700 }}>{formatINR(totals.gstTotal)}</span>
                </div>

                {totals.additionalCharges > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Logistics Charges</span>
                    <span style={{ fontWeight: 700 }}>{formatINR(totals.additionalCharges)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Paid Amount</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-success-dark)' }}>{formatINR(amountPaid)}</span>
                </div>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 800,
                padding: '16px 20px', borderRadius: '12px', marginTop: '8px',
                background: 'linear-gradient(135deg, var(--bg-card), var(--bg-app))',
                border: '1.5px solid var(--border-color)',
                flexWrap: 'wrap', gap: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Grand Total</span>
                  <span style={{ color: 'var(--primary-dark)', fontSize: '22px' }}>{formatINR(totals.grandTotal)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    {totals.balanceDue > 0 ? 'Due Balance' : '✓ Full Settlement'}
                  </span>
                  <span style={{ color: totals.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', fontSize: '20px' }}>
                    {formatINR(totals.balanceDue)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* FLOATING ACTION BAR */}
            <div className="form-docked-footer no-print">
              <div className="docked-total-info">
                <span className="docked-total-label">Grand Total</span>
                <strong className="docked-total-value">{formatINR(totals.grandTotal)}</strong>
              </div>
              <div className="docked-buttons">
                <button
                  type="button"
                  className="btn btn-secondary discard-btn"
                  onClick={() => handleResetForm()}
                >
                  Discard Draft
                </button>
                <button
                  type="button"
                  className="btn btn-secondary save-add-btn"
                  onClick={(e) => handleSavePurchaseWrapper(e, true)}
                  disabled={items.length === 0 || !items[0].productId}
                >
                  Save & Add New
                </button>
                <button
                  type="submit"
                  className="btn btn-primary submit-btn"
                  disabled={items.length === 0 || !items[0].productId}
                >
                  {editingPurchaseId ? '✓ Update Purchase' : '✓ Save Purchase'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Quick add supplier modal */}
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          onSaveCallback={(s) => setSelectedSupplierId(s.id)}
        />

        {/* Quick add product modal */}
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setActiveProductRowIndex(null);
          }}
          onSaveCallback={(newProd) => {
            if (activeProductRowIndex !== null) {
              handleUpdateItemRow(activeProductRowIndex, 'productId', newProd.id);
            } else {
              setItems((prev) => {
                const updated = [...prev];
                // Replace first empty item or add new row
                if (updated.length === 1 && !updated[0].productId) {
                  updated[0] = {
                    productId: newProd.id,
                    quantity: 1,
                    price: newProd.purchasePrice,
                    discount: 0,
                    gstRate: newProd.gstRate,
                  };
                  return updated;
                }
                return [
                  ...prev,
                  {
                    productId: newProd.id,
                    quantity: 1,
                    price: newProd.purchasePrice,
                    discount: 0,
                    gstRate: newProd.gstRate,
                  }
                ];
              });
            }
            setIsProductModalOpen(false);
            setActiveProductRowIndex(null);
            showToast(`Product "${newProd.name}" added to list!`, 'success');
          }}
        />

        {renderAttachmentPreviewModal()}
      </div>
    );
  }

  // 3. Purchases List view
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Purchases KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Total Purchases</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800 }}>
              {formatINR(totalPurchases)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Total billing outlays
            </span>
          </div>
        </div>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Total Paid</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-success-dark)' }}>
              {formatINR(totalPaid)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Cash and bank payouts
            </span>
          </div>
        </div>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Pending Owed</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-danger-dark)' }}>
              {formatINR(totalOwed)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Accounts payable balance
            </span>
          </div>
        </div>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Bill Count</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-info)' }}>
              {purchaseCount} bills
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Total purchase transactions
            </span>
          </div>
        </div>
      </div>

      {/* Top filter row */}
      <div className="filters-row-unified">
        <div className="filters-group-one">
          <div className="search-input-wrapper">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search bill number or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Segmented Filter Control */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '10px', border: '1.5px solid var(--border-color)', gap: '2px', flexShrink: 0 }}>
            {['All', 'Paid', 'Partial', 'Unpaid'].map((status) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  className="btn-sm"
                  type="button"
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
              <option value="date-desc">Newest Date first</option>
              <option value="date-asc">Oldest Date first</option>
              <option value="amount-desc">Highest Bill amount</option>
              <option value="amount-asc">Lowest Bill amount</option>
              <option value="number-desc">Bill number desc</option>
            </select>
            <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>

          <button className="btn btn-primary" onClick={() => setIsEnteringPurchase(true)}>
            <Plus size={16} /> Enter Purchase
          </button>
        </div>
      </div>

      {/* List Grid */}
      <div className="card">
        {sortedPurchases.length === 0 ? (
          <div className="empty-state">
            <FileSpreadsheet size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Purchase Records</h4>
            <p className="empty-state-desc">
              No supplier purchases match your filters or searching criteria.
            </p>
            <button className="btn btn-primary" onClick={() => setIsEnteringPurchase(true)}>
              Log New Purchase
            </button>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-nowrap">Bill Number</th>
                      <th>Supplier Name</th>
                      <th className="text-nowrap">Receipt Date</th>
                      <th className="text-nowrap">Total Bill (₹)</th>
                      <th className="text-nowrap">Balance Owed (₹)</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPurchases.map((pur) => (
                      <tr key={pur.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            className="table-link-btn bill-link"
                            onClick={() => setViewPurchase(pur.id)}
                            title={`View details for ${pur.purchaseNumber}`}
                          >
                            {pur.purchaseNumber}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="table-link-btn supplier-link"
                            onClick={() => {
                              setCurrentTab('suppliers');
                              setViewSupplier(pur.supplierId);
                              setViewPurchase(null);
                            }}
                            title={`View supplier profile for ${pur.supplierName}`}
                          >
                            {pur.supplierName}
                          </button>
                        </td>
                        <td className="text-nowrap">{formatDate(pur.date)}</td>
                        <td style={{ fontWeight: 700 }}>{formatINR(pur.grandTotal).replace('₹', '')}</td>
                        <td
                          style={{
                            fontWeight: pur.balanceDue > 0 ? 700 : 600,
                            color: pur.balanceDue > 0 ? 'var(--color-danger)' : 'var(--text-secondary)',
                          }}
                        >
                          {formatINR(pur.balanceDue).replace('₹', '')}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              pur.paymentStatus === 'Paid'
                                ? 'badge-success'
                                : pur.paymentStatus === 'Partial'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {pur.paymentStatus}
                          </span>
                        </td>
                        <td className="no-print" style={{ position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuPurchaseId(activeMenuPurchaseId === pur.id ? null : pur.id);
                            }}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenuPurchaseId === pur.id && (
                            <>
                              {/* Overlay to close the menu on clicking outside */}
                              <div 
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                                onClick={() => setActiveMenuPurchaseId(null)}
                              />
                              
                              {/* Dropdown Menu */}
                              <div className="card" style={{
                                position: 'absolute',
                                right: '100%',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                marginRight: '8px',
                                zIndex: 999,
                                minWidth: '160px',
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
                                    setViewPurchase(pur.id);
                                    setActiveMenuPurchaseId(null);
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
                                    handleStartEditPurchase(pur);
                                    setActiveMenuPurchaseId(null);
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Edit2 size={14} /> Edit Purchase
                                </button>

                                {getAttachmentName(pur.notes) && (
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
                                      setActivePreviewPurchase(pur);
                                      setShowAttachmentPreview(true);
                                      setActiveMenuPurchaseId(null);
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <FileText size={14} /> View Invoice File
                                  </button>
                                )}

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
                                    handleDeletePurchase(pur.id, pur.purchaseNumber);
                                    setActiveMenuPurchaseId(null);
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Trash size={14} style={{ color: 'var(--color-danger)' }} /> Delete
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
              {paginatedPurchases.map((pur) => (
                <div key={pur.id} className="mobile-list-card">
                  <div className="mobile-list-card-header">
                    <div>
                      <h4 className="mobile-list-card-title">
                        <button
                          type="button"
                          className="table-link-btn bill-link"
                          onClick={() => setViewPurchase(pur.id)}
                        >
                          {pur.purchaseNumber}
                        </button>
                      </h4>
                      <span className="mobile-list-card-subtitle">{pur.supplierName}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={(e) => { e.stopPropagation(); setActiveMenuPurchaseId(activeMenuPurchaseId === pur.id ? null : pur.id); }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenuPurchaseId === pur.id && (
                        <>
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuPurchaseId(null)} />
                          <div className="card" style={{
                            position: 'absolute', right: '0', top: '100%', marginTop: '4px',
                            zIndex: 999, minWidth: '160px', padding: '6px 0',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                            display: 'flex', flexDirection: 'column', gap: '2px',
                            backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                          }}>
                            <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                              onClick={() => { setViewPurchase(pur.id); setActiveMenuPurchaseId(null); }}>
                              <Eye size={14} /> View Details
                            </button>
                            <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                              onClick={() => { handleStartEditPurchase(pur); setActiveMenuPurchaseId(null); }}>
                              <Edit2 size={14} /> Edit Purchase
                            </button>
                            {getAttachmentName(pur.notes) && (
                              <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                                onClick={() => { setActivePreviewPurchase(pur); setShowAttachmentPreview(true); setActiveMenuPurchaseId(null); }}>
                                <FileText size={14} /> View Invoice File
                              </button>
                            )}
                            <button className="dropdown-item danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--color-danger)' }}
                              onClick={() => { handleDeletePurchase(pur.id, pur.purchaseNumber); setActiveMenuPurchaseId(null); }}>
                              <Trash size={14} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Receipt Date</span>
                    <span className="mobile-list-card-val">{formatDate(pur.date)}</span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Status</span>
                    <span className="mobile-list-card-val">
                      <span className={`badge ${pur.paymentStatus === 'Paid' ? 'badge-success' : pur.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                        {pur.paymentStatus}
                      </span>
                    </span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Bill</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>
                      {formatINR(pur.grandTotal)}
                    </span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Balance Owed</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700, color: pur.balanceDue > 0 ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                      {formatINR(pur.balanceDue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-row">
                <span>
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, sortedPurchases.length)}</strong> of{' '}
                  <strong>{sortedPurchases.length}</strong> bills
                </span>
                <div className="pagination-btn-group">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                    title="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                    title="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {renderAttachmentPreviewModal()}
      </div>
    </div>
  );
};
