import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FlaskConical, Download } from 'lucide-react';
import { LabOrder, storageService } from '../services/storageService';

interface LabReportPdfModalProps {
  order: LabOrder;
  onClose: () => void;
}

export const LabReportPdfModal: React.FC<LabReportPdfModalProps> = ({ order, onClose }) => {
  const settings = storageService.getSettings();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printArea = document.getElementById('lab-report-pdf-content');
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
        <title>Lab_Report_${order.orderId || order.testId || 'LAB'}</title>
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
    link.download = `Lab_Report_${order.orderId || order.testId || 'LAB'}.html`;
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
          #lab-report-pdf-content {
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
            <FlaskConical className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-serif font-bold text-white text-base tracking-wide">Official Pathology Diagnostic Report</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="btn-secondary text-xs py-1.5 px-3 cursor-pointer border-slate-700 bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1"
              title="Download Printable Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-gold text-xs py-1.5 px-3.5 cursor-pointer shadow-md bg-[#2563EB] text-white flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Print Report</span>
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

        {/* Scrollable Printable Report Content */}
        <div id="lab-report-pdf-content" className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white text-[#0F172A]">
          {/* Laboratory Letterhead Header */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#0F172A]">
                {settings.lab?.labName || 'ClinicFlow NABL Diagnostics'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                NABL Accredited Laboratory • {settings.address}, {settings.city}
              </p>
              <p className="text-[11px] text-[#2563EB] font-bold mt-1 font-mono">
                Reg No: {settings.registrationNumber} • Phone: {settings.lab?.labContactPhone || settings.phone}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                  order.status === 'Result Ready' || order.status === 'Report Uploaded'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : order.status === 'Processing' || order.status === 'Sample Collected'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : order.status === 'Cancelled'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {order.status?.toUpperCase() || 'ORDERED'}
              </span>
              <p className="text-lg font-bold text-[#0F172A] mt-2 font-mono">{order.orderId || order.testId || 'LAB-2026-001'}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                Report Date: {new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          {/* Patient & Ordering Doctor Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Patient Information</p>
              <p className="font-bold text-sm text-[#0F172A] mt-0.5">{order.patientName}</p>
              <p className="text-slate-500 font-mono">
                ID: {order.patientId} • Age: {order.patientAge || '32'} Yrs • Gender: {order.patientGender || 'Male'}
              </p>
              <p className="text-slate-500 font-mono">Contact: {order.patientPhone || '+91 98765 43210'}</p>
            </div>

            <div className="sm:text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ordering Practitioner</p>
              <p className="font-bold text-sm text-[#0F172A] mt-0.5">{order.doctorName || 'Dr. Sarah Connor'}</p>
              <p className="text-slate-500 text-[11px] font-serif">{order.doctorSpecialization || 'Internal Medicine'}</p>
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">Sample Status: <strong className="text-slate-700 font-bold">{order.sampleStatus || (order.status === 'Ordered' ? 'Pending Collection' : order.status)}</strong></p>
            </div>
          </div>

          {/* Order Test Information */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs font-mono">
            <div>
              <span className="text-slate-500">Test Category:</span> <strong className="text-[#0F172A]">{order.category}</strong>
            </div>
            <div>
              <span className="text-slate-500">Sample Specimen:</span> <strong className="text-[#2563EB]">{order.sampleType || order.tests?.[0]?.sampleType || 'Blood Specimen'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Collection Date:</span> <strong className="text-slate-700">{order.sampleCollectedAt || new Date().toLocaleDateString()}</strong>
            </div>
          </div>

          {/* Test Results Parameter Table */}
          <div>
            <h4 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider mb-2">
              Laboratory Parameter Investigation Results ({order.results?.length || 0})
            </h4>

            {order.results && order.results.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[550px]">
                  <thead className="bg-[#FAF9F6] text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Investigation Parameter</th>
                      <th className="p-3">Observed Result</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Biological Reference Interval</th>
                      <th className="p-3 text-center">Status Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {order.results.map((res, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-serif font-bold text-[#0F172A] text-sm">{res.parameter}</td>
                        <td className="p-3 font-bold text-[#2563EB] text-sm">{res.value}</td>
                        <td className="p-3 text-slate-600">{res.unit}</td>
                        <td className="p-3 text-slate-600">{res.normalRange}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              res.flag === 'Normal' || !res.flag
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : res.flag === 'High' || res.flag === 'Low'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {res.flag || 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-center font-sans">
                <p className="text-xs font-bold text-amber-800">Results Pending</p>
                <p className="text-[11px] text-amber-700 mt-0.5">Laboratory investigation for this specimen is currently in progress.</p>
              </div>
            )}
          </div>

          {/* Pathologist Notes & Remarks */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pathologist Remarks & Clinical Notes</p>
            <p className="text-slate-700 leading-relaxed font-sans">
              {order.notes || 'All reported parameters have been cross-verified with calibrated automated analyzers. Clinical correlation is recommended.'}
            </p>
          </div>

          {/* Signature Box */}
          <div className="pt-8 flex items-center justify-between border-t border-slate-100">
            <div className="text-[10px] text-slate-400 max-w-xs">
              <p className="font-bold text-slate-500 uppercase mb-0.5">End of Laboratory Report</p>
              <p>Reports are electronically authenticated under statutory NABL pathology guidelines.</p>
            </div>
            <div className="text-center w-52">
              <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
              <p className="text-xs font-serif font-bold text-[#0F172A]">{settings.lab?.pathologistName || 'Dr. Aris Thorne, MD'}</p>
              <p className="text-[10px] text-slate-500 font-mono">{settings.lab?.pathologistTitle || 'Chief Consultant Pathologist'}</p>
            </div>
          </div>
        </div>

        {/* Fixed Footer Bar */}
        <div className="flex-none p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between z-10 print-hide">
          <button onClick={onClose} className="btn-secondary text-xs py-2 px-4 cursor-pointer hover:border-slate-400">
            Close Report
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="btn-secondary text-xs py-2 px-3.5 cursor-pointer flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button onClick={handlePrint} className="btn-gold text-xs py-2 px-4 cursor-pointer shadow-md bg-[#2563EB] text-white flex items-center gap-1">
              <Printer className="w-3.5 h-3.5 text-white" /> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
};
