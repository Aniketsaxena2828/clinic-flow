import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Eye,
  X,
  Trash2,
  Calendar,
  IndianRupee,
  CreditCard,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Stethoscope,
  Printer,
  Download,
  Sparkles,
  ArrowRight,
  Loader2,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { Bill, Patient, Doctor, Appointment } from '../../types';
import { InvoicePdfModal } from '../../components/InvoicePdfModal';
import { storageService, getTodayLocalDateStr, getLocalDateStrFromISO } from '../../services/storageService';

export const BillingList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryDate = searchParams.get('date');
  const queryStatus = searchParams.get('status');
  const todayStr = getTodayLocalDateStr();

  // State Management
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<string>(queryDate || '');
  const [statusFilter, setStatusFilter] = useState<string>(queryStatus || '');
  const [doctorFilter, setDoctorFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activePayBill, setActivePayBill] = useState<Bill | null>(null);

  // Invoice Form State (Default Unpaid / Pending)
  const [billForm, setBillForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentId: '',
    items: [
      { description: 'Outpatient Consultation Fee', category: 'Consultation', unitPrice: 800, quantity: 1 }
    ],
    gstRate: 0,
    discountAmount: 0,
    initialPaidAmount: 0, // Default 0 -> Pending
    paymentMethod: 'Cash',
    transactionRef: ''
  });

  // Collect Payment Form State
  const [payForm, setPayForm] = useState({
    amountPaid: '',
    paymentMethod: 'Cash',
    transactionRef: '',
    paymentDate: todayStr,
    notes: ''
  });

  useEffect(() => {
    if (queryDate) setDateFilter(queryDate);
    if (queryStatus) setStatusFilter(queryStatus);
  }, [queryDate, queryStatus]);

  useEffect(() => {
    fetchData();
  }, [search, dateFilter, statusFilter, doctorFilter]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [billList, patList, docList, apptList] = await Promise.all([
        storageService.fetchBills(),
        storageService.fetchPatients(),
        storageService.fetchDoctors(),
        storageService.fetchAppointments()
      ]);

      setPatients(patList as any);
      setDoctors(docList as any);
      setAppointments(apptList as any);

      // Filtering Logic
      let list = billList;

      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (b: any) =>
            (b.invoiceNumber || '').toLowerCase().includes(q) ||
            (b.patientName || '').toLowerCase().includes(q) ||
            (b.doctorName || '').toLowerCase().includes(q)
        );
      }

      if (dateFilter) {
        list = list.filter((b: any) => getLocalDateStrFromISO(b.createdAt) === dateFilter);
      }

      if (statusFilter && statusFilter !== 'all') {
        list = list.filter((b: any) => {
          if (statusFilter === 'Pending') return b.paymentStatus === 'Pending' || b.balanceDue > 0;
          return b.paymentStatus === statusFilter;
        });
      }

      if (doctorFilter && doctorFilter !== 'all') {
        list = list.filter((b: any) => b.doctorId === doctorFilter || b.doctorName === doctorFilter);
      }

      setBills(list as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open Create Invoice Modal
  const handleOpenCreateModal = () => {
    setBillForm({
      patientId: patients[0]?._id || patients[0]?.id || patients[0]?.patientId || '',
      doctorId: doctors[0]?._id || doctors[0]?.id || '',
      appointmentId: '',
      items: [
        { description: 'Outpatient Consultation Fee', category: 'Consultation', unitPrice: 800, quantity: 1 }
      ],
      gstRate: 0,
      discountAmount: 0,
      initialPaidAmount: 0, // Default ₹0 -> Status: Pending
      paymentMethod: 'Cash',
      transactionRef: ''
    });
    setCreateModalOpen(true);
  };

  // Items Manipulation
  const addItemToBill = () => {
    setBillForm({
      ...billForm,
      items: [...billForm.items, { description: '', category: 'Consultation', unitPrice: 500, quantity: 1 }]
    });
  };

  const removeItemFromBill = (index: number) => {
    setBillForm({
      ...billForm,
      items: billForm.items.filter((_, i) => i !== index)
    });
  };

  const updateItemInBill = (index: number, field: string, value: any) => {
    const updated = [...billForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setBillForm({ ...billForm, items: updated });
  };

  const handleQuickAddPresetService = (desc: string, category: string, unitPrice: number) => {
    setBillForm({
      ...billForm,
      items: [...billForm.items, { description: desc, category, unitPrice, quantity: 1 }]
    });
  };

  // Calculation Helpers
  const calculateSubtotal = () => {
    return billForm.items.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1), 0);
  };

  const calculateGstAmount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * (Number(billForm.gstRate) || 0)) / 100;
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const gst = calculateGstAmount();
    return subtotal + gst - (Number(billForm.discountAmount) || 0);
  };

  const calculateBalanceDue = () => {
    const total = calculateGrandTotal();
    const paid = Number(billForm.initialPaidAmount) || 0;
    return Math.max(0, total - paid);
  };

  // Submit Create Invoice
  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPat = patients.find((p: any) =>
      (p._id && p._id === billForm.patientId) ||
      (p.id && p.id === billForm.patientId) ||
      (p.patientId && p.patientId === billForm.patientId)
    );

    // Doctor Data Matching
    const selectedDoc = doctors.find(
      (d: any) => (d._id && d._id === billForm.doctorId) || (d.id && d.id === billForm.doctorId) || d.name === billForm.doctorId
    );
    const doctorName = selectedDoc?.name || 'Attending Doctor';

    const subtotal = calculateSubtotal();
    const gstAmount = calculateGstAmount();
    const totalAmount = calculateGrandTotal();
    const initialPaid = Number(billForm.initialPaidAmount) || 0;
    const balanceDue = Math.max(0, totalAmount - initialPaid);

    let paymentStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
    if (balanceDue === 0 && totalAmount > 0) {
      paymentStatus = 'Paid';
    } else if (initialPaid > 0 && balanceDue > 0) {
      paymentStatus = 'Partially Paid';
    }

    const payload = {
      patientId: billForm.patientId || selectedPat?._id || selectedPat?.id || selectedPat?.patientId || 'PAT-1001',
      patientName: selectedPat?.name || 'Registered Patient',
      patientPhone: selectedPat?.phone || '+91 98765 43210',
      doctorId: billForm.doctorId || selectedDoc?._id || selectedDoc?.id,
      doctorName: doctorName,
      appointmentId: billForm.appointmentId || undefined,
      items: billForm.items.map((i) => ({
        description: i.description || 'Medical Service',
        category: i.category as any,
        unitPrice: Number(i.unitPrice),
        quantity: Number(i.quantity),
        amount: Number(i.unitPrice) * Number(i.quantity)
      })),
      subtotal,
      gstRate: Number(billForm.gstRate),
      gstAmount,
      discountAmount: Number(billForm.discountAmount),
      totalAmount,
      paidAmount: initialPaid,
      balanceDue,
      paymentStatus,
      paymentMethod: billForm.paymentMethod,
      transactionRef: billForm.transactionRef
    };

    try {
      await storageService.saveBill(payload);
    } catch (err) {
      console.error('Failed to create bill:', err);
    }

    setCreateModalOpen(false);
    fetchData();
  };

  const handleDeleteBill = async (billId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await storageService.deleteBill(billId);
      fetchData();
    } catch (err) {
      console.error('Failed to delete bill:', err);
    }
  };

  // Open Collect Payment Modal
  const handleOpenCollectPayment = (bill: Bill) => {
    setActivePayBill(bill);
    setPayForm({
      amountPaid: bill.balanceDue.toString(),
      paymentMethod: 'Cash',
      transactionRef: '',
      paymentDate: todayStr,
      notes: ''
    });
    setPayModalOpen(true);
  };

  // Submit Collect Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayBill) return;

    const amountToCollect = Number(payForm.amountPaid);
    if (isNaN(amountToCollect) || amountToCollect <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      await storageService.payBill(
        activePayBill._id,
        amountToCollect,
        payForm.paymentMethod,
        payForm.transactionRef || 'TXN-' + Date.now()
      );
    } catch (err) {
      console.error('Payment failed:', err);
    }

    setPayModalOpen(false);
    setActivePayBill(null);
    fetchData();
  };

  // Summary Card Totals
  const totalRevenue = bills.reduce((sum, b) => sum + (Number(b.paidAmount) || 0), 0);
  const totalOutstanding = bills.reduce((sum, b) => sum + (Number(b.balanceDue) || 0), 0);
  const paidCount = bills.filter((b) => b.paymentStatus === 'Paid').length;
  const pendingCount = bills.filter((b) => b.paymentStatus !== 'Paid').length;

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#2563EB]" /> Billing & Invoicing
          </h1>
          <p className="page-subtitle mt-1">
            Manage clinic tax invoices, payment collections, GST invoicing, and revenue tracking
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn-gold shrink-0"
        >
          <Plus className="w-4 h-4 text-white" /> + CREATE NEW INVOICE
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOTAL REVENUE COLLECTED</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-emerald-700 mt-3 font-mono">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">Realized settled payments</p>
        </div>

        <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">OUTSTANDING BALANCE</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-amber-700 mt-3 font-mono">₹{totalOutstanding.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">Pending balance receivables</p>
        </div>

        <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOTAL INVOICES</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-[#0F172A] mt-3 font-mono">{bills.length}</p>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">Generated medical receipts</p>
        </div>

        <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SETTLED VS PENDING</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-serif font-bold text-emerald-700">{paidCount}</span>
            <span className="text-xs text-slate-400">Paid /</span>
            <span className="text-xl font-bold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-slate-400">Pending</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">Invoice clearance status</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row gap-4 items-center justify-between border-slate-200/80 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice #, patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-10 text-xs"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2563EB] shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full glass-input text-xs py-1.5 font-mono"
            />
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending / Unpaid</option>
            </select>
          </div>

          {/* Doctor Filter */}
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#2563EB] shrink-0" />
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
        </div>

        {(search || dateFilter || statusFilter || doctorFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setDateFilter('');
              setStatusFilter('');
              setDoctorFilter('');
            }}
            className="text-xs text-[#2563EB] font-bold hover:underline font-mono shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Invoice Data Table */}
      <div className="glass-panel border-slate-200/80 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2563EB] mb-2" />
            Loading invoices...
          </div>
        ) : (
          <table className="w-full text-left text-xs font-sans text-[#0F172A]">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="p-4">INVOICE # & DATE</th>
                <th className="p-4">PATIENT</th>
                <th className="p-4">DOCTOR</th>
                <th className="p-4">SERVICES</th>
                <th className="p-4">TOTAL</th>
                <th className="p-4">PAID</th>
                <th className="p-4">BALANCE</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((bill) => (
                <tr key={bill._id} className="hover:bg-slate-50/80 transition">
                  {/* Invoice # & Date */}
                  <td className="p-4">
                    <span className="font-mono font-extrabold text-xs text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg inline-block">
                      {bill.invoiceNumber}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {new Date(bill.createdAt || Date.now()).toLocaleDateString('en-GB')}
                    </p>
                  </td>

                  {/* Patient */}
                  <td className="p-4">
                    <p className="font-bold text-[#0F172A]">{bill.patientName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{bill.patientPhone}</p>
                  </td>

                  {/* Doctor */}
                  <td className="p-4 font-bold text-[#0F172A]">
                    {bill.doctorName || 'Attending Doctor'}
                  </td>

                  {/* Services */}
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      {bill.items?.length || 1} Items
                    </span>
                  </td>

                  {/* Total */}
                  <td className="p-4 font-bold text-[#0F172A] font-mono text-sm">
                    ₹{bill.totalAmount?.toLocaleString()}
                  </td>

                  {/* Paid */}
                  <td className="p-4 font-bold text-emerald-700 font-mono">
                    ₹{bill.paidAmount?.toLocaleString()}
                  </td>

                  {/* Balance */}
                  <td className="p-4 font-bold font-mono">
                    {bill.balanceDue > 0 ? (
                      <span className="text-rose-600">₹{bill.balanceDue?.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">₹0</span>
                    )}
                  </td>

                  {/* Payment Status Badge */}
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        bill.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : bill.paymentStatus === 'Partially Paid' || bill.paymentStatus === 'Partial'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {bill.paymentStatus}
                    </span>
                  </td>

                  {/* Actions: Collect Payment disappears when balanceDue === 0 */}
                  <td className="p-4 text-right space-x-1.5">
                    {bill.balanceDue > 0 && (
                      <button
                        onClick={() => handleOpenCollectPayment(bill)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1 border border-emerald-200 cursor-pointer shadow-sm"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Collect Payment
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedBill(bill)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1 border border-blue-200 cursor-pointer"
                      title="View Invoice"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>

                    <button
                      onClick={() => setSelectedBill(bill)}
                      className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shadow-sm"
                      title="Print Invoice"
                    >
                      <Printer className="w-3.5 h-3.5 text-white" /> Print
                    </button>

                    <button
                      onClick={() => handleDeleteBill(bill._id || (bill as any).id)}
                      className="px-2 py-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs font-bold inline-flex items-center cursor-pointer"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE NEW INVOICE MODAL (Rendered via Portal) */}
      {createModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            
            {/* Modal Header */}
            <div className="flex-none p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#2563EB]" /> Generate Medical Tax Invoice
              </h2>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateBill} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Invoice Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    required
                    value={billForm.patientId}
                    onChange={(e) => setBillForm({ ...billForm, patientId: e.target.value })}
                    className="w-full glass-input text-xs"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p: any) => (
                      <option key={p._id || p.patientId} value={p._id || p.patientId}>
                        {p.name} ({p.patientId || p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attending Doctor *</label>
                  <select
                    required
                    value={billForm.doctorId}
                    onChange={(e) => setBillForm({ ...billForm, doctorId: e.target.value })}
                    className="w-full glass-input text-xs"
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map((d: any) => (
                      <option key={d._id || d.id} value={d._id || d.id}>
                        {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" /> Quick Service Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAddPresetService('Outpatient Consultation Fee', 'Consultation', 800)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + Consultation (₹800)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddPresetService('ECG Diagnostics Test', 'Lab Test', 1500)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + ECG Test (₹1,500)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddPresetService('CBC Blood Count', 'Lab Test', 650)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + CBC Blood Test (₹650)
                  </button>
                </div>
              </div>

              {/* Dynamic Line Items Table */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider">
                    Itemized Billing Line Items ({billForm.items.length})
                  </label>
                  <button
                    type="button"
                    onClick={addItemToBill}
                    className="btn-secondary text-xs py-1 px-2.5 cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2.5">
                  {billForm.items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Service Description (e.g. ECG Test)"
                          value={item.description}
                          onChange={(e) => updateItemInBill(idx, 'description', e.target.value)}
                          className="w-full glass-input text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={item.unitPrice}
                          onChange={(e) => updateItemInBill(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full glass-input text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItemInBill(idx, 'quantity', Number(e.target.value))}
                          className="w-full glass-input text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#0F172A] font-bold text-xs">
                          ₹{(Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)}
                        </span>
                        {billForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemFromBill(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Discount Calculations */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    value={billForm.gstRate}
                    onChange={(e) => setBillForm({ ...billForm, gstRate: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Amount (₹)</label>
                  <input
                    type="number"
                    value={billForm.discountAmount}
                    onChange={(e) => setBillForm({ ...billForm, discountAmount: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono"
                  />
                </div>
              </div>

              {/* Initial Payment Settlement */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-bold">Subtotal:</span>
                  <span className="font-bold">₹{calculateSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-bold">Grand Total:</span>
                  <span className="text-lg font-extrabold text-[#2563EB]">₹{calculateGrandTotal().toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Initial Payment (₹) (Default ₹0 = Pending)</label>
                    <input
                      type="number"
                      value={billForm.initialPaidAmount}
                      onChange={(e) => setBillForm({ ...billForm, initialPaidAmount: Number(e.target.value) })}
                      className="w-full glass-input text-xs font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Payment Method</label>
                    <select
                      value={billForm.paymentMethod}
                      onChange={(e) => setBillForm({ ...billForm, paymentMethod: e.target.value })}
                      className="w-full glass-input text-xs"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-700 font-bold">Calculated Balance Due:</span>
                  <span className={`font-bold ${calculateBalanceDue() > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    ₹{calculateBalanceDue().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold tracking-wide"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>CREATE INVOICE</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* COLLECT PAYMENT MODAL (Rendered via Portal) */}
      {payModalOpen && activePayBill && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="glass-panel w-full max-w-lg p-6 border border-slate-200 shadow-2xl relative bg-white text-[#0F172A] rounded-2xl">
            <button onClick={() => setPayModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-serif font-bold text-[#0F172A] mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" /> Collect Invoice Payment
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-4">
              Invoice #{activePayBill.invoiceNumber} • Patient: <strong className="text-slate-900">{activePayBill.patientName}</strong>
            </p>

            {/* Payment Summary Breakdown Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Invoice Amount:</span>
                <span className="font-bold text-[#0F172A]">₹{activePayBill.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Paid Amount:</span>
                <span className="font-bold text-emerald-700">₹{activePayBill.paidAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Remaining Balance Due:</span>
                <span className="font-bold text-rose-600 text-sm">₹{activePayBill.balanceDue?.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  required
                  max={activePayBill.balanceDue}
                  value={payForm.amountPaid}
                  onChange={(e) => setPayForm({ ...payForm, amountPaid: e.target.value })}
                  className="w-full glass-input text-base font-mono font-bold text-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                    className="w-full glass-input text-xs font-bold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payForm.paymentDate}
                    onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                    className="w-full glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / Txn ID</label>
                <input
                  type="text"
                  value={payForm.transactionRef}
                  onChange={(e) => setPayForm({ ...payForm, transactionRef: e.target.value })}
                  className="w-full glass-input text-xs font-mono"
                  placeholder="e.g. UPI-9928374611 or CHQ-00192"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Notes (Optional)</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full glass-input text-xs"
                  placeholder="e.g. Partial cash payment at front desk"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-emerald-600 text-white hover:bg-emerald-700 font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* INVOICE VIEW PREVIEW MODAL */}
      {selectedBill && (
        <InvoicePdfModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  );
};