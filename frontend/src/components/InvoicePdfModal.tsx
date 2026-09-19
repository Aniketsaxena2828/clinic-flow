import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Receipt, Download } from 'lucide-react';
import { Bill } from '../types';
import { storageService } from '../services/storageService';

interface InvoicePdfModalProps {
  bill: Bill;
  onClose: () => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({ bill, onClose }) => {
  const settings = storageService.getSettings();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printArea = document.getElementById('invoice-pdf-content');
    if (!printArea) return;

    // Extract compiled application stylesheets and Tailwind rules from document.head
    const styleNodes = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'));
    const stylesHtml = styleNodes.map((node) => node.outerHTML).join('\n');

    const fullHtml = `
      <!DOCTYPE html>
      <html class="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invoice_${bill.invoiceNumber}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
        ${stylesHtml}
        <style>
          @page { size: A4; margin: 10mm; }
          body {
            background-color: #FFFFFF !important;
            color: #0F172A !important;
            font-family: 'Inter', system-ui, sans-serif !important;
            margin: 0 !important;
            padding: 24px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #print-document-root {
            max-width: 800px;
            margin: 0 auto;
            background: #FFFFFF !important;
            color: #0F172A !important;
          }
        </style>
      </head>
      <body class="bg-white text-[#0F172A]">
        <div id="print-document-root">
          ${printArea.innerHTML}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${bill.invoiceNumber || 'INV'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const modalUI = (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-sans modal-backdrop-container">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .modal-backdrop-container,
          .modal-backdrop-container * {
            visibility: visible;
          }
          .modal-backdrop-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-hide {
            display: none !important;
          }
          .modal-print-box {
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          #invoice-pdf-content {
            padding: 0 !important;
            overflow: visible !important;
            max-height: none !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="w-full max-w-3xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative modal-print-box">
        {/* Fixed Header Bar */}
        <div className="flex-none p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white print-hide">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-serif font-bold text-white text-base tracking-wide">Official Tax Invoice & Receipt</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="btn-secondary text-xs py-1.5 px-3 cursor-pointer border-slate-700 bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1"
              title="Download Printable Invoice"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-gold text-xs py-1.5 px-3.5 cursor-pointer shadow-md bg-[#2563EB] text-white flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div id="invoice-pdf-content" className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white text-[#0F172A]">
          {/* Clinic Header */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#0F172A]">
                {settings.clinicName || 'ClinicFlow Healthcare Practice'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {settings.address}, {settings.city}, {settings.state} - {settings.postalCode}
              </p>
              <p className="text-[11px] text-[#2563EB] font-bold mt-1 font-mono">
                GSTIN: {settings.gstin} • Phone: {settings.phone}
              </p>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200 font-mono tracking-wider">
                OFFICIAL TAX INVOICE
              </span>
              <p className="text-lg font-bold text-[#0F172A] mt-2 font-mono">{bill.invoiceNumber}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                Date: {new Date(bill.createdAt || Date.now()).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          {/* Billed To Patient & Doctor Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Billed To Patient</p>
              <p className="font-bold text-sm text-[#0F172A] mt-0.5">{bill.patientName}</p>
              <p className="text-slate-500 font-mono">Phone: {bill.patientPhone || '+91 98765 43210'}</p>
            </div>

            <div className="sm:text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Attending Practitioner</p>
              <p className="font-bold text-sm text-[#0F172A] mt-0.5">{bill.doctorName || 'Attending Doctor'}</p>
              <span
                className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold ${
                  bill.paymentStatus === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : bill.paymentStatus === 'Partially Paid' || bill.paymentStatus === 'Partial'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {bill.paymentStatus}
              </span>
            </div>
          </div>

          {/* Itemized Services Table */}
          <div>
            <h4 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider mb-2">
              Medical Services & Items ({bill.items?.length || 0})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-[#FAF9F6] text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Service / Item Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Amount ({settings.billing?.currencySymbol || '₹'})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bill.items?.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-3 text-slate-400 font-bold font-mono">{idx + 1}</td>
                      <td className="p-3 font-serif font-bold text-[#0F172A] text-sm">{item.description}</td>
                      <td className="p-3 text-slate-500 font-medium">{item.category}</td>
                      <td className="p-3 text-right text-[#0F172A] font-mono">₹{item.unitPrice?.toLocaleString()}</td>
                      <td className="p-3 text-center text-[#0F172A] font-mono">{item.quantity}</td>
                      <td className="p-3 text-right font-bold text-[#2563EB] font-mono">₹{(item.amount || (item.unitPrice * item.quantity)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculations Summary Box */}
          <div className="flex justify-end pt-2 text-xs font-mono">
            <div className="w-full sm:w-72 space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold">₹{bill.subtotal?.toLocaleString()}</span>
              </div>
              {bill.gstRate > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST ({bill.gstRate}%):</span>
                  <span>₹{bill.gstAmount?.toLocaleString()}</span>
                </div>
              )}
              {bill.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Discount Applied:</span>
                  <span>-₹{bill.discountAmount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-[#0F172A] pt-2 border-t border-slate-200">
                <span>Invoice Total:</span>
                <span className="text-[#2563EB]">₹{bill.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span>₹{bill.paidAmount?.toLocaleString()}</span>
              </div>
              {bill.balanceDue > 0 ? (
                <div className="flex justify-between text-xs text-rose-600 font-bold pt-1 border-t border-dashed border-slate-300">
                  <span>Balance Due:</span>
                  <span>₹{bill.balanceDue?.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex justify-between text-xs text-emerald-700 font-bold pt-1 border-t border-dashed border-slate-300">
                  <span>Balance Due:</span>
                  <span>₹0 (Fully Settled)</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Settlement Log */}
          {bill.payments && bill.payments.length > 0 && (
            <div className="pt-4 border-t border-slate-200 font-sans">
              <h4 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                Payment Settlement Log ({bill.payments.length})
              </h4>
              <div className="space-y-1.5 text-xs font-mono">
                {bill.payments.map((p, pIdx) => (
                  <div key={p._id || pIdx} className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 font-medium">
                      {p.paymentMethod} • Txn Ref: {p.transactionRef || 'N/A'} ({new Date(p.paidAt || Date.now()).toLocaleDateString()})
                    </span>
                    <span className="font-bold text-emerald-700">+₹{p.amountPaid?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms & Signature Box */}
          <div className="pt-8 flex items-center justify-between border-t border-slate-100">
            <div className="text-[10px] text-slate-400 max-w-xs">
              <p className="font-bold text-slate-500 uppercase mb-0.5">Terms & Instructions</p>
              <p>Thank you for choosing {settings.clinicName}. Invoices are computer-generated tax receipts.</p>
            </div>
            <div className="text-center w-48">
              <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
              <p className="text-xs font-serif font-bold text-[#0F172A]">{bill.doctorName || 'Authorized Accountant'}</p>
              <p className="text-[10px] text-slate-500 font-mono">Authorized Accounts Stamp</p>
            </div>
          </div>
        </div>

        {/* Fixed Footer Bar */}
        <div className="flex-none p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between z-10 print-hide">
          <button onClick={onClose} className="btn-secondary text-xs py-2 px-4 cursor-pointer hover:border-slate-400">
            Close Invoice
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="btn-secondary text-xs py-2 px-3.5 cursor-pointer flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={handlePrint} className="btn-gold text-xs py-2 px-4 cursor-pointer shadow-md bg-[#2563EB] text-white flex items-center gap-1">
              <Printer className="w-3.5 h-3.5 text-[#FFFFFF]" /> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
};
