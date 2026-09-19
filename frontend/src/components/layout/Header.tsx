import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storageService, NotificationItem } from '../../services/storageService';
import {
  Search,
  Bell,
  Building2,
  User as UserIcon,
  LogOut,
  Shield,
  ChevronDown,
  Check,
  AlertTriangle,
  Calendar,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  Pill,
  FlaskConical,
  IndianRupee,
  Receipt,
  UserPlus,
  ArrowRight
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, clinic, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Live Refresh Trigger State
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const refreshData = () => setRefreshKey((prev) => prev + 1);

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    let isMounted = true;
    storageService.fetchNotifications(user?._id).then(() => {
      if (isMounted) refreshData();
    });
    const interval = setInterval(() => {
      storageService.fetchNotifications(user?._id).then(() => {
        if (isMounted) refreshData();
      });
    }, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?._id, notifOpen]);

  // Fetch Live Notifications and Unread Count
  const notifications: NotificationItem[] = useMemo(
    () => storageService.getNotifications(user?._id),
    [user?._id, notifOpen, refreshKey]
  );

  const unreadCount = useMemo(
    () => storageService.getUnreadNotifCount(user?._id),
    [user?._id, notifOpen, refreshKey]
  );

  // Icon Helper per Notification Type
  const getNotifIcon = (type: string, priority: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />;
      case 'billing':
      case 'payment':
        return <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      case 'pharmacy':
        return <Pill className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'lab':
        return <FlaskConical className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />;
      case 'prescription':
        return <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;
      case 'patient':
        return <UserPlus className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
    }
  };

  // Format Relative Timestamp
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

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsRead();
    refreshData();
  };

  const handleNotifClick = (n: NotificationItem) => {
    storageService.markNotificationRead(n.id);
    setNotifOpen(false);
    navigate(n.link || '/dashboard');
    refreshData();
  };

  return (
    <header className="h-20 border-b border-slate-200/80 bg-white px-8 flex items-center justify-between sticky top-0 z-30 font-sans shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clinical records, doctors, patients..."
            className="w-full glass-input pl-10 pr-4 py-2 text-sm text-[#0F172A] placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-5">
        {/* Active Practice Badge */}
        {clinic && (
          <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 shadow-sm">
            <Building2 className="w-4 h-4 text-[#2563EB]" />
            <span className="max-w-[160px] truncate text-[#0F172A] font-semibold">{clinic.name}</span>
            <span className="uppercase text-[10px] bg-[#F0F6FF] text-[#2563EB] border border-[#2563EB]/30 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
              {clinic.subscriptionTier?.replace('_', ' ') || 'PROFESSIONAL'}
            </span>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setDropdownOpen(false);
              refreshData();
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Practice Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#2563EB] rounded-full animate-ping"></span>
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 bg-[#2563EB] text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center px-1 border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-96 bg-white p-4 shadow-2xl z-50 border border-slate-200 rounded-2xl animate-fade-in-scale text-[#0F172A]">
              <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#2563EB]" /> Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-mono font-bold bg-blue-50 text-[#2563EB] border border-blue-200 px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#2563EB] font-semibold hover:underline cursor-pointer font-mono"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 relative ${
                        !n.read
                          ? 'bg-blue-50/50 border-blue-200/80 hover:bg-blue-50'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                      }`}
                    >
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-1.5" title="Unread" />
                      )}
                      {getNotifIcon(n.type, n.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${!n.read ? 'font-bold text-[#0F172A]' : 'font-semibold text-slate-700'}`}>
                            {n.title}
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono ml-2 shrink-0">
                            {getRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-2">{n.desc}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-mono space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">You're all caught up</p>
                    <p className="text-[11px]">No active practice alerts recorded.</p>
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/notifications');
                  }}
                  className="text-xs text-[#2563EB] hover:underline font-semibold font-mono cursor-pointer inline-flex items-center gap-1"
                >
                  View All Notifications <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200/80 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-900 font-sans font-bold flex items-center justify-center text-sm shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-sm font-semibold text-[#0F172A] leading-tight">{user?.name || 'Practitioner'}</div>
              <div className="text-[11px] text-[#2563EB] font-mono tracking-wider uppercase font-bold leading-tight">{user?.role || 'Owner'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-60 bg-white p-2.5 shadow-2xl z-50 border border-slate-200 rounded-2xl animate-fade-in-scale">
              <div className="px-3 py-2.5 border-b border-slate-200 mb-1 bg-slate-50 rounded-xl">
                <p className="text-sm font-semibold text-[#0F172A]">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-[#2563EB] font-bold uppercase tracking-wider">
                  <Shield className="w-3 h-3 text-[#2563EB]" /> Access: {user?.role}
                </div>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer mt-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
