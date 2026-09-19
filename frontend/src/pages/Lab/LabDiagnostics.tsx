import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FlaskConical,
  Search,
  Plus,
  Upload,
  Eye,
  Loader2,
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Printer,
  Download,
  Trash2,
  User,
  Stethoscope,
  ChevronRight,
  Sparkles,
  Activity,
  Edit2,
  TestTube
} from 'lucide-react';
import api from '../../services/api';
import { Patient, Doctor } from '../../types';
import { storageService, LabOrder, LabResultItem, LabTestItem, getTodayLocalDateStr, getLocalDateStrFromISO } from '../../services/storageService';
import { LabReportPdfModal } from '../../components/LabReportPdfModal';

export const LabDiagnostics: React.FC = () => {
  const todayStr = getTodayLocalDateStr();

  // State Management
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [reportModalOrder, setReportModalOrder] = useState<LabOrder | null>(null);

  // Selected Order for Actions
  const [activeOrder, setActiveOrder] = useState<LabOrder | null>(null);
  const [reportUrl, setReportUrl] = useState('');

  // New Order Form State
  const [orderForm, setOrderForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentId: '',
    tests: [
      { testName: 'Complete Blood Count (CBC) with Differential', category: 'Hematology', price: 650, sampleType: 'Whole Blood (EDTA)', preparationInstructions: 'Fast 8 hours' }
    ] as LabTestItem[]
  });

  // Status & Sample Collection Form State
  const [statusForm, setStatusForm] = useState({
    status: 'Sample Collected' as LabOrder['status'],
    sampleStatus: 'Sample Collected' as LabOrder['sampleStatus'],
    sampleCollectedAt: todayStr + ' 09:00 AM',
    sampleCollectedBy: 'Mark Taylor (Lab Tech)',
    sampleType: 'Whole Blood (EDTA)',
    notes: ''
  });

  // Results Form State
  const [resultsForm, setResultsForm] = useState<{
    results: LabResultItem[];
    notes: string;
  }>({
    results: [],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, categoryFilter, doctorFilter, dateFilter]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [labList, patList, docList] = await Promise.all([
        storageService.fetchLabOrders(),
        storageService.fetchPatients(),
        storageService.fetchDoctors()
      ]);

      setPatients(patList as any);
      setDoctors(docList as any);

      // Filtering Logic
      let list = labList;

      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (o: any) =>
            (o.orderId || o.testId || '').toLowerCase().includes(q) ||
            (o.patientName || '').toLowerCase().includes(q) ||
            (o.testName || '').toLowerCase().includes(q) ||
            (o.doctorName || '').toLowerCase().includes(q)
        );
      }

      if (statusFilter && statusFilter !== 'all') {
        list = list.filter((o: any) => o.status === statusFilter);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        list = list.filter((o: any) => o.category === categoryFilter);
      }

      if (doctorFilter && doctorFilter !== 'all') {
        list = list.filter((o: any) => o.doctorId === doctorFilter || o.doctorName === doctorFilter);
      }

      if (dateFilter) {
        list = list.filter((o: any) => getLocalDateStrFromISO(o.createdAt) === dateFilter);
      }

      setLabOrders(list as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open New Order Modal
  const handleOpenNewOrderModal = () => {
    setOrderForm({
      patientId: patients[0]?._id || patients[0]?.patientId || '',
      doctorId: doctors[0]?._id || doctors[0]?.id || '',
      appointmentId: '',
      tests: [
        { testName: 'Complete Blood Count (CBC) with Differential', category: 'Hematology', price: 650, sampleType: 'Whole Blood (EDTA)', preparationInstructions: 'Fast 8 hours' }
      ]
    });
    setNewOrderModalOpen(true);
  };

  // Preset Catalog Adding Helper
  const handleAddPresetTest = (testName: string, category: string, price: number, sampleType: string) => {
    setOrderForm({
      ...orderForm,
      tests: [...orderForm.tests, { testName, category, price, sampleType }]
    });
  };

  const handleRemoveTest = (index: number) => {
    setOrderForm({
      ...orderForm,
      tests: orderForm.tests.filter((_, i) => i !== index)
    });
  };

  const calculateOrderTotal = () => {
    return orderForm.tests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  };

  // Submit Create New Lab Order
  const handleCreateLabOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPat = patients.find((p: any) => p._id === orderForm.patientId || p.patientId === orderForm.patientId);
    const selectedDoc = doctors.find(
      (d: any) => (d._id && d._id === orderForm.doctorId) || (d.id && d.id === orderForm.doctorId) || d.name === orderForm.doctorId
    );

    const primaryTest = orderForm.tests[0];
    const totalPrice = calculateOrderTotal();
    const generatedId = 'LAB-2026-' + Math.floor(100 + Math.random() * 900);

    const newOrder = {
      orderId: generatedId,
      testId: generatedId,
      patientId: selectedPat?.patientId || selectedPat?._id || '',
      patientName: selectedPat?.name || 'Registered Patient',
      patientPhone: selectedPat?.phone || '',
      patientAge: selectedPat?.age || 0,
      patientGender: selectedPat?.gender || 'Male',
      doctorId: selectedDoc?._id || orderForm.doctorId,
      doctorName: selectedDoc?.name || 'Attending Doctor',
      doctorSpecialization: selectedDoc?.specialization || 'Internal Medicine',
      tests: orderForm.tests,
      testName: orderForm.tests.length > 1 ? `${primaryTest?.testName} (+${orderForm.tests.length - 1} more)` : (primaryTest?.testName || 'Diagnostic Test'),
      category: primaryTest?.category || 'General',
      price: totalPrice,
      sampleType: primaryTest?.sampleType || 'Whole Blood',
      sampleStatus: 'Pending Collection',
      status: 'Ordered',
      createdAt: new Date().toISOString()
    };

    try {
      await api.post('/lab/orders', newOrder);
    } catch (err) {
      console.error(err);
    }

    setNewOrderModalOpen(false);
    fetchData();
  };

  // Sample Status Update Handler
  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    const orderId = activeOrder._id || (activeOrder as any).id;
    if (!orderId) return;

    const updated: Partial<LabOrder> = {
      status: statusForm.status,
      sampleStatus: statusForm.sampleStatus,
      sampleCollectedAt: statusForm.sampleCollectedAt,
      sampleCollectedBy: statusForm.sampleCollectedBy,
      sampleType: statusForm.sampleType,
      notes: statusForm.notes || activeOrder.notes
    };

    try {
      await storageService.updateLabOrder(orderId, updated);
    } catch (err) {
      console.error(err);
    }

    setStatusModalOpen(false);
    setActiveOrder(null);
    fetchData();
  };

  // Results Entry Handler
  const handleOpenResultsModal = (order: LabOrder) => {
    setActiveOrder(order);

    let defaultResults: LabResultItem[] = order.results || [];
    if (defaultResults.length === 0) {
      if (order.testName.includes('CBC') || order.category === 'Hematology') {
        defaultResults = [
          { parameter: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', normalRange: '13.5 - 17.5 g/dL', flag: 'Normal' },
          { parameter: 'Total WBC Count', value: '7,500', unit: '/cu mm', normalRange: '4,000 - 11,000 /cu mm', flag: 'Normal' },
          { parameter: 'Platelet Count', value: '2.80', unit: 'Lakhs/cu mm', normalRange: '1.5 - 4.5 Lakhs', flag: 'Normal' }
        ];
      } else if (order.testName.includes('Sugar') || order.category === 'Biochemistry') {
        defaultResults = [
          { parameter: 'Fasting Blood Glucose', value: '98', unit: 'mg/dL', normalRange: '70 - 100 mg/dL', flag: 'Normal' },
          { parameter: 'HbA1c (Glycated Hemoglobin)', value: '5.8', unit: '%', normalRange: '< 5.7 Normal, 5.7-6.4 Prediabetes', flag: 'High' }
        ];
      } else {
        defaultResults = [
          { parameter: 'Primary Investigation Value', value: 'Normal', unit: 'N/A', normalRange: 'Standard Normal', flag: 'Normal' }
        ];
      }
    }

    setResultsForm({
      results: defaultResults,
      notes: order.notes || 'All investigated parameters cross-verified.'
    });
    setResultsModalOpen(true);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    const orderId = activeOrder._id || (activeOrder as any).id;
    if (!orderId) return;

    try {
      await storageService.updateLabResults(orderId, resultsForm.results, resultsForm.notes);
    } catch (err) {
      console.error(err);
    }

    setResultsModalOpen(false);
    setActiveOrder(null);
    fetchData();
  };

  const updateResultRow = (idx: number, field: string, value: any) => {
    const updated = [...resultsForm.results];
    updated[idx] = { ...updated[idx], [field]: value };
    setResultsForm({ ...resultsForm, results: updated });
  };

  const addResultRow = () => {
    setResultsForm({
      ...resultsForm,
      results: [...resultsForm.results, { parameter: '', value: '', unit: '', normalRange: '', flag: 'Normal' }]
    });
  };

  const removeResultRow = (idx: number) => {
    setResultsForm({
      ...resultsForm,
      results: resultsForm.results.filter((_, i) => i !== idx)
    });
  };

  // Upload Report PDF Handler
  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !reportUrl) return;

    const orderId = activeOrder._id || (activeOrder as any).id;
    if (!orderId) return;

    try {
      await storageService.uploadLabReport(orderId, reportUrl);
    } catch (err) {
      console.error('Report upload failed:', err);
    }

    setUploadModalOpen(false);
    setActiveOrder(null);
    setReportUrl('');
    fetchData();
  };

  // Dashboard Metrics
  const allLabOrders = labOrders;
  const totalOrdersCount = allLabOrders.length;
  const pendingCount = allLabOrders.filter((o) => o.status === 'Ordered').length;
  const processingCount = allLabOrders.filter((o) => o.status === 'Sample Collected' || o.status === 'Processing').length;
  const resultReadyCount = allLabOrders.filter((o) => o.status === 'Result Ready').length;
  const reportUploadedCount = allLabOrders.filter((o) => o.status === 'Report Uploaded').length;

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-[#2563EB]" /> Lab Diagnostics & Pathology
          </h1>
          <p className="page-subtitle mt-1">
            Diagnostic orders, test scheduling, sample collection, results and laboratory reports
          </p>
        </div>

        <button
          onClick={handleOpenNewOrderModal}
          className="btn-gold shrink-0"
        >
          <Plus className="w-4 h-4 text-white" /> + NEW LAB ORDER
        </button>
      </div>

      {/* Summary Cards Grid (5 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Lab Orders</span>
          <p className="text-2xl font-serif font-bold text-[#0F172A] mt-2 font-mono">{totalOrdersCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Diagnostic requests</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Tests</span>
          <p className="text-2xl font-serif font-bold text-amber-600 mt-2 font-mono">{pendingCount}</p>
          <p className="text-[10px] text-amber-700 mt-1 font-semibold">Awaiting sample collection</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Processing</span>
          <p className="text-2xl font-serif font-bold text-blue-600 mt-2 font-mono">{processingCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">In laboratory analysis</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Results Ready</span>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-2 font-mono">{resultReadyCount}</p>
          <p className="text-[10px] text-emerald-700 mt-1 font-semibold">Ready for report view</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reports Uploaded</span>
          <p className="text-2xl font-serif font-bold text-purple-700 mt-2 font-mono">{reportUploadedCount}</p>
          <p className="text-[10px] text-purple-700 mt-1 font-semibold">Final reports attached</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row gap-4 items-center justify-between border-slate-200/80 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full lg:w-auto flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search order ID, patient, test..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-10 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Statuses</option>
              <option value="Ordered">Ordered</option>
              <option value="Sample Collected">Sample Collected</option>
              <option value="Processing">Processing</option>
              <option value="Result Ready">Result Ready</option>
              <option value="Report Uploaded">Report Uploaded</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Categories</option>
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Immunology">Immunology</option>
              <option value="Pathology">Pathology</option>
            </select>
          </div>

          {/* Doctor Filter */}
          <div>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Doctors</option>
              {doctors.map((d: any) => (
                <option key={d._id || d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full glass-input text-xs font-mono"
            />
          </div>
        </div>

        {(search || statusFilter || categoryFilter || doctorFilter || dateFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setCategoryFilter('');
              setDoctorFilter('');
              setDateFilter('');
            }}
            className="text-xs text-[#2563EB] font-bold hover:underline font-mono shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Lab Orders Data Table */}
      <div className="glass-panel border-slate-200/80 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-sans">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2563EB] mb-2" />
            Loading diagnostic orders...
          </div>
        ) : labOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-serif font-bold text-[#0F172A]">No Lab Orders</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create a new diagnostic order to get started with lab testing, sample collection, and pathology reporting.
            </p>
            <button
              onClick={handleOpenNewOrderModal}
              className="btn-gold text-xs cursor-pointer shadow-md bg-[#2563EB] text-white inline-flex items-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4 text-white" /> + NEW LAB ORDER
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs font-sans text-[#0F172A]">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="p-4">ORDER ID & DATE</th>
                <th className="p-4">PATIENT</th>
                <th className="p-4">ORDERING DOCTOR</th>
                <th className="p-4">DIAGNOSTIC TEST</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4">TEST FEE</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {labOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/80 transition">
                  {/* Order ID & Date */}
                  <td className="p-4">
                    <span className="font-mono font-extrabold text-xs text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg inline-block">
                      {order.orderId || order.testId || 'LAB-2026-001'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB')}
                    </p>
                  </td>

                  {/* Patient Details */}
                  <td className="p-4">
                    <p className="font-bold text-[#0F172A]">{order.patientName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {order.patientId || 'PAT-1001'} • {order.patientAge || '32'}Y / {order.patientGender || 'M'}
                    </p>
                  </td>

                  {/* Ordering Doctor */}
                  <td className="p-4">
                    <p className="font-bold text-[#0F172A]">{order.doctorName || 'Dr. Sarah Connor'}</p>
                    <p className="text-[10px] text-slate-400 font-serif">{order.doctorSpecialization || 'Internal Medicine'}</p>
                  </td>

                  {/* Diagnostic Test */}
                  <td className="p-4 font-bold text-[#0F172A] font-serif text-sm">
                    {order.testName}
                  </td>

                  {/* Category */}
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {order.category}
                    </span>
                  </td>

                  {/* Test Fee */}
                  <td className="p-4 font-mono font-bold text-[#0F172A] text-sm">
                    ₹{order.price?.toLocaleString()}
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'Result Ready' || order.status === 'Report Uploaded'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.status === 'Processing' || order.status === 'Sample Collected'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : order.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  {/* Context-Aware Actions */}
                  <td className="p-4 text-right space-x-1.5">
                    {/* View Details */}
                    <button
                      onClick={() => {
                        setActiveOrder(order);
                        setViewModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1 border border-blue-200 cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>

                    {/* Update Status / Collect Sample */}
                    {order.status !== 'Report Uploaded' && order.status !== 'Cancelled' && (
                      <button
                        onClick={() => {
                          setActiveOrder(order);
                          setStatusForm({
                            status: order.status === 'Ordered' ? 'Sample Collected' : 'Processing',
                            sampleStatus: 'Sample Collected',
                            sampleCollectedAt: todayStr + ' 09:00 AM',
                            sampleCollectedBy: 'Mark Taylor (Lab Tech)',
                            sampleType: order.sampleType || 'Whole Blood (EDTA)',
                            notes: order.notes || ''
                          });
                          setStatusModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold inline-flex items-center gap-1 border border-slate-200 cursor-pointer"
                        title="Update Status"
                      >
                        <TestTube className="w-3.5 h-3.5 text-[#2563EB]" /> Status
                      </button>
                    )}

                    {/* Enter Results (when sample collected or processing) */}
                    {(order.status === 'Sample Collected' || order.status === 'Processing' || order.status === 'Result Ready') && (
                      <button
                        onClick={() => handleOpenResultsModal(order)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1 border border-emerald-200 cursor-pointer"
                        title="Enter Test Results"
                      >
                        <Activity className="w-3.5 h-3.5" /> Results
                      </button>
                    )}

                    {/* Report Preview / Print (when results ready or report uploaded) */}
                    {(order.status === 'Result Ready' || order.status === 'Report Uploaded') && (
                      <button
                        onClick={() => setReportModalOrder(order)}
                        className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shadow-sm"
                        title="Preview & Print Report"
                      >
                        <Printer className="w-3.5 h-3.5 text-white" /> Report
                      </button>
                    )}

                    {/* Upload External PDF */}
                    {order.status !== 'Report Uploaded' && (
                      <button
                        onClick={() => {
                          setActiveOrder(order);
                          setUploadModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold inline-flex items-center gap-1 border border-purple-200 cursor-pointer"
                        title="Upload PDF Report"
                      >
                        <Upload className="w-3.5 h-3.5" /> Attach PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE NEW LAB ORDER MODAL (Rendered via Portal) */}
      {newOrderModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            
            {/* Modal Header */}
            <div className="flex-none p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-[#2563EB]" /> Requisition New Diagnostic Lab Order
              </h2>
              <button onClick={() => setNewOrderModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateLabOrder} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Patient & Doctor Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    required
                    value={orderForm.patientId}
                    onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })}
                    className="w-full glass-input text-xs"
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map((p: any) => (
                      <option key={p._id || p.patientId} value={p._id || p.patientId}>
                        {p.name} ({p.patientId || p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ordering Practitioner *</label>
                  <select
                    required
                    value={orderForm.doctorId}
                    onChange={(e) => setOrderForm({ ...orderForm, doctorId: e.target.value })}
                    className="w-full glass-input text-xs"
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map((d: any) => (
                      <option key={d._id || d.id} value={d._id || d.id}>
                        {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Test Catalog Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" /> Quick Test Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPresetTest('Complete Blood Count (CBC)', 'Hematology', 650, 'Whole Blood (EDTA)')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + CBC Test (₹650)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetTest('Fasting Blood Sugar & HbA1c', 'Biochemistry', 900, 'Fluoride Plasma')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + FBS & HbA1c (₹900)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetTest('Lipid Profile Panel', 'Biochemistry', 1200, 'Serum')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + Lipid Profile (₹1,200)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetTest('Thyroid Panel (T3, T4, TSH)', 'Immunology', 1050, 'Serum')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + Thyroid Profile (₹1,050)
                  </button>
                </div>
              </div>

              {/* Itemized Tests List */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider">
                    Selected Diagnostic Tests ({orderForm.tests.length})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setOrderForm({
                        ...orderForm,
                        tests: [
                          ...orderForm.tests,
                          { testName: 'Custom Lab Investigation', category: 'General', price: 500, sampleType: 'Blood Specimen' }
                        ]
                      })
                    }
                    className="btn-secondary text-xs py-1 px-2.5 cursor-pointer"
                  >
                    + Add Custom Test
                  </button>
                </div>

                <div className="space-y-2">
                  {orderForm.tests.map((test, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Test Name"
                          value={test.testName}
                          onChange={(e) => {
                            const updated = [...orderForm.tests];
                            updated[idx].testName = e.target.value;
                            setOrderForm({ ...orderForm, tests: updated });
                          }}
                          className="w-full glass-input text-xs"
                        />
                      </div>
                      <div>
                        <select
                          value={test.category}
                          onChange={(e) => {
                            const updated = [...orderForm.tests];
                            updated[idx].category = e.target.value;
                            setOrderForm({ ...orderForm, tests: updated });
                          }}
                          className="w-full glass-input text-xs"
                        >
                          <option value="Hematology">Hematology</option>
                          <option value="Biochemistry">Biochemistry</option>
                          <option value="Microbiology">Microbiology</option>
                          <option value="Immunology">Immunology</option>
                          <option value="Pathology">Pathology</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between sm:col-span-2">
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={test.price}
                          onChange={(e) => {
                            const updated = [...orderForm.tests];
                            updated[idx].price = Number(e.target.value);
                            setOrderForm({ ...orderForm, tests: updated });
                          }}
                          className="w-full glass-input text-xs font-mono font-bold text-[#2563EB]"
                        />
                        {orderForm.tests.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Calculations Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center font-mono">
                <span className="text-xs text-slate-700 font-bold">Total Requisition Fee:</span>
                <span className="text-lg font-extrabold text-[#2563EB]">₹{calculateOrderTotal().toLocaleString()}</span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewOrderModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>CREATE LAB ORDER</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* VIEW LAB ORDER DETAILS MODAL (Rendered via Portal) */}
      {viewModalOpen && activeOrder && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            <div className="flex-none p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <h3 className="font-serif font-bold text-white text-base flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-[#2563EB]" /> Diagnostic Order Requisition Details
              </h3>
              <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                    {activeOrder.orderId || activeOrder.testId}
                  </span>
                  <h2 className="text-lg font-serif font-bold text-[#0F172A] mt-2">{activeOrder.testName}</h2>
                  <p className="text-xs text-slate-500">Category: {activeOrder.category}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      activeOrder.status === 'Result Ready' || activeOrder.status === 'Report Uploaded'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : activeOrder.status === 'Processing' || activeOrder.status === 'Sample Collected'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : activeOrder.status === 'Cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {activeOrder.status}
                  </span>
                  <p className="text-xs font-mono font-bold text-[#0F172A] mt-2">₹{activeOrder.price}</p>
                </div>
              </div>

              {/* Patient & Doctor */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Patient Details</span>
                  <p className="font-bold text-sm text-[#0F172A] mt-0.5">{activeOrder.patientName}</p>
                  <p className="text-xs text-slate-500 font-mono">ID: {activeOrder.patientId}</p>
                  <p className="text-xs text-slate-500 font-mono">Phone: {activeOrder.patientPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Ordering Doctor</span>
                  <p className="font-bold text-sm text-[#0F172A] mt-0.5">{activeOrder.doctorName}</p>
                  <p className="text-xs text-slate-500 font-serif">{activeOrder.doctorSpecialization}</p>
                </div>
              </div>

              {/* Sample Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Specimen Tracking</span>
                <p><span className="text-slate-500">Sample Specimen:</span> <strong className="text-[#2563EB]">{activeOrder.sampleType || 'Whole Blood'}</strong></p>
                <p><span className="text-slate-500">Collection Status:</span> <strong className="text-slate-700">{activeOrder.sampleStatus || (activeOrder.status === 'Ordered' ? 'Pending Collection' : activeOrder.status)}</strong></p>
                <p><span className="text-slate-500">Collected At:</span> <strong className="text-slate-700">{activeOrder.sampleCollectedAt || 'N/A'}</strong></p>
              </div>

              {/* Results Preview */}
              {activeOrder.results && activeOrder.results.length > 0 ? (
                <div>
                  <h4 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                    Investigated Parameter Values ({activeOrder.results.length})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden font-mono">
                    {activeOrder.results.map((r, rIdx) => (
                      <div key={rIdx} className="p-2.5 flex justify-between items-center text-xs border-b border-slate-100 last:border-0 bg-slate-50">
                        <span className="font-serif font-bold text-[#0F172A]">{r.parameter}</span>
                        <span className="font-bold text-[#2563EB]">{r.value} {r.unit} (Ref: {r.normalRange})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center font-sans">
                  <p className="text-xs font-bold text-amber-800">Results Pending</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">Sample processing is underway in laboratory section.</p>
                </div>
              )}
            </div>

            <div className="flex-none p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setViewModalOpen(false)} className="btn-secondary text-xs py-1.5 px-4 cursor-pointer">
                Close Requisition
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SAMPLE STATUS UPDATE MODAL (Rendered via Portal) */}
      {statusModalOpen && activeOrder && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="glass-panel w-full max-w-md p-6 border border-slate-200 shadow-2xl relative bg-white text-[#0F172A] rounded-2xl">
            <button onClick={() => setStatusModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-serif font-bold text-[#0F172A] mb-1 flex items-center gap-2">
              <TestTube className="w-5 h-5 text-[#2563EB]" /> Update Sample & Order Status
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-4">
              Order {activeOrder.orderId || activeOrder.testId} • Patient: {activeOrder.patientName}
            </p>

            <form onSubmit={handleSaveStatusUpdate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Order Workflow Status *</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as any })}
                  className="w-full glass-input text-xs"
                >
                  <option value="Sample Collected">Sample Collected</option>
                  <option value="Processing">Processing in Lab</option>
                  <option value="Result Ready">Result Ready</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Specimen Type</label>
                <select
                  value={statusForm.sampleType}
                  onChange={(e) => setStatusForm({ ...statusForm, sampleType: e.target.value })}
                  className="w-full glass-input text-xs"
                >
                  <option value="Whole Blood (EDTA)">Whole Blood (EDTA)</option>
                  <option value="Fluoride Plasma">Fluoride Plasma</option>
                  <option value="Serum">Serum</option>
                  <option value="Urine Specimen">Urine Specimen</option>
                  <option value="Throat Swab">Throat Swab</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Date & Time</label>
                <input
                  type="text"
                  value={statusForm.sampleCollectedAt}
                  onChange={(e) => setStatusForm({ ...statusForm, sampleCollectedAt: e.target.value })}
                  className="w-full glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Collected By (Lab Tech)</label>
                <input
                  type="text"
                  value={statusForm.sampleCollectedBy}
                  onChange={(e) => setStatusForm({ ...statusForm, sampleCollectedBy: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ENTER LAB RESULTS MODAL (Rendered via Portal) */}
      {resultsModalOpen && activeOrder && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            
            {/* Modal Header */}
            <div className="flex-none p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" /> Enter Laboratory Investigation Parameters
              </h2>
              <button onClick={() => setResultsModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveResults} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-[#0F172A]">{activeOrder.testName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Patient: {activeOrder.patientName} ({activeOrder.patientId})</p>
                </div>
                <button
                  type="button"
                  onClick={addResultRow}
                  className="btn-secondary text-xs py-1 px-3 cursor-pointer"
                >
                  + Add Parameter
                </button>
              </div>

              {/* Dynamic Parameter Rows */}
              <div className="space-y-3">
                {resultsForm.results.map((res, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Parameter Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Hemoglobin (Hb)"
                          value={res.parameter}
                          onChange={(e) => updateResultRow(idx, 'parameter', e.target.value)}
                          className="w-full glass-input text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Observed Value</label>
                        <input
                          type="text"
                          required
                          placeholder="14.5"
                          value={res.value}
                          onChange={(e) => updateResultRow(idx, 'value', e.target.value)}
                          className="w-full glass-input text-xs font-mono font-bold text-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Unit</label>
                        <input
                          type="text"
                          placeholder="g/dL"
                          value={res.unit}
                          onChange={(e) => updateResultRow(idx, 'unit', e.target.value)}
                          className="w-full glass-input text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Biological Reference Interval</label>
                        <input
                          type="text"
                          placeholder="13.5 - 17.5 g/dL"
                          value={res.normalRange}
                          onChange={(e) => updateResultRow(idx, 'normalRange', e.target.value)}
                          className="w-full glass-input text-xs font-mono text-slate-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Flag Status</label>
                        <select
                          value={res.flag || 'Normal'}
                          onChange={(e) => updateResultRow(idx, 'flag', e.target.value)}
                          className="w-full glass-input text-xs"
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>

                      <div className="flex justify-end pt-3 sm:pt-0">
                        {resultsForm.results.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeResultRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pathologist Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pathologist Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={resultsForm.notes}
                  onChange={(e) => setResultsForm({ ...resultsForm, notes: e.target.value })}
                  className="w-full glass-input text-xs"
                  placeholder="All parameters verified on automated analyzer."
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResultsModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Save Results & Finalize</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* UPLOAD ATTACHED PDF REPORT MODAL (Rendered via Portal) */}
      {uploadModalOpen && activeOrder && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="glass-panel w-full max-w-md p-6 border border-slate-200 shadow-2xl relative bg-white text-[#0F172A] rounded-2xl">
            <button onClick={() => setUploadModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-serif font-bold text-[#0F172A] mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600" /> Attach Lab Report PDF
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-4">
              {activeOrder.testName} • Patient: {activeOrder.patientName}
            </p>

            <form onSubmit={handleUploadReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Report PDF Document URL / File Link *</label>
                <input
                  type="text"
                  required
                  placeholder="https://cloudinary.com/reports/CBC-1092.pdf"
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                  className="w-full glass-input text-xs font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-4 cursor-pointer shadow-md bg-purple-700 text-white hover:bg-purple-800"
                >
                  Publish Diagnostic Report
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* LAB REPORT PREVIEW / PRINT MODAL */}
      {reportModalOrder && (
        <LabReportPdfModal order={reportModalOrder} onClose={() => setReportModalOrder(null)} />
      )}
    </div>
  );
};
