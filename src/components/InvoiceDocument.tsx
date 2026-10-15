import React from 'react';
import type { Invoice, Quotation, Customer, BusinessSettings } from '../types';
import { getFullAddress } from '../utils/dummyData';
import { getInvoiceLabels } from '../utils/invoiceDictionary';
import { amountToWords } from '../utils/numberToWords';

export interface InvoiceDocumentProps {
  invoice?: Invoice | null;
  quotation?: Quotation | null;
  customer?: Customer | null;
  settings: BusinessSettings;
  language?: 'mr' | 'en';
  template?: 'A4' | 'A5' | 'Thermal';
  onCustomerClick?: (customerId: string) => void;
  formatDateFn?: (dateStr?: string) => string;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  invoice,
  quotation,
  customer,
  settings,
  language = 'mr',
  template = 'A4',
  onCustomerClick,
  formatDateFn,
}) => {
  const isQuotation = !invoice && !!quotation;
  const activeDoc = invoice || quotation;
  if (!activeDoc) return null;

  const labels = getInvoiceLabels(language);
  const isMarathi = language === 'mr';

  const defaultFormatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatDate = formatDateFn || defaultFormatDate;

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const isInterState = Boolean(
    customer?.state &&
    settings.state &&
    customer.state.trim().toLowerCase() !== settings.state.trim().toLowerCase()
  );

  const subtotal = activeDoc.subtotal || 0;
  const discountTotal = activeDoc.discountTotal || 0;
  const gstTotal = activeDoc.gstTotal || 0;
  const grandTotal = activeDoc.grandTotal || 0;
  const amountPaid = invoice ? (invoice.amountPaid || 0) : 0;
  const balanceDue = invoice ? (invoice.balanceDue || 0) : 0;
  const paymentStatus = invoice ? invoice.paymentStatus : null;
  const paymentMethod = invoice ? invoice.paymentMethod : null;
  const referenceNumber = invoice ? invoice.referenceNumber : null;
  const dueDate = invoice ? invoice.dueDate : null;
  const validUntil = quotation ? quotation.validUntil : null;
  const notes = activeDoc.notes;

  const docNumber = invoice ? invoice.invoiceNumber : quotation ? quotation.quotationNumber : '';
  const docDate = activeDoc.date;

  const amountInWordsText = amountToWords(grandTotal, language);

  // Status label translation
  const getStatusText = (status: string | null) => {
    if (!status) return '';
    if (status.toLowerCase() === 'paid') return labels.statusPaid;
    if (status.toLowerCase() === 'partial') return labels.statusPartial;
    if (status.toLowerCase() === 'unpaid') return labels.statusUnpaid;
    return status.toUpperCase();
  };

  // Payment method translation
  const getPaymentMethodText = (method: string | null) => {
    if (!method) return '';
    if (method.toLowerCase() === 'cash') return labels.methodCash;
    if (method.toLowerCase() === 'upi') return labels.methodUpi;
    if (method.toLowerCase().includes('bank') || method.toLowerCase().includes('transfer')) return labels.methodBankTransfer;
    if (method.toLowerCase() === 'cheque') return labels.methodCheque;
    return method;
  };

  // 1. THERMAL PRINT TEMPLATE (80mm width)
  if (template === 'Thermal') {
    return (
      <div className={`print-invoice-layout thermal ${isMarathi ? 'invoice-marathi' : 'invoice-english'}`}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1b4332' }}>
            {(settings.businessName || 'AgriBiz').toUpperCase()}
          </h3>
          {settings.showAddress && (
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#334155' }}>
              {getFullAddress(settings)}
            </p>
          )}
          {settings.showContact && (
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#334155' }}>
              {[settings.phone, settings.email].filter(Boolean).join(' • ')}
            </p>
          )}
          {settings.showGstin && settings.gstin && (
            <p style={{ margin: '3px 0 0 0', fontSize: '10px', fontWeight: 'bold' }}>
              GSTIN: {settings.gstin}
            </p>
          )}
        </div>

        <div style={{ borderTop: '1px dashed #1b4332', margin: '6px 0' }} />

        <div style={{ textAlign: 'center', margin: '4px 0' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isQuotation ? labels.quotationTitle : labels.taxInvoice}
          </span>
        </div>

        <div style={{ fontSize: '10.5px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              {isQuotation ? labels.quotationNo : labels.invoiceNo}: <strong>{docNumber}</strong>
            </span>
            <span>
              {labels.date}: {formatDate(docDate)}
            </span>
          </div>
          <div>
            {labels.customerName}:{' '}
            {customer ? <strong>{customer.name}</strong> : <strong>{labels.walkInCustomer}</strong>}
          </div>
          {customer?.phone && (
            <div>
              {labels.phone}: {customer.phone}
            </div>
          )}
          {customer?.gstin && <div>GSTIN: {customer.gstin}</div>}
        </div>

        <div style={{ borderTop: '1px dashed #1b4332', margin: '6px 0' }} />

        {/* Thermal Items Table */}
        <div style={{ fontSize: '10.5px' }}>
          <div style={{ fontWeight: 'bold', display: 'grid', gridTemplateColumns: '3.5fr 1fr 1.5fr', paddingBottom: '3px' }}>
            <span>{labels.itemDescription}</span>
            <span style={{ textAlign: 'center' }}>{labels.qty}</span>
            <span style={{ textAlign: 'right' }}>{labels.total}</span>
          </div>
          <div style={{ borderTop: '1px solid #e2e8f0', margin: '3px 0' }} />
          {activeDoc.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '5px', display: 'grid', gridTemplateColumns: '3.5fr 1fr 1.5fr' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{item.productName}</span>
                <div style={{ fontSize: '9px', color: '#64748b' }}>
                  {labels.price}: ₹{item.price} | GST: {item.gstRate}%{item.discount > 0 ? ` | Disc: ${item.discount}%` : ''}
                </div>
              </div>
              <span style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
              <span style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #1b4332', margin: '6px 0' }} />

        {/* Thermal Summary */}
        <div style={{ fontSize: '10.5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{labels.taxableAmount}</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discountTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
              <span>{labels.discountMinus}</span>
              <span>₹{discountTotal.toFixed(2)}</span>
            </div>
          )}
          {isInterState ? (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>IGST</span>
              <span>₹{gstTotal.toFixed(2)}</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CGST</span>
                <span>₹{(gstTotal / 2).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SGST</span>
                <span>₹{(gstTotal / 2).toFixed(2)}</span>
              </div>
            </>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 800,
            fontSize: '12px',
            borderTop: '1px solid #1b4332',
            borderBottom: '1px solid #1b4332',
            padding: '4px 0',
            color: '#1b4332'
          }}>
            <span>{labels.totalAmount}</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
          {invoice && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#16a34a' }}>
                <span>{labels.collectedAmount}</span>
                <span>₹{amountPaid.toFixed(2)}</span>
              </div>
              {balanceDue > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#dc2626' }}>
                  <span>{labels.balanceDue}</span>
                  <span>₹{balanceDue.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Amount in words */}
        <div style={{ marginTop: '6px', fontSize: '9.5px', fontStyle: 'italic', color: '#334155' }}>
          <strong>{labels.amountInWords}:</strong> {amountInWordsText}
        </div>

        <div style={{ borderTop: '1px dashed #1b4332', margin: '6px 0' }} />

        <div style={{ textAlign: 'center', fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '2px', color: '#64748b' }}>
          <div>{settings.footerMessage || labels.thankYouMessage}</div>
          {notes && <div style={{ fontStyle: 'italic' }}>"{notes}"</div>}
        </div>
      </div>
    );
  }

  // 2. STANDARD A4 GST INVOICE (Default) & A5 BILL BOOK
  const isA5 = template === 'A5';

  return (
    <div
      className={`print-invoice-layout invoice-print-container ${isA5 ? 'dense-layout a5-layout' : 'a4-layout'} ${isMarathi ? 'invoice-marathi' : 'invoice-english'} ${
        settings.showLogo && (settings.watermarkLogo || settings.logo) ? 'has-custom-watermark' : ''
      }`}
      style={{
        backgroundColor: '#ffffff',
        fontFamily: isMarathi ? "'Mukta', 'Noto Sans Devanagari', sans-serif" : "'Inter', sans-serif",
      }}
    >
      {/* Central Watermark */}
      {settings.showLogo && (settings.watermarkLogo || settings.logo) && (
        <div className={`print-watermark-logo ${(settings.watermarkAsIs || settings.watermarkColorMode === 'as_is') ? 'as-is' : ''}`}>
          <img src={settings.watermarkLogo || settings.logo} alt="Watermark" />
        </div>
      )}

      {/* Elegant Leafy Agricultural Corner Watermark */}
      <div style={{ position: 'absolute', top: isA5 ? '8px' : '12px', right: isA5 ? '8px' : '14px', opacity: 0.07, pointerEvents: 'none', zIndex: 1 }}>
        <svg width={isA5 ? '55' : '75'} height={isA5 ? '55' : '75'} viewBox="0 0 100 100" fill="none" stroke="#1b4332" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 90 Q 50 50 90 10" />
          <path d="M90 10 C80 20 65 25 60 15 C55 5 70 0 90 10" fill="#1b4332" />
          <path d="M70 30 C60 40 45 45 40 35 C35 25 50 20 70 30" fill="#1b4332" />
          <path d="M50 50 C40 60 25 65 20 55 C15 45 30 40 50 50" fill="#1b4332" />
        </svg>
      </div>

      {/* HEADER SECTION: Business Info + Invoice Meta */}
      <div className="invoice-header-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '2px solid #1b4332',
        paddingBottom: isA5 ? '10px' : '16px',
        marginBottom: isA5 ? '10px' : '14px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Left: Logo & Business Identity */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: isA5 ? '10px' : '16px', maxWidth: '60%' }}>
          {settings.showLogo && settings.logo && (
            <div className="invoice-logo-container" style={{ flexShrink: 0, margin: 0, padding: 0 }}>
              <img
                src={settings.logo}
                alt="Business Logo"
                style={{
                  maxWidth: isA5 ? '80px' : '110px',
                  maxHeight: isA5 ? '80px' : '95px',
                  objectFit: 'contain',
                  borderRadius: '6px',
                }}
              />
            </div>
          )}
          <div>
            <h2 className="invoice-company-name" style={{
              fontSize: isA5 ? '18px' : '23px',
              fontWeight: 800,
              color: '#1b4332',
              margin: '0 0 2px 0',
              fontFamily: isMarathi ? "'Mukta', sans-serif" : "'Outfit', sans-serif",
              letterSpacing: '-0.3px',
              lineHeight: 1.2
            }}>
              {settings.businessName}
            </h2>
            {settings.showAddress && (
              <p className="invoice-company-sub" style={{
                fontSize: isA5 ? '9px' : '10.5px',
                color: '#334155',
                margin: '2px 0 0 0',
                lineHeight: 1.4,
                fontWeight: 500
              }}>
                {getFullAddress(settings)}
              </p>
            )}
            {settings.showContact && (
              <p className="invoice-company-sub" style={{
                fontSize: isA5 ? '9px' : '10px',
                color: '#475569',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 8px',
                alignItems: 'center',
                margin: '3px 0 0 0',
                fontWeight: 500
              }}>
                {settings.phone && <span><strong>{labels.mob}</strong> {settings.phone}</span>}
                {settings.email && <span>| <strong>{labels.email}</strong> {settings.email}</span>}
                {settings.website && <span>| <strong>{labels.web}</strong> {settings.website}</span>}
              </p>
            )}
            {settings.showGstin && (settings.gstin || settings.panNumber) && (
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '4px',
                fontSize: isA5 ? '9px' : '10px',
                fontWeight: 700,
                color: '#0f172a'
              }}>
                {settings.gstin && <span>GSTIN: <span className="invoice-num-font">{settings.gstin}</span></span>}
                {settings.panNumber && <span>PAN: <span className="invoice-num-font">{settings.panNumber}</span></span>}
              </div>
            )}
          </div>
        </div>

        {/* Right: Document Title, Number, Date, Copy Badge */}
        <div style={{ textAlign: 'right', minWidth: '150px' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(27, 67, 50, 0.08)',
            color: '#1b4332',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: 700,
            marginBottom: '4px',
            letterSpacing: '0.4px'
          }}>
            {labels.originalForRecipient}
          </div>
          <h1 className="invoice-main-title" style={{
            fontSize: isA5 ? '18px' : '24px',
            fontWeight: 800,
            color: '#1b4332',
            margin: '0',
            lineHeight: 1.2,
            fontFamily: isMarathi ? "'Mukta', sans-serif" : "'Outfit', sans-serif",
            letterSpacing: isMarathi ? '0.2px' : '0.8px'
          }}>
            {isQuotation ? labels.quotationTitle : labels.taxInvoice}
          </h1>
          <div className="invoice-number-text" style={{
            fontSize: isA5 ? '11px' : '13px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '3px 0 0 0',
            fontFamily: "'Outfit', sans-serif"
          }}>
            {isQuotation ? labels.quotationNo : labels.invoiceNo}: #{docNumber}
          </div>
          <p className="invoice-date-text" style={{
            fontSize: isA5 ? '9.5px' : '11px',
            color: '#475569',
            margin: '2px 0 0 0',
            fontWeight: 600
          }}>
            {labels.date}: <span className="invoice-num-font">{formatDate(docDate)}</span>
          </p>
          {validUntil && (
            <p className="invoice-date-text" style={{ fontSize: isA5 ? '9px' : '10.5px', color: '#2563eb', margin: '2px 0 0 0', fontWeight: 600 }}>
              {labels.validUntil}: <span className="invoice-num-font">{formatDate(validUntil)}</span>
            </p>
          )}
        </div>
      </div>

      {/* BILLING & PAYMENT SECTION */}
      <div className="invoice-billing-details" style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: isA5 ? '10px' : '16px',
        marginBottom: isA5 ? '10px' : '14px',
        backgroundColor: '#f8faf9',
        padding: isA5 ? '10px 14px' : '12px 18px',
        borderRadius: '8px',
        border: '1px solid #d1e2d6',
        borderLeft: '4px solid #1b4332',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Left: Customer Info */}
        <div>
          <h4 className="invoice-detail-header" style={{
            fontSize: isA5 ? '9.5px' : '11px',
            fontWeight: 800,
            color: '#1b4332',
            textTransform: 'uppercase',
            margin: '0 0 3px 0',
            letterSpacing: '0.4px'
          }}>
            {labels.billTo}
          </h4>
          {customer ? (
            <>
              <h3 className="invoice-customer-name" style={{
                fontSize: isA5 ? '13px' : '15px',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 2px 0'
              }}>
                {onCustomerClick ? (
                  <>
                    <button
                      type="button"
                      className="table-link-btn customer-link no-print"
                      style={{
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                        color: '#1b4332',
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        textDecoration: 'underline',
                      }}
                      onClick={() => onCustomerClick(customer.id)}
                    >
                      {customer.name}
                    </button>
                    <span className="print-only">{customer.name}</span>
                  </>
                ) : (
                  <span>{customer.name}</span>
                )}
              </h3>
              <p className="invoice-customer-sub" style={{ fontSize: isA5 ? '9.5px' : '11px', color: '#334155', margin: '2px 0 0 0', lineHeight: 1.35 }}>
                {customer.address || labels.addressNa}
              </p>
              <p className="invoice-customer-sub" style={{ fontSize: isA5 ? '9.5px' : '11px', color: '#334155', margin: '2px 0 0 0' }}>
                <strong>{labels.phone}:</strong> <span className="invoice-num-font">{customer.phone}</span>
              </p>
              {customer.gstin && (
                <p className="invoice-customer-gst" style={{ fontSize: isA5 ? '9.5px' : '11px', fontWeight: 700, color: '#0f172a', margin: '3px 0 0 0' }}>
                  GSTIN: <span className="invoice-num-font">{customer.gstin}</span>
                </p>
              )}
            </>
          ) : (
            <h3 className="invoice-customer-name" style={{ fontSize: isA5 ? '12px' : '14px', fontWeight: 700, color: '#475569', margin: '2px 0 0 0' }}>
              {labels.walkInCustomer}
            </h3>
          )}
        </div>

        {/* Right: Payment details / Quotation status */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
          <h4 className="invoice-detail-header" style={{
            fontSize: isA5 ? '9.5px' : '11px',
            fontWeight: 800,
            color: '#1b4332',
            textTransform: 'uppercase',
            margin: '0 0 4px 0',
            letterSpacing: '0.4px'
          }}>
            {labels.paymentInfo}
          </h4>

          {invoice && paymentStatus && (
            <span
              className={`invoice-payment-badge ${paymentStatus.toLowerCase()}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: isA5 ? '9px' : '10.5px',
                fontWeight: 800,
                letterSpacing: '0.4px',
                backgroundColor: paymentStatus.toLowerCase() === 'paid' ? 'rgba(22, 163, 74, 0.12)' : paymentStatus.toLowerCase() === 'partial' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                color: paymentStatus.toLowerCase() === 'paid' ? '#15803d' : paymentStatus.toLowerCase() === 'partial' ? '#b45309' : '#b91c1c',
              }}
            >
              {getStatusText(paymentStatus)}
            </span>
          )}

          {invoice && paymentMethod && (
            <p className="invoice-customer-sub" style={{ fontSize: isA5 ? '9px' : '10.5px', marginTop: '4px', fontWeight: 600, color: '#334155' }}>
              <strong>{labels.paymentMethod}:</strong> {getPaymentMethodText(paymentMethod)}
            </p>
          )}

          {invoice && referenceNumber && (
            <p className="invoice-customer-sub" style={{ fontSize: isA5 ? '8.5px' : '10px', marginTop: '2px', fontWeight: 600, color: '#475569' }}>
              {paymentMethod === 'Cheque' ? labels.chequeNo : labels.txnRefNo}: <span className="invoice-num-font">{referenceNumber}</span>
            </p>
          )}

          {invoice && dueDate && balanceDue > 0 && (
            <p className="invoice-customer-sub" style={{ fontSize: isA5 ? '9px' : '10.5px', marginTop: '3px', fontWeight: 700, color: '#dc2626' }}>
              {labels.dueBy} <span className="invoice-num-font">{formatDate(dueDate)}</span>
            </p>
          )}
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="invoice-table" style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: isA5 ? '10px' : '14px',
        position: 'relative',
        zIndex: 2
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f7f2', borderTop: '1.5px solid #1b4332', borderBottom: '2px solid #1b4332' }}>
            <th style={{ width: isA5 ? '28px' : '36px', textAlign: 'center', padding: isA5 ? '6px 4px' : '9px 8px', fontSize: isA5 ? '9.5px' : '11px', fontWeight: 800, color: '#1b4332' }}>
              {labels.srNo}
            </th>
            <th style={{ textAlign: 'left', padding: isA5 ? '6px 8px' : '9px 12px', fontSize: isA5 ? '9.5px' : '11px', fontWeight: 800, color: '#1b4332' }}>
              {labels.itemDescription}
            </th>
            <th style={{ width: isA5 ? '55px' : '70px', textAlign: 'center', padding: isA5 ? '6px 4px' : '9px 6px', fontSize: isA5 ? '9.5px' : '11px', fontWeight: 800, color: '#1b4332' }}>
              {labels.gstRate}
            </th>
            <th style={{ width: isA5 ? '70px' : '85px', textAlign: 'right', padding: isA5 ? '6px 6px' : '9px 10px', fontSize: isA5 ? '9.5px' : '11px', fontWeight: 800, color: '#1b4332' }}>
              {labels.price}
            </th>
            <th style={{ width: isA5 ? '50px' : '65px', textAlign: 'center', padding: isA5 ? '6px 4px' : '9px 6px', fontSize: isA5 ? '9.5px' : '11px', fontWeight: 800, color: '#1b4332' }}>
              {labels.qty}
            </th>
            <th style={{ width: isA5 ? '55px' : '65px', textAlign: 'right', padding: isA5 ? '6px 4px' : '9px 6px', fontSize: isA5 ? '9.5px' : '11px', fontWeight: 800, color: '#1b4332' }}>
              {labels.discount}
            </th>
            <th style={{ width: isA5 ? '80px' : '105px', textAlign: 'right', padding: isA5 ? '6px 8px' : '9px 12px', fontSize: isA5 ? '9.5px' : '11px', fontWeight: 800, color: '#1b4332' }}>
              {labels.total}
            </th>
          </tr>
        </thead>
        <tbody>
          {activeDoc.items.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafcfb' }}>
              <td style={{ textAlign: 'center', padding: isA5 ? '6px 4px' : '8px 8px', fontSize: isA5 ? '10px' : '11.5px', color: '#64748b', fontWeight: 600 }}>
                {index + 1}
              </td>
              <td style={{ textAlign: 'left', padding: isA5 ? '6px 8px' : '8px 12px', fontSize: isA5 ? '10.5px' : '12px', fontWeight: 700, color: '#0f172a', lineHeight: 1.45 }}>
                {item.productName}
              </td>
              <td style={{ textAlign: 'center', padding: isA5 ? '6px 4px' : '8px 6px', fontSize: isA5 ? '10px' : '11.5px', color: '#334155', fontWeight: 600 }} className="invoice-num-font">
                {item.gstRate}%
              </td>
              <td style={{ textAlign: 'right', padding: isA5 ? '6px 6px' : '8px 10px', fontSize: isA5 ? '10px' : '11.5px', color: '#334155', fontWeight: 600 }} className="invoice-num-font">
                {item.price.toFixed(2)}
              </td>
              <td style={{ textAlign: 'center', padding: isA5 ? '6px 4px' : '8px 6px', fontSize: isA5 ? '10.5px' : '12px', fontWeight: 800, color: '#0f172a' }} className="invoice-num-font">
                {item.quantity}
              </td>
              <td style={{ textAlign: 'right', padding: isA5 ? '6px 4px' : '8px 6px', fontSize: isA5 ? '10px' : '11.5px', color: item.discount > 0 ? '#16a34a' : '#64748b', fontWeight: 600 }} className="invoice-num-font">
                {item.discount > 0 ? `${item.discount}%` : '-'}
              </td>
              <td style={{ textAlign: 'right', padding: isA5 ? '6px 8px' : '8px 12px', fontSize: isA5 ? '10.5px' : '12px', fontWeight: 800, color: '#0f172a' }} className="invoice-num-font">
                {item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SUMMARY, AMOUNT IN WORDS & BANK DETAILS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: isA5 ? '12px' : '20px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Left Column: Amount in Words, Bank Details, Terms */}
        <div style={{ flex: 1, maxWidth: '58%' }}>
          {/* Amount in words banner */}
          <div style={{
            backgroundColor: '#f0f7f2',
            border: '1px solid #d1e2d6',
            borderRadius: '6px',
            padding: isA5 ? '6px 10px' : '8px 12px',
            marginBottom: isA5 ? '8px' : '10px'
          }}>
            <span style={{ fontSize: isA5 ? '9px' : '10.5px', fontWeight: 800, color: '#1b4332', display: 'block', marginBottom: '2px' }}>
              {labels.amountInWords}:
            </span>
            <span style={{
              fontSize: isA5 ? '10px' : '11.5px',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.4,
              fontFamily: isMarathi ? "'Mukta', sans-serif" : "'Inter', sans-serif"
            }}>
              {amountInWordsText}
            </span>
          </div>

          {/* Bank Details */}
          {settings.showBankDetails && settings.bankName && (
            <div style={{ marginBottom: isA5 ? '6px' : '8px' }}>
              <h5 className="invoice-terms-title" style={{
                fontSize: isA5 ? '9px' : '10.5px',
                fontWeight: 800,
                color: '#1b4332',
                margin: '0 0 3px 0'
              }}>
                {labels.bankDetails}
              </h5>
              <div style={{ fontSize: isA5 ? '8.5px' : '10px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.4 }}>
                <div>
                  <strong>{labels.bank}</strong> {settings.bankName}{settings.branchName ? ` (${settings.branchName})` : ''}
                </div>
                <div>
                  <strong>{labels.acName}</strong> {settings.accountHolderName || settings.businessName}
                </div>
                <div>
                  <strong>{labels.acNo}</strong> <span className="invoice-num-font">{settings.accountNumber}</span> | <strong>{labels.ifsc}</strong> <span className="invoice-num-font">{settings.ifscCode}</span>
                  {settings.upiId && <span> | <strong>{labels.upi}</strong> <span className="invoice-num-font">{settings.upiId}</span></span>}
                </div>
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {settings.showTerms && (settings.invoiceTerms || settings.defaultTerms) && (
            <div style={{ marginBottom: isA5 ? '6px' : '8px' }}>
              <h5 className="invoice-terms-title" style={{
                fontSize: isA5 ? '8.5px' : '10px',
                fontWeight: 800,
                color: '#1b4332',
                margin: '0 0 2px 0'
              }}>
                {labels.termsConditions}
              </h5>
              <p className="invoice-terms-text" style={{
                fontSize: isA5 ? '8px' : '9.5px',
                color: '#475569',
                lineHeight: 1.35,
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {isQuotation ? (settings.quotationTerms || settings.defaultTerms) : (settings.invoiceTerms || settings.defaultTerms)}
              </p>
            </div>
          )}

          {/* Optional Notes */}
          {notes && (
            <div style={{ marginTop: '4px' }}>
              <h5 className="invoice-terms-title" style={{ fontSize: isA5 ? '8.5px' : '10px', fontWeight: 800, color: '#1b4332', margin: '0 0 2px 0' }}>
                {labels.note}
              </h5>
              <p className="invoice-terms-text" style={{ fontSize: isA5 ? '8px' : '9.5px', color: '#475569', margin: 0, fontStyle: 'italic' }}>
                {notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Financial Summary Table */}
        <div style={{ minWidth: isA5 ? '190px' : '240px' }}>
          <table className="invoice-summary-table" style={{ width: '100%', fontSize: isA5 ? '10px' : '11.5px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: isA5 ? '3px 0' : '4px 0', color: '#475569', fontWeight: 600 }}>{labels.taxableAmount}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }} className="invoice-num-font">{formatINR(subtotal)}</td>
              </tr>
              {discountTotal > 0 && (
                <tr className="discount-row">
                  <td style={{ padding: isA5 ? '3px 0' : '4px 0', color: '#16a34a', fontWeight: 600 }}>{labels.discountMinus}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }} className="invoice-num-font">{formatINR(discountTotal)}</td>
                </tr>
              )}
              {isInterState ? (
                <tr>
                  <td style={{ padding: isA5 ? '3px 0' : '4px 0', color: '#475569', fontWeight: 600 }}>{labels.igst}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }} className="invoice-num-font">{formatINR(gstTotal)}</td>
                </tr>
              ) : (
                <>
                  <tr>
                    <td style={{ padding: isA5 ? '3px 0' : '4px 0', color: '#475569', fontWeight: 600 }}>{labels.cgst}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }} className="invoice-num-font">{formatINR(gstTotal / 2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: isA5 ? '3px 0' : '4px 0', color: '#475569', fontWeight: 600 }}>{labels.sgst}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }} className="invoice-num-font">{formatINR(gstTotal / 2)}</td>
                  </tr>
                </>
              )}

              {/* Total Payable Row with Tasteful Deep-Green Highlight */}
              <tr className="grand-total-row">
                <td colSpan={2} style={{ padding: isA5 ? '6px 0 4px 0' : '8px 0 6px 0' }}>
                  <div style={{
                    backgroundColor: '#1b4332',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: isA5 ? '6px 10px' : '8px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(27, 67, 50, 0.18)'
                  }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: isA5 ? '11px' : '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      fontFamily: isMarathi ? "'Mukta', sans-serif" : "'Outfit', sans-serif"
                    }}>
                      {labels.totalAmount}
                    </span>
                    <span style={{
                      fontWeight: 800,
                      fontSize: isA5 ? '13px' : '16px',
                      fontFamily: "'Outfit', sans-serif"
                    }}>
                      {formatINR(grandTotal)}
                    </span>
                  </div>
                </td>
              </tr>

              {invoice && (
                <>
                  <tr className="collected-row">
                    <td style={{ padding: isA5 ? '3px 0' : '4px 0', color: '#16a34a', fontWeight: 700 }}>{labels.collectedAmount}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }} className="invoice-num-font">{formatINR(amountPaid)}</td>
                  </tr>
                  {balanceDue > 0 && (
                    <tr className="due-row">
                      <td style={{ padding: isA5 ? '3px 0' : '4px 0', color: '#dc2626', fontWeight: 800 }}>{labels.balanceDue}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }} className="invoice-num-font">{formatINR(balanceDue)}</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TASTEFUL AGRICULTURAL BOTTOM MOTIF */}
      <div className="invoice-decor-row" style={{ display: 'flex', justifyContent: 'center', marginTop: isA5 ? '4px' : '8px', width: '100%', flexShrink: 0 }}>
        <svg viewBox="0 0 500 65" width="100%" height={isA5 ? '22' : '26'} style={{ display: 'block', maxWidth: isA5 ? '320px' : '420px', opacity: 0.85 }}>
          {/* Ground line */}
          <line x1="0" y1="58" x2="500" y2="58" stroke="#d1e2d6" strokeWidth="2" />
          
          {/* 1. Tractor with plow */}
          <rect x="20" y="24" width="45" height="25" fill="#1b4332" rx="3" />
          <rect x="30" y="10" width="28" height="16" fill="none" stroke="#1b4332" strokeWidth="2" rx="1" />
          <rect x="32" y="12" width="24" height="12" fill="#ffffff" rx="0.5" />
          <rect x="65" y="29" width="18" height="20" fill="#1b4332" />
          <line x1="83" y1="31" x2="83" y2="44" stroke="#d1e2d6" strokeWidth="1.5" />
          <line x1="72" y1="29" x2="72" y2="8" stroke="#1b4332" strokeWidth="1.5" />
          <circle cx="32" cy="49" r="13" fill="#1b4332" />
          <circle cx="32" cy="49" r="5" fill="#ffffff" />
          <circle cx="72" cy="52" r="9" fill="#1b4332" />
          <circle cx="72" cy="52" r="3.5" fill="#ffffff" />
          <path d="M 20 37 L 5 37 L 0 54 M 5 54 L 10 37" stroke="#1b4332" strokeWidth="1.5" fill="none" />

          {/* 2. Crop Sprout / Seedling */}
          <path d="M 160 58 Q 165 42 165 30" stroke="#2d6a4f" strokeWidth="2.5" fill="none" />
          <path d="M 165 38 Q 152 30 150 40 Q 158 45 165 40" fill="#2d6a4f" />
          <path d="M 165 34 Q 178 26 180 36 Q 172 41 165 36" fill="#2d6a4f" />

          {/* 3. Water Pump / Irrigation */}
          <rect x="250" y="24" width="36" height="24" fill="#1b4332" rx="2" />
          <line x1="256" y1="24" x2="256" y2="48" stroke="#ffffff" strokeWidth="1" />
          <line x1="262" y1="24" x2="262" y2="48" stroke="#ffffff" strokeWidth="1" />
          <line x1="268" y1="24" x2="268" y2="48" stroke="#ffffff" strokeWidth="1" />
          <circle cx="298" cy="36" r="13" fill="#1b4332" />
          <rect x="293" y="49" width="10" height="12" fill="#1b4332" />
          <path d="M 302 24 Q 308 12 318 12 L 328 12" stroke="#1b4332" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* 4. Sprayer Nozzle */}
          <rect x="390" y="16" width="24" height="34" fill="#1b4332" rx="5" />
          <rect x="398" y="12" width="8" height="4" fill="#2d6a4f" rx="1" />
          <circle cx="402" cy="25" r="4" fill="#ffffff" stroke="#1b4332" strokeWidth="1" />
          <path d="M 414 42 Q 422 50 425 38 T 428 25" stroke="#1b4332" strokeWidth="1.5" fill="none" />
          <line x1="428" y1="25" x2="446" y2="10" stroke="#1b4332" strokeWidth="1" />
          <circle cx="448" cy="8" r="1.5" fill="#2d6a4f" opacity="0.6" />
          <circle cx="452" cy="6" r="1" fill="#2d6a4f" opacity="0.5" />
        </svg>
      </div>

      {/* SIGNATURES SECTION */}
      <div className="invoice-signatures-row" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: isA5 ? '6px' : '10px',
        width: '100%',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2
      }}>
        {/* Receiver's Signature */}
        <div style={{ textAlign: 'center', minWidth: isA5 ? '100px' : '130px' }}>
          <div style={{ height: isA5 ? '18px' : '26px' }} />
          <p style={{
            borderTop: '1.5px solid #d1e2d6',
            paddingTop: '4px',
            fontSize: isA5 ? '9.5px' : '11px',
            fontWeight: 700,
            color: '#1b4332',
            margin: 0,
            whiteSpace: 'nowrap',
            fontFamily: isMarathi ? "'Mukta', sans-serif" : "'Inter', sans-serif"
          }}>
            {labels.receiversSignature}
          </p>
        </div>

        {/* Authorized Signature */}
        <div style={{ textAlign: 'center', minWidth: isA5 ? '120px' : '150px' }}>
          <div style={{
            height: isA5 ? '26px' : '36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginBottom: '2px'
          }}>
            <span style={{ fontSize: isA5 ? '8.5px' : '9.5px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
              {labels.forCompany} {settings.businessName}
            </span>
            {settings.signature && (invoice ? invoice.showSignature !== false : true) ? (
              <img
                src={settings.signature}
                alt="E-Signature"
                style={{ maxHeight: isA5 ? '20px' : '28px', maxWidth: '100px', objectFit: 'contain', mixBlendMode: 'multiply' }}
              />
            ) : null}
          </div>
          <p style={{
            borderTop: '1.5px solid #d1e2d6',
            paddingTop: '4px',
            fontSize: isA5 ? '9.5px' : '11px',
            fontWeight: 800,
            color: '#1b4332',
            margin: 0,
            whiteSpace: 'nowrap',
            fontFamily: isMarathi ? "'Mukta', sans-serif" : "'Inter', sans-serif"
          }}>
            {labels.authorizedSignature}
          </p>
        </div>
      </div>

      {/* FOOTER MESSAGE */}
      <div className="invoice-footer-message" style={{
        textAlign: 'center',
        fontSize: isA5 ? '8px' : '9.5px',
        color: '#64748b',
        borderTop: '1px dashed #d1e2d6',
        paddingTop: isA5 ? '4px' : '6px',
        marginTop: isA5 ? '6px' : '10px',
        width: '100%',
        flexShrink: 0
      }}>
        {settings.footerMessage || labels.thankYouMessage}
      </div>
    </div>
  );
};
