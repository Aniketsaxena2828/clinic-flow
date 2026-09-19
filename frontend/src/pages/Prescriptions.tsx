import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Search,
  Plus,
  Eye,
  Edit2,
  Printer,
  Calendar,
  User,
  Stethoscope,
  Loader2,
  X,
  Trash2,
  CheckCircle2,
  Pill,
  Sparkles,
  Download
} from 'lucide-react';
import api from '../services/api';
import { Prescription, PrescriptionItem, Patient, Doctor, Appointment } from '../types';
import { PrescriptionPdfModal } from '../components/PrescriptionPdfModal';
import { storageService, getTodayLocalDateStr } from '../services/storageService';

export const PrescriptionsPage: React.FC = () => {
  const todayStr = getTodayLocalDateStr();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Search & Filters (Matching Appointments Page)
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals State
  const [previewRx, setPreviewRx] = useState<Prescription | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRx, setEditingRx] = useState<Prescription | null>(null);

  // Form State
  const [formPatientId, setFormPatientId] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formAppointmentId, setFormAppointmentId] = useState('');
  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formAdvice, setFormAdvice] = useState('');
  const [formFollowUpDate, setFormFollowUpDate] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Completed' | 'Cancelled'>('Active');
  const [formVitals, setFormVitals] = useState({
    bp: '120/80',
    pulse: '72 bpm',
    temp: '98.6 °F',
    weight: '70 kg'
  });
  const [formMedicines, setFormMedicines] = useState<PrescriptionItem[]>([
    {
      medicineName: 'Paracetamol 650mg',
      type: 'Tablet',
      dosage: '1-0-1',
      frequency: 'Twice daily',
      duration: '5 Days',
      instructions: 'After food'
    }
  ]);

  useEffect(() => {
    fetchData();
  }, [search, dateFilter, doctorFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [rxList, patList, docList, apptList] = await Promise.all([
        storageService.fetchPrescriptions(),
        storageService.fetchPatients(),
        storageService.fetchDoctors(),
        storageService.fetchAppointments()
      ]);

      setPatients(patList as any);
      setDoctors(docList as any);
      setAppointments(apptList as any);

      // Filtering Logic
      let filtered = rxList;

      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (r: any) =>
            (r.patientName || '').toLowerCase().includes(q) ||
            (r.doctorName || '').toLowerCase().includes(q) ||
            (r.diagnosis || '').toLowerCase().includes(q)
        );
      }


      if (doctorFilter !== 'all' && doctorFilter !== '') {
        filtered = filtered.filter((r: any) => r.doctorId === doctorFilter || r.doctorName === doctorFilter);
      }

      if (statusFilter !== 'all' && statusFilter !== '') {
        filtered = filtered.filter((r: any) => (r.status || 'Active') === statusFilter);
      }
      
      if (dateFilter) {
        filtered = filtered.filter((r: any) => {
           const rxDate = r.createdAt ? r.createdAt.split('T')[0] : '';
           return rxDate === dateFilter;
        });
      }

      setPrescriptions(filtered as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Form Open (Create Mode)
  const handleOpenCreateModal = () => {
    setEditingRx(null);
    setFormPatientId(patients[0]?._id || '');
    setFormDoctorId(doctors[0]?._id || '');
    setFormAppointmentId('');
    setFormDiagnosis('');
    setFormAdvice('Drink plenty of fluids and take rest.');
    setFormFollowUpDate('');
    setFormStatus('Active');
    setFormVitals({ bp: '120/80', pulse: '72 bpm', temp: '98.6 °F', weight: '70 kg' });
    setFormMedicines([
      {
        medicineName: 'Paracetamol 650mg',
        type: 'Tablet',
        dosage: '1-0-1',
        frequency: 'Twice daily',
        duration: '5 Days',
        instructions: 'After food'
      }
    ]);
    setIsFormOpen(true);
  };

  // Handle Form Open (Edit Mode)
  const handleOpenEditModal = (rx: Prescription) => {
    setEditingRx(rx);
    setFormPatientId(rx.patientId || '');
    setFormDoctorId(rx.doctorId || '');
    setFormAppointmentId(rx.appointmentId || '');
    setFormDiagnosis(rx.diagnosis || '');
    setFormAdvice(rx.advice || '');
    setFormFollowUpDate(rx.followUpDate || '');
    setFormStatus((rx.status as any) || 'Active');
    if (rx.vitals) {
      setFormVitals({
        bp: rx.vitals.bp || '120/80',
        pulse: rx.vitals.pulse || '72 bpm',
        temp: rx.vitals.temp || '98.6 °F',
        weight: rx.vitals.weight || '70 kg'
      });
    }
    setFormMedicines(rx.medicines && rx.medicines.length > 0 ? rx.medicines : [
      {
        medicineName: 'Paracetamol 650mg',
        type: 'Tablet',
        dosage: '1-0-1',
        frequency: 'Twice daily',
        duration: '5 Days',
        instructions: 'After food'
      }
    ]);
    setIsFormOpen(true);
  };

  // Add / Remove Medicine Rows
  const handleAddMedicineRow = () => {
    setFormMedicines([
      ...formMedicines,
      {
        medicineName: '',
        type: 'Tablet',
        dosage: '1-0-1',
        frequency: 'Twice daily',
        duration: '5 Days',
        instructions: 'After meals'
      }
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    setFormMedicines(formMedicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...formMedicines];
    updated[index] = { ...updated[index], [field]: value };
    setFormMedicines(updated);
  };

  // Quick Preset Templates
  const handleQuickAddPreset = (name: string, type: any, dosage: string, duration: string) => {
    setFormMedicines([
      ...formMedicines,
      {
        medicineName: name,
        type,
        dosage,
        frequency: 'As prescribed',
        duration,
        instructions: 'After meals'
      }
    ]);
  };

  // Form Submit Handler
  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDiagnosis) {
      alert('Please enter a clinical diagnosis');
      return;
    }

    const selPat = patients.find((p) => p._id === formPatientId || p.patientId === formPatientId);
    const selDoc = doctors.find((d) => d._id === formDoctorId);

    const payload: any = {
      ...(editingRx ? { _id: editingRx._id } : {}),
      appointmentId: formAppointmentId || '',
      patientId: selPat?._id || formPatientId || '',
      patientName: selPat?.name || editingRx?.patientName || '',
      doctorId: selDoc?._id || formDoctorId || '',
      doctorName: selDoc?.name || editingRx?.doctorName || '',
      doctorSpecialization: (selDoc as any)?.specialization || editingRx?.doctorSpecialization || 'General Physician',
      diagnosis: formDiagnosis,
      symptoms: [formDiagnosis],
      vitals: formVitals,
      medicines: formMedicines.filter((m) => m.medicineName.trim() !== ''),
      advice: formAdvice,
      followUpDate: formFollowUpDate,
      status: formStatus,
      createdAt: editingRx ? editingRx.createdAt : new Date().toISOString()
    };

    try {
      if (editingRx) {
        await api.put(`/prescriptions/${editingRx._id}`, payload);
      } else {
        await api.post('/prescriptions', payload);
      }
    } catch (err) {
      console.error(err);
    }

    setIsFormOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* Header - Matching Appointments Page Structure */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#2563EB]" /> Prescription Management
          </h1>
          <p className="page-subtitle mt-1">
            Official clinical prescriptions, patient diagnosis, dosage plans, and medical PDF exports
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn-gold shrink-0"
        >
          <Plus className="w-4 h-4 text-white" /> + NEW PRESCRIPTION
        </button>
      </div>

      {/* Search & Filters Section - Matching Appointments Page */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row gap-4 items-center justify-between border-slate-200/80 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Rx ID, patient, doctor..."
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

          {/* Doctor Filter */}
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#2563EB] shrink-0" />
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Attending Doctors</option>
              {doctors.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {(search || dateFilter || doctorFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setDateFilter('');
              setDoctorFilter('');
              setStatusFilter('');
            }}
            className="text-xs text-[#2563EB] font-bold hover:underline font-mono shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Prescription Table - Matching Appointments Table Design */}
      <div className="glass-panel border-slate-200/80 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2563EB] mb-2" />
            Loading prescriptions...
          </div>
        ) : (
          <table className="w-full text-left text-xs font-sans text-[#0F172A]">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="p-4">PRESCRIPTION ID & DATE</th>
                <th className="p-4">PATIENT</th>
                <th className="p-4">DOCTOR</th>
                <th className="p-4">DIAGNOSIS</th>
                <th className="p-4">MEDICINES</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prescriptions.map((rx) => (
                <tr key={rx._id} className="hover:bg-slate-50/80 transition">
                  {/* Prescription ID & Date */}
                  <td className="p-4">
                    <span className="font-mono font-extrabold text-xs text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg inline-block">
                      {rx._id}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {new Date(rx.createdAt || Date.now()).toLocaleDateString('en-GB')}
                    </p>
                  </td>

                  {/* Patient */}
                  <td className="p-4">
                    <p className="font-bold text-[#0F172A]">{rx.patientName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {rx.patientId}</p>
                  </td>

                  {/* Doctor */}
                  <td className="p-4">
                    <p className="font-bold text-[#0F172A]">{rx.doctorName}</p>
                    <p className="text-[10px] text-[#2563EB] font-semibold">{rx.doctorSpecialization}</p>
                  </td>

                  {/* Diagnosis */}
                  <td className="p-4 text-slate-700 max-w-xs font-medium truncate">
                    {rx.diagnosis}
                  </td>

                  {/* Medicines Count */}
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200 font-mono">
                      {rx.medicines?.length || 0} Medicines
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (rx.status || 'Active') === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : (rx.status || 'Active') === 'Completed'
                          ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {rx.status || 'Active'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right space-x-1.5">
                    <button
                      onClick={() => setPreviewRx(rx)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1 border border-blue-200"
                      title="Preview Prescription"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(rx)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold inline-flex items-center gap-1 border border-slate-200"
                      title="Edit Prescription"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setPreviewRx(rx)}
                      className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shadow-sm"
                      title="Preview & Print"
                    >
                      <Printer className="w-3.5 h-3.5 text-white" /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* NEW / EDIT PRESCRIPTION MODAL (Portal Rendered to prevent CSS Transform bugs) */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            
            {/* Modal Header */}
            <div className="flex-none p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2563EB]" />
                <span>{editingRx ? 'Edit Prescription' : 'Create Clinical Prescription (Rx)'}</span>
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSavePrescription} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Patient & Doctor Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    required
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.patientId} - {p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attending Doctor *</label>
                  <select
                    required
                    value={formDoctorId}
                    onChange={(e) => setFormDoctorId(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consultation / Appointment Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Linked Consultation / Token</label>
                  <select
                    value={formAppointmentId}
                    onChange={(e) => setFormAppointmentId(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    <option value="">-- General Outpatient Visit --</option>
                    {appointments.map((a) => (
                      <option key={a._id} value={a.appointmentId || a._id}>
                        {a.appointmentId || a._id} - {a.patientName} ({a.timeSlot})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prescription Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full glass-input text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Vitals Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-700 block mb-2">Patient Vitals at Examination</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">BP</label>
                    <input
                      type="text"
                      value={formVitals.bp}
                      onChange={(e) => setFormVitals({ ...formVitals, bp: e.target.value })}
                      className="w-full glass-input text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Pulse</label>
                    <input
                      type="text"
                      value={formVitals.pulse}
                      onChange={(e) => setFormVitals({ ...formVitals, pulse: e.target.value })}
                      className="w-full glass-input text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Temp</label>
                    <input
                      type="text"
                      value={formVitals.temp}
                      onChange={(e) => setFormVitals({ ...formVitals, temp: e.target.value })}
                      className="w-full glass-input text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Weight</label>
                    <input
                      type="text"
                      value={formVitals.weight}
                      onChange={(e) => setFormVitals({ ...formVitals, weight: e.target.value })}
                      className="w-full glass-input text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Diagnosis & Symptoms *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Pharyngitis with mild fever / Essential Hypertension"
                  value={formDiagnosis}
                  onChange={(e) => setFormDiagnosis(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" /> Quick Add Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAddPreset('Paracetamol 650mg', 'Tablet', '1-0-1', '5 Days')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + Paracetamol 650mg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddPreset('Amoxicillin 500mg', 'Capsule', '1-0-1', '7 Days')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + Amoxicillin 500mg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddPreset('Pantoprazole 40mg', 'Tablet', '1-0-0', '10 Days')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] text-[11px] font-semibold cursor-pointer"
                  >
                    + Pantoprazole 40mg
                  </button>
                </div>
              </div>

              {/* Dynamic Multiple Medicines List */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider">
                    Prescribed Medications ({formMedicines.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="btn-secondary text-xs py-1 px-2.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formMedicines.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Medicine Name"
                          value={m.medicineName}
                          onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                          className="w-full glass-input text-xs"
                        />
                      </div>

                      <div>
                        <select
                          value={m.type}
                          onChange={(e) => handleMedicineChange(idx, 'type', e.target.value as any)}
                          className="w-full glass-input text-xs"
                        >
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Injection">Injection</option>
                          <option value="Ointment">Ointment</option>
                          <option value="Drops">Drops</option>
                        </select>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Dosage (1-0-1)"
                          value={m.dosage}
                          onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                          className="w-full glass-input text-xs font-mono font-bold text-center"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Duration (5 Days)"
                          value={m.duration}
                          onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                          className="w-full glass-input text-xs"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Instructions"
                          value={m.instructions}
                          onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                          className="w-full glass-input text-xs"
                        />
                        {formMedicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(idx)}
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

              {/* Advice & Follow up */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Doctor Advice / Diet Instructions</label>
                  <input
                    type="text"
                    value={formAdvice}
                    onChange={(e) => setFormAdvice(e.target.value)}
                    className="w-full glass-input text-xs"
                    placeholder="Adequate rest, drink warm fluids..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={formFollowUpDate}
                    onChange={(e) => setFormFollowUpDate(e.target.value)}
                    className="w-full glass-input text-xs font-mono"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{editingRx ? 'Update Prescription' : 'Save & Issue Prescription'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* PRESCRIPTION PREVIEW MODAL */}
      {previewRx && (
        <PrescriptionPdfModal
          prescription={previewRx}
          onClose={() => setPreviewRx(null)}
        />
      )}
    </div>
  );
};
