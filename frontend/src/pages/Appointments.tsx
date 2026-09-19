import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Play,
  Loader2,
  X,
  Tag,
  Hash,
  PhoneCall,
  Search,
  Filter,
  AlertTriangle,
  UserPlus,
  Edit3,
  Eye,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  CalendarDays,
  UserCheck,
  Ban,
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';
import {
  storageService,
  getTodayLocalDateStr,
  getLocalDateStrFromISO
} from '../services/storageService';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'
];

export const AppointmentsPage: React.FC = () => {
  const { clinic } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const todayStr = getTodayLocalDateStr();

  // Query Params & Modal Triggers
  const queryDate = searchParams.get('date');
  const queryPatientId = searchParams.get('patientId');
  const shouldOpenBookModal = searchParams.get('book') === 'true';

  // Primary State
  const [selectedDate, setSelectedDate] = useState<string>(queryDate || todayStr);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'list'>('day');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(shouldOpenBookModal);
  const [viewDetailAppt, setViewDetailAppt] = useState<any | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<any | null>(null);
  const [cancelTargetAppt, setCancelTargetAppt] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Trigger state for refreshing appointments from storage
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    if (queryDate) {
      setSelectedDate(queryDate);
    }
  }, [queryDate]);

  useEffect(() => {
    if (shouldOpenBookModal) {
      setIsBookModalOpen(true);
    }
  }, [shouldOpenBookModal]);

  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);

  const refreshData = () => setRefreshKey((prev) => prev + 1);

  // Fetch Datasets
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      const [appts, pats, docs] = await Promise.all([
        storageService.fetchAppointments(),
        storageService.fetchPatients(),
        storageService.fetchDoctors()
      ]);
      if (isMounted) {
        setAllAppointments(appts || []);
        setAllPatients(pats || []);
        setAllDoctors(docs || []);

        const activeDocs = (docs || []).filter((d: any) => {
          const s = (d.status || '').toLowerCase();
          return s === 'active';
        });
        if (activeDocs.length > 0) {
          setBookingForm((prev) => ({
            ...prev,
            doctorId: prev.doctorId || activeDocs[0]._id || activeDocs[0].id || ''
          }));
        }
      }
    };
    loadAll();
    return () => { isMounted = false; };
  }, [refreshKey, clinic?._id]);

  useEffect(() => {
    if (queryPatientId) {
      setBookingForm((prev) => ({ ...prev, patientId: queryPatientId }));
    }
  }, [queryPatientId]);

  // Synchronized Filtered Appointments for Selected Date
  const dateAppointments = useMemo(() => {
    return allAppointments.filter((a: any) => a.date === selectedDate);
  }, [allAppointments, selectedDate]);

  // Multi-Faceted Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return dateAppointments.filter((a: any) => {
      // Doctor filter
      const apptDocId = typeof a.doctorId === 'object' ? a.doctorId?._id : a.doctorId;
      if (doctorFilter !== 'all' && apptDocId !== doctorFilter && a.doctorName !== doctorFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && a.status !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && a.type !== typeFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const patName = (a.patientName || '').toLowerCase();
        const patIdStr = typeof a.patientId === 'object' ? (a.patientId?.patientId || a.patientId?._id || '') : (a.patientId || '');
        const patId = patIdStr.toLowerCase();
        const apptId = (a.appointmentId || '').toLowerCase();
        const docName = (a.doctorName || '').toLowerCase();
        const phone = (a.patientPhone || '').toLowerCase();
        if (
          !patName.includes(q) &&
          !patId.includes(q) &&
          !apptId.includes(q) &&
          !docName.includes(q) &&
          !phone.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [dateAppointments, doctorFilter, statusFilter, typeFilter, searchQuery]);

  // Statistics Metrics for Selected Date
  const statsMetrics = useMemo(() => {
    const total = dateAppointments.length;
    const scheduled = dateAppointments.filter((a: any) => a.status === 'Scheduled' || a.status === 'Confirmed').length;
    const checkedIn = dateAppointments.filter((a: any) => a.status === 'Checked In').length;
    const inConsultation = dateAppointments.filter((a: any) => a.status === 'In Consultation').length;
    const completed = dateAppointments.filter((a: any) => a.status === 'Completed').length;
    const cancelled = dateAppointments.filter((a: any) => a.status === 'Cancelled').length;
    const noShow = dateAppointments.filter((a: any) => a.status === 'No Show').length;

    return { total, scheduled, checkedIn, inConsultation, completed, cancelled, noShow };
  }, [dateAppointments]);

  // Today's Live Queue Patients
  const liveQueueList = useMemo(() => {
    return dateAppointments.filter((a: any) => a.status === 'Checked In' || a.status === 'In Consultation');
  }, [dateAppointments]);

  // Calculate Realized Wait Time in minutes for Checked-in patients
  const calculateWaitTime = (checkedInTimeStr?: string): string => {
    if (!checkedInTimeStr) return '0 min';
    try {
      const now = new Date();
      const parts = checkedInTimeStr.split(' ');
      const timeParts = parts[0].split(':');
      let hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      if (parts[1] === 'PM' && hours < 12) hours += 12;
      if (parts[1] === 'AM' && hours === 12) hours = 0;

      const checkInDate = new Date();
      checkInDate.setHours(hours, minutes, 0, 0);

      const diffMs = now.getTime() - checkInDate.getTime();
      const diffMins = Math.max(0, Math.floor(diffMs / 60000));
      return `${diffMins} min`;
    } catch (e) {
      return '10 min';
    }
  };

  // Status Action Handlers
  const handleStatusTransition = async (apptId: string, newStatus: string, metadata?: any) => {
    try {
      await storageService.updateAppointmentStatus(apptId, newStatus, metadata);
    } catch (err) {
      console.error('Status update failed:', err);
    }
    refreshData();
  };

  const handleConfirmCancel = async () => {
    if (cancelTargetAppt) {
      try {
        await storageService.updateAppointmentStatus(cancelTargetAppt._id, 'Cancelled', {
          cancellationReason: cancelReason || 'Patient requested cancellation'
        });
      } catch (err) {
        console.error('Cancel failed:', err);
      }
      setCancelTargetAppt(null);
      setCancelReason('');
      refreshData();
    }
  };

  // Form State for Booking Modal
  const [bookingForm, setBookingForm] = useState({
    patientId: '',
    doctorId: allDoctors[0]?._id || '',
    date: selectedDate,
    timeSlot: '10:00 AM',
    type: 'In-person',
    reasonForVisit: '',
    // Inline Add New Patient state
    isInlineNewPatient: false,
    newPatientName: '',
    newPatientPhone: '',
    newPatientGender: 'Male',
    newPatientAge: 30
  });

  // Conflict Detection for Booking Form
  const bookingConflict = useMemo(() => {
    if (!bookingForm.date || !bookingForm.timeSlot || !bookingForm.doctorId) return false;
    const existing = allAppointments.find(
      (a: any) => {
        const apptDocId = typeof a.doctorId === 'object' ? a.doctorId?._id : a.doctorId;
        return (
          a.date === bookingForm.date &&
          a.timeSlot === bookingForm.timeSlot &&
          apptDocId === bookingForm.doctorId &&
          a.status !== 'Cancelled'
        );
      }
    );
    return !!existing;
  }, [allAppointments, bookingForm.date, bookingForm.timeSlot, bookingForm.doctorId]);

  // Submit Booking Form
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingConflict) return;

    let targetPatientId = bookingForm.patientId;
    let targetPatientName = '';
    let targetPatientPhone = '';

    try {
      if (bookingForm.isInlineNewPatient) {
        if (!bookingForm.newPatientName) return;
        const newPat = {
          name: bookingForm.newPatientName,
          phone: bookingForm.newPatientPhone || '',
          gender: bookingForm.newPatientGender,
          age: Number(bookingForm.newPatientAge),
          status: 'active'
        };
        const saved = await storageService.savePatient(newPat);
        targetPatientId = saved?._id || saved?.id || saved?.patientId || '';
        targetPatientName = saved?.name || newPat.name;
        targetPatientPhone = saved?.phone || newPat.phone;
      } else {
        const p = allPatients.find((x: any) =>
          (x._id && x._id === bookingForm.patientId) ||
          (x.id && x.id === bookingForm.patientId) ||
          (x.patientId && x.patientId === bookingForm.patientId)
        );
        if (p) {
          targetPatientId = p._id || p.id || p.patientId;
          targetPatientName = p.name;
          targetPatientPhone = p.phone;
        }
      }

      const doc = allDoctors.find((d: any) =>
        (d._id && d._id === bookingForm.doctorId) ||
        (d.id && d.id === bookingForm.doctorId) ||
        d.name === bookingForm.doctorId
      ) || allDoctors[0];

      const resolvedDoctorId = doc?._id || doc?.id || bookingForm.doctorId || (allDoctors[0]?._id || allDoctors[0]?.id || '');
      const resolvedDoctorName = doc?.name || allDoctors[0]?.name || 'Attending Doctor';
      const resolvedDoctorSpec = (doc as any)?.specialization || (allDoctors[0] as any)?.specialization || 'General Medicine';

      const dateAppts = allAppointments.filter((a: any) => a.date === bookingForm.date);
      const nextToken = dateAppts.length + 1;

      const newAppt = {
        appointmentId: `APT-${bookingForm.date.replace(/-/g, '')}-${String(nextToken).padStart(3, '0')}`,
        tokenNumber: nextToken,
        patientId: targetPatientId,
        patientName: targetPatientName,
        patientPhone: targetPatientPhone,
        doctorId: resolvedDoctorId,
        doctorName: resolvedDoctorName,
        doctorSpecialization: resolvedDoctorSpec,
        date: bookingForm.date,
        timeSlot: bookingForm.timeSlot,
        type: bookingForm.type,
        status: 'Scheduled',
        reasonForVisit: bookingForm.reasonForVisit || 'Routine Consultation',
        createdAt: new Date().toISOString(),
        bookedAt: new Date().toISOString()
      };

      await storageService.saveAppointment(newAppt);
    } catch (err) {
      console.error('Failed to book appointment:', err);
    }

    setSelectedDate(bookingForm.date);
    setIsBookModalOpen(false);
    refreshData();

    if (shouldOpenBookModal || queryPatientId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('book');
      newParams.delete('patientId');
      setSearchParams(newParams);
    }
  };

  // Form State for Reschedule Modal
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    timeSlot: '',
    doctorId: '',
    type: '',
    reasonForVisit: ''
  });

  useEffect(() => {
    if (rescheduleAppt) {
      setRescheduleForm({
        date: rescheduleAppt.date,
        timeSlot: rescheduleAppt.timeSlot,
        doctorId: rescheduleAppt.doctorId || rescheduleAppt.doctor_id || '',
        type: rescheduleAppt.type,
        reasonForVisit: rescheduleAppt.reasonForVisit || ''
      });
    }
  }, [rescheduleAppt]);

  // Conflict Detection for Reschedule Form
  const rescheduleConflict = useMemo(() => {
    if (!rescheduleAppt || !rescheduleForm.date || !rescheduleForm.timeSlot || !rescheduleForm.doctorId) return false;
    const existing = allAppointments.find(
      (a: any) => {
        const apptDocId = typeof a.doctorId === 'object' ? a.doctorId?._id : (a.doctorId || a.doctor_id);
        const apptId = a._id || a.id;
        const targetId = rescheduleAppt._id || rescheduleAppt.id;
        return (
          apptId !== targetId &&
          a.date === rescheduleForm.date &&
          a.timeSlot === rescheduleForm.timeSlot &&
          apptDocId === rescheduleForm.doctorId &&
          a.status !== 'Cancelled'
        );
      }
    );
    return !!existing;
  }, [allAppointments, rescheduleAppt, rescheduleForm]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rescheduleConflict || !rescheduleAppt) return;

    const doc = allDoctors.find((d: any) =>
      (d._id && d._id === rescheduleForm.doctorId) ||
      (d.id && d.id === rescheduleForm.doctorId)
    );

    const updatedAppt = {
      ...rescheduleAppt,
      date: rescheduleForm.date,
      timeSlot: rescheduleForm.timeSlot,
      doctorId: rescheduleForm.doctorId,
      doctorName: doc?.name || rescheduleAppt.doctorName,
      doctorSpecialization: (doc as any)?.specialization || rescheduleAppt.doctorSpecialization,
      type: rescheduleForm.type,
      reasonForVisit: rescheduleForm.reasonForVisit
    };

    try {
      await storageService.updateAppointment(updatedAppt);
    } catch (err) {
      console.error('Failed to reschedule:', err);
    }
    setSelectedDate(rescheduleForm.date);
    setRescheduleAppt(null);
    refreshData();
  };

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#2563EB]" /> Appointment Scheduling & Token Queue System
          </h1>
          <p className="page-subtitle mt-1">
            Real-time appointment calendar, sequential queue tokens, doctor schedules, and consultation workflow
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="btn-secondary text-xs py-2 px-3.5 cursor-pointer flex items-center gap-1.5 bg-white hover:border-slate-400 font-mono font-bold"
          >
            <Clock className="w-3.5 h-3.5 text-[#2563EB]" /> TODAY'S SCHEDULE ({todayStr})
          </button>
          <button
            onClick={() => {
              setBookingForm((prev) => ({ ...prev, date: selectedDate }));
              setIsBookModalOpen(true);
            }}
            className="btn-gold text-xs py-2 px-4 cursor-pointer shadow-md bg-[#2563EB] text-white flex items-center gap-1.5 font-bold"
          >
            <Plus className="w-4 h-4 text-white" /> BOOK NEW APPOINTMENT
          </button>
        </div>
      </div>

      {/* 2. Daily Summary Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="glass-panel p-3 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Bookings</span>
          <p className="text-xl font-serif font-bold text-[#0F172A] mt-0.5 font-mono">{statsMetrics.total}</p>
        </div>
        <div className="glass-panel p-3 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Scheduled</span>
          <p className="text-xl font-serif font-bold text-blue-600 mt-0.5 font-mono">{statsMetrics.scheduled}</p>
        </div>
        <div className="glass-panel p-3 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Checked In</span>
          <p className="text-xl font-serif font-bold text-amber-600 mt-0.5 font-mono">{statsMetrics.checkedIn}</p>
        </div>
        <div className="glass-panel p-3 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">In Consultation</span>
          <p className="text-xl font-serif font-bold text-emerald-600 mt-0.5 font-mono">{statsMetrics.inConsultation}</p>
        </div>
        <div className="glass-panel p-3 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Completed</span>
          <p className="text-xl font-serif font-bold text-purple-600 mt-0.5 font-mono">{statsMetrics.completed}</p>
        </div>
        <div className="glass-panel p-3 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Cancelled</span>
          <p className="text-xl font-serif font-bold text-rose-600 mt-0.5 font-mono">{statsMetrics.cancelled}</p>
        </div>
        <div className="glass-panel p-3 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">No Show</span>
          <p className="text-xl font-serif font-bold text-slate-600 mt-0.5 font-mono">{statsMetrics.noShow}</p>
        </div>
      </div>

      {/* 3. Filter & View Mode Controls Bar */}
      <div className="glass-panel p-4 border-slate-200/80 bg-white shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'day' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'week' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Week View
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Month View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List View
            </button>
          </div>

          {/* Date Selector Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(getLocalDateStrFromISO(d.toISOString()));
              }}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="glass-input text-xs font-mono py-1.5 px-3 font-bold text-[#0F172A]"
            />

            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(getLocalDateStrFromISO(d.toISOString()));
              }}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Doctor Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Doctor Roster</label>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="all">All Doctors</option>
              {allDoctors.map((doc: any) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Appointment Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked In">Checked In</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>

          {/* Visit Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Visit Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="all">All Types</option>
              <option value="In-person">In-person</option>
              <option value="Video consultation">Video consultation</option>
              <option value="Follow-up">Follow-up</option>
              <option value="New consultation">New consultation</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          {/* Patient / ID Search */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Patient / ID</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Name, Patient ID, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input text-xs pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main View Area Grid (Schedule View + Live Queue Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Schedule Display Area (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* DAY VIEW */}
          {viewMode === 'day' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#2563EB]" /> Daily Chronological Schedule for {selectedDate}
                </h3>
                <span className="text-xs font-mono font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                  {filteredAppointments.length} Bookings Scheduled
                </span>
              </div>

              {filteredAppointments.length > 0 ? (
                <div className="space-y-4">
                  {TIME_SLOTS.map((slot) => {
                    const slotAppts = filteredAppointments.filter((a: any) => a.timeSlot === slot);
                    if (slotAppts.length === 0) return null;

                    return (
                      <div key={slot} className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:bg-slate-50 transition">
                        <div className="w-24 shrink-0">
                          <span className="text-xs font-mono font-bold text-[#2563EB] bg-white border border-blue-200 px-2.5 py-1 rounded-xl inline-block shadow-sm">
                            {slot}
                          </span>
                        </div>

                        <div className="flex-1 w-full space-y-3">
                          {slotAppts.map((apt: any) => (
                            <div
                              key={apt._id}
                              className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition"
                            >
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono font-extrabold text-xs text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                                    #{String(apt.tokenNumber).padStart(2, '0')}
                                  </span>
                                  <div>
                                    <span className="font-serif font-bold text-sm text-[#0F172A]">{apt.patientName}</span>
                                    <span className="text-[11px] text-slate-400 font-mono ml-2">
                                      ({typeof apt.patientId === 'object' ? (apt.patientId?.patientId || apt.patientId?._id || apt.patientName) : (apt.patientId || apt.appointmentId)})
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      apt.status === 'Completed'
                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                        : apt.status === 'In Consultation'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : apt.status === 'Checked In'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : apt.status === 'Confirmed'
                                        ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                                        : apt.status === 'Cancelled'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {apt.status}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Attending Practitioner</span>
                                  <p className="font-bold text-slate-800">{apt.doctorName}</p>
                                  <p className="text-[11px] text-slate-500">{apt.doctorSpecialization}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Visit Reason</span>
                                  <p className="text-slate-700 font-serif italic">{apt.reasonForVisit || 'Routine Checkup'}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Type & Contact</span>
                                  <p className="font-semibold text-slate-700">{apt.type}</p>
                                  <p className="text-[11px] font-mono text-slate-500">{apt.patientPhone}</p>
                                </div>
                              </div>

                              {/* Card Action Buttons */}
                              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  {apt.status === 'Scheduled' && (
                                    <button
                                      onClick={() => handleStatusTransition(apt._id, 'Confirmed')}
                                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 border border-blue-200 text-xs font-bold cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                  )}

                                  {(apt.status === 'Scheduled' || apt.status === 'Confirmed') && (
                                    <button
                                      onClick={() => handleStatusTransition(apt._id, 'Checked In')}
                                      className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" /> Check In
                                    </button>
                                  )}

                                  {apt.status === 'Checked In' && (
                                    <button
                                      onClick={() => handleStatusTransition(apt._id, 'In Consultation')}
                                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current" /> Start Consultation
                                    </button>
                                  )}

                                  {apt.status === 'In Consultation' && (
                                    <button
                                      onClick={() => handleStatusTransition(apt._id, 'Completed')}
                                      className="px-3 py-1 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete Visit
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 text-xs">
                                  <button
                                    onClick={() => setViewDetailAppt(apt)}
                                    className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer flex items-center gap-1"
                                    title="View Timeline Details"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-500" /> Details
                                  </button>
                                  <button
                                    onClick={() => setRescheduleAppt(apt)}
                                    className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer flex items-center gap-1"
                                    title="Reschedule / Edit"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Reschedule
                                  </button>
                                  {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                                    <>
                                      <button
                                        onClick={() => setCancelTargetAppt(apt)}
                                        className="px-2 py-1 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                                        title="Cancel Appointment"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleStatusTransition(apt._id, 'No Show')}
                                        className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                                        title="Mark No Show"
                                      >
                                        No Show
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-base font-serif font-bold text-slate-700">No Appointments Scheduled for {selectedDate}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    There are currently no bookings for this date matching your active filters. Click below to schedule a patient encounter.
                  </p>
                  <button
                    onClick={() => {
                      setBookingForm((prev) => ({ ...prev, date: selectedDate }));
                      setIsBookModalOpen(true);
                    }}
                    className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-white" /> BOOK NEW APPOINTMENT
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="glass-panel overflow-hidden border-slate-200/80 bg-white shadow-sm">
              <table className="w-full text-left text-xs font-sans text-[#0F172A]">
                <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="p-3.5">TOKEN #</th>
                    <th className="p-3.5">APPOINTMENT ID & PATIENT</th>
                    <th className="p-3.5">ATTENDING DOCTOR</th>
                    <th className="p-3.5">TIME & TYPE</th>
                    <th className="p-3.5">STATUS</th>
                    <th className="p-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((apt: any) => (
                    <tr key={apt._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-[#2563EB]">
                        #{String(apt.tokenNumber).padStart(2, '0')}
                      </td>
                      <td className="p-3.5">
                        <p className="font-serif font-bold text-sm text-[#0F172A]">{apt.patientName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{apt.appointmentId} • {apt.patientPhone}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-[#0F172A]">{apt.doctorName}</p>
                        <p className="text-[11px] text-slate-500">{apt.reasonForVisit || 'Consultation'}</p>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-[#2563EB]">{apt.timeSlot}</span>
                        <p className="text-[11px] text-slate-500">{apt.type}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200">
                          {apt.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button onClick={() => setViewDetailAppt(apt)} className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* WEEK / MONTH VIEW PLACEHOLDER GRIDS */}
          {(viewMode === 'week' || viewMode === 'month') && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <CalendarIcon className="w-5 h-5 text-[#2563EB]" /> Calendar Density Map ({selectedDate})
              </h3>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono font-bold">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="p-2 bg-slate-100 rounded-lg text-slate-600 uppercase text-[10px]">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 font-mono text-xs">
                {Array.from({ length: viewMode === 'week' ? 7 : 31 }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const targetDateStr = `${selectedDate.substring(0, 8)}${String(dayNum).padStart(2, '0')}`;
                  const count = allAppointments.filter((a: any) => a.date === targetDateStr).length;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(targetDateStr);
                        setViewMode('day');
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer min-h-[70px] flex flex-col justify-between ${
                        targetDateStr === selectedDate
                          ? 'border-[#2563EB] bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-slate-700">{dayNum}</span>
                      {count > 0 ? (
                        <span className="text-[10px] font-bold text-white bg-[#2563EB] px-2 py-0.5 rounded-full w-fit">
                          {count} Appts
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Free</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. TODAY'S LIVE QUEUE SIDEBAR (1 Col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm space-y-4">
            <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" /> Today's Live Queue
              </span>
              <span className="text-xs font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                {liveQueueList.length} Active
              </span>
            </h3>

            {liveQueueList.length > 0 ? (
              <div className="space-y-3">
                {liveQueueList.map((apt: any) => (
                  <div
                    key={apt._id}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      apt.status === 'In Consultation'
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                        : 'bg-amber-50/70 border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-sm text-[#0F172A]">
                        #{String(apt.tokenNumber).padStart(2, '0')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'In Consultation' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <div>
                      <p className="font-serif font-bold text-sm text-[#0F172A]">{apt.patientName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Dr. {apt.doctorName.replace('Dr. ', '')}</p>
                    </div>

                    {apt.status === 'Checked In' && (
                      <div className="flex items-center justify-between text-[11px] text-amber-900 font-mono pt-1 border-t border-amber-200">
                        <span>Waiting Time:</span>
                        <strong className="font-bold text-amber-800">{calculateWaitTime(apt.timestamps?.checkedInAt)}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                No patients currently waiting or in consultation.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: BOOK NEW APPOINTMENT */}
      {isBookModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A]">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#2563EB]" /> Book Patient Appointment
                </h3>
                <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBookSubmit} className="p-6 space-y-4 text-xs">
                {/* Conflict Alert Banner */}
                {bookingConflict && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Doctor Unavailable at this Time</p>
                      <p className="text-[11px] text-rose-700">
                        Selected doctor already has a booked appointment for {bookingForm.date} at {bookingForm.timeSlot}. Please choose a different time slot.
                      </p>
                    </div>
                  </div>
                )}

                {/* Patient Selector or Inline New Patient Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Patient *</label>
                    <button
                      type="button"
                      onClick={() => setBookingForm({ ...bookingForm, isInlineNewPatient: !bookingForm.isInlineNewPatient })}
                      className="text-xs text-[#2563EB] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {bookingForm.isInlineNewPatient ? 'Select Existing Patient' : '+ Add New Patient'}
                    </button>
                  </div>

                  {!bookingForm.isInlineNewPatient ? (
                    <select
                      required
                      value={bookingForm.patientId}
                      onChange={(e) => setBookingForm({ ...bookingForm, patientId: e.target.value })}
                      className="w-full glass-input text-xs"
                    >
                      <option value="">-- Select Registered Patient --</option>
                      {allPatients.map((p: any) => {
                        const pId = p._id || p.id || p.patientId;
                        return (
                          <option key={pId} value={pId}>
                            {p.name} ({p.patientId || pId} • {p.phone})
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <input
                        type="text"
                        placeholder="Full Patient Name *"
                        required
                        value={bookingForm.newPatientName}
                        onChange={(e) => setBookingForm({ ...bookingForm, newPatientName: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={bookingForm.newPatientPhone}
                          onChange={(e) => setBookingForm({ ...bookingForm, newPatientPhone: e.target.value })}
                          className="glass-input text-xs font-mono"
                        />
                        <select
                          value={bookingForm.newPatientGender}
                          onChange={(e) => setBookingForm({ ...bookingForm, newPatientGender: e.target.value })}
                          className="glass-input text-xs"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Age"
                          value={bookingForm.newPatientAge}
                          onChange={(e) => setBookingForm({ ...bookingForm, newPatientAge: Number(e.target.value) })}
                          className="glass-input text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Doctor Selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attending Doctor *</label>
                  <select
                    required
                    value={bookingForm.doctorId}
                    onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                    className="w-full glass-input text-xs"
                  >
                    {allDoctors
                      .filter((doc: any) => (doc.status || '').toLowerCase() === 'active')
                      .map((doc: any) => {
                        const dId = doc._id || doc.id;
                        return (
                          <option key={dId} value={dId}>
                            {doc.name} ({doc.specialization}) - ₹{doc.consultationFee}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* Date & Time Slot Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Appointment Date *</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Time Slot *</label>
                    <select
                      value={bookingForm.timeSlot}
                      onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Type & Reason */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Appointment Type</label>
                    <select
                      value={bookingForm.type}
                      onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
                      className="w-full glass-input text-xs"
                    >
                      <option value="In-person">In-person</option>
                      <option value="Video consultation">Video consultation</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="New consultation">New consultation</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Reason for Visit</label>
                    <input
                      type="text"
                      placeholder="e.g. Fever, Routine checkup"
                      value={bookingForm.reasonForVisit}
                      onChange={(e) => setBookingForm({ ...bookingForm, reasonForVisit: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                  <button type="button" onClick={() => setIsBookModalOpen(false)} className="btn-secondary text-xs py-2 px-4 cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingConflict}
                    className={`btn-gold text-xs py-2 px-5 cursor-pointer font-bold ${
                      bookingConflict ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-[#2563EB] text-white shadow-md'
                    }`}
                  >
                    Confirm & Issue Token
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 2: VIEW DETAILS & TIMELINE */}
      {viewDetailAppt &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A]">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#2563EB]" /> Appointment Details & Lifecycle
                </h3>
                <button onClick={() => setViewDetailAppt(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Patient Information</span>
                  <p className="font-bold text-sm text-[#0F172A]">{viewDetailAppt.patientName}</p>
                  <p className="font-mono text-slate-500">
                    {typeof viewDetailAppt.patientId === 'object' ? (viewDetailAppt.patientId?.patientId || viewDetailAppt.patientId?._id || viewDetailAppt.patientName) : viewDetailAppt.patientId} • Phone: {viewDetailAppt.patientPhone}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Appointment Metadata</span>
                  <p className="font-bold text-[#0F172A]">Token #{String(viewDetailAppt.tokenNumber).padStart(2, '0')} ({viewDetailAppt.appointmentId})</p>
                  <p className="font-mono text-slate-600">Date: {viewDetailAppt.date} at {viewDetailAppt.timeSlot}</p>
                  <p className="text-slate-600">Doctor: <strong>{viewDetailAppt.doctorName}</strong> ({viewDetailAppt.doctorSpecialization})</p>
                </div>

                {/* Timeline Box */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Appointment Timeline</span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-[11px]">
                    {(() => {
                      const fmtTs = (iso?: string) => {
                        if (!iso) return '—';
                        try {
                          return new Date(iso).toLocaleString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          });
                        } catch { return iso; }
                      };
                      const appt = viewDetailAppt;
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Booked:</span>
                            <strong className="text-slate-800">{fmtTs(appt.bookedAt || appt.createdAt)}</strong>
                          </div>
                          {appt.checkedInAt && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Checked In:</span>
                              <strong className="text-amber-600">{fmtTs(appt.checkedInAt)}</strong>
                            </div>
                          )}
                          {appt.consultationStartedAt && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Consultation Started:</span>
                              <strong className="text-emerald-600">{fmtTs(appt.consultationStartedAt)}</strong>
                            </div>
                          )}
                          {appt.completedAt && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Visit Completed:</span>
                              <strong className="text-purple-600">{fmtTs(appt.completedAt)}</strong>
                            </div>
                          )}
                          {appt.cancelledAt && (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Cancelled:</span>
                                <strong className="text-red-500">{fmtTs(appt.cancelledAt)}</strong>
                              </div>
                              {appt.cancellationReason && (
                                <div className="text-slate-500 italic truncate pl-2">
                                  Reason: {appt.cancellationReason}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="pt-3 flex justify-end border-t border-slate-200">
                  <button onClick={() => setViewDetailAppt(null)} className="btn-secondary text-xs py-1.5 px-4 cursor-pointer">
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 3: RESCHEDULE / EDIT */}
      {rescheduleAppt &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A]">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#2563EB]" /> Reschedule Appointment
                </h3>
                <button onClick={() => setRescheduleAppt(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4 text-xs">
                {rescheduleConflict && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                    Doctor is unavailable at this target time slot.
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Date *</label>
                  <input
                    type="date"
                    required
                    value={rescheduleForm.date}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                    className="w-full glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Time Slot *</label>
                  <select
                    value={rescheduleForm.timeSlot}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, timeSlot: e.target.value })}
                    className="w-full glass-input text-xs font-mono"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doctor *</label>
                  <select
                    value={rescheduleForm.doctorId}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, doctorId: e.target.value })}
                    className="w-full glass-input text-xs"
                  >
                    {allDoctors.map((doc: any) => {
                      const dId = doc._id || doc.id;
                      return (
                        <option key={dId} value={dId}>
                          {doc.name} ({doc.specialization})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                  <button type="button" onClick={() => setRescheduleAppt(null)} className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rescheduleConflict}
                    className="btn-gold text-xs py-1.5 px-4 cursor-pointer bg-[#2563EB] text-white font-bold"
                  >
                    Save Reschedule
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 4: CANCEL CONFIRMATION */}
      {cancelTargetAppt &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A]">
              <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Ban className="w-5 h-5 text-white" /> Cancel Appointment
                </h3>
                <button onClick={() => setCancelTargetAppt(null)} className="text-rose-200 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-700">
                  Are you sure you want to cancel the appointment for <strong className="text-[#0F172A]">{cancelTargetAppt.patientName}</strong>?
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
                  <input
                    type="text"
                    placeholder="Patient unavailable, Doctor emergency..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                  <button type="button" onClick={() => setCancelTargetAppt(null)} className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
                    Keep Appointment
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className="btn-gold text-xs py-1.5 px-4 cursor-pointer bg-rose-600 text-white font-bold"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
