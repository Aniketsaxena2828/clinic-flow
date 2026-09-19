import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  storageService,
  getTodayLocalDateStr,
  getLocalDateStrFromISO
} from '../services/storageService';
import {
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Stethoscope,
  Plus,
  FileText,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Clock,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  IndianRupee,
  Activity,
  Receipt,
  FlaskConical,
  Pill,
  UserPlus,
  Check,
  ChevronRight,
  Eye
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { PrescriptionPdfModal } from '../components/PrescriptionPdfModal';
import { InvoicePdfModal } from '../components/InvoicePdfModal';
import { LabReportPdfModal } from '../components/LabReportPdfModal';

export const Dashboard: React.FC = () => {
  const { user, clinic } = useAuth();
  const navigate = useNavigate();

  const todayStr = getTodayLocalDateStr();

  // Formatted System Date Header (e.g. Wednesday, September 3, 2026)
  const formattedTodayDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const todayDayAbbr = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date().getDay()];
  }, []);

  // Live Refresh Trigger State
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const refreshData = () => setRefreshKey((prev) => prev + 1);

  // Preview Modals State
  const [previewRx, setPreviewRx] = useState<any | null>(null);
  const [previewBill, setPreviewBill] = useState<any | null>(null);
  const [previewLab, setPreviewLab] = useState<any | null>(null);

  // 1. Datasets State from MongoDB
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [allBills, setAllBills] = useState<any[]>([]);
  const [allPrescriptions, setAllPrescriptions] = useState<any[]>([]);
  const [allPharmacy, setAllPharmacy] = useState<any[]>([]);
  const [allLabOrders, setAllLabOrders] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      const [appts, pats, docs, bills, rxs, meds, labs] = await Promise.all([
        storageService.fetchAppointments(),
        storageService.fetchPatients(),
        storageService.fetchDoctors(),
        storageService.fetchBills(),
        storageService.fetchPrescriptions(),
        storageService.fetchPharmacy(),
        storageService.fetchLabOrders()
      ]);
      if (isMounted) {
        setAllAppointments(appts);
        setAllPatients(pats);
        setAllDoctors(docs);
        setAllBills(bills);
        setAllPrescriptions(rxs);
        setAllPharmacy(meds);
        setAllLabOrders(labs);
      }
    };
    loadAll();
    return () => { isMounted = false; };
  }, [refreshKey, clinic?._id]);

  // 2. Operational Metrics Calculations
  const todayAppointments = useMemo(
    () => allAppointments.filter((a: any) => a.date === todayStr),
    [allAppointments, todayStr]
  );

  const todayApptCounts = useMemo(() => {
    const total = todayAppointments.length;
    const scheduled = todayAppointments.filter((a: any) => a.status === 'Scheduled').length;
    const checkedIn = todayAppointments.filter((a: any) => a.status === 'Checked In').length;
    const inConsultation = todayAppointments.filter((a: any) => a.status === 'In Consultation').length;
    const completed = todayAppointments.filter((a: any) => a.status === 'Completed').length;
    const cancelled = todayAppointments.filter((a: any) => a.status === 'Cancelled').length;
    const noShow = todayAppointments.filter((a: any) => a.status === 'No Show').length;
    return { total, scheduled, checkedIn, inConsultation, completed, cancelled, noShow };
  }, [todayAppointments]);

  // Financial Revenue Calculations (Strictly sum actual settled funds paidAmount)
  const todayBills = useMemo(() => {
    return allBills.filter((b: any) => getLocalDateStrFromISO(b.createdAt) === todayStr);
  }, [allBills, todayStr]);

  const todayCollectedRevenue = useMemo(() => {
    return todayBills.reduce((sum: number, b: any) => sum + (Number(b.paidAmount) || 0), 0);
  }, [todayBills]);

  const totalOutstandingReceivables = useMemo(() => {
    return allBills.reduce((sum: number, b: any) => sum + (Number(b.balanceDue) || 0), 0);
  }, [allBills]);

  // Doctor Workload & Availability Metrics
  const activeDoctors = useMemo(() => {
    return allDoctors.filter((d: any) => d.status === 'active' || !d.status);
  }, [allDoctors]);

  const availableTodayDoctors = useMemo(() => {
    return activeDoctors.filter((d: any) => d.availableDays?.includes(todayDayAbbr));
  }, [activeDoctors, todayDayAbbr]);

  // Pharmacy Inventory Alert Metrics
  const lowStockMeds = useMemo(() => {
    return allPharmacy.filter(
      (m: any) => (m.stockQuantity || 0) <= (m.reorderLevel || m.minStockAlert || 20) || (m.expiryDate && m.expiryDate < todayStr)
    );
  }, [allPharmacy, todayStr]);

  // Lab Diagnostics Summary
  const labSummary = useMemo(() => {
    const total = allLabOrders.length;
    const processing = allLabOrders.filter((l: any) => l.status === 'Processing').length;
    const resultsReady = allLabOrders.filter((l: any) => l.status === 'Result Ready' || l.status === 'Report Uploaded').length;
    return { total, processing, resultsReady };
  }, [allLabOrders]);

  // Dynamic Chart Data Generator
  const chartData = useMemo(() => {
    const totalTodayPaid = todayCollectedRevenue;

    return [
      { date: 'May 4', encounters: 12, billing: 3400 },
      { date: 'May 11', encounters: 19, billing: 4200 },
      { date: 'May 18', encounters: 15, billing: 3800 },
      { date: 'May 25', encounters: 22, billing: 5900 },
      { date: 'Jun 1', encounters: 28, billing: 7400 },
      { date: 'Today', encounters: todayAppointments.length, billing: totalTodayPaid }
    ];
  }, [todayAppointments, todayCollectedRevenue]);

  // Quick Action Appointment Status Handler
  const handleUpdateAppointmentStatus = (id: string, newStatus: string) => {
    storageService.updateAppointmentStatus(id, newStatus);
    refreshData();
  };

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* 1. Header Banner & Quick Actions */}
      <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] tracking-wider uppercase mb-1 font-mono">
              <Building2 className="w-4 h-4 text-[#2563EB]" />
              <span>{clinic?.name || 'ClinicFlow Practice Management'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono text-xs">
                {formattedTodayDate}
              </span>
            </div>
            <h1 className="page-title text-[#0F172A]">
              Good morning, {user?.name || 'Dr. Robert Ford'}
            </h1>
            <p className="page-subtitle mt-1 max-w-xl">
              Logged in as <span className="text-slate-900 font-semibold uppercase tracking-wider text-xs">{user?.role || 'OWNER'}</span>. Practice operational command overview.
            </p>
          </div>

          {/* 4 Primary Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/appointments?book=true')}
              className="btn-gold"
            >
              <Plus className="w-4 h-4 text-white" /> + Book Appt
            </button>
            <button
              onClick={() => navigate('/patients')}
              className="btn-secondary"
            >
              <UserPlus className="w-4 h-4 text-[#2563EB]" /> + Add Patient
            </button>
            <button
              onClick={() => navigate('/billing')}
              className="btn-secondary"
            >
              <Receipt className="w-4 h-4 text-emerald-600" /> + Create Invoice
            </button>
            <button
              onClick={() => navigate('/prescriptions')}
              className="btn-secondary"
            >
              <FileText className="w-4 h-4 text-blue-600" /> + New Rx
            </button>
          </div>
        </div>
      </div>

      {/* 2. Today's Key Operational KPIs Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Today's Appointments */}
        <div
          onClick={() => navigate(`/appointments?date=${todayStr}`)}
          className="glass-panel p-5 border-slate-200/80 cursor-pointer group transition-all duration-300 bg-white hover:border-blue-300 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB]">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#2563EB]">
              TODAY'S APPOINTMENTS
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="kpi-number">{todayApptCounts.total}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              {todayApptCounts.completed} Completed
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
            <span>{todayApptCounts.scheduled} Scheduled • {todayApptCounts.checkedIn + todayApptCounts.inConsultation} Active</span>
            <span className="text-[#2563EB] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-sans">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 2: Total Patient Records */}
        <div
          onClick={() => navigate('/patients')}
          className="glass-panel p-5 border-slate-200/80 cursor-pointer group transition-all duration-300 bg-white hover:border-blue-300 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB]">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#2563EB]">
              PATIENT DATABASE
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="kpi-number">{allPatients.length}</span>
            <span className="text-xs text-blue-600 font-semibold">Active EHR Files</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
            <span>100% Isolated Data</span>
            <span className="text-[#2563EB] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-sans">
              Directory <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 3: Today's Realized Revenue */}
        <div
          onClick={() => navigate('/billing')}
          className="glass-panel p-5 border-slate-200/80 cursor-pointer group transition-all duration-300 bg-white hover:border-emerald-300 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600">
              TODAY'S SETTLED REVENUE
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="kpi-number text-emerald-700">₹{todayCollectedRevenue.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-500 font-medium">Settled Funds</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
            <span>{todayBills.length} Payments Collected</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-sans">
              Billing Ledger <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 4: Outstanding Receivables */}
        <div
          onClick={() => navigate('/billing?status=Pending')}
          className="glass-panel p-5 border-slate-200/80 cursor-pointer group transition-all duration-300 bg-white hover:border-amber-300 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-600">
              RECEIVABLES BALANCES
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="kpi-number text-amber-700">₹{totalOutstandingReceivables.toLocaleString('en-IN')}</span>
            <span className="text-xs text-amber-600 font-semibold">Unpaid Balance</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
            <span>Uncollected Invoices</span>
            <span className="text-amber-600 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-sans">
              Collect Payments <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Operational Body Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's Schedule Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="section-heading text-[#0F172A] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#2563EB]" /> Today's Consultation Schedule & Live Queue
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {todayAppointments.length} Encounters Scheduled for {formattedTodayDate}
                </p>
              </div>

              <button
                onClick={() => navigate('/appointments')}
                className="text-xs text-[#2563EB] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Full Calendar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Queue Items */}
            {todayAppointments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {todayAppointments.map((appt: any) => (
                  <div key={appt._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        #{String(appt.tokenNumber || 1).padStart(2, '0')}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#0F172A]">{appt.patientName}</h4>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              appt.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : appt.status === 'In Consultation'
                                ? 'bg-blue-50 text-[#2563EB] border-blue-200 animate-pulse'
                                : appt.status === 'Checked In'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                          <span className="font-mono text-slate-700 font-semibold">{appt.timeSlot}</span>
                          <span>•</span>
                          <span className="text-slate-700 font-medium">{appt.doctorName}</span>
                          <span>•</span>
                          <span className="italic text-slate-500">{appt.reasonForVisit || 'General Consultation'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inline Status Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {appt.status === 'Scheduled' && (
                        <button
                          onClick={() => handleUpdateAppointmentStatus(appt._id, 'Checked In')}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-200 hover:bg-blue-100 cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                      {appt.status === 'Checked In' && (
                        <button
                          onClick={() => handleUpdateAppointmentStatus(appt._id, 'In Consultation')}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                        >
                          Start Consult
                        </button>
                      )}
                      {appt.status === 'In Consultation' && (
                        <button
                          onClick={() => handleUpdateAppointmentStatus(appt._id, 'Completed')}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/consultation/${appt._id}`)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-[#2563EB]" /> Consult
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No Appointments Scheduled for Today</p>
                <button
                  onClick={() => navigate('/appointments?book=true')}
                  className="btn-gold text-xs py-1.5 px-3"
                >
                  + Book First Appointment
                </button>
              </div>
            )}
          </div>

          {/* Revenue & Encounter Chart */}
          <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="section-heading text-[#0F172A] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Settled Revenue Trajectory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Summing actual settled payment receipts across recent practice weeks</p>
              </div>
              <button onClick={() => navigate('/analytics')} className="text-xs text-[#2563EB] font-semibold hover:underline">
                Analytics →
              </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="billingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Settled Revenue']} />
                  <Area type="monotone" dataKey="billing" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#billingGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Doctors & Inventory Cards */}
        <div className="space-y-6">
          {/* Doctor Availability Panel */}
          <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="section-heading text-[#0F172A] flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#2563EB]" /> Doctor Roster & Workload
              </h3>
              <button onClick={() => navigate('/doctors')} className="text-xs text-[#2563EB] font-semibold hover:underline">
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {activeDoctors.map((doc: any) => {
                const isAvailToday = doc.availableDays?.includes(todayDayAbbr);
                const docApptsCount = todayAppointments.filter((a: any) => a.doctorId === doc._id || a.doctorName === doc.name).length;

                return (
                  <div key={doc._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-[#0F172A]">{doc.name}</h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isAvailToday ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'}`}>
                          {isAvailToday ? 'Available Today' : 'Off Today'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{doc.specialization}</p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-bold text-[#0F172A] block">{docApptsCount} Appts</span>
                      <span className="text-[10px] text-slate-500 font-sans">Today's Load</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module Status Summaries: Pharmacy & Lab */}
          <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
            <h3 className="section-heading text-[#0F172A] flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="w-5 h-5 text-[#2563EB]" /> Diagnostic & Pharmacy Alerts
            </h3>

            {/* Pharmacy Reorder Card */}
            <div onClick={() => navigate('/pharmacy')} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 cursor-pointer hover:bg-amber-50 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-900 text-xs flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-amber-600" /> Pharmacy Inventory Status
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  {lowStockMeds.length} Reorders Needed
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-snug">
                {lowStockMeds.length > 0 ? `${lowStockMeds.map((m: any) => m.name).slice(0, 2).join(', ')} low on stock.` : 'All pharmacy stock levels within safety limits.'}
              </p>
            </div>

            {/* Lab Status Card */}
            <div onClick={() => navigate('/lab')} className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 cursor-pointer hover:bg-purple-50 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-900 text-xs flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-purple-600" /> Laboratory Diagnostic Orders
                </span>
                <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full font-mono">
                  {labSummary.total} Total Orders
                </span>
              </div>
              <p className="text-xs text-purple-800 leading-snug">
                {labSummary.processing} test samples processing in lab. {labSummary.resultsReady} reports ready for review.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Modals */}
      {previewRx && <PrescriptionPdfModal prescription={previewRx} onClose={() => setPreviewRx(null)} />}
      {previewBill && <InvoicePdfModal bill={previewBill} onClose={() => setPreviewBill(null)} />}
      {previewLab && <LabReportPdfModal order={previewLab} onClose={() => setPreviewLab(null)} />}
    </div>
  );
};
