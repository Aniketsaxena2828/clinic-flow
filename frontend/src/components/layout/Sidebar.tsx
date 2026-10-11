import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  FileText,
  CreditCard,
  Pill,
  FlaskConical,
  UserCheck,
  BarChart3,
  Settings,
  Activity,
  Sparkles,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'Doctors', path: '/doctors', icon: Stethoscope },
  { name: 'Appointments', path: '/appointments', icon: Calendar },
  { name: 'Prescriptions', path: '/prescriptions', icon: FileText },
  { name: 'Billing', path: '/billing', icon: CreditCard },
  { name: 'Pharmacy', path: '/pharmacy', icon: Pill },
  { name: 'Lab Diagnostics', path: '/lab', icon: FlaskConical },
  { name: 'Staff Management', path: '/staff', icon: UserCheck, roles: ['Owner', 'Admin'] },
  { name: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['Owner', 'Admin', 'Accountant'] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: ['Owner', 'Admin'] }
];

// Export the open-state setter so Header can trigger it
export let openMobileSidebar: (() => void) | null = null;

export const Sidebar: React.FC = () => {
  const { user, clinic, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Register the global opener so Header can call it
  useEffect(() => {
    openMobileSidebar = () => setMobileOpen(true);
    return () => { openMobileSidebar = null; };
  }, []);

  // Close drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const SidebarInner = ({ onClose }: { onClose?: () => void }) => (
    <>
      {/* Brand Header */}
      <div className="h-16 sm:h-20 px-5 flex items-center justify-between border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shadow-sm shrink-0">
            <Activity className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-base font-sans font-bold text-[#0F172A] tracking-wider uppercase leading-none">
              CLINICFLOW
            </h1>
            <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-[#2563EB] block mt-0.5">
              PRACTICE MANAGEMENT SAAS
            </span>
          </div>
        </div>
        {/* Close button — only shown inside mobile drawer */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tenant Indicator Card */}
      {clinic && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0F172A] flex items-center justify-center font-sans font-bold text-sm shrink-0">
            {clinic.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-[#0F172A] truncate font-sans">{clinic.name}</div>
            <div className="text-[11px] text-[#2563EB] font-mono truncate uppercase tracking-wider font-bold">{clinic.code}</div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#F0F6FF] text-[#1E3A8A] font-semibold border-[#2563EB]/40 shadow-sm'
                    : 'bg-white text-[#334155] font-medium hover:bg-slate-50 border-transparent hover:text-[#0F172A]'
                }`
              }
            >
              <Icon className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0">
        {/* Mobile: show logout here inside drawer */}
        {onClose && (
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-5 py-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-t border-slate-200 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        )}
        <div className="p-4 border-t border-slate-200/80 text-[11px] text-slate-400 text-center font-mono uppercase tracking-widest flex items-center justify-center gap-1.5">
          <span>ENTERPRISE CLINIC SaaS</span>
          <Sparkles className="w-3 h-3 text-[#2563EB]" />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white text-[#0F172A] h-screen sticky top-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] font-sans shrink-0">
        <SidebarInner />
      </aside>

      {/* ── Mobile Drawer ────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-2xl md:hidden">
            <SidebarInner onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
};
