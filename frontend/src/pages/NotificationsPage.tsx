import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storageService, NotificationItem } from '../services/storageService';
import {
  Bell,
  Search,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Pill,
  FlaskConical,
  FileText,
  UserPlus,
  AlertTriangle,
  Trash2,
  Check,
  Filter,
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter & Search State
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  // Live Refresh Trigger State
  const [allNotifs, setAllNotifs] = useState<NotificationItem[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const refreshData = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    let isMounted = true;
    storageService.fetchNotifications(user?._id).then(notifs => {
      if (isMounted) setAllNotifs(notifs);
    });
    return () => { isMounted = false; };
  }, [user?._id, refreshKey]);

  // Multi-Faceted Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return allNotifs.filter((n) => {
      // Unread only check
      if (unreadOnly && n.read) return false;

      // Category tab check
      if (activeTab !== 'all') {
        if (activeTab === 'billing' && n.type !== 'billing' && n.type !== 'payment') return false;
        if (activeTab !== 'billing' && n.type !== activeTab) return false;
      }

      // Search Query
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const title = (n.title || '').toLowerCase();
        const desc = (n.desc || '').toLowerCase();
        if (!title.includes(q) && !desc.includes(q)) return false;
      }

      return true;
    });
  }, [allNotifs, activeTab, unreadOnly, search]);

  const unreadCount = useMemo(
    () => allNotifs.filter((n) => !n.read).length,
    [allNotifs]
  );

  const getRelativeTime = (isoStr: string) => {
    if (!isoStr) return 'Just now';
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return new Date(isoStr).toLocaleDateString('en-GB');
  };

  const getNotifIcon = (type: string, priority: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-[#2563EB] shrink-0" />;
      case 'billing':
      case 'payment':
        return <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'pharmacy':
        return <Pill className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'lab':
        return <FlaskConical className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'prescription':
        return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'patient':
        return <UserPlus className="w-4 h-4 text-slate-700 shrink-0" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
    }
  };

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsRead();
    refreshData();
  };

  const handleToggleRead = (n: NotificationItem) => {
    if (n.read) return;
    storageService.markNotificationRead(n.id);
    refreshData();
  };

  const handleDeleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.deleteNotification(id);
    refreshData();
  };

  const handleNotifOpenLink = (n: NotificationItem) => {
    storageService.markNotificationRead(n.id);
    navigate(n.link || '/dashboard');
  };

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#0F172A] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#2563EB]" /> Practice Notifications & Activity Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time practice alerts, patient encounters, prescription issuances, pharmacy reorder warnings, and financial billing settlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-gold text-xs py-2 px-4 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-white" /> Mark All as Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="glass-panel p-4 border-slate-200/80 bg-white shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by title, patient, invoice #, or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-10 text-xs"
            />
          </div>

          {/* Unread Toggle */}
          <div className="flex items-center justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Show Unread Only ({unreadCount})</span>
            </label>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'appointment', label: 'Appointments' },
            { id: 'billing', label: 'Billing & Payments' },
            { id: 'pharmacy', label: 'Pharmacy Inventory' },
            { id: 'lab', label: 'Lab Diagnostics' },
            { id: 'prescription', label: 'Prescriptions' },
            { id: 'patient', label: 'Patients EHR' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                activeTab === tab.id ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Notifications List */}
      <div className="glass-panel border-slate-200/80 overflow-hidden bg-white shadow-sm">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotifOpenLink(n)}
                className={`p-4 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                  !n.read ? 'bg-blue-50/40 hover:bg-blue-50' : 'bg-white hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getNotifIcon(n.type, n.priority)}</div>

                  <div>
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" title="Unread" />}
                      <h4 className={`text-sm ${!n.read ? 'font-extrabold text-[#0F172A]' : 'font-bold text-slate-800'}`}>
                        {n.title}
                      </h4>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border font-mono ${
                          n.priority === 'critical' || n.priority === 'warning'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : n.priority === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-blue-50 text-[#2563EB] border-blue-200'
                        }`}
                      >
                        {n.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.desc}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                      {getRelativeTime(n.createdAt)} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRead(n);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                      !n.read
                        ? 'bg-white text-[#2563EB] border-blue-200 hover:bg-blue-50'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {!n.read ? 'Mark Read' : 'Read'}
                  </button>
                  <button
                    onClick={(e) => handleDeleteNotif(n.id, e)}
                    className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-serif font-bold text-slate-700">You're All Caught Up</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching activity notifications found for the selected category filter.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setActiveTab('all');
                setUnreadOnly(false);
              }}
              className="btn-secondary text-xs py-1.5 px-3 cursor-pointer mt-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
