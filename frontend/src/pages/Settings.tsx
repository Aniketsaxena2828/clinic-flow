import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon,
  Building2,
  Clock,
  Calendar,
  Receipt,
  FileText,
  Pill,
  FlaskConical,
  Bell,
  UserCheck,
  Lock,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  Sliders,
  Check,
  UserPlus
} from 'lucide-react';
import {
  storageService,
  ClinicSettings,
  NotificationPreferences,
  OperatingHoursDay,
  StaffMember
} from '../services/storageService';

const DAYS_LIST: (keyof ClinicSettings['operatingHours'])[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active Tab State - Defaulting to 'profile'
  const [activeTab, setActiveTab] = useState<
    'profile' | 'hours' | 'appointment' | 'billing' | 'prescription' | 'pharmacy' | 'lab' | 'notifications' | 'users' | 'security' | 'tenant'
  >('profile');

  // Loading & Saving States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings State initialized from storageService
  const [settings, setSettings] = useState<ClinicSettings>(storageService.getSettings());

  // Per-User Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    storageService.getNotificationPreferences(user?._id)
  );

  // Staff List for Users & Access Tab
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  // Change Password State for Security Tab
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAllSettings = async () => {
      setLoading(true);
      try {
        const [loadedSettings, userPrefs, staffList] = await Promise.all([
          storageService.fetchSettings(),
          storageService.fetchNotificationPreferences(user?._id),
          storageService.fetchStaff()
        ]);
        if (isMounted) {
          setSettings(loadedSettings);
          setNotifPrefs(userPrefs);
          setStaffMembers(staffList);
        }
      } catch (err: any) {
        console.error('Failed to load clinic settings from server:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadAllSettings();
    return () => { isMounted = false; };
  }, [user?._id]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    try {
      await storageService.saveSettings(settings);
      if (activeTab === 'notifications') {
        await storageService.saveNotificationPreferences(user?._id, notifPrefs);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    if (!currentPassword) {
      setPwdError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirmation do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      await storageService.changePassword(currentPassword, newPassword);
      setPwdSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(false), 4000);
    } catch (err: any) {
      setPwdError(err?.response?.data?.message || err?.message || 'Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#0F172A] flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#2563EB]" /> Clinic Administration & System Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global practice profile, operating hours, booking rules, billing rates, rx formats, pharmacy thresholds, and security preferences
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saving && (
            <div className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm animate-pulse">
              <span>Saving Changes...</span>
            </div>
          )}
          {savedSuccess && (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings Saved & Applied System-Wide</span>
            </div>
          )}
          {errorMessage && (
            <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Settings Layout (Left-side Nav Tabs + Content Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tab Sidebar */}
        <div className="lg:col-span-1 glass-panel p-2.5 border-slate-200/80 bg-white shadow-sm h-fit space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'profile' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Clinic Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('hours')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'hours' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Operating Hours</span>
          </button>

          <button
            onClick={() => setActiveTab('appointment')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'appointment' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Appointments</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'billing' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>Billing & Tax</span>
          </button>

          <button
            onClick={() => setActiveTab('prescription')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'prescription' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Prescriptions</span>
          </button>

          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'pharmacy' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Pill className="w-4 h-4 shrink-0" />
            <span>Pharmacy</span>
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'lab' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FlaskConical className="w-4 h-4 shrink-0" />
            <span>Lab Diagnostics</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'notifications' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'users' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Users & Access</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'security' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>Security & System</span>
          </button>

          <button
            onClick={() => setActiveTab('tenant')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === 'tenant' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Tenant & Plan</span>
          </button>
        </div>

        {/* Right-Hand Content Area */}
        <div className="lg:col-span-3 min-h-[500px]">
          {/* TAB 1: CLINIC PROFILE */}
          {activeTab === 'profile' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <Building2 className="w-5 h-5 text-[#2563EB]" /> Practice Profile & Medical Registration
              </h3>
              <p className="text-xs text-slate-500">
                Configure your official practice identity, address, contact information, and medical tax registrations.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Clinic Full Name *</label>
                    <input
                      type="text"
                      required
                      value={settings.clinicName}
                      onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">GSTIN Tax ID *</label>
                    <input
                      type="text"
                      required
                      value={settings.gstin}
                      onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={settings.website}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Medical Council Reg Number</label>
                    <input
                      type="text"
                      value={settings.registrationNumber}
                      onChange={(e) => setSettings({ ...settings, registrationNumber: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Clinic Logo URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/logo.png"
                      value={settings.clinicLogoUrl || ''}
                      onChange={(e) => setSettings({ ...settings, clinicLogoUrl: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={settings.city}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={settings.state}
                      onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={settings.postalCode}
                      onChange={(e) => setSettings({ ...settings, postalCode: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={settings.country}
                      onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Practice Description</label>
                  <textarea
                    rows={2}
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="pt-4 flex justify-end border-t border-slate-200">
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-white" />
                    <span>SAVE CHANGES</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: OPERATING HOURS */}
          {activeTab === 'hours' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <Clock className="w-5 h-5 text-[#2563EB]" /> Weekly Practice Operating Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Configure clinic working hours, weekend operations, and break times across the 7 days of the week.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
                {DAYS_LIST.map((dayKey) => {
                  const dayData: OperatingHoursDay = settings.operatingHours[dayKey];
                  const dayLabel = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);

                  return (
                    <div key={dayKey} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={dayData.enabled}
                            onChange={(e) => {
                              const updatedHours = { ...settings.operatingHours };
                              updatedHours[dayKey] = { ...dayData, enabled: e.target.checked };
                              setSettings({ ...settings, operatingHours: updatedHours });
                            }}
                            className="w-4 h-4 accent-[#2563EB]"
                          />
                          <span className="font-bold text-[#0F172A] text-sm">{dayLabel}</span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dayData.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                          {dayData.enabled ? 'Open' : 'Closed / Off'}
                        </span>
                      </div>

                      {dayData.enabled && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 font-mono">
                          <div>
                            <label className="block text-[10px] text-slate-500 font-sans mb-0.5">Opening Time</label>
                            <input
                              type="time"
                              value={dayData.openTime}
                              onChange={(e) => {
                                const updatedHours = { ...settings.operatingHours };
                                updatedHours[dayKey] = { ...dayData, openTime: e.target.value };
                                setSettings({ ...settings, operatingHours: updatedHours });
                              }}
                              className="w-full glass-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-sans mb-0.5">Closing Time</label>
                            <input
                              type="time"
                              value={dayData.closeTime}
                              onChange={(e) => {
                                const updatedHours = { ...settings.operatingHours };
                                updatedHours[dayKey] = { ...dayData, closeTime: e.target.value };
                                setSettings({ ...settings, operatingHours: updatedHours });
                              }}
                              className="w-full glass-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-sans mb-0.5">Break Start</label>
                            <input
                              type="time"
                              value={dayData.breakStart || '13:00'}
                              onChange={(e) => {
                                const updatedHours = { ...settings.operatingHours };
                                updatedHours[dayKey] = { ...dayData, breakStart: e.target.value };
                                setSettings({ ...settings, operatingHours: updatedHours });
                              }}
                              className="w-full glass-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-sans mb-0.5">Break End</label>
                            <input
                              type="time"
                              value={dayData.breakEnd || '14:00'}
                              onChange={(e) => {
                                const updatedHours = { ...settings.operatingHours };
                                updatedHours[dayKey] = { ...dayData, breakEnd: e.target.value };
                                setSettings({ ...settings, operatingHours: updatedHours });
                              }}
                              className="w-full glass-input text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-4 flex justify-end border-t border-slate-200">
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-white" />
                    <span>SAVE SCHEDULE</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: APPOINTMENTS SETTINGS */}
          {activeTab === 'appointment' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <Calendar className="w-5 h-5 text-[#2563EB]" /> Appointment Booking Rules & Token Queue Policy
              </h3>
              <p className="text-xs text-slate-500">
                Configure consultation slot lengths, buffer times, advance booking windows, and cancellation rules.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Default Duration (Minutes) *</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="120"
                      value={settings.appointment.defaultDurationMinutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointment: { ...settings.appointment, defaultDurationMinutes: Number(e.target.value) }
                        })
                      }
                      className="w-full glass-input text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Buffer Between Appts (Minutes)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={settings.appointment.bufferMinutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointment: { ...settings.appointment, bufferMinutes: Number(e.target.value) }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Max Advance Booking (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.appointment.maxFutureDays}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointment: { ...settings.appointment, maxFutureDays: Number(e.target.value) }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-[#0F172A]">Allow Advance Future Booking</span>
                      <p className="text-[10px] text-slate-500">Enable patients and reception to schedule visits in advance</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.appointment.allowFutureBooking}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointment: { ...settings.appointment, allowFutureBooking: e.target.checked }
                        })
                      }
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-[#0F172A]">Allow Same-Day Walk-In Bookings</span>
                      <p className="text-[10px] text-slate-500">Allow same-day token allocation and walk-in consultation appointments</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.appointment.allowSameDay}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointment: { ...settings.appointment, allowSameDay: e.target.checked }
                        })
                      }
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-[#0F172A]">Allow Double Booking / Overlapping Slots</span>
                      <p className="text-[10px] text-slate-500">Permit scheduling overlapping appointments for the same doctor slot</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.appointment.allowDoubleBooking}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appointment: { ...settings.appointment, allowDoubleBooking: e.target.checked }
                        })
                      }
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cancellation & Rescheduling Policy</label>
                  <textarea
                    rows={2}
                    value={settings.appointment.cancellationPolicy}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        appointment: { ...settings.appointment, cancellationPolicy: e.target.value }
                      })
                    }
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="pt-4 flex justify-end border-t border-slate-200">
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-white" />
                    <span>SAVE APPOINTMENT SETTINGS</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: BILLING & TAX SETTINGS */}
          {activeTab === 'billing' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <Receipt className="w-5 h-5 text-[#2563EB]" /> Financial Billing, Tax Rates & Invoice Preferences
              </h3>
              <p className="text-xs text-slate-500">
                Configure currency symbols, GST tax enforcement, invoice numbering sequences, and accepted payment methods.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency Code *</label>
                    <input
                      type="text"
                      required
                      value={settings.billing.currency}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          billing: { ...settings.billing, currency: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency Symbol *</label>
                    <input
                      type="text"
                      required
                      value={settings.billing.currencySymbol}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          billing: { ...settings.billing, currencySymbol: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs font-mono font-bold text-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Default GST Rate (%)</label>
                    <input
                      type="number"
                      value={settings.billing.defaultGstRate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          billing: { ...settings.billing, defaultGstRate: Number(e.target.value) }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Invoice Number Prefix</label>
                    <input
                      type="text"
                      value={settings.billing.invoicePrefix}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          billing: { ...settings.billing, invoicePrefix: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-[#0F172A]">GST Tax Calculation Enabled</span>
                      <p className="text-[10px] text-slate-500">Include GST tax breakdowns on invoices</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.billing.gstEnabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          billing: { ...settings.billing, gstEnabled: e.target.checked }
                        })
                      }
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-slate-200">
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-white" />
                    <span>SAVE BILLING SETTINGS</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: PRESCRIPTION SETTINGS */}
          {activeTab === 'prescription' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <FileText className="w-5 h-5 text-[#2563EB]" /> Prescription Header, Advice & PDF Layout Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure default clinical advice templates, Rx prefixes, follow-up intervals, and digital signature headers.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Prescription ID Prefix</label>
                    <input
                      type="text"
                      value={settings.prescription.rxPrefix}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          prescription: { ...settings.prescription, rxPrefix: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Default Follow-up Interval (Days)</label>
                    <input
                      type="number"
                      value={settings.prescription.followUpDefaultDays}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          prescription: { ...settings.prescription, followUpDefaultDays: Number(e.target.value) }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Practitioner Advice & Instructions</label>
                  <textarea
                    rows={3}
                    value={settings.prescription.defaultAdviceText}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        prescription: { ...settings.prescription, defaultAdviceText: e.target.value }
                      })
                    }
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Authorized Doctor Signature Line Text</label>
                  <input
                    type="text"
                    value={settings.prescription.doctorSignatureText}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        prescription: { ...settings.prescription, doctorSignatureText: e.target.value }
                      })
                    }
                    className="w-full glass-input text-xs font-bold"
                  />
                </div>

                <div className="pt-4 flex justify-end border-t border-slate-200">
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-white" />
                    <span>SAVE PRESCRIPTION SETTINGS</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: PHARMACY SETTINGS */}
          {activeTab === 'pharmacy' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <Pill className="w-5 h-5 text-[#2563EB]" /> Pharmacy Inventory Alert Thresholds & Batch Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure minimum reorder stock alert thresholds, expiry lead-time warnings, and sales tax rates.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Low-Stock Alert Threshold (Units) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={settings.pharmacy.lowStockThreshold}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pharmacy: { ...settings.pharmacy, lowStockThreshold: Number(e.target.value) }
                        })
                      }
                      className="w-full glass-input text-xs font-mono font-bold text-amber-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Expiry Warning Lead Time (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={settings.pharmacy.expiryWarningDays}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pharmacy: { ...settings.pharmacy, expiryWarningDays: Number(e.target.value) }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Medicine Sales Tax Rate (%)</label>
                    <input
                      type="number"
                      value={settings.pharmacy.defaultMedicineTaxRate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pharmacy: { ...settings.pharmacy, defaultMedicineTaxRate: Number(e.target.value) }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-slate-200">
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-white" />
                    <span>SAVE PHARMACY SETTINGS</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: LAB DIAGNOSTICS SETTINGS */}
          {activeTab === 'lab' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <FlaskConical className="w-5 h-5 text-[#2563EB]" /> NABL Laboratory Header & Pathologist Signature Credentials
              </h3>
              <p className="text-xs text-slate-500">
                Configure diagnostic lab facility name, NABL registration, and signatory consultant pathologist credentials.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Laboratory Facility Name *</label>
                    <input
                      type="text"
                      required
                      value={settings.lab.labName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          lab: { ...settings.lab, labName: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Report ID Prefix</label>
                    <input
                      type="text"
                      value={settings.lab.reportPrefix}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          lab: { ...settings.lab, reportPrefix: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Chief Consultant Pathologist Name</label>
                    <input
                      type="text"
                      value={settings.lab.pathologistName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          lab: { ...settings.lab, pathologistName: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pathologist NABL Qualifications & Title</label>
                    <input
                      type="text"
                      value={settings.lab.pathologistTitle}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          lab: { ...settings.lab, pathologistTitle: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-slate-200">
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-white" />
                    <span>SAVE LAB SETTINGS</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 8: NOTIFICATION SETTINGS */}
          {activeTab === 'notifications' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-5">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <Bell className="w-5 h-5 text-[#2563EB]" /> Automated Alert & Notification Preferences
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                {/* Master Switch */}
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#0F172A] text-sm">Master Notifications Delivery</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">Control whether ClinicFlow delivers non-critical operational alerts to your notification center</p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.masterEnabled}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, masterEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                  </label>
                </div>

                {!notifPrefs.masterEnabled && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Master Notifications Disabled</p>
                      <p>Non-critical user-facing notifications are currently paused. Mandatory security alerts will still be logged.</p>
                    </div>
                  </div>
                )}

                {/* Category Switches */}
                <div className={`space-y-2.5 transition-opacity ${!notifPrefs.masterEnabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <span className="font-serif font-bold text-slate-800 text-xs uppercase tracking-wider block">
                    Individual Alert Categories
                  </span>

                  {[
                    { key: 'appointments', label: 'Appointment Scheduling & Queue Alerts', desc: 'Bookings, reschedules, check-ins, and cancellations' },
                    { key: 'billing', label: 'Billing Invoices & Payment Settlements', desc: 'New invoices generated, UPI/cash payments collected, unpaid balance alerts' },
                    { key: 'pharmacy', label: 'Pharmacy Inventory & Reorder Warnings', desc: 'Low-stock thresholds, batch expiry warnings' },
                    { key: 'lab', label: 'Laboratory Diagnostics & Test Reports', desc: 'Sample collection, processing, and PDF report readiness' },
                    { key: 'prescriptions', label: 'Prescription Workflows', desc: 'Clinical Rx issuances and dosage advice updates' },
                    { key: 'patients', label: 'Patient Record Activity', desc: 'New patient registrations and medical document uploads' },
                    { key: 'system', label: 'System Security & RBAC Audits', desc: 'Staff invitation updates and login activity' }
                  ].map((cat) => (
                    <div key={cat.key} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-[#0F172A] text-xs">{cat.label}</span>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{cat.desc}</p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(notifPrefs as any)[cat.key]}
                          onChange={(e) => setNotifPrefs({ ...notifPrefs, [cat.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end border-t border-slate-200">
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-white" />
                    <span>SAVE NOTIFICATION PREFERENCES</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 9: USERS & ACCESS */}
          {activeTab === 'users' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <UserCheck className="w-5 h-5 text-[#2563EB]" /> Staff & RBAC Role-Based Access Control
              </h3>
              <p className="text-xs text-slate-500">
                Manage clinic staff accounts, active roles (Owner, Doctor, Nurse, Pharmacist, LabTech), and granular module permissions.
              </p>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  Staff accounts, permissions, and roles are managed centrally via the **Staff Management** module.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/staff')}
                    className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4 text-white" />
                    <span>MANAGE STAFF & PERMISSIONS</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Staff Overview Roster */}
              <div className="space-y-2 pt-2">
                <span className="font-serif font-bold text-slate-800 text-xs uppercase tracking-wider block">
                  Current Practice Staff Roster ({staffMembers.length})
                </span>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {staffMembers.length > 0 ? (
                    staffMembers.map((m) => (
                      <div key={m._id || m.staffId} className="p-3 bg-white flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#2563EB] text-[11px]">{m.staffId || m._id}</span>
                            <h4 className="font-bold text-[#0F172A]">{m.name}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500">{m.roleName || 'Staff'} • {m.department || 'General'}</p>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {m.status || 'Active'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 italic">No staff members enrolled yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SECURITY & SYSTEM PREFERENCES */}
          {activeTab === 'security' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Lock className="w-5 h-5 text-[#2563EB]" /> Security, Session Timeouts & System Preferences
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure security session inactivity timeouts, 2-Factor Authentication, and regional date/time formats.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Session Inactivity Timeout (Minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={settings.security.sessionTimeoutMinutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, sessionTimeoutMinutes: Number(e.target.value) }
                        })
                      }
                      className="w-full glass-input text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">System Timezone</label>
                    <select
                      value={settings.security.timezone || 'Asia/Kolkata'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, timezone: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date Format Display</label>
                    <select
                      value={settings.security.dateFormat || 'DD-MM-YYYY'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, dateFormat: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    >
                      <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 03-09-2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-03)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/03/2026)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Time Format Display</label>
                    <select
                      value={settings.security.timeFormat || '12-hour'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, timeFormat: e.target.value }
                        })
                      }
                      className="w-full glass-input text-xs font-mono"
                    >
                      <option value="12-hour">12-hour (10:15 AM)</option>
                      <option value="24-hour">24-hour (10:15)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-bold text-[#0F172A]">Enforce Two-Factor Authentication (2FA)</span>
                    <p className="text-[10px] text-slate-500">Require 2FA authentication codes for practitioner login</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorAuth}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, twoFactorAuth: e.target.checked }
                      })
                    }
                    className="w-4 h-4 accent-[#2563EB]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="submit" className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-white" />
                    <span>SAVE SECURITY PREFERENCES</span>
                  </button>
                </div>
              </form>

              {/* Change Password Form */}
              <div className="pt-6 border-t border-slate-200 space-y-3">
                <div>
                  <h4 className="text-sm font-serif font-bold text-[#0F172A] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#2563EB]" /> Change Account Password
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Update your practitioner login password. Passwords must be at least 6 characters long.
                  </p>
                </div>

                {pwdSuccess && (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Password updated successfully!</span>
                  </div>
                )}

                {pwdError && (
                  <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{pwdError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3 max-w-md text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Password *</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full glass-input text-xs"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full glass-input text-xs"
                      placeholder="Enter new password (min 6 chars)"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full glass-input text-xs"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4 text-white" />
                    <span>{pwdLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 11: TENANT & SUBSCRIPTION PLAN */}
          {activeTab === 'tenant' && (
            <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-200 pb-3">
                <Shield className="w-5 h-5 text-[#2563EB]" /> Multi-Tenant SaaS Isolation & Subscription Plan
              </h3>
              <p className="text-xs text-slate-500">
                View your active clinic tenant identifier, subscription tier, and multi-tenant data boundary security parameters.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Tenant Identifier</span>
                    <p className="font-bold text-[#0F172A] text-sm mt-0.5">{settings.tenant?.tenantId || 'clinic-apex-01'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Tenant Code (Slug)</span>
                    <p className="font-bold text-[#2563EB] text-sm mt-0.5">{settings.tenant?.tenantCode || 'apex-health'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Subscription Tier</span>
                    <p className="font-bold text-emerald-700 text-sm mt-0.5 uppercase">{settings.tenant?.subscriptionPlan || 'Professional'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block font-sans">Account Status</span>
                    <p className="font-bold text-emerald-700 text-sm mt-0.5 uppercase">{settings.tenant?.subscriptionStatus || 'Active'}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-slate-700">
                  <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Tenant isolation parameters are locked read-only to ensure strict multi-tenant data boundary protection. All clinic data remains encrypted and segregated under tenant ID <code className="font-bold text-[#0F172A]">{settings.tenant?.tenantId || 'clinic-apex-01'}</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
