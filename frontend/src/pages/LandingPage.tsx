import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Users,
  Stethoscope,
  Calendar,
  FileText,
  CreditCard,
  Receipt,
  Pill,
  FlaskConical,
  BarChart3,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  UserCheck,
  Zap,
  TrendingUp,
  Layers,
  Check,
  ChevronRight,
  Menu,
  X,
  Database,
  Building2,
  Sparkles,
  Search,
  Bell,
  LayoutDashboard,
  Settings,
  Plus,
  UserPlus,
  IndianRupee,
  DollarSign,
  ChevronDown,
  RotateCw,
  ArrowLeft,
  Eye
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'screenshot' | 'active'>('screenshot');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#2563EB] selection:text-white relative">
      {/* Subtle Background Pattern Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">CLINICFLOW</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide">
                  Enterprise
                </span>
              </div>
              <span className="text-[11px] block font-medium text-slate-500 tracking-wider">
                Clinical Operating System
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#preview" className="hover:text-blue-600 transition-colors">Live Dashboard UI</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Core Pillars</a>
            <a href="#modules" className="hover:text-blue-600 transition-colors">Clinical Modules</a>
            <a href="#workflow" className="hover:text-blue-600 transition-colors">OPD Workflow</a>
            <a href="#security" className="hover:text-blue-600 transition-colors">Security & Multi-Tenancy</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/sign-in"
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 transition-all flex items-center gap-1.5 active:scale-95"
            >
              Create Account <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Live Dashboard UI
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Core Pillars
            </a>
            <a
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Clinical Modules
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              OPD Workflow
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Security & Multi-Tenancy
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/sign-in"
                className="w-full py-2.5 text-center text-xs font-bold text-slate-800 bg-slate-100 rounded-lg"
              >
                Sign In to Clinic
              </Link>
              <Link
                to="/sign-up"
                className="w-full py-2.5 text-center text-xs font-bold bg-blue-600 text-white rounded-lg shadow-sm"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 shadow-sm text-xs font-semibold text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Enterprise Multi-Tenant Clinical Practice System</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              The complete operating system for{' '}
              <span className="text-blue-600">modern medical practices.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Unify patient queue management, electronic medical records, digital prescriptions, in-house pharmacy dispensing, and GST-compliant invoicing into a seamless, high-security clinical platform.
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/sign-up"
                className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                Launch Your Clinic Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/sign-in"
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                Sign In to Existing Practice
              </Link>
            </div>

            {/* Key Clinical Trust Indicators */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Strict Tenant Isolation</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Real-Time OPD Queue</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">GST-Ready Invoicing</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Connected Pharmacy & Lab</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACTUAL CLINICFLOW DASHBOARD PRODUCT SHOWCASE */}
      <section id="preview" className="py-16 md:py-24 bg-white border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Actual Application Interface
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-3">
              The Real ClinicFlow Clinical Workspace
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Exact look and feel of the authenticated physician command center—with full multi-tenant isolation, live OPD queues, and integrated inventory.
            </p>

            {/* State Toggle Buttons */}
            <div className="mt-5 inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setPreviewMode('screenshot')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  previewMode === 'screenshot'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Practice Command Center (Standard View)
              </button>
              <button
                onClick={() => setPreviewMode('active')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  previewMode === 'active'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active OPD Queue View (With Encounters)
              </button>
            </div>
          </div>

          {/* REAL BROWSER SHELL & CLINICFLOW DASHBOARD */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden font-sans">
            {/* Realistic Browser Title Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs select-none">
              {/* Browser Tab */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400/90" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/90" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/90" />
                </div>
                <div className="bg-white px-3 py-1.5 rounded-t-lg border-t border-x border-slate-200 flex items-center gap-2 shadow-2xs">
                  <div className="w-3.5 h-3.5 rounded bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                    <Activity className="w-2.5 h-2.5" />
                  </div>
                  <span className="font-semibold text-slate-800 text-[11px]">ClinicFlow - Practice Management</span>
                  <span className="text-slate-400 hover:text-slate-600 ml-1 text-xs cursor-pointer">×</span>
                </div>
                <span className="text-slate-400 text-sm font-light px-1">+</span>
              </div>

              {/* Browser Status */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Encrypted TLS 1.3 • Multi-Tenant Isolated</span>
              </div>
            </div>

            {/* Browser Address Bar */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <ArrowLeft className="w-3.5 h-3.5" />
                <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                <RotateCw className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 bg-slate-100 hover:bg-slate-100/80 rounded-lg px-3 py-1.5 flex items-center justify-between text-slate-700 font-mono text-[11px] border border-slate-200">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>https://app.clinicflow.health/dashboard</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans">Tenant: demo-clinic</span>
              </div>
            </div>

            {/* ACTUAL CLINICFLOW APPLICATION INTERFACE */}
            <div className="flex min-h-[640px] bg-[#FAF9F6]">
              {/* SIDEBAR (Matching Sidebar.tsx) */}
              <aside className="w-64 border-r border-slate-200/80 bg-white text-[#0F172A] hidden lg:flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
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
                <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0F172A] flex items-center justify-center font-sans font-bold text-sm">
                    L
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-semibold text-[#0F172A] truncate font-sans">LifeCare Multi-Specialty...</div>
                    <div className="text-[11px] text-[#2563EB] font-mono truncate uppercase tracking-wider font-bold">DEMO-CLINIC</div>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto text-xs">
                  <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm bg-[#F0F6FF] text-[#1E3A8A] font-semibold border border-[#2563EB]/40 shadow-sm">
                    <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
                    <span>Dashboard</span>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm bg-white text-[#334155] font-medium hover:bg-slate-50 border border-transparent">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                    <span>Patients</span>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm bg-white text-[#334155] font-medium hover:bg-slate-50 border border-transparent">
                    <Stethoscope className="w-4 h-4 text-[#2563EB]" />
                    <span>Doctors</span>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm bg-white text-[#334155] font-medium hover:bg-slate-50 border border-transparent">
                    <Calendar className="w-4 h-4 text-[#2563EB]" />
                    <span>Appointments</span>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm bg-white text-[#334155] font-medium hover:bg-slate-50 border border-transparent">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    <span>Prescriptions</span>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm bg-white text-[#334155] font-medium hover:bg-slate-50 border border-transparent">
                    <CreditCard className="w-4 h-4 text-[#2563EB]" />
                    <span>Billing</span>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm bg-white text-[#334155] font-medium hover:bg-slate-50 border border-transparent">
                    <Pill className="w-4 h-4 text-[#2563EB]" />
                    <span>Pharmacy</span>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm bg-white text-[#334155] font-medium hover:bg-slate-50 border border-transparent">
                    <FlaskConical className="w-4 h-4 text-[#2563EB]" />
                    <span>Lab Diagnostics</span>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm bg-white text-[#334155] font-medium hover:bg-slate-50 border border-transparent">
                    <UserCheck className="w-4 h-4 text-[#2563EB]" />
                    <span>Staff Management</span>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm bg-white text-[#334155] font-medium hover:bg-slate-50 border border-transparent">
                    <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                    <span>Analytics</span>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm bg-white text-[#334155] font-medium hover:bg-slate-50 border border-transparent">
                    <Settings className="w-4 h-4 text-[#2563EB]" />
                    <span>Settings</span>
                  </div>
                </nav>

                {/* Footer Branding */}
                <div className="p-4 border-t border-slate-200/80 text-[11px] text-slate-400 text-center font-mono uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <span>ENTERPRISE CLINIC SAAS</span>
                  <Sparkles className="w-3 h-3 text-[#2563EB]" />
                </div>
              </aside>

              {/* MAIN APP WORKSPACE (Matching Header.tsx + Dashboard.tsx) */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* APP HEADER BAR (Matching Header.tsx) */}
                <header className="h-20 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-xs shrink-0">
                  {/* Global Search Bar */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        readOnly
                        placeholder="Search clinical records, doctors, patients..."
                        className="w-full bg-[#FAF9F6] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Top Right Profile & Quick Access */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Clinic Selector Pill */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <Building2 className="w-4 h-4 text-[#2563EB]" />
                      <span className="text-xs font-semibold text-slate-700 max-w-[140px] truncate">
                        LifeCare Multi-Speci...
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200 uppercase tracking-wider">
                        PROFESSIONAL
                      </span>
                    </div>

                    {/* Notification Bell */}
                    <div className="relative p-2 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-600">
                      <Bell className="w-4 h-4 text-[#2563EB]" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
                    </div>

                    {/* User Profile Area */}
                    <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                        D
                      </div>
                      <div className="hidden md:block text-left">
                        <div className="text-xs font-bold text-slate-900 leading-tight">Dr. Robert Ford (Owner)</div>
                        <div className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">OWNER</div>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </header>

                {/* DASHBOARD PAGE CONTENT (Matching Dashboard.tsx) */}
                <main className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
                  {/* 1. Greeting Banner & Quick Actions */}
                  <div className="glass-panel p-6 border-slate-200/80 bg-white shadow-sm">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] tracking-wider uppercase mb-1 font-mono">
                          <Building2 className="w-4 h-4 text-[#2563EB]" />
                          <span>LIFECARE MULTI-SPECIALTY CLINIC</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-mono text-xs">
                            SATURDAY, SEPTEMBER 19, 2026
                          </span>
                        </div>
                        <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
                          Good morning, Dr. Robert Ford (Owner)
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 max-w-xl">
                          Logged in as <span className="text-slate-900 font-semibold uppercase tracking-wider text-xs">OWNER</span>. Practice operational command overview.
                        </p>
                      </div>

                      {/* 4 Primary Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] text-white shadow-md flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-white" /> + Book Appt
                        </button>
                        <button className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-[#0F172A] shadow-xs flex items-center gap-1.5">
                          <UserPlus className="w-3.5 h-3.5 text-[#2563EB]" /> + Add Patient
                        </button>
                        <button className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-[#0F172A] shadow-xs flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" /> + Create Invoice
                        </button>
                        <button className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-[#0F172A] shadow-xs flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" /> + New Rx
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Key Operational KPIs Ribbon */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* KPI 1: Today's Appointments */}
                    <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB]">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          TODAY'S APPOINTMENTS
                        </span>
                      </div>
                      <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900 font-mono">
                          {previewMode === 'screenshot' ? '0' : '14'}
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                          {previewMode === 'screenshot' ? '0 Completed' : '8 Completed'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>{previewMode === 'screenshot' ? '0 Scheduled • 0 Active' : '4 Scheduled • 2 Active'}</span>
                      </div>
                    </div>

                    {/* KPI 2: Total Patient Records */}
                    <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB]">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          PATIENT DATABASE
                        </span>
                      </div>
                      <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900 font-mono">
                          {previewMode === 'screenshot' ? '0' : '382'}
                        </span>
                        <span className="text-xs text-blue-600 font-semibold">Active EHR Files</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>100% Isolated Data</span>
                      </div>
                    </div>

                    {/* KPI 3: Today's Realized Revenue */}
                    <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                          <IndianRupee className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          TODAY'S SETTLED REVENUE
                        </span>
                      </div>
                      <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900 font-mono">
                          {previewMode === 'screenshot' ? '₹0' : '₹18,450'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Settled Funds</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>{previewMode === 'screenshot' ? '0 Payments Collected' : '11 Payments Collected'}</span>
                      </div>
                    </div>

                    {/* KPI 4: Outstanding Receivables */}
                    <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          RECEIVABLES BALANCES
                        </span>
                      </div>
                      <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900 font-mono">
                          {previewMode === 'screenshot' ? '₹0' : '₹2,300'}
                        </span>
                        <span className="text-xs text-amber-600 font-semibold">Unpaid Balance</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
                        <span>Uncollected Invoices</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Operational Body Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2 Cols): Today's Schedule Queue */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-[#2563EB]" /> Today's Consultation Schedule & Live Queue
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 font-mono">
                              {previewMode === 'screenshot' ? '0' : '3'} Encounters Scheduled for Saturday, September 19, 2026
                            </p>
                          </div>

                          <span className="text-xs text-[#2563EB] font-semibold flex items-center gap-1">
                            Full Calendar <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        {/* Live Queue Items or Empty State (Matching Screenshot) */}
                        {previewMode === 'screenshot' ? (
                          <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-3">
                            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="text-xs font-semibold text-slate-600">No Appointments Scheduled for Today</p>
                            <button className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] text-white shadow-md">
                              + Book First Appointment
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 font-mono font-bold flex items-center justify-center">
                                  #14
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">Rahul Sharma</span>
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold text-[10px]">
                                      In Consultation
                                    </span>
                                  </div>
                                  <span className="text-slate-500 text-[11px]">10:30 AM • Dr. Kavita Mehta • Acute Bronchospasm</span>
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 rounded-lg">
                                Active Room 104
                              </span>
                            </div>
                            <div className="py-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-mono font-bold flex items-center justify-center">
                                  #15
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">Priya Nair</span>
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-semibold text-[10px]">
                                      Checked In (Waiting)
                                    </span>
                                  </div>
                                  <span className="text-slate-500 text-[11px]">11:00 AM • Dr. Kavita Mehta • Follow-up Review</span>
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-lg">
                                Next in Line
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column (1 Col): Doctors & Inventory Cards (Matching Screenshot) */}
                    <div className="space-y-6">
                      {/* Doctor Roster & Workload */}
                      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-[#2563EB]" /> Doctor Roster & Workload
                          </h3>
                          <span className="text-xs text-[#2563EB] font-semibold">
                            Manage
                          </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-[#0F172A]">Dr. Kavita Mehta</h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Available Today
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">Internal Medicine • Room #104</p>
                            </div>
                            <div className="text-right font-mono">
                              <span className="font-bold text-[#0F172A] block">
                                {previewMode === 'screenshot' ? '0 Appts' : '8 Appts'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-sans">Today's Load</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic & Pharmacy Alerts (Matching Screenshot) */}
                      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-4">
                        <h3 className="text-base font-semibold text-[#0F172A] flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Activity className="w-5 h-5 text-[#2563EB]" /> Diagnostic & Pharmacy Alerts
                        </h3>

                        {/* Pharmacy Inventory Status Card */}
                        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-900 text-xs flex items-center gap-1.5">
                              <Pill className="w-4 h-4 text-amber-600" /> Pharmacy Inventory Status
                            </span>
                            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              0 Reorders Needed
                            </span>
                          </div>
                          <p className="text-xs text-amber-800 leading-snug">
                            All pharmacy stock levels within safety limits.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Section */}
      <section id="features" className="py-20 md:py-28 bg-[#FAF9F6] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Architectural Excellence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for absolute reliability in clinical environments
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Every feature is built around the real constraints of high-volume medical facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Cryptographic Multi-Tenancy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete database row-level security isolation per clinic subdomain. No clinic can ever see or cross-query another tenant's records.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time Token Queue</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Eliminate waiting room chaos with automated sequential tokens, doctor capacity routing, and live display board synchronization.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">GST & Multi-Mode Billing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate compliant tax invoices with automatic CGST/SGST breakdowns, multi-item invoicing (OPD, pharmacy, lab), and instant receipts.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Closed-Loop Workflow</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prescriptions flow automatically from the doctor's desk to pharmacy dispensing and lab ordering without manual re-entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Core Modules Bento Grid */}
      <section id="modules" className="py-20 md:py-28 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Nine comprehensive modules in one integrated suite
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Everything your staff, clinicians, pharmacists, and administrators need on a daily basis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1 */}
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">1. Electronic Health Records</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comprehensive patient profiles, chronological clinical history, vital logs, allergies, and permanent digital medical charts.
              </p>
            </div>

            {/* Module 2 */}
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">2. Doctor Rosters & Scheduling</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Shift allocation, doctor availability, appointment slot limits, and multi-specialty OPD calendar management.
              </p>
            </div>

            {/* Module 3 */}
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">3. Smart Queue & Triage</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Auto-assigned tokens, walk-in registration, priority triage for emergencies, and live waiting room status updates.
              </p>
            </div>

            {/* Module 4 */}
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">4. Digital Prescription (Rx)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fast medication autocomplete, standard dosage schedules, dietary advice templates, and instant PDF printing.
              </p>
            </div>

            {/* Module 5 */}
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">5. Billing & Invoicing</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Itemized invoice generation, customizable tax rates, discount controls, settlement tracking, and payment receipts.
              </p>
            </div>

            {/* Module 6 */}
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">6. Pharmacy Inventory</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stock balance tracking, low-inventory triggers, batch and expiry dates management, and direct prescription dispensing.
              </p>
            </div>

            {/* Module 7 */}
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">7. Pathology & Diagnostics</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Diagnostic test orders, specimen tracking, pathology parameter entry, and instant digital report generation for doctors.
              </p>
            </div>

            {/* Module 8 */}
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">8. Role-Based Access Control</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Granular permissions for Doctors, Front Desk, Pharmacists, Lab Technicians, and Clinic Administrators.
              </p>
            </div>

            {/* Module 9 */}
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">9. Practice Analytics</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time operational KPIs, revenue breakdowns, patient footfall trends, and doctor consultation volumes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OPD Workflow Section */}
      <section id="workflow" className="py-20 md:py-28 bg-[#FAF9F6] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Seamless Patient Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From front-desk check-in to final discharge
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              How ClinicFlow powers your everyday outpatient workflow step-by-step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Check-In & Token</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receptionist records patient details or looks up existing profile, logging initial vitals and assigning an automated token.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Doctor Encounter</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Doctor reviews patient history, records diagnosis, and writes digital prescriptions with immediate sync.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Pharmacy & Lab</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pharmacy team dispenses medications and lab technicians collect samples based on live prescription orders.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Unified Billing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Front desk issues a single consolidated GST invoice covering consultation fees, medicines, and tests with instant receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section id="security" className="py-20 md:py-28 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Data Protection & Privacy
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Enterprise security built for healthcare compliance
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                ClinicFlow enforces strict tenant boundaries at the database engine level. Your clinic's electronic medical records, financial data, and staff credentials remain strictly protected and isolated.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">PostgreSQL Row-Level Security (RLS)</h4>
                    <p className="text-xs text-slate-500">Every query is strictly constrained to the authenticated user's clinic ID.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Encrypted In-Transit & At-Rest</h4>
                    <p className="text-xs text-slate-500">High-grade TLS 1.3 encryption for data transfer and AES-256 for persistent records.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Full Audit Logging & RBAC Enforcement</h4>
                    <p className="text-xs text-slate-500">Traceable audit logs for patient chart access, billing updates, and inventory changes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Card */}
            <div className="lg:col-span-6 bg-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-blue-400" />
                  <span className="font-mono text-xs font-bold text-slate-200">TENANT_ISOLATION_SPEC</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30">
                  ENFORCED
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs text-slate-300">
                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60">
                  <span className="text-blue-400">auth.jwt() -&gt; clinic_id</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">Bound to cryptographically signed token on session creation.</p>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60">
                  <span className="text-emerald-400">CREATE POLICY "tenant_isolation" ON records</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">USING (clinic_id = current_setting('app.current_clinic_id'))</p>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60">
                  <span className="text-purple-400">REST API Middlewares</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">Auto-injection of tenant context into backend database transactions.</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                <span>Infrastructure: PostgreSQL & Supabase</span>
                <span className="text-blue-400 font-bold">100% Deterministic Security</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="py-20 bg-blue-600 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to elevate your clinic's operational performance?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Create your clinic account today and experience seamless outpatient queue management, digital prescriptions, and multi-tenant security.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/sign-up"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-blue-700 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              Get Started with ClinicFlow
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/sign-in"
              className="w-full sm:w-auto px-7 py-4 bg-blue-700/60 hover:bg-blue-700 text-white border border-blue-400/40 font-bold text-sm rounded-xl transition-all"
            >
              Sign In to Practice
            </Link>
          </div>
        </div>
      </section>

      {/* Production Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white tracking-wider">CLINICFLOW</span>
            </div>
            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              Enterprise Multi-Tenant Clinical Practice System. Unifying electronic records, live queue scheduling, digital Rx, pharmacy inventory, and billing for modern healthcare providers.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              All Systems Operational • Supabase PostgreSQL Multi-Tenant
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#preview" className="hover:text-white transition-colors">Live Dashboard UI</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Core Pillars</a></li>
              <li><a href="#modules" className="hover:text-white transition-colors">Clinical Modules</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">OPD Workflow</a></li>
            </ul>
          </div>

          {/* Security & Access */}
          <div className="md:col-span-2 space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Access</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link to="/sign-in" className="hover:text-white transition-colors">Sign In to Practice</Link></li>
              <li><Link to="/sign-up" className="hover:text-white transition-colors">Create Clinic Account</Link></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security Architecture</a></li>
            </ul>
          </div>

          {/* Multi-Tenant Governance */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Tenant Architecture</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Cryptographically isolated schema policies per practice subdomain with automated audit trails.
            </p>
            <p className="text-[10px] text-slate-500 pt-2">
              © {new Date().getFullYear()} ClinicFlow Health Technologies Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
