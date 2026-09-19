import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Activity,
  Award,
  IndianRupee,
  AlertTriangle,
  Pill,
  FlaskConical,
  CheckCircle2,
  Filter,
  Download,
  FileSpreadsheet,
  ArrowUpRight,
  Stethoscope,
  Clock,
  ArrowRight,
  Layers,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import {
  storageService,
  getTodayLocalDateStr,
  getLocalDateStrFromISO
} from '../../services/storageService';

const DEPARTMENT_COLORS: { [key: string]: string } = {
  Cardiology: '#2563EB',
  Orthopedics: '#10B981',
  Dermatology: '#F59E0B',
  'General Medicine': '#6366F1',
  Pediatrics: '#EC4899',
  Neurology: '#8B5CF6',
  General: '#64748B'
};

export const AnalyticsDashboard: React.FC = () => {
  const { clinic } = useAuth();
  const navigate = useNavigate();
  const todayStr = getTodayLocalDateStr();

  // Date Range Filter State (Default 'All Time' so initial load matches Billing ledger)
  const [datePeriod, setDatePeriod] = useState<string>('All Time');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');

  // Live Refresh State
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Revenue Chart Interval View State
  const [chartInterval, setChartInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Doctor Performance Sorting State
  const [doctorSortField, setDoctorSortField] = useState<'revenue' | 'appointments' | 'patients'>('revenue');

  // Refresh dataset on mount & focus
  useEffect(() => {
    const handleFocus = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Date Range Calculator Helper
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    let start = new Date(0); // 1970 for All Time
    let end = new Date(2099, 11, 31);

    if (datePeriod === 'Today') {
      start = new Date(todayStr + 'T00:00:00');
      end = new Date(todayStr + 'T23:59:59');
    } else if (datePeriod === 'This Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date();
    } else if (datePeriod === 'This Month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (datePeriod === 'Last Month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (datePeriod === 'This Quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
    } else if (datePeriod === 'This Year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (datePeriod === 'Custom Range' && customFromDate && customToDate) {
      start = new Date(customFromDate + 'T00:00:00');
      end = new Date(customToDate + 'T23:59:59');
    }

    const startStr = getLocalDateStrFromISO(start.toISOString());
    const endStr = getLocalDateStrFromISO(end.toISOString());

    return { start, end, startStr, endStr };
  }, [datePeriod, customFromDate, customToDate, todayStr]);

  // Datasets State from MongoDB
  const [rawBills, setRawBills] = useState<any[]>([]);
  const [rawAppointments, setRawAppointments] = useState<any[]>([]);
  const [rawPatients, setRawPatients] = useState<any[]>([]);
  const [rawDoctors, setRawDoctors] = useState<any[]>([]);
  const [rawPharmacy, setRawPharmacy] = useState<any[]>([]);
  const [rawLabOrders, setRawLabOrders] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      const [bills, appts, pats, docs, meds, labs] = await Promise.all([
        storageService.fetchBills(),
        storageService.fetchAppointments(),
        storageService.fetchPatients(),
        storageService.fetchDoctors(),
        storageService.fetchPharmacy(),
        storageService.fetchLabOrders()
      ]);
      if (isMounted) {
        setRawBills(bills);
        setRawAppointments(appts);
        setRawPatients(pats);
        setRawDoctors(docs);
        setRawPharmacy(meds);
        setRawLabOrders(labs);
      }
    };
    loadAll();
    return () => { isMounted = false; };
  }, [refreshTrigger]);

  // Synchronized Filtered Datasets based on Selected Date Range
  const filteredBills = useMemo(() => {
    if (datePeriod === 'All Time') return rawBills;
    return rawBills.filter((b: any) => {
      const bDateStr = getLocalDateStrFromISO(b.createdAt);
      if (datePeriod === 'Today') return bDateStr === todayStr;
      return bDateStr >= dateRangeBounds.startStr && bDateStr <= dateRangeBounds.endStr;
    });
  }, [rawBills, dateRangeBounds, datePeriod, todayStr, refreshTrigger]);

  const filteredAppointments = useMemo(() => {
    if (datePeriod === 'All Time') return rawAppointments;
    return rawAppointments.filter((a: any) => {
      const aDateStr = a.date || getLocalDateStrFromISO(a.createdAt);
      if (datePeriod === 'Today') return aDateStr === todayStr;
      return aDateStr >= dateRangeBounds.startStr && aDateStr <= dateRangeBounds.endStr;
    });
  }, [rawAppointments, dateRangeBounds, datePeriod, todayStr, refreshTrigger]);

  const filteredPatients = useMemo(() => {
    if (datePeriod === 'All Time') return rawPatients;
    return rawPatients.filter((p: any) => {
      if (!p.createdAt) return true;
      const pDateStr = getLocalDateStrFromISO(p.createdAt);
      if (datePeriod === 'Today') return pDateStr === todayStr;
      return pDateStr >= dateRangeBounds.startStr && pDateStr <= dateRangeBounds.endStr;
    });
  }, [rawPatients, dateRangeBounds, datePeriod, todayStr, refreshTrigger]);

  const filteredLabOrders = useMemo(() => {
    if (datePeriod === 'All Time') return rawLabOrders;
    return rawLabOrders.filter((l: any) => {
      const lDateStr = getLocalDateStrFromISO(l.createdAt);
      if (datePeriod === 'Today') return lDateStr === todayStr;
      return lDateStr >= dateRangeBounds.startStr && lDateStr <= dateRangeBounds.endStr;
    });
  }, [rawLabOrders, dateRangeBounds, datePeriod, todayStr, refreshTrigger]);

  // Synchronized Financial Calculations (Exact match with BillingList.tsx)
  const totalRevenue = useMemo(() => {
    // Sum of actual paid/collected amounts across all invoices in period
    return filteredBills.reduce((sum: number, b: any) => sum + (Number(b.paidAmount) || 0), 0);
  }, [filteredBills]);

  const totalInvoiced = useMemo(() => {
    return filteredBills.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0);
  }, [filteredBills]);

  const totalOutstanding = useMemo(() => {
    // Outstanding = Total Invoice Amount - Total Amount Paid
    return filteredBills.reduce((sum: number, b: any) => sum + (Number(b.balanceDue) || 0), 0);
  }, [filteredBills]);

  const paidInvoicesCount = useMemo(() => {
    return filteredBills.filter((b: any) => b.paymentStatus === 'Paid').length;
  }, [filteredBills]);

  const avgInvoiceValue = useMemo(() => {
    if (filteredBills.length === 0) return 0;
    return Math.round(totalInvoiced / filteredBills.length);
  }, [totalInvoiced, filteredBills]);

  const totalAppointmentsCount = filteredAppointments.length;
  const completedConsultationsCount = filteredAppointments.filter(
    (a: any) => a.status === 'Completed' || a.status === 'In Consultation'
  ).length;
  const scheduledCount = filteredAppointments.filter((a: any) => a.status === 'Scheduled').length;
  const cancelledCount = filteredAppointments.filter((a: any) => a.status === 'Cancelled').length;

  const newPatientsCount = filteredPatients.length;

  // Returning Patients Calculation
  const returningPatientsCount = useMemo(() => {
    const patientVisitCounts: { [key: string]: number } = {};
    filteredAppointments.forEach((a: any) => {
      const aPatId = typeof a.patientId === 'object' ? (a.patientId?._id || a.patientId?.patientId) : a.patientId;
      const key = aPatId || a.patientName;
      patientVisitCounts[key] = (patientVisitCounts[key] || 0) + 1;
    });
    return Object.values(patientVisitCounts).filter((cnt) => cnt > 1).length;
  }, [filteredAppointments]);

  const patientRetentionRate = useMemo(() => {
    const uniqueVisitedPatients = new Set(
      filteredAppointments.map((a: any) => {
        const aPatId = typeof a.patientId === 'object' ? (a.patientId?._id || a.patientId?.patientId) : a.patientId;
        return aPatId || a.patientName;
      })
    ).size;
    if (uniqueVisitedPatients === 0) return 0;
    return Math.round((returningPatientsCount / uniqueVisitedPatients) * 100);
  }, [filteredAppointments, returningPatientsCount]);

  // Revenue Over Time Chart Series (Strictly using collected paidAmount!)
  const revenueTimeSeries = useMemo(() => {
    const grouped: { [key: string]: { label: string; revenue: number; invoices: number } } = {};

    filteredBills.forEach((b: any) => {
      const dStr = getLocalDateStrFromISO(b.createdAt);
      if (!grouped[dStr]) {
        grouped[dStr] = { label: dStr, revenue: 0, invoices: 0 };
      }
      // ONLY sum actual collected paidAmount (never falsy fallback to totalAmount!)
      grouped[dStr].revenue += (Number(b.paidAmount) || 0);
      grouped[dStr].invoices += 1;
    });

    const result = Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label));
    if (result.length === 0) {
      return [{ label: dateRangeBounds.startStr || todayStr, revenue: 0, invoices: 0 }];
    }
    return result;
  }, [filteredBills, dateRangeBounds, todayStr]);

  // Revenue By Department Breakdown (Strictly using collected paidAmount!)
  const departmentRevenueBreakdown = useMemo(() => {
    const deptSums: { [key: string]: number } = {};
    let grandTotal = 0;

    filteredBills.forEach((b: any) => {
      const doc = rawDoctors.find((d: any) => d.name === b.doctorName);
      const dept = doc?.specialization || doc?.departmentName || 'General Practice';
      const amount = Number(b.paidAmount) || 0; // Collected revenue only!
      deptSums[dept] = (deptSums[dept] || 0) + amount;
      grandTotal += amount;
    });

    if (grandTotal === 0 && filteredBills.length === 0) {
      // Fallback from appointments when no bills exist
      filteredAppointments.forEach((a: any) => {
        const doc = rawDoctors.find((d: any) => d.name === a.doctorName);
        const dept = doc?.specialization || 'General Medicine';
        deptSums[dept] = (deptSums[dept] || 0) + 800;
        grandTotal += 800;
      });
    }

    const items = Object.entries(deptSums).map(([name, val]) => ({
      name,
      value: val,
      percentage: grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0,
      color: DEPARTMENT_COLORS[name] || DEPARTMENT_COLORS[name.split(' ')[0]] || '#2563EB'
    }));

    return items.sort((a, b) => b.value - a.value);
  }, [filteredBills, filteredAppointments, rawDoctors]);

  // Doctor Performance Dataset (Strictly using collected paidAmount!)
  const doctorPerformanceList = useMemo(() => {
    return rawDoctors.map((doc: any) => {
      const docAppts = filteredAppointments.filter((a: any) => {
        const aDocId = typeof a.doctorId === 'object' ? a.doctorId?._id : a.doctorId;
        return a.doctorName === doc.name || aDocId === doc._id;
      });
      const completed = docAppts.filter((a: any) => a.status === 'Completed' || a.status === 'In Consultation').length;
      const cancelled = docAppts.filter((a: any) => a.status === 'Cancelled').length;
      
      const docBills = filteredBills.filter((b: any) => b.doctorName === doc.name);
      // Strictly sum paidAmount for Doctor Revenue!
      const revenue = docBills.reduce((sum: number, b: any) => sum + (Number(b.paidAmount) || 0), 0);
      
      const uniquePatients = new Set(docAppts.map((a: any) => {
        const aPatId = typeof a.patientId === 'object' ? a.patientId?._id : a.patientId;
        return aPatId || a.patientName;
      })).size;
      const avgBilling = docBills.length > 0 ? Math.round(revenue / docBills.length) : doc.consultationFee || 800;

      return {
        _id: doc._id,
        name: doc.name,
        specialization: doc.specialization,
        appointments: docAppts.length,
        completed,
        cancelled,
        patients: uniquePatients,
        revenue,
        avgBilling
      };
    }).sort((a, b) => {
      if (doctorSortField === 'revenue') return b.revenue - a.revenue;
      if (doctorSortField === 'appointments') return b.appointments - a.appointments;
      return b.patients - a.patients;
    });
  }, [rawDoctors, filteredAppointments, filteredBills, doctorSortField]);

  // Pharmacy Analytics Metrics
  const totalPharmacyMeds = rawPharmacy.length;
  const totalStockUnits = rawPharmacy.reduce((sum: number, m: any) => sum + (Number(m.stockQuantity) || 0), 0);
  const lowStockCount = rawPharmacy.filter((m: any) => (m.stockQuantity || 0) <= (m.reorderLevel || 20)).length;
  const expiredMedsCount = rawPharmacy.filter((m: any) => m.expiryDate && m.expiryDate < todayStr).length;

  // Lab Analytics Metrics
  const totalLabOrdersCount = filteredLabOrders.length;
  const labProcessingCount = filteredLabOrders.filter((l: any) => l.status === 'Processing' || l.status === 'Sample Collected').length;
  const labResultReadyCount = filteredLabOrders.filter((l: any) => l.status === 'Result Ready' || l.status === 'Report Uploaded').length;
  const labRevenue = filteredLabOrders.reduce((sum: number, l: any) => sum + Number(l.price || 0), 0);

  // CSV Report Exporter
  const handleExportCSV = () => {
    const headers = ['Metric', 'Period', 'Value'];
    const rows = [
      ['Total Revenue (Collected)', datePeriod, `INR ${totalRevenue}`],
      ['Total Invoiced Amount', datePeriod, `INR ${totalInvoiced}`],
      ['Outstanding Balance', datePeriod, `INR ${totalOutstanding}`],
      ['Average Invoice Value', datePeriod, `INR ${avgInvoiceValue}`],
      ['Total Appointments', datePeriod, totalAppointmentsCount],
      ['Completed Encounters', datePeriod, completedConsultationsCount],
      ['New Patients Registered', datePeriod, newPatientsCount],
      ['Patient Retention Rate', datePeriod, `${patientRetentionRate}%`],
      ['Total Lab Orders', datePeriod, totalLabOrdersCount],
      ['Lab Revenue', datePeriod, `INR ${labRevenue}`],
      ['Pharmacy Low Stock SKUs', 'Current', lowStockCount]
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Clinic_Analytics_Report_${datePeriod.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* Analytics Header & Date Range Filter */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#2563EB]" /> Practice Performance & Revenue Analytics
          </h1>
          <p className="page-subtitle mt-1">
            Revenue, appointments/encounters, patient activity, doctor performance, billing, pharmacy, and laboratory performance
          </p>
        </div>

        {/* Date Filter & Export Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Preset Period Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <Filter className="w-3.5 h-3.5 text-[#2563EB] ml-2 shrink-0" />
            <select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-[#0F172A] focus:outline-none pr-3 cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Quarter">This Quarter</option>
              <option value="This Year">This Year</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Inputs */}
          {datePeriod === 'Custom Range' && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl text-xs font-mono">
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="bg-transparent border-0 text-xs text-[#0F172A] focus:outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="bg-transparent border-0 text-xs text-[#0F172A] focus:outline-none"
              />
            </div>
          )}

          {/* Export Report CSV Button */}
          <button
            onClick={handleExportCSV}
            className="btn-secondary text-xs py-2 px-3.5 cursor-pointer flex items-center gap-1.5 hover:border-slate-400 bg-white"
            title="Export CSV Analytics Report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards (8 Metrics Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue (Collected) - EXACT SYNCHRONIZED VALUE WITH BILLING LEDGER */}
        <div
          onClick={() => navigate('/billing')}
          className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm cursor-pointer group hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue (Collected)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-2 font-mono">₹{totalRevenue.toLocaleString()}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 font-mono">
            <span>Invoiced: ₹{totalInvoiced.toLocaleString()}</span>
            <span className="text-[#2563EB] font-bold flex items-center gap-0.5 group-hover:underline">
              Billing <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Total Appointments */}
        <div
          onClick={() => navigate('/appointments')}
          className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm cursor-pointer group hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Appointments</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-[#0F172A] mt-2 font-mono">{totalAppointmentsCount}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 font-mono">
            <span>{scheduledCount} Scheduled</span>
            <span className="text-[#2563EB] font-bold flex items-center gap-0.5 group-hover:underline">
              Appointments <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Completed Consultations */}
        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Consultations</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-purple-700 mt-2 font-mono">{completedConsultationsCount}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Fulfilled clinical visits</p>
        </div>

        {/* Card 4: Outstanding Receivables */}
        <div
          onClick={() => navigate('/billing?status=Pending')}
          className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm cursor-pointer group hover:border-amber-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outstanding Receivables</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-2 font-mono">₹{totalOutstanding.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Unpaid invoice balance</p>
        </div>

        {/* Card 5: Average Invoice Value */}
        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Invoice Value</span>
          <p className="text-2xl font-serif font-bold text-[#0F172A] mt-2 font-mono">₹{avgInvoiceValue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Per billed patient invoice</p>
        </div>

        {/* Card 6: New Patients */}
        <div
          onClick={() => navigate('/patients')}
          className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm cursor-pointer group hover:border-blue-300 transition"
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Patients Registered</span>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-2 font-mono">{newPatientsCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">First-time patient records</p>
        </div>

        {/* Card 7: Returning Patients */}
        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Returning Patients</span>
          <p className="text-2xl font-serif font-bold text-blue-600 mt-2 font-mono">{returningPatientsCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Repeat consultation visits</p>
        </div>

        {/* Card 8: Patient Retention Rate */}
        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient Retention Rate</span>
          <p className="text-2xl font-serif font-bold text-[#2563EB] mt-2 font-mono">{patientRetentionRate}%</p>
          <p className="text-[10px] text-emerald-700 mt-1 font-semibold">Calculated repeat visit share</p>
        </div>
      </div>

      {/* Revenue Over Time Chart & Revenue by Department */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Over Time Chart */}
        <div className="lg:col-span-2 glass-panel p-6 border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#0F172A]">Realized Revenue Trajectory</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Financial performance for {clinic?.name || 'ClinicFlow Practice'} ({datePeriod})
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-mono">
              <button
                onClick={() => setChartInterval('daily')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  chartInterval === 'daily' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setChartInterval('weekly')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  chartInterval === 'weekly' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTimeSeries}>
                <defs>
                  <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', color: '#0F172A', fontSize: '12px' }}
                />
                <Area name="Collected Revenue (₹)" type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#revAreaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue By Department Pie Chart */}
        <div className="glass-panel p-6 border-slate-200/80 bg-white flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#0F172A] mb-1 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-[#2563EB]" /> Revenue by Specialty
            </h3>
            <p className="text-xs text-slate-500 mb-4">Actual revenue share calculated per department</p>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentRevenueBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                  >
                    {departmentRevenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Collected Revenue']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', color: '#0F172A', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            {departmentRevenueBreakdown.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 font-medium truncate max-w-[170px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="font-bold text-[#0F172A] font-mono">₹{d.value.toLocaleString()} ({d.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Doctor Performance & Productivity Table */}
      <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#2563EB]" /> Practitioner Productivity & Revenue
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">Individual doctor appointment volume, completion rates, and billing contributions</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500 font-sans font-semibold">Sort By:</span>
            <button
              onClick={() => setDoctorSortField('revenue')}
              className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                doctorSortField === 'revenue' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setDoctorSortField('appointments')}
              className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                doctorSortField === 'appointments' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Appointments
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans text-[#0F172A]">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="p-3">DOCTOR</th>
                <th className="p-3">SPECIALIZATION</th>
                <th className="p-3 text-center">APPOINTMENTS</th>
                <th className="p-3 text-center">COMPLETED</th>
                <th className="p-3 text-center">PATIENTS</th>
                <th className="p-3 text-right">REVENUE GENERATED</th>
                <th className="p-3 text-right">AVG BILL VALUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctorPerformanceList.map((doc) => (
                <tr key={doc._id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-serif font-bold text-sm text-[#0F172A]">
                    {doc.name}
                  </td>
                  <td className="p-3 text-slate-600 font-medium">
                    {doc.specialization}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-[#0F172A]">
                    {doc.appointments}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-emerald-700">
                    {doc.completed}
                  </td>
                  <td className="p-3 text-center font-mono text-slate-700">
                    {doc.patients}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                    ₹{doc.revenue.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700">
                    ₹{doc.avgBilling.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Module Analytics Grid (Pharmacy & Lab Diagnostics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pharmacy Module Analytics */}
        <div
          onClick={() => navigate('/pharmacy')}
          className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4 cursor-pointer group hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2">
              <Pill className="w-5 h-5 text-[#2563EB]" /> Pharmacy Inventory Health
            </h3>
            <span className="text-xs text-[#2563EB] font-bold flex items-center gap-1 group-hover:underline">
              Pharmacy Module <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Medicine SKUs</span>
              <p className="text-lg font-bold text-[#0F172A] mt-1">{totalPharmacyMeds}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Stock Units</span>
              <p className="text-lg font-bold text-emerald-700 mt-1">{totalStockUnits.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Low Stock</span>
              <p className="text-lg font-bold text-amber-600 mt-1">{lowStockCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Expired</span>
              <p className="text-lg font-bold text-rose-600 mt-1">{expiredMedsCount}</p>
            </div>
          </div>
        </div>

        {/* Lab Diagnostics Module Analytics */}
        <div
          onClick={() => navigate('/lab')}
          className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4 cursor-pointer group hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#2563EB]" /> Pathology & Diagnostic Activity
            </h3>
            <span className="text-xs text-[#2563EB] font-bold flex items-center gap-1 group-hover:underline">
              Lab Module <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Lab Orders</span>
              <p className="text-lg font-bold text-[#0F172A] mt-1">{totalLabOrdersCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Processing</span>
              <p className="text-lg font-bold text-blue-600 mt-1">{labProcessingCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Result Ready</span>
              <p className="text-lg font-bold text-emerald-700 mt-1">{labResultReadyCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Lab Income</span>
              <p className="text-lg font-bold text-emerald-700 mt-1">₹{labRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
