import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Sparkles
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

export const Sidebar: React.FC = () => {
  const { user, clinic } = useAuth();

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white text-[#0F172A] flex flex-col h-screen sticky top-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] font-sans">
      {/* Brand Header */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shadow-sm">
            <Activity className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-base font-sans font-bold text-[#0F172A] tracking-wider uppercase">
              CLINICFLOW
            </h1>
            <span className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-[#2563EB] block -mt-0.5">
              PRACTICE MANAGEMENT SAAS
            </span>
          </div>
        </div>
      </div>

      {/* Tenant Indicator Card */}
      {clinic && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0F172A] flex items-center justify-center font-sans font-bold text-sm">
            {clinic.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-[#0F172A] truncate font-sans">{clinic.name}</div>
            <div className="text-[11px] text-[#2563EB] font-mono truncate uppercase tracking-wider font-bold">{clinic.code}</div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#F0F6FF] text-[#1E3A8A] font-semibold border-[#2563EB]/40 shadow-sm'
                    : 'bg-white text-[#334155] font-medium hover:bg-slate-50 border-transparent hover:text-[#0F172A]'
                }`
              }
            >
              <Icon className="w-4 h-4 text-[#2563EB]" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-200/80 text-[11px] text-slate-400 text-center font-mono uppercase tracking-widest flex items-center justify-center gap-1.5">
        <span>ENTERPRISE CLINIC SaaS</span>
        <Sparkles className="w-3 h-3 text-[#2563EB]" />
      </div>
    </aside>
  );
};
