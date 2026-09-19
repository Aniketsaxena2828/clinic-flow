import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  Mail,
  Phone,
  Loader2,
  X,
  Eye,
  Edit2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Check,
  Sliders,
  Calendar,
  Building2,
  Briefcase,
  History,
  Send,
  UserPlus,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { storageService, StaffMember, StaffPermissions, getDefaultPermissionsForRole, getTodayLocalDateStr } from '../services/storageService';

export const StaffPage: React.FC = () => {
  const todayStr = getTodayLocalDateStr();

  // State Management
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Active Selected Staff
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Provision Form State
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleName: 'Receptionist' as StaffMember['roleName'],
    department: 'Front Desk Operations',
    designation: 'Receptionist',
    joiningDate: todayStr,
    status: 'Active' as StaffMember['status']
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    roleName: 'Receptionist' as StaffMember['roleName'],
    department: '',
    designation: '',
    status: 'Active' as StaffMember['status']
  });

  // Permissions Form State
  const [permissionsForm, setPermissionsForm] = useState<StaffPermissions>({
    dashboard: true,
    patients: true,
    doctors: false,
    appointments: true,
    prescriptions: false,
    billing: true,
    pharmacy: false,
    lab: false,
    staff: false,
    analytics: false,
    settings: false
  });

  useEffect(() => {
    fetchStaff();
  }, [search, roleFilter, statusFilter]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await storageService.fetchStaff();
      let list = data;

      // Apply Search
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (s: any) =>
            (s.name || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q) ||
            (s.roleName || '').toLowerCase().includes(q)
        );
      }

      if (roleFilter && roleFilter !== 'all') {
        list = list.filter((s: any) => s.roleName === roleFilter);
      }

      if (statusFilter && statusFilter !== 'all') {
        list = list.filter((s: any) => s.status === statusFilter);
      }

      setStaffList(list as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open Provision Modal
  const handleOpenProvisionModal = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roleName: 'Receptionist',
      department: 'Front Desk Operations',
      designation: 'Receptionist',
      joiningDate: todayStr,
      status: 'Active'
    });
    setProvisionModalOpen(true);
  };

  // Submit Provision Account
  const handleProvisionAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const generatedStaffId = 'STF-' + String(staffList.length + 1).padStart(3, '0');
    const defaultPerms = getDefaultPermissionsForRole(form.roleName);

    const newStaff: StaffMember = {
      _id: 'usr-' + Date.now(),
      staffId: generatedStaffId,
      name: fullName,
      email: form.email,
      phone: form.phone || '+91 98765 00000',
      roleName: form.roleName,
      department: form.department || 'General Administration',
      designation: form.designation || form.roleName,
      joiningDate: form.joiningDate || todayStr,
      status: form.status,
      lastActive: form.status === 'Active' ? 'Just Now' : `Invited ${todayStr}`,
      permissions: defaultPerms,
      activityLogs: [
        { action: 'Account Provisioned', timestamp: todayStr, actor: 'Owner/Admin' }
      ]
    };

    try {
      await api.post('/staff', newStaff);
    } catch (err) {
      console.error(err);
    }

    setProvisionModalOpen(false);
    fetchStaff();
  };

  // Open Edit Modal
  const handleOpenEditModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      roleName: staff.roleName,
      department: staff.department || '',
      designation: staff.designation || '',
      status: staff.status
    });
    setEditModalOpen(true);
  };

  // Submit Edit Staff
  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    let updatedPerms = selectedStaff.permissions;
    if (selectedStaff.roleName !== editForm.roleName) {
      updatedPerms = getDefaultPermissionsForRole(editForm.roleName);
    }

    const updated: StaffMember = {
      ...selectedStaff,
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      roleName: editForm.roleName,
      department: editForm.department,
      designation: editForm.designation,
      status: editForm.status,
      permissions: updatedPerms,
      activityLogs: [
        { action: 'Profile & Role Details Updated', timestamp: todayStr, actor: 'Owner/Admin' },
        ...(selectedStaff.activityLogs || [])
      ]
    };

    try {
      await api.put(`/staff/${selectedStaff._id}`, updated);
    } catch (err) {
      console.error(err);
    }

    setEditModalOpen(false);
    setSelectedStaff(null);
    fetchStaff();
  };

  // Open Access / Permissions Modal
  const handleOpenAccessModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setPermissionsForm(staff.permissions || getDefaultPermissionsForRole(staff.roleName));
    setAccessModalOpen(true);
  };

  // Save Permissions
  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    storageService.updateStaffPermissions(selectedStaff._id, permissionsForm);

    try {
      await api.put(`/staff/${selectedStaff._id}/permissions`, { permissions: permissionsForm });
    } catch (err) {
      console.error(err);
    }

    setAccessModalOpen(false);
    setSelectedStaff(null);
    fetchStaff();
  };

  // Real Delete Operation
  const handleConfirmDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      await storageService.deleteStaff(selectedStaff._id);
    } catch (err) {
      console.error(err);
    }

    setDeleteModalOpen(false);
    setSelectedStaff(null);
    fetchStaff();
  };

  // Summary Metrics Calculations — derived from fetched state
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter((s) => s.status === 'Active').length;
  const pendingStaffCount = staffList.filter((s) => s.status === 'Pending').length;
  const doctorsCount = staffList.filter((s) => s.roleName === 'Doctor').length;
  const otherStaffCount = staffList.filter((s) => s.roleName !== 'Doctor').length;

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#2563EB]" /> Staff Management & Access Control
          </h1>
          <p className="page-subtitle mt-1">
            Manage staff accounts, roles, permissions, and access to the clinic system.
          </p>
        </div>

        <button
          onClick={handleOpenProvisionModal}
          className="btn-gold shrink-0"
        >
          <Plus className="w-4 h-4 text-white" /> + PROVISION NEW ACCOUNT
        </button>
      </div>

      {/* Summary Cards Grid (5 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Staff</span>
          <p className="text-2xl font-serif font-bold text-[#0F172A] mt-2 font-mono">{totalStaffCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Provisioned system accounts</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Staff</span>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-2 font-mono">{activeStaffCount}</p>
          <p className="text-[10px] text-emerald-700 mt-1 font-semibold">Authorized active users</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Invitations</span>
          <p className="text-2xl font-serif font-bold text-amber-600 mt-2 font-mono">{pendingStaffCount}</p>
          <p className="text-[10px] text-amber-700 mt-1 font-semibold">Awaiting user setup</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Doctors</span>
          <p className="text-2xl font-serif font-bold text-blue-600 mt-2 font-mono">{doctorsCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Medical practitioners</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Other Staff</span>
          <p className="text-2xl font-serif font-bold text-purple-700 mt-2 font-mono">{otherStaffCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Admin, Reception & Labs</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row gap-4 items-center justify-between border-slate-200/80 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, staff ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-10 text-xs"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Doctor">Doctor</option>
              <option value="Nurse">Nurse</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Pharmacist">Pharmacist</option>
              <option value="Lab Technician">Lab Technician</option>
              <option value="Accountant">Accountant</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {(search || roleFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setStatusFilter('');
            }}
            className="text-xs text-[#2563EB] font-bold hover:underline font-mono shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Staff Accounts Data Table */}
      <div className="glass-panel border-slate-200/80 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-sans">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2563EB] mb-2" />
            Loading staff accounts...
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-serif font-bold text-[#0F172A]">No Staff Members</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Provision a new staff account to get started with role-based access control.
            </p>
            <button
              onClick={handleOpenProvisionModal}
              className="btn-gold text-xs cursor-pointer shadow-md bg-[#2563EB] text-white inline-flex items-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4 text-white" /> + PROVISION NEW ACCOUNT
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs font-sans text-[#0F172A]">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="p-4">STAFF</th>
                <th className="p-4">STAFF ID</th>
                <th className="p-4">EMAIL</th>
                <th className="p-4">PHONE</th>
                <th className="p-4">ROLE</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">LAST ACTIVE</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((member) => (
                <tr key={member._id} className="hover:bg-slate-50/80 transition">
                  {/* Staff Name & Dept */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-[#0F172A] font-serif font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-serif font-bold text-sm text-[#0F172A]">{member.name}</p>
                        <p className="text-[10px] text-slate-400 font-sans">{member.designation || member.department || 'Staff Member'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Staff ID */}
                  <td className="p-4 font-mono font-bold text-[#2563EB]">
                    {member.staffId || 'STF-001'}
                  </td>

                  {/* Email */}
                  <td className="p-4 font-mono text-slate-600">
                    {member.email}
                  </td>

                  {/* Phone */}
                  <td className="p-4 font-mono text-slate-600">
                    {member.phone || '+91 98765 12345'}
                  </td>

                  {/* Role */}
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200 font-mono">
                      {member.roleName || 'Unassigned'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        member.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : member.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : member.status === 'Suspended'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>

                  {/* Last Active */}
                  <td className="p-4 text-slate-500 font-mono text-[11px]">
                    {member.lastActive || 'Today'}
                  </td>

                  {/* Actions: View | Edit | Manage Access | Delete */}
                  <td className="p-4 text-right space-x-1.5">
                    {/* View */}
                    <button
                      onClick={() => {
                        setSelectedStaff(member);
                        setViewModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1 border border-blue-200 cursor-pointer"
                      title="View Profile & Access"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(member)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold inline-flex items-center gap-1 border border-slate-200 cursor-pointer"
                      title="Edit Staff Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>

                    {/* Manage Access */}
                    <button
                      onClick={() => handleOpenAccessModal(member)}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold inline-flex items-center gap-1 border border-purple-200 cursor-pointer"
                      title="Configure Module Access"
                    >
                      <Shield className="w-3.5 h-3.5" /> Manage Access
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        setSelectedStaff(member);
                        setDeleteModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold inline-flex items-center gap-1 border border-rose-200 cursor-pointer"
                      title="Permanently Delete Staff Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PROVISION NEW ACCOUNT MODAL (Rendered via Portal) */}
      {provisionModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            
            {/* Modal Header */}
            <div className="flex-none p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#2563EB]" /> Provision New Staff Account
              </h2>
              <button onClick={() => setProvisionModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleProvisionAccount} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Personal Information */}
              <div className="space-y-3">
                <span className="text-[11px] font-serif font-bold text-[#0F172A] uppercase tracking-wider block">
                  Personal Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sharma"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="vikram@democlinic.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-serif font-bold text-[#0F172A] uppercase tracking-wider block">
                  Professional Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Pathology Lab"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="Senior Lab Technologist"
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Access Status */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-serif font-bold text-[#0F172A] uppercase tracking-wider block">
                  Role Assignment & Account Status
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned RBAC Role *</label>
                    <select
                      value={form.roleName}
                      onChange={(e) => setForm({ ...form, roleName: e.target.value as any })}
                      className="w-full glass-input text-xs font-bold text-[#2563EB]"
                    >
                      <option value="Owner">Owner (Full Access)</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Nurse">Nurse</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Pharmacist">Pharmacist</option>
                      <option value="Lab Technician">Lab Technician</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Initial Account Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      className="w-full glass-input text-xs"
                    >
                      <option value="Active">Active Immediate Access</option>
                      <option value="Pending">Pending Setup / Invitation</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setProvisionModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>CREATE ACCOUNT</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* VIEW STAFF PROFILE & ACCESS MODAL (Rendered via Portal) */}
      {viewModalOpen && selectedStaff && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            <div className="flex-none p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <h3 className="font-serif font-bold text-white text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#2563EB]" /> Staff Account Specifications
              </h3>
              <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] font-serif font-bold flex items-center justify-center text-lg shadow-sm">
                    {selectedStaff.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#0F172A]">{selectedStaff.name}</h2>
                    <p className="text-xs text-[#2563EB] font-semibold">{selectedStaff.designation || selectedStaff.roleName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">ID: {selectedStaff.staffId || 'STF-001'} • {selectedStaff.email}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  {selectedStaff.status}
                </span>
              </div>

              {/* Account Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Role</span>
                  <p className="font-bold text-slate-900">{selectedStaff.roleName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Department</span>
                  <p className="font-bold text-slate-900">{selectedStaff.department || 'General'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Joining Date</span>
                  <p className="font-mono text-slate-700">{selectedStaff.joiningDate || '2023-01-01'}</p>
                </div>
              </div>

              {/* Module Access Checklist */}
              <div>
                <h4 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                  Module Authorization Matrix
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {Object.entries(selectedStaff.permissions || getDefaultPermissionsForRole(selectedStaff.roleName)).map(([modKey, isAllowed]) => (
                    <div key={modKey} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                      <span className="capitalize font-medium text-slate-700">{modKey}</span>
                      {isAllowed ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> ✓</span>
                      ) : (
                        <span className="text-rose-500 font-bold flex items-center gap-0.5"><X className="w-3.5 h-3.5" /> ✕</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Audit Log */}
              {selectedStaff.activityLogs && selectedStaff.activityLogs.length > 0 && (
                <div>
                  <h4 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                    Security Activity Log
                  </h4>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {selectedStaff.activityLogs.map((log, lIdx) => (
                      <div key={lIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
                        <span className="text-slate-700">{log.action} (by {log.actor})</span>
                        <span className="text-slate-400">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-none p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setViewModalOpen(false)} className="btn-secondary text-xs py-1.5 px-4 cursor-pointer">
                Close Specifications
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MANAGE ACCESS / PERMISSIONS MODAL (Rendered via Portal) */}
      {accessModalOpen && selectedStaff && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-lg max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            <div className="flex-none p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <h3 className="font-serif font-bold text-white text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" /> Configure Module Authorization Permissions
              </h3>
              <button onClick={() => setAccessModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-sm text-[#0F172A]">{selectedStaff.name}</p>
                <p className="text-xs text-slate-500 font-mono">Role: {selectedStaff.roleName} • Staff ID: {selectedStaff.staffId}</p>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-serif font-bold text-[#0F172A] uppercase tracking-wider block">
                  Toggle Module Access Permissions
                </span>

                <div className="space-y-1.5">
                  {Object.entries(permissionsForm).map(([modKey, isAllowed]) => (
                    <div key={modKey} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 capitalize text-xs">{modKey} Module</span>
                        <p className="text-[10px] text-slate-400 font-mono">Grant access to {modKey} navigation & actions</p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAllowed}
                          onChange={(e) => setPermissionsForm({ ...permissionsForm, [modKey]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAccessModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Save Permissions</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT STAFF MODAL (Rendered via Portal) */}
      {editModalOpen && selectedStaff && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-lg max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            <div className="flex-none p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#2563EB]" /> Edit Staff Account Details
              </h2>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">RBAC Role</label>
                  <select
                    value={editForm.roleName}
                    onChange={(e) => setEditForm({ ...editForm, roleName: e.target.value as any })}
                    className="w-full glass-input text-xs font-bold text-[#2563EB]"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Lab Technician">Lab Technician</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full glass-input text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CONFIRMATION PERMANENT DELETE MODAL (Rendered via Portal) */}
      {deleteModalOpen && selectedStaff && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="glass-panel w-full max-w-md p-6 border border-slate-200 shadow-2xl relative bg-white text-[#0F172A] rounded-2xl">
            <button onClick={() => setDeleteModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-serif font-bold text-rose-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" /> Confirm Permanent Staff Deletion
            </h3>
            
            {/* Target Staff Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-1 text-xs font-mono">
              <p><span className="text-slate-500 font-sans">Staff Name:</span> <strong className="text-[#0F172A]">{selectedStaff.name}</strong></p>
              <p><span className="text-slate-500 font-sans">Staff ID:</span> <strong className="text-[#2563EB]">{selectedStaff.staffId || 'STF-001'}</strong></p>
              <p><span className="text-slate-500 font-sans">Email Address:</span> <span className="text-slate-700">{selectedStaff.email}</span></p>
              <p><span className="text-slate-500 font-sans">Assigned Role:</span> <span className="text-slate-700">{selectedStaff.roleName}</span></p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently delete this staff account? This will remove the user's login record from the staff directory while preserving all historical patient, appointment, and medical records intact.
            </p>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer hover:border-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-rose-600 text-white hover:bg-rose-700 font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
