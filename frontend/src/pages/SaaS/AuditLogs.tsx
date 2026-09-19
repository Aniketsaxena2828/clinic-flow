import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search } from 'lucide-react';
import api from '../../services/api';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/saas/audit-logs');
      if (res.data?.data) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    l.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#0F172A] flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-[#2563EB]" />
            <span>Security Audit Trail & Logs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Multi-tenant action logging, authentication events, and data modifications</p>
        </div>

        <div className="w-64 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full glass-input pl-10 text-xs"
          />
        </div>
      </div>

      <div className="glass-panel border-slate-200/80 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left text-xs font-sans text-[#0F172A]">
          <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Action</th>
              <th className="p-4">Resource</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <tr key={log._id} className="hover:bg-slate-50/80 transition">
                <td className="p-4 text-slate-500 font-mono text-[11px]">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-4 font-bold text-[#0F172A]">{log.userName}</td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200 font-mono">
                    {log.userRole}
                  </span>
                </td>
                <td className="p-4 font-bold text-[#0F172A]">{log.action}</td>
                <td className="p-4 text-[#2563EB] font-mono font-bold">{log.resource}</td>
                <td className="p-4 text-slate-600 font-medium">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
