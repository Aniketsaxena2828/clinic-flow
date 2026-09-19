import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText, Download } from 'lucide-react';
import { Prescription } from '../types';

interface PrescriptionPdfModalProps {
  prescription: Prescription;
  onClose: () => void;
}

export const PrescriptionPdfModal: React.FC<PrescriptionPdfModalProps> = ({ prescription, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printArea = document.getElementById('prescription-pdf-content');
    if (!printArea) return;

    // Grab all current application stylesheets and Tailwind rules from document.head
    const styleNodes = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'));
    const stylesHtml = styleNodes.map(node => node.outerHTML).join('\n');

    const fullHtml = `
      <!DOCTYPE html>
      <html class="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Prescription_${prescription._id}</title>
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
    link.download = `Prescription_${prescription._id || 'Rx'}.html`;
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
          #prescription-pdf-content {
            padding: 0 !important;
            overflow: visible !important;
            max-height: none !important;
          }
        }
      `}</style>

      {/* Modal Box Container */}
      <div className="w-full max-w-3xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative modal-print-box">
        
        {/* Fixed Header Bar */}
        <div className="flex-none p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white print-hide">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-serif font-bold text-white text-base tracking-wide">Medical Prescription (Rx) Preview</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="btn-secondary text-xs py-1.5 px-3 cursor-pointer border-slate-700 bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1"
              title="Download Printable Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-gold text-xs py-1.5 px-3.5 cursor-pointer shadow-md bg-[#2563EB] text-white flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Print</span>
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

        {/* Scrollable Prescription Content Area */}
        <div id="prescription-pdf-content" className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white text-[#0F172A]">
          {/* Top Letterhead */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#0F172A]">
                {prescription.clinic?.name || 'ClinicFlow Medical & Healthcare Practice'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {prescription.clinic?.address || 'Suite 402, Medical Enclave, Connaught Place, New Delhi'}
              </p>
              <p className="text-[11px] text-[#2563EB] font-bold mt-1 font-mono">
                Ph: {prescription.clinic?.phone || '+91 98765 43210'} • GST: {prescription.clinic?.gstNumber || '07AAAAA0000A1Z5'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-serif font-bold text-[#2563EB]">Rx</span>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Rx ID: <span className="font-bold text-[#2563EB]">{prescription._id}</span>
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Date: {new Date(prescription.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Practitioner & Patient Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Attending Practitioner</p>
              <p className="font-serif font-bold text-base text-[#0F172A] mt-0.5">{prescription.doctorName}</p>
              <p className="text-[11px] text-[#2563EB] font-semibold">{prescription.doctorSpecialization || 'Specialist'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Patient Information</p>
              <p className="font-bold text-sm text-[#0F172A] mt-0.5">{prescription.patientName}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                ID: {prescription.patientId} • Blood Group: <span className="text-rose-600 font-bold">{prescription.patient?.bloodGroup || 'O+'}</span>
              </p>
            </div>
          </div>

          {/* Vitals Summary */}
          {prescription.vitals && (
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono font-medium">
              <span>BP: <strong className="text-[#0F172A]">{prescription.vitals.bp || '120/80'}</strong></span>
              <span>Pulse: <strong className="text-[#0F172A]">{prescription.vitals.pulse || '72 bpm'}</strong></span>
              <span>Temp: <strong className="text-[#0F172A]">{prescription.vitals.temp || '98.6 °F'}</strong></span>
              <span>Weight: <strong className="text-[#0F172A]">{prescription.vitals.weight || '70 kg'}</strong></span>
            </div>
          )}

          {/* Clinical Diagnosis */}
          <div>
            <h4 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider mb-1">
              Clinical Diagnosis
            </h4>
            <p className="text-sm font-semibold text-[#0F172A] bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {prescription.diagnosis}
            </p>
          </div>

          {/* Prescribed Medications */}
          <div>
            <h4 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider mb-2">
              Prescribed Medications ({prescription.medicines?.length || 0})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-[#FAF9F6] text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Medicine & Form</th>
                    <th className="p-3">Dosage</th>
                    <th className="p-3">Frequency</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescription.medicines?.map((m, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-3 text-slate-400 font-bold font-mono">{idx + 1}</td>
                      <td className="p-3 font-serif font-bold text-[#0F172A] text-sm">
                        {m.medicineName} <span className="text-[10px] text-[#2563EB] font-sans font-semibold">({m.type})</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#2563EB]">{m.dosage}</td>
                      <td className="p-3 text-slate-700 font-medium">{m.frequency}</td>
                      <td className="p-3 text-slate-700 font-medium">{m.duration}</td>
                      <td className="p-3 text-slate-500">{m.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advice & Follow-Up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {prescription.advice && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-500 uppercase text-[10px]">Practitioner Advice</p>
                <p className="text-[#0F172A] font-medium mt-1">{prescription.advice}</p>
              </div>
            )}

            {prescription.followUpDate && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-500 uppercase text-[10px]">Recommended Follow-Up</p>
                <p className="text-sm font-bold text-[#0F172A] font-mono mt-1">{prescription.followUpDate}</p>
              </div>
            )}
          </div>

          {/* Signature Area */}
          <div className="pt-8 flex items-center justify-between border-t border-slate-100">
            <div>
              <span className="text-[10px] font-mono text-slate-400">ClinicFlow Digital Verification Stamp</span>
            </div>
            <div className="text-center w-48">
              <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
              <p className="text-xs font-serif font-bold text-[#0F172A]">{prescription.doctorName}</p>
              <p className="text-[10px] text-slate-500 font-mono">Authorized Practitioner Signature</p>
            </div>
          </div>
        </div>

        {/* Fixed Footer Bar */}
        <div className="flex-none p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between z-10 print-hide">
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4 cursor-pointer hover:border-slate-400"
          >
            Close Preview
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="btn-secondary text-xs py-2 px-3.5 cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="btn-gold text-xs py-2 px-4 cursor-pointer shadow-md bg-[#2563EB] text-white flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5 text-white" /> Print
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
};
