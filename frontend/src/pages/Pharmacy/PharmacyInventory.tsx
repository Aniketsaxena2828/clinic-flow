import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  Pill,
  Plus,
  Search,
  AlertTriangle,
  Package,
  Loader2,
  X,
  Edit2,
  Eye,
  Sliders,
  CheckCircle2,
  Calendar,
  Building2,
  TrendingUp,
  Tag,
  Hash,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { Medicine } from '../../types';
import { storageService, getTodayLocalDateStr } from '../../services/storageService';

export const PharmacyInventory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialStatusParam = searchParams.get('status') || '';
  const todayStr = getTodayLocalDateStr();

  // Calculate 90 days from today for "Expiring Soon" threshold
  const thresholdDateObj = new Date();
  thresholdDateObj.setDate(thresholdDateObj.getDate() + 90);
  const expiringSoonThresholdStr = `${thresholdDateObj.getFullYear()}-${String(thresholdDateObj.getMonth() + 1).padStart(2, '0')}-${String(thresholdDateObj.getDate()).padStart(2, '0')}`;

  // State Management
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState(initialStatusParam);
  const [expiryFilter, setExpiryFilter] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<any | null>(null);
  const [viewingMed, setViewingMed] = useState<any | null>(null);
  const [adjustingMed, setAdjustingMed] = useState<any | null>(null);
  const [deletingMed, setDeletingMed] = useState<any | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    genericName: '',
    brand: '',
    category: 'Analgesic',
    unit: 'Tablet',
    batchNumber: 'PCM-2026-01',
    mfgDate: todayStr,
    expiryDate: '2027-12-31',
    stockQuantity: 100,
    reorderLevel: 20,
    purchasePrice: 15,
    unitPrice: 20,
    supplier: 'Apollo Pharma Wholesale',
    supplierContact: '+91 98765 00011'
  });

  // Stock Adjustment Form State
  const [adjustForm, setAdjustForm] = useState({
    adjustmentType: 'add',
    qtyChange: 10,
    reason: 'Stock Received from Distributor'
  });

  useEffect(() => {
    fetchInventory();
  }, [search, categoryFilter, stockStatusFilter, expiryFilter]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const medList = await storageService.fetchPharmacy();
      let list = medList;

      // Apply Search
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (m: any) =>
            (m.name || '').toLowerCase().includes(q) ||
            (m.brand || '').toLowerCase().includes(q) ||
            (m.batchNumber || '').toLowerCase().includes(q)
        );
      }

      // Apply Category Filter
      if (categoryFilter) {
        list = list.filter((m: any) => m.category === categoryFilter);
      }

      // Apply Stock Status Filter
      if (stockStatusFilter) {
        list = list.filter((m: any) => {
          const qty = m.stockQuantity || 0;
          const reorder = m.reorderLevel || m.minStockAlert || 20;
          if (stockStatusFilter === 'Out of Stock') return qty === 0;
          if (stockStatusFilter === 'Low Stock') return qty > 0 && qty <= reorder;
          if (stockStatusFilter === 'In Stock') return qty > reorder;
          return true;
        });
      }

      // Apply Expiry Status Filter
      if (expiryFilter) {
        list = list.filter((m: any) => {
          const exp = m.expiryDate || '';
          if (expiryFilter === 'Expired') return exp && exp < todayStr;
          if (expiryFilter === 'Expiring Soon') return exp && exp >= todayStr && exp <= expiringSoonThresholdStr;
          if (expiryFilter === 'Normal') return exp && exp > expiringSoonThresholdStr;
          return true;
        });
      }

      setMedicines(list);
    } catch (err) {
      console.error('Failed to fetch pharmacy inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingMed(null);
    setForm({
      name: '',
      genericName: '',
      brand: '',
      category: 'Analgesic',
      unit: 'Tablet',
      batchNumber: 'BATCH-2026-' + Math.floor(10 + Math.random() * 90),
      mfgDate: todayStr,
      expiryDate: '2027-12-31',
      stockQuantity: 100,
      reorderLevel: 20,
      purchasePrice: 15,
      unitPrice: 20,
      supplier: 'Apollo Pharma Wholesale',
      supplierContact: '+91 98765 00011'
    });
    setIsAddModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (med: any) => {
    setEditingMed(med);
    setForm({
      name: med.name || '',
      genericName: med.genericName || '',
      brand: med.brand || '',
      category: med.category || 'Analgesic',
      unit: med.unit || 'Tablet',
      batchNumber: med.batchNumber || '',
      mfgDate: med.mfgDate || todayStr,
      expiryDate: med.expiryDate || '2027-12-31',
      stockQuantity: med.stockQuantity || 0,
      reorderLevel: med.reorderLevel || 20,
      purchasePrice: med.purchasePrice || 10,
      unitPrice: med.unitPrice || 15,
      supplier: med.supplier || 'Apollo Pharma Wholesale',
      supplierContact: med.supplierContact || '+91 98765 00011'
    });
    setIsAddModalOpen(true);
  };

  // Save Batch (Add / Edit)
  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      genericName: form.genericName || form.name,
      brand: form.brand || 'Generic',
      category: form.category,
      unit: form.unit,
      batchNumber: form.batchNumber,
      mfgDate: form.mfgDate,
      expiryDate: form.expiryDate,
      stockQuantity: Number(form.stockQuantity),
      reorderLevel: Number(form.reorderLevel),
      minStockAlert: Number(form.reorderLevel),
      purchasePrice: Number(form.purchasePrice),
      unitPrice: Number(form.unitPrice),
      mrp: Number(form.unitPrice) * 1.2,
      supplier: form.supplier,
      supplierContact: form.supplierContact
    };

    try {
      if (editingMed) {
        await api.put(`/pharmacy/medicines/${editingMed._id}`, payload);
      } else {
        await api.post('/pharmacy/medicines', payload);
      }
    } catch (err) {
      console.error(err);
    }

    setIsAddModalOpen(false);
    fetchInventory();
  };

  // Submit Stock Adjustment
  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingMed) return;

    let qtyChange = Number(adjustForm.qtyChange);
    if (adjustForm.adjustmentType === 'subtract' || adjustForm.adjustmentType === 'damage') {
      qtyChange = -Math.abs(qtyChange);
    } else {
      qtyChange = Math.abs(qtyChange);
    }

    try {
      await api.patch(`/pharmacy/medicines/${adjustingMed._id}/stock`, { qtyChange });
    } catch (err) {
      console.error('Stock adjustment failed:', err);
    }

    setAdjustingMed(null);
    fetchInventory();
  };

  // Confirm Delete Medicine from Inventory
  const handleConfirmDeleteMedicine = async () => {
    if (!deletingMed) return;
    try {
      await api.delete(`/pharmacy/medicines/${deletingMed._id}`);
    } catch (err) {
      console.error('Failed to delete medicine:', err);
    }
    setDeletingMed(null);
    fetchInventory();
  };

  // Helper Stock Status Evaluator
  const getStockBadge = (med: any) => {
    const qty = med.stockQuantity || 0;
    const reorder = med.reorderLevel || med.minStockAlert || 20;

    if (qty === 0) {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Out of Stock</span>;
    }
    if (qty <= reorder) {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Low Stock</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">In Stock</span>;
  };

  // Helper Expiry Evaluator
  const getExpiryBadge = (med: any) => {
    const exp = med.expiryDate || '';
    if (!exp) return null;

    if (exp < todayStr) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 font-mono">Expired ({exp})</span>;
    }
    if (exp <= expiringSoonThresholdStr) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 font-mono">Expiring Soon ({exp})</span>;
    }
    return <span className="text-slate-600 font-mono text-xs">{exp}</span>;
  };

  // Calculated Dashboard Metrics — derived from React state (backed by MongoDB)
  const totalMedicinesCount = medicines.length;
  const totalStockUnits = medicines.reduce((sum, m: any) => sum + (Number(m.stockQuantity) || 0), 0);
  const lowStockCount = medicines.filter((m: any) => (m.stockQuantity || 0) <= (m.reorderLevel || 20) && (m.stockQuantity || 0) > 0).length;
  const expiringSoonCount = medicines.filter((m: any) => m.expiryDate && m.expiryDate >= todayStr && m.expiryDate <= expiringSoonThresholdStr).length;
  const expiredCount = medicines.filter((m: any) => m.expiryDate && m.expiryDate < todayStr).length;

  return (
    <div className="space-y-6 animate-fade-in-scale font-sans text-[#0F172A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="page-title text-[#0F172A] flex items-center gap-2">
            <Pill className="w-6 h-6 text-[#2563EB]" /> Pharmacy Stock & Inventory
          </h1>
          <p className="page-subtitle mt-1">
            Medicine inventory, batch tracking, expiry monitoring and stock management
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn-gold shrink-0"
        >
          <Plus className="w-4 h-4 text-white" /> + ADD MEDICINE BATCH
        </button>
      </div>

      {/* Summary Cards Grid (5 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Medicines</span>
          <p className="text-2xl font-serif font-bold text-[#0F172A] mt-2 font-mono">{totalMedicinesCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Unique active SKUs</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Stock Units</span>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-2 font-mono">{totalStockUnits.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Physical stock quantity</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Low Stock Items</span>
          <p className="text-2xl font-serif font-bold text-amber-600 mt-2 font-mono">{lowStockCount}</p>
          <p className="text-[10px] text-amber-700 mt-1 font-semibold">At or below reorder level</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expiring Soon</span>
          <p className="text-2xl font-serif font-bold text-amber-600 mt-2 font-mono">{expiringSoonCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Within 90 days</p>
        </div>

        <div className="glass-panel p-5 border-slate-200/80 bg-white shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expired Items</span>
          <p className="text-2xl font-serif font-bold text-rose-600 mt-2 font-mono">{expiredCount}</p>
          <p className="text-[10px] text-rose-600 mt-1 font-semibold">Requires immediate removal</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row gap-4 items-center justify-between border-slate-200/80 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine, brand, generic, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-10 text-xs"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Categories</option>
              <option value="Analgesic">Analgesic</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Antipyretic">Antipyretic</option>
              <option value="Vitamins">Vitamins</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Stock Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Expiry Filter */}
          <div>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full glass-input text-xs"
            >
              <option value="">All Expiry Statuses</option>
              <option value="Normal">Normal Expiry</option>
              <option value="Expiring Soon">Expiring Soon (90 Days)</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {(search || categoryFilter || stockStatusFilter || expiryFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setStockStatusFilter('');
              setExpiryFilter('');
            }}
            className="text-xs text-[#2563EB] font-bold hover:underline font-mono shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Inventory Data Table */}
      <div className="glass-panel border-slate-200/80 overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-sans">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2563EB] mb-2" />
            Loading pharmacy inventory...
          </div>
        ) : medicines.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-serif font-bold text-[#0F172A]">No medicines in inventory</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your first medicine batch to begin managing pharmacy stock, reorder levels, and expiry alerts.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="btn-gold text-xs cursor-pointer shadow-md bg-[#2563EB] text-white inline-flex items-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4 text-white" /> + ADD MEDICINE BATCH
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs font-sans text-[#0F172A]">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="p-4">MEDICINE & BRAND</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4">BATCH #</th>
                <th className="p-4">EXPIRY DATE</th>
                <th className="p-4">STOCK LEVEL</th>
                <th className="p-4">UNIT PRICE</th>
                <th className="p-4">SUPPLIER</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.map((med) => (
                <tr key={med._id} className="hover:bg-slate-50/80 transition">
                  {/* Medicine Name & Brand */}
                  <td className="p-4">
                    <p className="font-serif font-bold text-sm text-[#0F172A]">{med.name}</p>
                    <p className="text-[10px] text-[#2563EB] font-semibold">{med.brand || med.manufacturer || 'Generic'}</p>
                    {med.genericName && (
                      <p className="text-[10px] text-slate-400 font-mono italic">Generic: {med.genericName}</p>
                    )}
                  </td>

                  {/* Category */}
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {med.category || 'General'}
                    </span>
                  </td>

                  {/* Batch Number */}
                  <td className="p-4 font-mono font-bold text-[#2563EB]">
                    {med.batchNumber || 'N/A'}
                  </td>

                  {/* Expiry Date */}
                  <td className="p-4">
                    {getExpiryBadge(med)}
                  </td>

                  {/* Stock Level */}
                  <td className="p-4">
                    <p className="font-mono font-bold text-[#0F172A]">{med.stockQuantity || 0} {med.unit || 'Units'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Reorder at: {med.reorderLevel || med.minStockAlert || 20}</p>
                  </td>

                  {/* Unit Price */}
                  <td className="p-4 font-mono font-bold text-[#0F172A]">
                    ₹{med.unitPrice?.toLocaleString()}
                  </td>

                  {/* Supplier */}
                  <td className="p-4 text-slate-600 font-medium">
                    {med.supplier || 'Apollo Wholesale'}
                  </td>

                  {/* Status Badge */}
                  <td className="p-4">
                    {getStockBadge(med)}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right space-x-1.5">
                    <button
                      onClick={() => setViewingMed(med)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1 border border-blue-200 cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(med)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold inline-flex items-center gap-1 border border-slate-200 cursor-pointer"
                      title="Edit Batch"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setAdjustingMed(med);
                        setAdjustForm({ adjustmentType: 'add', qtyChange: 10, reason: 'Stock Received' });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1 border border-emerald-200 cursor-pointer"
                      title="Adjust Stock"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Adjust
                    </button>
                    <button
                      onClick={() => setDeletingMed(med)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold inline-flex items-center gap-1 border border-rose-200 cursor-pointer"
                      title="Delete Medicine"
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD / EDIT MEDICINE BATCH MODAL (Rendered via Portal) */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            
            {/* Modal Header */}
            <div className="flex-none p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#2563EB]" />
                <span>{editingMed ? 'Edit Medicine Batch' : 'Add New Medicine Batch'}</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveBatch} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Medicine Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 650mg"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol IP"
                    value={form.genericName}
                    onChange={(e) => setForm({ ...form, genericName: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand / Manufacturer</label>
                  <input
                    type="text"
                    placeholder="Cipla Ltd"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full glass-input text-xs"
                  >
                    <option value="Analgesic">Analgesic</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Antipyretic">Antipyretic</option>
                    <option value="Vitamins">Vitamins</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage Form / Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full glass-input text-xs"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Strip">Strip</option>
                  </select>
                </div>
              </div>

              {/* Batch Information */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[11px] font-semibold text-slate-700 block">Batch & Expiry Controls</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Batch Number *</label>
                    <input
                      type="text"
                      required
                      value={form.batchNumber}
                      onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                      className="w-full glass-input text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Mfg Date</label>
                    <input
                      type="date"
                      value={form.mfgDate}
                      onChange={(e) => setForm({ ...form, mfgDate: e.target.value })}
                      className="w-full glass-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={form.expiryDate}
                      onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                      className="w-full glass-input text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Quantities & Pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Qty (Units)</label>
                  <input
                    type="number"
                    required
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    required
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono font-bold text-[#2563EB]"
                  />
                </div>
              </div>

              {/* Supplier Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full glass-input text-xs"
                    placeholder="Apollo Pharma Wholesale"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Contact</label>
                  <input
                    type="text"
                    value={form.supplierContact}
                    onChange={(e) => setForm({ ...form, supplierContact: e.target.value })}
                    className="w-full glass-input text-xs font-mono"
                    placeholder="+91 98765 00011"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white font-bold"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{editingMed ? 'Update Medicine Batch' : 'ADD MEDICINE BATCH'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* VIEW MEDICINE DETAILS MODAL (Rendered via Portal) */}
      {viewingMed && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-lg max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0F172A] relative">
            <div className="flex-none p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <h3 className="font-serif font-bold text-white text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#2563EB]" /> Medicine Batch Specifications
              </h3>
              <button onClick={() => setViewingMed(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#0F172A]">{viewingMed.name}</h2>
                  <p className="text-xs text-[#2563EB] font-semibold">{viewingMed.brand || viewingMed.manufacturer}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Generic: {viewingMed.genericName || viewingMed.name}</p>
                </div>
                <div className="text-right">
                  {getStockBadge(viewingMed)}
                  <div className="mt-1">{getExpiryBadge(viewingMed)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Batch Number</span>
                  <p className="font-mono font-bold text-sm text-[#2563EB]">{viewingMed.batchNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Category & Form</span>
                  <p className="font-bold text-xs text-[#0F172A]">{viewingMed.category} ({viewingMed.unit || 'Tablet'})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Mfg Date</span>
                  <p className="font-mono text-xs text-slate-700">{viewingMed.mfgDate || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Expiry Date</span>
                  <p className="font-mono text-xs text-slate-700">{viewingMed.expiryDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Current Stock</span>
                  <p className="text-base font-bold text-[#0F172A] mt-0.5">{viewingMed.stockQuantity} Units</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Reorder Level</span>
                  <p className="text-base font-bold text-amber-600 mt-0.5">{viewingMed.reorderLevel || 20} Units</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Selling Price</span>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">₹{viewingMed.unitPrice}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Distributor / Supplier Details</span>
                <p className="font-bold text-xs text-[#0F172A]">{viewingMed.supplier || 'Apollo Wholesale Pharma'}</p>
                <p className="text-xs text-slate-500 font-mono">Contact: {viewingMed.supplierContact || '+91 98765 00011'}</p>
              </div>
            </div>

            <div className="flex-none p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setViewingMed(null)} className="btn-secondary text-xs py-1.5 px-4 cursor-pointer">
                Close Specifications
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* STOCK ADJUSTMENT MODAL (Rendered via Portal) */}
      {adjustingMed && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="glass-panel w-full max-w-md p-6 border border-slate-200 shadow-2xl relative bg-white text-[#0F172A] rounded-2xl">
            <button onClick={() => setAdjustingMed(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-serif font-bold text-[#0F172A] mb-1 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#2563EB]" /> Adjust Physical Stock
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-4">
              Medicine: <strong className="text-[#0F172A]">{adjustingMed.name}</strong> • Current Stock: <strong className="text-[#2563EB]">{adjustingMed.stockQuantity} Units</strong>
            </p>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Action</label>
                <select
                  value={adjustForm.adjustmentType}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
                  className="w-full glass-input text-xs"
                >
                  <option value="add">Stock Received (+ Add Units)</option>
                  <option value="subtract">Manual Correction (- Remove Units)</option>
                  <option value="damage">Damaged / Expired (- Remove Units)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Adjustment *</label>
                <input
                  type="number"
                  required
                  value={adjustForm.qtyChange}
                  onChange={(e) => setAdjustForm({ ...adjustForm, qtyChange: Number(e.target.value) })}
                  className="w-full glass-input text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Reason / Notes</label>
                <input
                  type="text"
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full glass-input text-xs"
                  placeholder="Stock Shipment Received / Audit Check"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustingMed(null)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 cursor-pointer shadow-md bg-[#2563EB] text-white"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingMed && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="glass-panel w-full max-w-sm p-6 border border-slate-200 shadow-2xl relative bg-white text-[#0F172A] rounded-2xl">
            <button onClick={() => setDeletingMed(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-serif font-bold text-rose-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Delete Medicine
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to permanently delete <strong className="text-[#0F172A]">{deletingMed.name}</strong> (Batch: <strong>{deletingMed.batchNumber}</strong>) from inventory? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeletingMed(null)}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteMedicine}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
