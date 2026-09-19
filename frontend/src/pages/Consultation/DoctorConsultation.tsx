import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Activity, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { Appointment, Patient, PrescriptionItem, Prescription } from '../../types';
import { PrescriptionPdfModal } from '../../components/PrescriptionPdfModal';

export const DoctorConsultation: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const [vitals, setVitals] = useState({
    bp: '120/80',
    pulse: '72 bpm',
    temp: '98.6 °F',
    weight: '70 kg'
  });

  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const [medicines, setMedicines] = useState<PrescriptionItem[]>([
    {
      medicineName: 'Paracetamol 650mg',
      type: 'Tablet',
      dosage: '1-0-1',
      frequency: 'Twice daily',
      duration: '5 Days',
      instructions: 'After meals'
    }
  ]);

  const [activeRx, setActiveRx] = useState<Prescription | null>(null);

  useEffect(() => {
    if (appointmentId) {
      fetchConsultationDetails();
    } else {
      setLoading(false);
    }
  }, [appointmentId]);

  const fetchConsultationDetails = async () => {
    setLoading(true);
    try {
      const apptRes = await api.get('/appointments');
      if (apptRes.data?.data) {
        const found = apptRes.data.data.find((a: Appointment) => a._id === appointmentId);
        if (found) {
          setAppointment(found);
          if (found.vitals) {
            setVitals({
              bp: found.vitals.bp || '120/80',
              pulse: found.vitals.pulse || '72 bpm',
              temp: found.vitals.temp || '98.6 °F',
              weight: found.vitals.weight || '70 kg'
            });
          }

          const rawPatId: any = found.patientId;
          const targetPatId = typeof rawPatId === 'object' ? (rawPatId?._id || rawPatId?.patientId) : rawPatId;
          if (targetPatId && targetPatId !== '[object Object]') {
            const patRes = await api.get(`/patients/${targetPatId}`);
            if (patRes.data?.data) {
              setPatient(patRes.data.data);
            }
          } else if (typeof rawPatId === 'object' && rawPatId?._id) {
            setPatient(rawPatId);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
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

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleQuickAddTemplate = (name: string, type: any, dosage: string, duration: string) => {
    setMedicines([
      ...medicines,
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

  const handleCompleteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis) {
      alert('Please enter a clinical diagnosis');
      return;
    }

    try {
      const rawPatId: any = appointment?.patientId;
      const targetPatId = typeof rawPatId === 'object' ? rawPatId?._id : (rawPatId || patient?._id || 'pat-1');
      const rawDocId: any = appointment?.doctorId;
      const targetDocId = typeof rawDocId === 'object' ? rawDocId?._id : (rawDocId || 'doc-1');

      const payload = {
        appointmentId: appointment?._id,
        patientId: targetPatId,
        doctorId: targetDocId,
        diagnosis,
        vitals,
        medicines: medicines.filter(m => m.medicineName.trim() !== ''),
        advice,
        followUpDate
      };

      const res = await api.post('/prescriptions', payload);
      if (res.data?.data) {
        setActiveRx(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save prescription.');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-400 font-sans">Loading Doctor Consultation Workspace...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in-scale font-sans text-[#0F172A]">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/appointments')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#0F172A] flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-[#2563EB]" />
              <span>Doctor Examination Workspace</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono">Token #{appointment?.queueNumber || 1} • Patient Visit Consultation</p>
          </div>
        </div>

        <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          In Consultation
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass-panel p-6 border-slate-200/80 bg-white space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-[#0F172A] text-lg">{patient?.name || appointment?.patientName || 'Rohan Mehta'}</h3>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
              {patient?.bloodGroup || 'O+'}
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
            <p>Age / Gender: <span className="font-bold text-[#0F172A]">{patient?.age || 34} yrs • {patient?.gender || 'Male'}</span></p>
            <p>Patient ID: <span className="font-mono text-[#2563EB] font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{patient?.patientId || 'PAT-1001'}</span></p>
            <p>Phone: <span className="text-[#0F172A] font-mono">{patient?.phone || '+91 98765 43210'}</span></p>
          </div>

          {patient?.allergies && patient.allergies.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Allergies: <strong>{patient.allergies.join(', ')}</strong></span>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 glass-panel p-6 border-slate-200/80 bg-white space-y-4 shadow-sm">
          <h3 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider flex items-center space-x-1.5">
            <Activity className="w-4 h-4 text-[#2563EB]" />
            <span>Patient Vitals Summary</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-1">Blood Pressure</label>
              <input
                type="text"
                value={vitals.bp}
                onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                className="w-full glass-input font-mono font-bold text-[#0F172A] text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-1">Pulse Rate</label>
              <input
                type="text"
                value={vitals.pulse}
                onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                className="w-full glass-input font-mono font-bold text-[#0F172A] text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-1">Body Temp</label>
              <input
                type="text"
                value={vitals.temp}
                onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                className="w-full glass-input font-mono font-bold text-[#0F172A] text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-semibold mb-1">Weight (kg)</label>
              <input
                type="text"
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                className="w-full glass-input font-mono font-bold text-[#0F172A] text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleCompleteVisit} className="glass-panel p-7 border-slate-200/80 bg-white space-y-6 shadow-sm">
        <div>
          <label className="block text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider mb-2">
            Clinical Diagnosis & Symptoms *
          </label>
          <input
            type="text"
            required
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full glass-input text-xs"
            placeholder="e.g. Acute Pharyngitis with mild fever / Essential Hypertension"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Quick Medicine Presets</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickAddTemplate('Paracetamol 650mg', 'Tablet', '1-0-1', '5 Days')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] font-bold cursor-pointer transition"
            >
              + Paracetamol 650mg
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddTemplate('Amoxicillin 500mg', 'Capsule', '1-0-1', '7 Days')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] font-bold cursor-pointer transition"
            >
              + Amoxicillin 500mg
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddTemplate('Pantoprazole 40mg', 'Tablet', '1-0-0', '10 Days')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0F172A] font-bold cursor-pointer transition"
            >
              + Pantoprazole 40mg
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider">Prescribed Medications</h3>
            <button
              type="button"
              onClick={handleAddMedicine}
              className="btn-secondary text-xs py-1.5 px-3 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Medicine</span>
            </button>
          </div>

          <div className="space-y-3">
            {medicines.map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#FAF9F6] border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Medicine Name (e.g. Augmentin 625)"
                    value={m.medicineName}
                    onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <select
                    value={m.type}
                    onChange={(e) => handleMedicineChange(idx, 'type', e.target.value)}
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
                    placeholder="Instructions (After food)"
                    value={m.instructions}
                    onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Advice / Diet Instructions</label>
            <input
              type="text"
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full glass-input text-xs"
              placeholder="Adequate rest, drink warm fluids, avoid cold items."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recommended Follow-up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full glass-input text-xs font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="btn-secondary text-xs py-2 px-4 cursor-pointer"
          >
            Cancel & Return
          </button>

          <button
            type="submit"
            className="btn-gold text-xs py-2.5 px-6 cursor-pointer shadow-md bg-[#2563EB] text-white"
          >
            <CheckCircle className="w-4 h-4 text-white" />
            <span>Complete Visit & Generate Rx PDF</span>
          </button>
        </div>
      </form>

      {activeRx && (
        <PrescriptionPdfModal
          prescription={activeRx}
          onClose={() => {
            setActiveRx(null);
            navigate('/appointments');
          }}
        />
      )}
    </div>
  );
};
