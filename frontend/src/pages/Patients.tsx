import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Droplet,
  ShieldAlert,
  FileText,
  Upload,
  Eye,
  Loader2,
  X,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Receipt,
  FlaskConical,
  Clock,
  Edit3,
  Trash2,
  UserPlus,
  Filter,
  ArrowRight,
  ShieldCheck,
  Printer,
  ChevronLeft,
  ChevronRight,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import {
  storageService,
  getTodayLocalDateStr,
  getLocalDateStrFromISO
} from '../services/storageService';
import { PrescriptionPdfModal } from '../components/PrescriptionPdfModal';
import { InvoicePdfModal } from '../components/InvoicePdfModal';
import { LabReportPdfModal } from '../components/LabReportPdfModal';
import { useAuth } from '../context/AuthContext';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { clinic } = useAuth();
  const [searchParams] = useSearchParams();
  const todayStr = getTodayLocalDateStr();

  // Query Params
  const queryPatientId = searchParams.get('patientId');

  // Filter & Search State
  const [search, setSearch] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [bloodFilter, setBloodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [balanceFilter, setBalanceFilter] = useState<string>('all');
  const [appointmentFilter, setAppointmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'date'>('name');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Modals State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [editPatient, setEditPatient] = useState<any | null>(null);
  const [viewEhrPatient, setViewEhrPatient] = useState<any | null>(null);
  const [deleteTargetPatient, setDeleteTargetPatient] = useState<any | null>(null);

  // EHR Profile Active Tab
  const [ehrTab, setEhrTab] = useState<'history' | 'appointments' | 'prescriptions' | 'billing' | 'lab' | 'documents' | 'timeline'>('history');

  // Document Upload Input State
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');

  // Preview Modals State
  const [previewRx, setPreviewRx] = useState<any | null>(null);
  const [previewBill, setPreviewBill] = useState<any | null>(null);
  const [previewLab, setPreviewLab] = useState<any | null>(null);

  // Live Data Refresh
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [allPrescriptions, setAllPrescriptions] = useState<any[]>([]);
  const [allBills, setAllBills] = useState<any[]>([]);
  const [allLabOrders, setAllLabOrders] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const refreshData = () => setRefreshKey((prev) => prev + 1);

  // Fetch MongoDB Datasets
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      const [pats, appts, rxs, bills, labs] = await Promise.all([
        storageService.fetchPatients(),
        storageService.fetchAppointments(),
        storageService.fetchPrescriptions(),
        storageService.fetchBills(),
        storageService.fetchLabOrders()
      ]);
      if (isMounted) {
        setAllPatients(pats);
        setAllAppointments(appts);
        setAllPrescriptions(rxs);
        setAllBills(bills);
        setAllLabOrders(labs);
      }
    };
    loadAll();
    return () => { isMounted = false; };
  }, [refreshKey, clinic?._id]);

  // Open profile if patientId query param present
  useEffect(() => {
    if (queryPatientId && allPatients.length > 0) {
      const found = allPatients.find((p: any) => p._id === queryPatientId || p.patientId === queryPatientId);
      if (found) setViewEhrPatient(found);
    }
  }, [queryPatientId, allPatients]);

  // Synchronized Patient Metrics (Last Visit, Next Appt, Outstanding Balance, Total Visits)
  const getPatientSummary = (patientId: string, patientName: string) => {
    const patAppts = allAppointments.filter((a: any) => {
      const aPatId = typeof a.patientId === 'object' ? a.patientId?._id : a.patientId;
      return aPatId === patientId || a.patientName === patientName;
    });
    const completedAppts = patAppts.filter((a: any) => a.status === 'Completed');
    const upcomingAppts = patAppts.filter(
      (a: any) => a.date >= todayStr && (a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'Checked In')
    );

    // Last Visit Date
    const lastVisitDate = completedAppts.length > 0
      ? completedAppts.sort((a: any, b: any) => b.date.localeCompare(a.date))[0].date
      : (patAppts.length > 0 ? patAppts[0].date : 'No visits');

    // Next Appointment Date
    const nextApptDate = upcomingAppts.length > 0
      ? upcomingAppts.sort((a: any, b: any) => a.date.localeCompare(b.date))[0].date
      : 'None scheduled';

    // Outstanding Balance from Billing
    const patBills = allBills.filter(
      (b: any) => b.patientId === patientId || b.patientName === patientName
    );
    const outstandingBalance = patBills.reduce((sum: number, b: any) => sum + (Number(b.balanceDue) || 0), 0);

    return {
      lastVisitDate,
      nextApptDate,
      outstandingBalance,
      totalVisits: completedAppts.length,
      appointments: patAppts,
      prescriptions: allPrescriptions.filter((r: any) => r.patientId === patientId || r.patientName === patientName),
      bills: patBills,
      labOrders: allLabOrders.filter((l: any) => l.patientId === patientId || l.patientName === patientName)
    };
  };

  // Multi-Faceted Filtered Patients List
  const filteredPatients = useMemo(() => {
    return allPatients.filter((p: any) => {
      // Gender Filter
      if (genderFilter !== 'all' && p.gender !== genderFilter) return false;

      // Blood Group Filter
      if (bloodFilter !== 'all' && p.bloodGroup !== bloodFilter) return false;

      // Status Filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      const summary = getPatientSummary(p._id, p.name);

      // Outstanding Balance Filter
      if (balanceFilter === 'has_balance' && summary.outstandingBalance <= 0) return false;

      // Upcoming Appointment Filter
      if (appointmentFilter === 'has_upcoming' && summary.nextApptDate === 'None scheduled') return false;

      // Search Query
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const name = (p.name || '').toLowerCase();
        const patId = (p.patientId || '').toLowerCase();
        const phone = (p.phone || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        if (!name.includes(q) && !patId.includes(q) && !phone.includes(q) && !email.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a: any, b: any) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'id') return (a.patientId || '').localeCompare(b.patientId || '');
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [allPatients, genderFilter, bloodFilter, statusFilter, balanceFilter, appointmentFilter, search, sortBy, allAppointments, allBills, todayStr]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, currentPage, pageSize]);

  // Form State for Register / Edit Patient
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    dob: '1995-06-15',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    street: '',
    city: 'New Delhi',
    state: 'Delhi',
    postalCode: '110001',
    country: 'India',
    emergencyName: '',
    emergencyRel: 'Spouse',
    emergencyPhone: '',
    allergiesStr: '',
    conditionsStr: '',
    medicationsStr: '',
    insuranceProvider: '',
    insurancePolicy: '',
    status: 'active'
  });

  const [formError, setFormError] = useState<string>('');

  // Automatically Calculate Age from DOB
  const calculatedAge = useMemo(() => {
    if (!formValues.dob) return 30;
    try {
      const birth = new Date(formValues.dob);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return Math.max(0, age);
    } catch (e) {
      return 30;
    }
  }, [formValues.dob]);

  const openRegisterModal = () => {
    setFormValues({
      firstName: '',
      lastName: '',
      dob: '1995-06-15',
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '',
      email: '',
      street: 'Suite 101, Ring Road',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
      emergencyName: '',
      emergencyRel: 'Spouse',
      emergencyPhone: '',
      allergiesStr: '',
      conditionsStr: '',
      medicationsStr: '',
      insuranceProvider: 'Star Health',
      insurancePolicy: `SH-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'active'
    });
    setFormError('');
    setIsRegisterModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditPatient(p);
    const names = (p.name || '').split(' ');
    const fName = p.firstName || names[0] || '';
    const lName = p.lastName || names.slice(1).join(' ') || '';

    setFormValues({
      firstName: fName,
      lastName: lName,
      dob: p.dob || '1995-06-15',
      gender: p.gender || 'Male',
      bloodGroup: p.bloodGroup || 'O+',
      phone: p.phone || '',
      email: p.email || '',
      street: p.address?.street || '',
      city: p.address?.city || 'New Delhi',
      state: p.address?.state || 'Delhi',
      postalCode: p.address?.postalCode || '110001',
      country: p.address?.country || 'India',
      emergencyName: p.emergencyContact?.name || '',
      emergencyRel: p.emergencyContact?.relationship || 'Spouse',
      emergencyPhone: p.emergencyContact?.phone || '',
      allergiesStr: p.allergies?.join(', ') || '',
      conditionsStr: p.medicalHistory?.join(', ') || '',
      medicationsStr: p.medications?.join(', ') || '',
      insuranceProvider: p.insurance?.provider || '',
      insurancePolicy: p.insurance?.policyNumber || '',
      status: p.status || 'active'
    });
    setFormError('');
  };

  const handleSavePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formValues.firstName || !formValues.phone) {
      setFormError('Please enter First Name and Phone Number');
      return;
    }

    const fullName = `${formValues.firstName} ${formValues.lastName}`.trim();
    const allergies = formValues.allergiesStr ? formValues.allergiesStr.split(',').map((s) => s.trim()) : [];
    const medicalHistory = formValues.conditionsStr ? formValues.conditionsStr.split(',').map((s) => s.trim()) : [];
    const medications = formValues.medicationsStr ? formValues.medicationsStr.split(',').map((s) => s.trim()) : [];

    try {
      if (editPatient) {
        const updated = {
          ...editPatient,
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          name: fullName,
          dob: formValues.dob,
          age: calculatedAge,
          gender: formValues.gender,
          bloodGroup: formValues.bloodGroup,
          phone: formValues.phone,
          email: formValues.email,
          address: {
            street: formValues.street,
            city: formValues.city,
            state: formValues.state,
            postalCode: formValues.postalCode,
            country: formValues.country
          },
          emergencyContact: {
            name: formValues.emergencyName,
            relationship: formValues.emergencyRel,
            phone: formValues.emergencyPhone
          },
          allergies,
          medicalHistory,
          medications,
          insurance: { provider: formValues.insuranceProvider, policyNumber: formValues.insurancePolicy },
          status: formValues.status
        };
        await storageService.updatePatient(updated);
        setEditPatient(null);
      } else {
        const newPat = {
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          name: fullName,
          dob: formValues.dob,
          age: calculatedAge,
          gender: formValues.gender,
          bloodGroup: formValues.bloodGroup,
          phone: formValues.phone,
          email: formValues.email,
          address: {
            street: formValues.street,
            city: formValues.city,
            state: formValues.state,
            postalCode: formValues.postalCode,
            country: formValues.country
          },
          emergencyContact: {
            name: formValues.emergencyName,
            relationship: formValues.emergencyRel,
            phone: formValues.emergencyPhone
          },
          allergies,
          medicalHistory,
          medications,
          insurance: { provider: formValues.insuranceProvider, policyNumber: formValues.insurancePolicy },
          status: 'active',
          documents: []
        };
        await storageService.savePatient(newPat);
        setIsRegisterModalOpen(false);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save patient. Please try again.';
      setFormError(msg);
      return;
    }

    refreshData();
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetPatient) {
      try {
        await storageService.deletePatient(deleteTargetPatient._id);
      } catch (err) {
        console.error('Failed to delete patient:', err);
      }
      setDeleteTargetPatient(null);
      refreshData();
    }
  };

  // Attach document to EHR Profile
  const handleAttachDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docUrl || !viewEhrPatient) return;

    const newDocs = [
      ...(viewEhrPatient.documents || []),
      { title: docTitle, fileUrl: docUrl, uploadedAt: new Date().toISOString() }
    ];

    const updated = { ...viewEhrPatient, documents: newDocs };
    storageService.updatePatient(updated);
    setViewEhrPatient(updated);
    setDocTitle('');
    setDocUrl('');
    refreshData();
  };

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2563EB]" /> Electronic Health Records (EHR) & Patient Roster
          </h1>
          <p className="page-subtitle mt-1">
            Centralized electronic health records, clinical demographics, allergy monitoring, visit history, billing ledger, and diagnostic documents
          </p>
        </div>

        <button
          onClick={openRegisterModal}
          className="btn-gold shrink-0"
        >
          <Plus className="w-4 h-4 text-white" /> + Register Patient
        </button>
      </div>

      {/* 2. Filter & Search Controls Bar */}
      <div className="glass-panel p-4 border-slate-200/80 bg-white shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient ID, Name, Phone, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-9 text-xs"
            />
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Blood Group Filter */}
          <div>
            <select
              value={bloodFilter}
              onChange={(e) => setBloodFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="all">All Blood Groups</option>
              <option value="O+">O+</option>
              <option value="A+">A+</option>
              <option value="B+">B+</option>
              <option value="AB+">AB+</option>
              <option value="O-">O-</option>
              <option value="A-">A-</option>
              <option value="B-">B-</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full glass-input text-xs font-mono"
            >
              <option value="name">Sort by Name (A-Z)</option>
              <option value="id">Sort by Patient ID</option>
              <option value="date">Sort by Registration Date</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="all">All Account Balances</option>
              <option value="has_balance">Has Outstanding Balance (Unpaid)</option>
            </select>

            <select
              value={appointmentFilter}
              onChange={(e) => setAppointmentFilter(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="all">All Appointments</option>
              <option value="has_upcoming">Has Upcoming Appointment</option>
            </select>
          </div>

          {(search || genderFilter !== 'all' || bloodFilter !== 'all' || balanceFilter !== 'all' || appointmentFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setGenderFilter('all');
                setBloodFilter('all');
                setStatusFilter('all');
                setBalanceFilter('all');
                setAppointmentFilter('all');
              }}
              className="text-xs text-[#2563EB] font-bold hover:underline font-mono"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Patient EHR Directory Table */}
      <div className="glass-panel border-slate-200/80 overflow-hidden bg-white shadow-sm">
        {filteredPatients.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans text-[#0F172A]">
                <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="p-3.5">PATIENT & ID</th>
                    <th className="p-3.5">AGE / GENDER</th>
                    <th className="p-3.5">CONTACT & LOCATION</th>
                    <th className="p-3.5">BLOOD GROUP</th>
                    <th className="p-3.5">LAST VISIT</th>
                    <th className="p-3.5">NEXT APPOINTMENT</th>
                    <th className="p-3.5">STATUS</th>
                    <th className="p-3.5 text-right">EHR ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPatients.map((patient: any) => {
                    const summary = getPatientSummary(patient._id, patient.name);

                    return (
                      <tr key={patient._id} className="hover:bg-slate-50/80 transition">
                        {/* Patient Name & ID */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] font-serif font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                              {patient.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-[#2563EB] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                  {patient.patientId}
                                </span>
                                <span className="font-bold text-sm text-[#0F172A]">{patient.name}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{patient.email || 'No email registered'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Demographics */}
                        <td className="p-3.5">
                          <p className="font-bold text-[#0F172A]">{patient.gender}, {patient.age ? `${patient.age} yrs` : 'N/A'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">DOB: {patient.dob || '1995-06-15'}</p>
                        </td>

                        {/* Contact */}
                        <td className="p-3.5 font-mono">
                          <p className="font-bold text-[#0F172A]">{patient.phone}</p>
                          <p className="text-[10px] text-slate-500 font-sans">{patient.address?.city || 'New Delhi'}, {patient.address?.state || 'Delhi'}</p>
                        </td>

                        {/* Blood Group */}
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                            <Droplet className="w-3 h-3 text-rose-600 fill-current" /> {patient.bloodGroup || 'O+'}
                          </span>
                        </td>

                        {/* Last Visit */}
                        <td className="p-3.5 font-mono text-slate-600">
                          {summary.lastVisitDate}
                        </td>

                        {/* Next Appointment */}
                        <td className="p-3.5 font-mono">
                          {summary.nextApptDate !== 'None scheduled' ? (
                            <span className="font-bold text-[#2563EB]">{summary.nextApptDate}</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None scheduled</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {patient.status || 'Active'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 text-xs">
                            <button
                              onClick={() => {
                                setViewEhrPatient(patient);
                                setEhrTab('history');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 border border-blue-200 font-bold flex items-center gap-1 cursor-pointer"
                              title="View Complete EHR Profile"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Profile
                            </button>
                            <button
                              onClick={() => openEditModal(patient)}
                              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
                              title="Edit Patient"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetPatient(patient)}
                              className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                              title="Delete Patient Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <span className="text-slate-500">
                Showing {Math.min((currentPage - 1) * pageSize + 1, filteredPatients.length)}–
                {Math.min(currentPage * pageSize, filteredPatients.length)} of {filteredPatients.length} patient records
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="font-bold text-[#0F172A]">Page {currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-white space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-serif font-bold text-slate-700">No Patient Records Match Your Criteria</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching patient records found in your practice database. Try resetting your search query or click below to register a new patient.
            </p>
            <button onClick={openRegisterModal} className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold">
              + Register Patient
            </button>
          </div>
        )}
      </div>

      {/* MODAL 1: REGISTER / EDIT PATIENT PORTAL MODAL */}
      {(isRegisterModalOpen || editPatient) &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A] max-h-[90vh] flex flex-col">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#2563EB]" /> {editPatient ? 'Edit Patient Electronic Health Record' : 'Register New Patient Profile'}
                </h3>
                <button
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setEditPatient(null);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePatientSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Demographics */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-serif font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5 uppercase tracking-wider">
                    1. Patient Personal Identity
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Rahul"
                        value={formValues.firstName}
                        onChange={(e) => setFormValues({ ...formValues, firstName: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        placeholder="Sharma"
                        value={formValues.lastName}
                        onChange={(e) => setFormValues({ ...formValues, lastName: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Date of Birth (DOB) *</label>
                      <input
                        type="date"
                        required
                        value={formValues.dob}
                        onChange={(e) => setFormValues({ ...formValues, dob: e.target.value })}
                        className="w-full glass-input text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Calculated Age</label>
                      <input
                        type="text"
                        disabled
                        value={`${calculatedAge} Years`}
                        className="w-full glass-input text-xs font-mono bg-slate-100 font-bold text-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                      <select
                        value={formValues.gender}
                        onChange={(e) => setFormValues({ ...formValues, gender: e.target.value })}
                        className="w-full glass-input text-xs"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                      <select
                        value={formValues.bloodGroup}
                        onChange={(e) => setFormValues({ ...formValues, bloodGroup: e.target.value })}
                        className="w-full glass-input text-xs font-mono"
                      >
                        <option value="O+">O+</option>
                        <option value="A+">A+</option>
                        <option value="B+">B+</option>
                        <option value="AB+">AB+</option>
                        <option value="O-">O-</option>
                        <option value="A-">A-</option>
                        <option value="B-">B-</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98765 43210"
                        value={formValues.phone}
                        onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                        className="w-full glass-input text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        value={formValues.email}
                        onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Address & Emergency Contact */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-serif font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5 uppercase tracking-wider">
                    2. Address & Emergency Contact
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        placeholder="Main Ring Road"
                        value={formValues.street}
                        onChange={(e) => setFormValues({ ...formValues, street: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={formValues.city}
                        onChange={(e) => setFormValues({ ...formValues, city: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Emergency Person Name</label>
                      <input
                        type="text"
                        placeholder="Priya Sharma"
                        value={formValues.emergencyName}
                        onChange={(e) => setFormValues({ ...formValues, emergencyName: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Relationship</label>
                      <input
                        type="text"
                        placeholder="Spouse / Parent"
                        value={formValues.emergencyRel}
                        onChange={(e) => setFormValues({ ...formValues, emergencyRel: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Emergency Phone</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43211"
                        value={formValues.emergencyPhone}
                        onChange={(e) => setFormValues({ ...formValues, emergencyPhone: e.target.value })}
                        className="w-full glass-input text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Clinical Background & Allergies */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-serif font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5 uppercase tracking-wider">
                    3. Medical Background & Clinical Warnings
                  </h4>

                  <div>
                    <label className="block font-semibold text-rose-700 mb-1 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Known Allergies (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Penicillin, Sulfa drugs, Latex..."
                      value={formValues.allergiesStr}
                      onChange={(e) => setFormValues({ ...formValues, allergiesStr: e.target.value })}
                      className="w-full glass-input text-xs font-bold text-rose-800 bg-rose-50/50 border-rose-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Existing Medical Conditions</label>
                      <input
                        type="text"
                        placeholder="Hypertension, Asthma, Type 2 Diabetes..."
                        value={formValues.conditionsStr}
                        onChange={(e) => setFormValues({ ...formValues, conditionsStr: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Current Medications</label>
                      <input
                        type="text"
                        placeholder="Amlodipine 5mg, Metformin 500mg..."
                        value={formValues.medicationsStr}
                        onChange={(e) => setFormValues({ ...formValues, medicationsStr: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Insurance Provider</label>
                      <input
                        type="text"
                        placeholder="Star Health / HDFC ERGO"
                        value={formValues.insuranceProvider}
                        onChange={(e) => setFormValues({ ...formValues, insuranceProvider: e.target.value })}
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Policy / Member ID</label>
                      <input
                        type="text"
                        placeholder="SH-99210-A"
                        value={formValues.insurancePolicy}
                        onChange={(e) => setFormValues({ ...formValues, insurancePolicy: e.target.value })}
                        className="w-full glass-input text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterModalOpen(false);
                      setEditPatient(null);
                    }}
                    className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer bg-[#2563EB] text-white font-bold shadow-md">
                    {editPatient ? 'Save Changes' : 'Register Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 2: COMPREHENSIVE EHR PATIENT PROFILE MODAL */}
      {viewEhrPatient &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A] max-h-[92vh] flex flex-col">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#2563EB]" /> Electronic Health Record (EHR) Profile
                </h3>
                <button onClick={() => setViewEhrPatient(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const summary = getPatientSummary(viewEhrPatient._id, viewEhrPatient.name);

                return (
                  <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
                    {/* EHR Profile Header Bar */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] font-serif font-bold flex items-center justify-center text-2xl shadow-sm shrink-0">
                          {viewEhrPatient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                              {viewEhrPatient.patientId}
                            </span>
                            <h2 className="text-xl font-serif font-bold text-[#0F172A]">{viewEhrPatient.name}</h2>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {viewEhrPatient.gender}, {viewEhrPatient.age || '34'} Yrs • Blood Group: <strong className="text-rose-600 font-mono font-bold">{viewEhrPatient.bloodGroup || 'O+'}</strong>
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">Phone: {viewEhrPatient.phone} • Email: {viewEhrPatient.email || 'N/A'}</p>
                        </div>
                      </div>

                      {/* EHR Actions Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const p = viewEhrPatient;
                            setViewEhrPatient(null);
                            openEditModal(p);
                          }}
                          className="btn-secondary text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setViewEhrPatient(null);
                            navigate(`/appointments?book=true&patientId=${viewEhrPatient._id}`);
                          }}
                          className="btn-secondary text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#2563EB]" /> Book Appt
                        </button>
                        <button
                          onClick={() => {
                            setViewEhrPatient(null);
                            navigate(`/prescriptions?patientId=${viewEhrPatient._id}`);
                          }}
                          className="btn-secondary text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" /> New Rx
                        </button>
                        <button
                          onClick={() => {
                            setViewEhrPatient(null);
                            navigate(`/billing?patientId=${viewEhrPatient._id}`);
                          }}
                          className="btn-gold text-xs py-1.5 px-3 cursor-pointer bg-[#2563EB] text-white font-bold flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5 text-white" /> Create Invoice
                        </button>
                      </div>
                    </div>

                    {/* 4 Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Last Visit</span>
                        <p className="text-sm font-bold text-[#0F172A] mt-1">{summary.lastVisitDate}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Next Appointment</span>
                        <p className="text-sm font-bold text-[#2563EB] mt-1">{summary.nextApptDate}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                        <span className="text-[10px] text-amber-800 font-bold uppercase block font-sans">Outstanding Balance</span>
                        <p className="text-sm font-bold text-amber-700 mt-1">₹{summary.outstandingBalance.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
                        <span className="text-[10px] text-purple-800 font-bold uppercase block font-sans">Total Encounters</span>
                        <p className="text-sm font-bold text-purple-700 mt-1">{summary.totalVisits} Completed</p>
                      </div>
                    </div>

                    {/* Prominent Allergy Alert Banner */}
                    {viewEhrPatient.allergies && viewEhrPatient.allergies.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-serif font-bold text-sm block">⚠️ Clinical Allergy Warnings</span>
                          <p className="text-xs mt-0.5 font-semibold text-rose-900">
                            Patient has severe allergic reactions to: <strong>{viewEhrPatient.allergies.join(', ')}</strong>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tab Navigation for EHR Data Sections */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
                      <button
                        onClick={() => setEhrTab('history')}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                          ehrTab === 'history' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Clinical History
                      </button>
                      <button
                        onClick={() => setEhrTab('appointments')}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                          ehrTab === 'appointments' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Appointments ({summary.appointments.length})
                      </button>
                      <button
                        onClick={() => setEhrTab('prescriptions')}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                          ehrTab === 'prescriptions' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Prescriptions ({summary.prescriptions.length})
                      </button>
                      <button
                        onClick={() => setEhrTab('billing')}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                          ehrTab === 'billing' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Billing Ledger ({summary.bills.length})
                      </button>
                      <button
                        onClick={() => setEhrTab('lab')}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                          ehrTab === 'lab' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Lab Diagnostics ({summary.labOrders.length})
                      </button>
                      <button
                        onClick={() => setEhrTab('documents')}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                          ehrTab === 'documents' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Documents ({viewEhrPatient.documents?.length || 0})
                      </button>
                      <button
                        onClick={() => setEhrTab('timeline')}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                          ehrTab === 'timeline' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        EHR Timeline
                      </button>
                    </div>

                    {/* TAB CONTENT 1: CLINICAL HISTORY */}
                    {ehrTab === 'history' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="font-serif font-bold text-slate-800 text-xs uppercase tracking-wider block">
                            Diagnosed Conditions & Past History
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {viewEhrPatient.medicalHistory?.map((c: string, idx: number) => (
                              <span key={idx} className="bg-white border border-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded text-xs">
                                • {c}
                              </span>
                            ))}
                            {(!viewEhrPatient.medicalHistory || viewEhrPatient.medicalHistory.length === 0) && (
                              <span className="text-slate-400">No chronic medical conditions reported.</span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono">
                          <span className="font-serif font-bold text-slate-800 text-xs uppercase tracking-wider block font-sans">
                            Current Active Medications
                          </span>
                          <p className="text-slate-700 font-bold">{viewEhrPatient.medications?.join(', ') || 'None reported'}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Emergency Contact</span>
                            <p className="font-bold text-[#0F172A] mt-0.5">{viewEhrPatient.emergencyContact?.name || 'N/A'}</p>
                            <p className="text-slate-500 font-mono">{viewEhrPatient.emergencyContact?.relationship || 'Contact'} • {viewEhrPatient.emergencyContact?.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Insurance Coverage</span>
                            <p className="font-bold text-[#0F172A] mt-0.5">{viewEhrPatient.insurance?.provider || 'Self Pay'}</p>
                            <p className="text-slate-500 font-mono">Policy #: {viewEhrPatient.insurance?.policyNumber || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT 2: APPOINTMENTS */}
                    {ehrTab === 'appointments' && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs font-sans">
                          <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                            <tr>
                              <th className="p-3">Date & Time</th>
                              <th className="p-3">Doctor</th>
                              <th className="p-3">Visit Reason</th>
                              <th className="p-3">Type</th>
                              <th className="p-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {summary.appointments.map((a: any) => (
                              <tr key={a._id} className="bg-white">
                                <td className="p-3 font-mono font-bold text-[#2563EB]">{a.date} ({a.timeSlot})</td>
                                <td className="p-3 font-bold text-[#0F172A]">{a.doctorName}</td>
                                <td className="p-3 text-slate-600">{a.reasonForVisit || 'Consultation'}</td>
                                <td className="p-3 text-slate-500 font-mono">{a.type}</td>
                                <td className="p-3 text-right">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200">
                                    {a.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB CONTENT 3: PRESCRIPTIONS */}
                    {ehrTab === 'prescriptions' && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs font-sans">
                          <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                            <tr>
                              <th className="p-3">Rx ID & Date</th>
                              <th className="p-3">Doctor</th>
                              <th className="p-3">Clinical Diagnosis</th>
                              <th className="p-3">Medicines</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {summary.prescriptions.map((r: any) => (
                              <tr key={r._id} className="bg-white">
                                <td className="p-3 font-mono font-bold text-[#2563EB]">{r._id}</td>
                                <td className="p-3 font-bold text-[#0F172A]">{r.doctorName}</td>
                                <td className="p-3 text-slate-700">{r.diagnosis}</td>
                                <td className="p-3 font-mono">{r.medicines?.length || 0} Meds</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setPreviewRx(r)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-bold border border-blue-200 inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> View Rx
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB CONTENT 4: BILLING */}
                    {ehrTab === 'billing' && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs font-sans">
                          <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                            <tr>
                              <th className="p-3">Invoice #</th>
                              <th className="p-3">Doctor</th>
                              <th className="p-3 text-right">Total</th>
                              <th className="p-3 text-right">Paid</th>
                              <th className="p-3 text-right">Balance</th>
                              <th className="p-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {summary.bills.map((b: any) => (
                              <tr key={b._id} className="bg-white">
                                <td className="p-3 font-bold text-[#2563EB]">{b.invoiceNumber}</td>
                                <td className="p-3 font-sans font-bold text-[#0F172A]">{b.doctorName}</td>
                                <td className="p-3 text-right text-[#0F172A] font-bold">₹{b.totalAmount?.toLocaleString()}</td>
                                <td className="p-3 text-right text-emerald-700 font-bold">₹{b.paidAmount?.toLocaleString()}</td>
                                <td className="p-3 text-right text-rose-600 font-bold">₹{b.balanceDue?.toLocaleString()}</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setPreviewBill(b)}
                                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 cursor-pointer"
                                  >
                                    {b.paymentStatus}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB CONTENT 5: LAB DIAGNOSTICS */}
                    {ehrTab === 'lab' && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs font-sans">
                          <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                            <tr>
                              <th className="p-3">Order ID</th>
                              <th className="p-3">Test Name</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {summary.labOrders.map((l: any) => (
                              <tr key={l._id} className="bg-white">
                                <td className="p-3 font-bold text-[#2563EB]">{l.orderId || l.testId}</td>
                                <td className="p-3 font-sans font-bold text-[#0F172A]">{l.testName}</td>
                                <td className="p-3 text-slate-600 font-sans">{l.category}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 font-sans">
                                    {l.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-sans">
                                  <button
                                    onClick={() => setPreviewLab(l)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] font-bold text-xs border border-blue-200 cursor-pointer"
                                  >
                                    View Report
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB CONTENT 6: DOCUMENTS */}
                    {ehrTab === 'documents' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {viewEhrPatient.documents?.map((d: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#2563EB]" />
                                <div>
                                  <p className="font-bold text-[#0F172A]">{d.title}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{d.uploadedAt}</p>
                                </div>
                              </div>
                              <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-[#2563EB] font-bold hover:underline">
                                Open Document
                              </a>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={handleAttachDocument} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-800 block text-xs">Attach Scanned Report / File</span>
                          <input
                            type="text"
                            required
                            placeholder="Document Title (e.g. ECG Scan Sep 2026)"
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                            className="w-full glass-input text-xs"
                          />
                          <input
                            type="text"
                            required
                            placeholder="File URL / PDF Link"
                            value={docUrl}
                            onChange={(e) => setDocUrl(e.target.value)}
                            className="w-full glass-input text-xs font-mono"
                          />
                          <button type="submit" className="btn-gold text-xs py-1.5 px-4 cursor-pointer bg-[#2563EB] text-white font-bold">
                            + Attach to EHR Profile
                          </button>
                        </form>
                      </div>
                    )}

                    {/* TAB CONTENT 7: CHRONOLOGICAL TIMELINE */}
                    {ehrTab === 'timeline' && (
                      <div className="space-y-2 font-mono text-xs border-l-2 border-slate-200 pl-4 py-2">
                        {summary.appointments.map((a: any) => (
                          <div key={a._id} className="relative pb-3">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                            <span className="text-slate-400 font-bold">{a.date} ({a.timeSlot}):</span>
                            <p className="font-sans font-bold text-[#0F172A]">Clinical Encounter with {a.doctorName} ({a.status})</p>
                          </div>
                        ))}
                        {summary.prescriptions.map((r: any) => (
                          <div key={r._id} className="relative pb-3">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600" />
                            <span className="text-slate-400 font-bold">{getLocalDateStrFromISO(r.createdAt)}:</span>
                            <p className="font-sans font-bold text-emerald-800">Prescription {r._id} Issued ({r.diagnosis})</p>
                          </div>
                        ))}
                        {summary.bills.map((b: any) => (
                          <div key={b._id} className="relative pb-3">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-600" />
                            <span className="text-slate-400 font-bold">{getLocalDateStrFromISO(b.createdAt)}:</span>
                            <p className="font-sans font-bold text-purple-900">Invoice {b.invoiceNumber} Generated (Total ₹{b.totalAmount})</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 flex justify-end border-t border-slate-200 shrink-0">
                      <button onClick={() => setViewEhrPatient(null)} className="btn-secondary text-xs py-1.5 px-4 cursor-pointer">
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

      {/* MODAL 3: CONFIRM DELETE PATIENT */}
      {deleteTargetPatient &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0F172A]">
              <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
                <h3 className="font-serif font-bold text-base flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-white" /> Delete Patient File
                </h3>
                <button onClick={() => setDeleteTargetPatient(null)} className="text-rose-200 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-700 leading-relaxed">
                  Are you sure you want to delete patient file <strong className="text-[#0F172A]">{deleteTargetPatient.name}</strong> ({deleteTargetPatient.patientId})?
                </p>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <p className="font-bold flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Historical EHR Data Safeguard
                  </p>
                  <p>
                    Deleting this patient removes them from the active directory. Connected appointments, prescriptions, and billing ledger receipts will remain preserved for legal compliance.
                  </p>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                  <button type="button" onClick={() => setDeleteTargetPatient(null)} className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="btn-gold text-xs py-1.5 px-4 cursor-pointer bg-rose-600 text-white font-bold"
                  >
                    Delete Patient
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* PREVIEW MODALS */}
      {previewRx && <PrescriptionPdfModal prescription={previewRx} onClose={() => setPreviewRx(null)} />}
      {previewBill && <InvoicePdfModal bill={previewBill} onClose={() => setPreviewBill(null)} />}
      {previewLab && <LabReportPdfModal order={previewLab} onClose={() => setPreviewLab(null)} />}
    </div>
  );
};
