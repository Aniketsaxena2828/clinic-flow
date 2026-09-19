import React from 'react';
import { LucideIcon, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  milestone: string;
}

export const ModulePlaceholder: React.FC<Props> = ({ title, subtitle, icon: Icon, milestone }) => {
  const { clinic } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon className="w-6 h-6 text-brand-400" /> {title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Tenant: {clinic?.code}</span>
        </div>
      </div>

      <div className="glass-panel p-10 text-center max-w-xl mx-auto border-slate-800/90 my-12">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">{title} Module Active</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          This module is registered under tenant <strong className="text-brand-300">{clinic?.name}</strong>. Full detailed features are scheduled for deployment under <strong className="text-emerald-400">{milestone}</strong>.
        </p>

        <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Multi-Tenant Ready
          </span>
          <span className="flex items-center gap-1.5 text-brand-400 font-medium">
            <Layers className="w-4 h-4" /> RBAC Enforced
          </span>
        </div>
      </div>
    </div>
  );
};
