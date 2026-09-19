import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Stethoscope,
  Plus,
  Search,
  IndianRupee,
  Calendar,
  Clock,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Loader2,
  X,
  Award,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Ban,
  ShieldCheck,
  UserCheck,
  FileText,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  storageService,
  getTodayLocalDateStr,
  getLocalDateStrFromISO
} from '../services/storageService';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DoctorsPage: React.FC = () => {
  const { clinic } = useAuth();
  const todayStr = getTodayLocalDateStr();

  // Get Today Day Abbreviation e.g. 'Thu'
  const todayDayAbbr = useMemo(() => {
    const d = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[d.getDay()];
  }, []);

  // Filter & Search State
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editDoctor, setEditDoctor] = useState<any | null>(null);
  const [viewDoctor, setViewDoctor] = useState<any | null>(null);
  const [scheduleDoctor, setScheduleDoctor] = useState<any | null>(null);
  const [deleteTargetDoctor, setDeleteTargetDoctor] = useState<any | null>(null);

  // Live Refresh Trigger State
  const [rawDoctors, setRawDoctors] = useState<any[]>([]);
  const [rawAppointments, setRawAppointments] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const refreshData = () => setRefreshKey((prev) => prev + 1);

  // Fetch MongoDB Datasets
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      const [docs, appts] = await Promise.all([
        storageService.fetchDoctors(),
        storageService.fetchAppointments()
      ]);
      if (isMounted) {
        setRawDoctors(docs);
        setRawAppointments(appts);
      }
    };
    loadAll();
    return () => { isMounted = false; };
  }, [refreshKey]);

  // Unique Departments List
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    rawDoctors.forEach((d: any) => {
      if (d.departmentName) set.add(d.departmentName);
      if (d.specialization) set.add(d.specialization);
    });
    return Array.from(set);
  }, [rawDoctors]);

  // Synchronized Multi-Faceted Filtered Doctors List
  const filteredDoctors = useMemo(() => {
    return rawDoctors.filter((doc: any) => {
      // Status filter
      if (statusFilter === 'active' && doc.status !== 'active') return false;
      if (statusFilter === 'inactive' && doc.status === 'active') return false;

      // Department filter
      if (deptFilter !== 'all') {
        if (doc.departmentName !== deptFilter && doc.specialization !== deptFilter) return false;
      }

      // Availability filter
      if (availabilityFilter === 'available_today') {
        if (!doc.availableDays?.includes(todayDayAbbr) || doc.status !== 'active') return false;
      } else if (availabilityFilter === 'not_available') {
        if (doc.availableDays?.includes(todayDayAbbr) && doc.status === 'active') return false;
      }

      // Search query
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const name = (doc.name || '').toLowerCase();
        const docId = (doc.doctorId || '').toLowerCase();
        const spec = (doc.specialization || '').toLowerCase();
        const dept = (doc.departmentName || '').toLowerCase();
        const email = (doc.email || '').toLowerCase();
        const phone = (doc.phone || '').toLowerCase();
        if (
          !name.includes(q) &&
          !docId.includes(q) &&
          !spec.includes(q) &&
          !dept.includes(q) &&
          !email.includes(q) &&
          !phone.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [rawDoctors, statusFilter, deptFilter, availabilityFilter, search, todayDayAbbr]);

  // Summary Metrics Calculation
  const metrics = useMemo(() => {
    const total = rawDoctors.length;
    const active = rawDoctors.filter((d: any) => d.status === 'active' || !d.status).length;
    const inactive = rawDoctors.filter((d: any) => d.status === 'inactive').length;
    const uniqueSpecs = new Set(rawDoctors.map((d: any) => d.specialization)).size;
    const availableToday = rawDoctors.filter(
      (d: any) => (d.status === 'active' || !d.status) && d.availableDays?.includes(todayDayAbbr)
    ).length;

    return { total, active, inactive, uniqueSpecs, availableToday };
  }, [rawDoctors, todayDayAbbr]);

  // Form State for Add / Edit Doctor
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phone: '',
    qualification: '',
    specialization: '',
    departmentName: '',
    experienceYears: 8,
    registrationNumber: '',
    consultationFee: 800,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    openTime: '09:00',
    closeTime: '17:00',
    status: 'active'
  });

  const [formError, setFormError] = useState<string>('');

  const openAddModal = () => {
    setFormValues({
      name: '',
      email: '',
      phone: '',
      qualification: 'MD, MBBS',
      specialization: 'General Medicine',
      departmentName: 'Internal Medicine',
      experienceYears: 8,
      registrationNumber: `REG-MC-${Math.floor(1000 + Math.random() * 9000)}`,
      consultationFee: 800,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      openTime: '09:00',
      closeTime: '17:00',
      status: 'active'
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (doc: any) => {
    setEditDoctor(doc);
    setFormValues({
      name: doc.name || '',
      email: doc.email || '',
      phone: doc.phone || '',
      qualification: doc.qualification || 'MD, MBBS',
      specialization: doc.specialization || '',
      departmentName: doc.departmentName || doc.specialization || 'General Medicine',
      experienceYears: doc.experienceYears || 5,
      registrationNumber: doc.registrationNumber || `REG-MC-${Math.floor(1000 + Math.random() * 9000)}`,
      consultationFee: doc.consultationFee || 800,
      availableDays: doc.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      openTime: doc.workingHours?.openTime || '09:00',
      closeTime: doc.workingHours?.closeTime || '17:00',
      status: doc.status || 'active'
    });
    setFormError('');
  };

  const handleSaveDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formValues.name || !formValues.email || !formValues.phone || !formValues.specialization) {
      setFormError('Please fill out all required fields marked with *');
      return;
    }

    if (formValues.availableDays.length === 0) {
      setFormError('Doctor must be assigned at least one working day');
      return;
    }

    if (formValues.consultationFee < 0 || formValues.experienceYears < 0) {
      setFormError('Consultation fee and experience years cannot be negative');
      return;
    }

    const docName = formValues.name.startsWith('Dr.') ? formValues.name : `Dr. ${formValues.name}`;

    try {
      if (editDoctor) {
        // Update existing doctor
        const updated = {
          ...editDoctor,
          name: docName,
          email: formValues.email,
          phone: formValues.phone,
          qualification: formValues.qualification,
          specialization: formValues.specialization,
          departmentName: formValues.departmentName,
          experienceYears: Number(formValues.experienceYears),
          registrationNumber: formValues.registrationNumber,
          consultationFee: Number(formValues.consultationFee),
          availableDays: formValues.availableDays,
          workingHours: { openTime: formValues.openTime, closeTime: formValues.closeTime },
          status: formValues.status
        };
        await storageService.updateDoctor(updated);
        setEditDoctor(null);
      } else {
        // Create new doctor
        const newDoc = {
          doctorId: `DOC-2026-${String(rawDoctors.length + 1).padStart(3, '0')}`,
          name: docName,
          email: formValues.email,
          phone: formValues.phone,
          qualification: formValues.qualification,
          specialization: formValues.specialization,
          departmentName: formValues.departmentName,
          experienceYears: Number(formValues.experienceYears),
          registrationNumber: formValues.registrationNumber,
          consultationFee: Number(formValues.consultationFee),
          availableDays: formValues.availableDays,
          workingHours: { openTime: formValues.openTime, closeTime: formValues.closeTime },
          status: 'active'
        };
        await storageService.saveDoctor(newDoc);
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save doctor. Please try again.';
      setFormError(msg);
      return;
    }

    refreshData();
  };

  // Toggle Doctor Active / Inactive Status
  const handleToggleStatus = async (doc: any) => {
    const newStatus = doc.status === 'active' || !doc.status ? 'inactive' : 'active';
    try {
      await storageService.updateDoctor({ ...doc, status: newStatus });
    } catch (err) {
      console.error('Failed to toggle doctor status:', err);
    }
    refreshData();
  };

  // Confirm Delete Doctor
  const handleConfirmDelete = async () => {
    if (deleteTargetDoctor) {
      try {
        await storageService.deleteDoctor(deleteTargetDoctor._id);
      } catch (err) {
        console.error('Failed to delete doctor:', err);
      }
      setDeleteTargetDoctor(null);
      refreshData();
    }
  };

  // Doctor Profile Consultation Statistics Generator
  const getDoctorStats = (doc: any) => {
    const docAppts = rawAppointments.filter((a: any) => {
      const aDocId = typeof a.doctorId === 'object' ? a.doctorId?._id : a.doctorId;
      return aDocId === doc._id || a.doctorName === doc.name;
    });
    const todayCount = docAppts.filter((a: any) => a.date === todayStr).length;
    const upcomingCount = docAppts.filter((a: any) => a.date >= todayStr && a.status === 'Scheduled').length;
    const completedCount = docAppts.filter((a: any) => a.status === 'Completed').length;
    const cancelledCount = docAppts.filter((a: any) => a.status === 'Cancelled').length;
    const recentAppts = docAppts.slice(0, 4);

    return { totalAppts: docAppts.length, todayCount, upcomingCount, completedCount, cancelledCount, recentAppts };
  };

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#2563EB]" /> Doctor Profiles & Practitioner Directory
          </h1>
          <p className="page-subtitle mt-1">
            Medical practitioner directory, credentials, working schedule management, consultation fees, and active rosters for {clinic?.name || 'ClinicFlow Practice'}.
          </p>
        </div>

        <button onClick={openAddModal} className="btn-gold shrink-0">
          <Plus className="w-4 h-4 text-white" /> + ADD DOCTOR PROFILE
        </button>
      </div>

      {/* 2. Summary Dashboard Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="glass-panel p-4 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Doctors</span>
          <p className="text-2xl font-serif font-bold text-[#0F172A] mt-1 font-mono">{metrics.total}</p>
        </div>

        <div className="glass-panel p-4 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Active Doctors</span>
          <p className="text-2xl font-serif font-bold text-emerald-600 mt-1 font-mono">{metrics.active}</p>
        </div>

        <div className="glass-panel p-4 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Inactive Doctors</span>
          <p className="text-2xl font-serif font-bold text-slate-600 mt-1 font-mono">{metrics.inactive}</p>
        </div>

        <div className="glass-panel p-4 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Specialties</span>
          <p className="text-2xl font-serif font-bold text-[#2563EB] mt-1 font-mono">{metrics.uniqueSpecs}</p>
        </div>

        <div className="glass-panel p-4 border-slate-200/80 bg-white shadow-sm text-center">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Available Today ({todayDayAbbr})</span>
          <p className="text-2xl font-serif font-bold text-purple-600 mt-1 font-mono">{metrics.availableToday}</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="glass-panel p-4 border-slate-200/80 bg-white shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, specialty, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="all">All Doctor Statuses</option>
              <option value="active">Active Doctors Only</option>
              <option value="inactive">Inactive Doctors</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="all">All Departments / Specialties</option>
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="all">All Availability</option>
              <option value="available_today">Available Today ({todayDayAbbr})</option>
              <option value="not_available">Not Available Today</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Doctors Cards Grid */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc: any) => {
            const isAvailableToday = (doc.status === 'active' || !doc.status) && doc.availableDays?.includes(todayDayAbbr);

            return (
              <div
                key={doc._id}
                className="glass-panel p-6 border-slate-200/80 bg-white space-y-4 flex flex-col justify-between shadow-sm hover:border-blue-300 transition"
              >
                <div className="space-y-3">
                  {/* Identity Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] font-serif font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
                        {(doc.name || 'Doctor').replace(/^Dr\.\s*/i, '').charAt(0) || 'D'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-serif font-bold text-[#0F172A] text-base">{doc.name}</h3>
                        </div>
                        <p className="text-xs text-[#2563EB] font-semibold">{doc.specialization}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.doctorId || 'DOC-2026-000'}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                        doc.status === 'active' || !doc.status
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {doc.status || 'Active'}
                    </span>
                  </div>

                  {/* Professional Details Box */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Qualification:</span>
                      <span className="text-[#0F172A] font-bold font-serif">{doc.qualification || 'MD, MBBS'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="text-[#0F172A] font-bold">{doc.departmentName || doc.specialization}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500 font-sans">Medical License Reg #:</span>
                      <span className="text-slate-700 font-bold">{doc.registrationNumber || 'REG-MC-9921'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Experience:</span>
                      <span className="text-[#0F172A] font-bold">{doc.experienceYears || 5} Years</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
                      <span className="text-slate-500 font-sans">Consultation Fee:</span>
                      <span className="text-[#2563EB] font-bold text-sm">₹{doc.consultationFee}</span>
                    </div>
                  </div>

                  {/* Schedule Strip */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Working Schedule</span>
                      <span className="text-[10px] font-mono font-bold text-slate-600">
                        {doc.workingHours?.openTime || '09:00'} – {doc.workingHours?.closeTime || '17:00'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {DAYS_SHORT.map((day) => {
                        const isWorking = doc.availableDays?.includes(day);
                        return (
                          <span
                            key={day}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              isWorking
                                ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                                : 'bg-slate-100 text-slate-300 opacity-60'
                            }`}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Contact & Actions Footer */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono truncate">
                    <span className="truncate mr-2" title={doc.email}><Mail className="w-3 h-3 inline mr-1 text-slate-400" />{doc.email}</span>
                    <span className="shrink-0"><Phone className="w-3 h-3 inline mr-1 text-slate-400" />{doc.phone}</span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewDoctor(doc)}
                        className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 font-medium cursor-pointer flex items-center gap-1"
                        title="View Profile & Stats"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" /> View
                      </button>
                      <button
                        onClick={() => openEditModal(doc)}
                        className="px-2 py-1 rounded-lg hover:bg-blue-50 text-[#2563EB] font-medium cursor-pointer flex items-center gap-1"
                        title="Edit Doctor Profile"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#2563EB]" /> Edit
                      </button>
                      <button
                        onClick={() => setScheduleDoctor(doc)}
                        className="px-2 py-1 rounded-lg hover:bg-purple-50 text-purple-700 font-medium cursor-pointer flex items-center gap-1"
                        title="Manage Working Schedule"
                      >
                        <Clock className="w-3.5 h-3.5 text-purple-600" /> Schedule
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(doc)}
                        className={`px-2 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                          doc.status === 'active' || !doc.status
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                        title={doc.status === 'active' ? 'Deactivate Doctor' : 'Activate Doctor'}
                      >
                        {doc.status === 'active' || !doc.status ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setDeleteTargetDoctor(doc)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                        title="Delete Doctor Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 glass-panel space-y-3">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-serif font-bold text-slate-700">No Doctors Match Your Filters</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your search query or department filters, or click below to add a new doctor profile.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setDeptFilter('all');
                setAvailabilityFilter('all');
              }}
              className="btn-secondary text-xs py-2 px-4 cursor-pointer"
            >
              Clear Filters
            </button>
            <button onClick={openAddModal} className="btn-gold text-xs py-2 px-4 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold">
              + ADD DOCTOR PROFILE
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT DOCTOR PORTAL MODAL */}
      {(isAddModalOpen || editDoctor) &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A] max-h-[90vh] flex flex-col">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#2563EB]" /> {editDoctor ? 'Edit Doctor Profile' : 'Add New Doctor Profile'}
                </h3>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditDoctor(null);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDoctorSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Personal Information */}
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-serif font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5 uppercase tracking-wider">
                    1. Personal Information
                  </h4>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name (with Dr. prefix) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Sarah Connor"
                      value={formValues.name}
                      onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="sarah@democlinic.com"
                        value={formValues.email}
                        onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98765 11111"
                        value={formValues.phone}
                        onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                        className="w-full glass-input text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Professional Details */}
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-serif font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5 uppercase tracking-wider">
                    2. Professional Credentials & Licensing
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Specialization *</label>
                      <input
                        type="text"
                        required
                        placeholder="Cardiology & Internal Medicine"
                        value={formValues.specialization}
                        onChange={(e) => setFormValues({ ...formValues, specialization: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Department</label>
                      <input
                        type="text"
                        placeholder="Cardiology"
                        value={formValues.departmentName}
                        onChange={(e) => setFormValues({ ...formValues, departmentName: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
                      <input
                        type="text"
                        placeholder="MD, DM Cardiology"
                        value={formValues.qualification}
                        onChange={(e) => setFormValues({ ...formValues, qualification: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={formValues.experienceYears}
                        onChange={(e) => setFormValues({ ...formValues, experienceYears: Number(e.target.value) })}
                        className="w-full glass-input text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Consultation Fee (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formValues.consultationFee}
                        onChange={(e) => setFormValues({ ...formValues, consultationFee: Number(e.target.value) })}
                        className="w-full glass-input text-xs font-mono font-bold text-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Medical Registration / License #</label>
                    <input
                      type="text"
                      placeholder="REG-MC-9921"
                      value={formValues.registrationNumber}
                      onChange={(e) => setFormValues({ ...formValues, registrationNumber: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Section 3: Availability & Hours */}
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-serif font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5 uppercase tracking-wider">
                    3. Weekly Availability & Hours
                  </h4>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Working Days</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_SHORT.map((day) => {
                        const checked = formValues.availableDays.includes(day);
                        return (
                          <label key={day} className="flex items-center gap-1 cursor-pointer font-mono text-xs">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormValues({ ...formValues, availableDays: [...formValues.availableDays, day] });
                                } else {
                                  setFormValues({
                                    ...formValues,
                                    availableDays: formValues.availableDays.filter((d) => d !== day)
                                  });
                                }
                              }}
                              className="w-3.5 h-3.5 accent-[#2563EB]"
                            />
                            <span>{day}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 font-sans">Start Working Hour</label>
                      <input
                        type="time"
                        value={formValues.openTime}
                        onChange={(e) => setFormValues({ ...formValues, openTime: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 font-sans">End Working Hour</label>
                      <input
                        type="time"
                        value={formValues.closeTime}
                        onChange={(e) => setFormValues({ ...formValues, closeTime: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditDoctor(null);
                    }}
                    className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer bg-[#2563EB] text-white font-bold shadow-md">
                    {editDoctor ? 'Save Changes' : 'ADD DOCTOR'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 2: VIEW DOCTOR PROFILE & CONSULTATION METRICS */}
      {viewDoctor &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A] max-h-[90vh] flex flex-col">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#2563EB]" /> Doctor Profile & Clinical Record
                </h3>
                <button onClick={() => setViewDoctor(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const stats = getDoctorStats(viewDoctor);
                return (
                  <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
                    {/* Identity Header */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] font-serif font-bold flex items-center justify-center text-xl shadow-sm">
                          {viewDoctor.name.replace(/^Dr\.\s*/i, '').charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-lg font-serif font-bold text-[#0F172A]">{viewDoctor.name}</h2>
                          <p className="text-xs text-[#2563EB] font-bold">{viewDoctor.specialization}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{viewDoctor.doctorId || 'DOC-2026-001'} • Reg #: {viewDoctor.registrationNumber || 'REG-MC-9921'}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl block">
                          Fee: ₹{viewDoctor.consultationFee}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Status: {viewDoctor.status || 'Active'}</span>
                      </div>
                    </div>

                    {/* Performance Metrics Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Today's Appts</span>
                        <p className="text-xl font-serif font-bold text-[#2563EB] mt-0.5 font-mono">{stats.todayCount}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Upcoming</span>
                        <p className="text-xl font-serif font-bold text-[#0F172A] mt-0.5 font-mono">{stats.upcomingCount}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">Completed</span>
                        <p className="text-xl font-serif font-bold text-emerald-700 mt-0.5 font-mono">{stats.completedCount}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-800 uppercase block">Cancelled</span>
                        <p className="text-xl font-serif font-bold text-rose-700 mt-0.5 font-mono">{stats.cancelledCount}</p>
                      </div>
                    </div>

                    {/* Schedule Details */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <h4 className="font-serif font-bold text-slate-800 text-xs border-b border-slate-200 pb-1 uppercase tracking-wider">
                        Weekly Working Schedule
                      </h4>
                      <p className="font-mono text-xs">
                        Working Days: <strong className="text-[#2563EB]">{viewDoctor.availableDays?.join(', ') || 'Mon–Fri'}</strong>
                      </p>
                      <p className="font-mono text-xs">
                        Daily Hours: <strong className="text-slate-800">{viewDoctor.workingHours?.openTime || '09:00'} AM – {viewDoctor.workingHours?.closeTime || '17:00'} PM</strong>
                      </p>
                    </div>

                    {/* Recent Consultations Table */}
                    <div>
                      <h4 className="font-serif font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5 uppercase tracking-wider mb-2">
                        Recent Patient Consultation Appointments ({stats.recentAppts.length})
                      </h4>
                      {stats.recentAppts.length > 0 ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs font-sans">
                            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-2.5">Date</th>
                                <th className="p-2.5">Patient Name</th>
                                <th className="p-2.5">Time Slot</th>
                                <th className="p-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {stats.recentAppts.map((a: any) => (
                                <tr key={a._id} className="bg-white">
                                  <td className="p-2.5 font-mono font-bold text-[#2563EB]">{a.date}</td>
                                  <td className="p-2.5 font-bold text-[#0F172A]">{a.patientName}</td>
                                  <td className="p-2.5 font-mono">{a.timeSlot}</td>
                                  <td className="p-2.5">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200">
                                      {a.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-xl font-mono text-xs">
                          No clinical consultations recorded for this practitioner yet.
                        </p>
                      )}
                    </div>

                    <div className="pt-3 flex justify-end border-t border-slate-200 shrink-0">
                      <button onClick={() => setViewDoctor(null)} className="btn-secondary text-xs py-1.5 px-4 cursor-pointer">
                        Close Profile
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 3: SCHEDULE EDITOR MODAL */}
      {scheduleDoctor &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A]">
              <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-300" /> Working Schedule & Hours
                </h3>
                <button onClick={() => setScheduleDoctor(null)} className="text-purple-300 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  storageService.updateDoctor(scheduleDoctor);
                  setScheduleDoctor(null);
                  refreshData();
                }}
                className="p-6 space-y-4 text-xs"
              >
                <div>
                  <span className="font-bold text-[#0F172A] block text-sm">{scheduleDoctor.name}</span>
                  <span className="text-[#2563EB] font-semibold">{scheduleDoctor.specialization}</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-2">Configure Available Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_SHORT.map((day) => {
                      const checked = scheduleDoctor.availableDays?.includes(day);
                      return (
                        <label key={day} className="flex items-center gap-1.5 cursor-pointer font-mono text-xs p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const updatedDays = e.target.checked
                                ? [...(scheduleDoctor.availableDays || []), day]
                                : (scheduleDoctor.availableDays || []).filter((d: string) => d !== day);
                              setScheduleDoctor({ ...scheduleDoctor, availableDays: updatedDays });
                            }}
                            className="w-4 h-4 accent-[#2563EB]"
                          />
                          <span>{day}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 font-sans">Opening Hour</label>
                    <input
                      type="time"
                      value={scheduleDoctor.workingHours?.openTime || '09:00'}
                      onChange={(e) =>
                        setScheduleDoctor({
                          ...scheduleDoctor,
                          workingHours: { ...scheduleDoctor.workingHours, openTime: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 font-sans">Closing Hour</label>
                    <input
                      type="time"
                      value={scheduleDoctor.workingHours?.closeTime || '17:00'}
                      onChange={(e) =>
                        setScheduleDoctor({
                          ...scheduleDoctor,
                          workingHours: { ...scheduleDoctor.workingHours, closeTime: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                  <button type="button" onClick={() => setScheduleDoctor(null)} className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="btn-gold text-xs py-1.5 px-4 cursor-pointer bg-purple-700 text-white font-bold">
                    Save Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 4: SAFE DELETE CONFIRMATION */}
      {deleteTargetDoctor &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A]">
              <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-white" /> Delete Doctor Profile
                </h3>
                <button onClick={() => setDeleteTargetDoctor(null)} className="text-rose-200 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-700 leading-relaxed">
                  Are you sure you want to delete <strong className="text-[#0F172A]">{deleteTargetDoctor.name}</strong>?
                </p>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <p className="font-bold flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Historical Data Preservation
                  </p>
                  <p>
                    Deleting this doctor profile will remove them from the active practitioner roster. All past patient appointments, prescriptions, invoices, and lab orders will remain safely intact in history.
                  </p>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                  <button type="button" onClick={() => setDeleteTargetDoctor(null)} className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="btn-gold text-xs py-1.5 px-4 cursor-pointer bg-rose-600 text-white font-bold"
                  >
                    Delete Doctor
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
