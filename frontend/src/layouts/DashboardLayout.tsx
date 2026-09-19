import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  Stethoscope, 
  Calendar, 
  Clock, 
  UserCheck, 
  Building2, 
  LogOut, 
  Menu, 
  ChevronDown, 
  Search, 
  Bell, 
  Receipt,
  Pill,
  TrendingUp,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, clinic, logout, switchTenantClinic } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Activity },
    { label: 'Live Queue', path: '/queue', icon: Clock },
    { label: 'Appointments', path: '/appointments', icon: Calendar },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope },
    { label: 'Billing & Invoices', path: '/billing', icon: Receipt },
    { label: 'Pharmacy Inventory', path: '/pharmacy', icon: Pill },
    { label: 'Analytics & Reports', path: '/analytics', icon: TrendingUp },
    { label: 'SaaS Plans', path: '/subscriptions', icon: ShieldCheck },
    { label: 'Audit Trail', path: '/audit-logs', icon: ShieldAlert },
    { label: 'Staff & Team', path: '/staff', icon: UserCheck },
    { label: 'Clinic Settings', path: '/settings', icon: Building2 },
  ];

  const demoClinics = [
    {
      _id: 'clinic-1',
      name: 'Apex Healthcare & Dental Clinic',
      code: 'APEX',
      email: 'contact@apexhealth.com',
      phone: '+91 98765 43210',
      address: 'Suite 402, Medical Enclave, Connaught Place, New Delhi',
      specialties: ['General Medicine', 'Dental', 'Pediatric'],
      subscriptionPlan: 'Pro' as const,
      workingHours: { start: '08:00 AM', end: '08:00 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
    },
    {
      _id: 'clinic-2',
      name: 'Metro Wellness & Physiotherapy',
      code: 'METRO',
      email: 'info@metrowellness.org',
      phone: '+91 91234 56789',
      address: '12th Cross, Indiranagar, Bengaluru',
      specialties: ['Physiotherapy', 'Orthopedic', 'Dermatology'],
      subscriptionPlan: 'Enterprise' as const,
      workingHours: { start: '09:00 AM', end: '07:00 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }
    }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
        <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight bg-gradient-to-r from-white via-slate-200 to-teal-400 bg-clip-text text-transparent">
                ClinicFlow
              </h1>
              <span className="text-[11px] text-teal-400 font-semibold tracking-wide uppercase">Multi-Tenant SaaS</span>
            </div>
          </div>
        </div>

        {/* Tenant Selector Switcher */}
        <div className="px-4 py-3 border-b border-slate-800/60">
          <div className="relative">
            <button
              onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
              className="w-full p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between text-left transition"
            >
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Tenant</p>
                <p className="text-sm font-semibold truncate text-slate-200">{clinic?.name || 'Apex Healthcare'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </button>

            {tenantDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden py-1">
                <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Switch Active Clinic
                </div>
                {demoClinics.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => {
                      switchTenantClinic(c);
                      setTenantDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-xs flex items-center justify-between hover:bg-teal-500/10 transition ${
                      clinic?._id === c._id ? 'bg-teal-500/15 text-teal-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {c.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-400 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-bold text-sm shrink-0">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  {user?.role || 'Owner'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-lg flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-200"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="relative hidden sm:block w-64 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient, phone, or appointment..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/queue"
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold hover:bg-teal-500/20 transition"
            >
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Today's Queue Active</span>
            </Link>

            <button className="p-2 text-slate-400 hover:text-slate-200 rounded-lg bg-slate-900 border border-slate-800 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-400" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
