import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicRoute } from './components/common/PublicRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { RegisterClinic } from './pages/RegisterClinic';
import { VerifyOtp } from './pages/VerifyOtp';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { PatientsPage } from './pages/Patients';
import { DoctorsPage } from './pages/Doctors';
import { AppointmentsPage } from './pages/Appointments';
import { DoctorConsultation } from './pages/Consultation/DoctorConsultation';
import { PrescriptionsPage } from './pages/Prescriptions';
import { BillingList } from './pages/Billing/BillingList';
import { PharmacyInventory } from './pages/Pharmacy/PharmacyInventory';
import { LabDiagnostics } from './pages/Lab/LabDiagnostics';
import { AnalyticsDashboard } from './pages/Analytics/AnalyticsDashboard';
import { SubscriptionPlans } from './pages/SaaS/SubscriptionPlans';
import { AuditLogs } from './pages/SaaS/AuditLogs';
import { StaffPage } from './pages/Staff';
import { SettingsPage } from './pages/Settings';
import { NotificationsPage } from './pages/NotificationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Unauthenticated Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/sign-in" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/sign-up" element={<RegisterClinic />} />
              <Route path="/register-clinic" element={<RegisterClinic />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Protected Multi-Tenant App Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/doctors" element={<DoctorsPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/queue" element={<AppointmentsPage />} />
                <Route path="/consultation/:appointmentId" element={<DoctorConsultation />} />
                <Route path="/prescriptions" element={<PrescriptionsPage />} />
                <Route path="/billing" element={<BillingList />} />
                <Route path="/pharmacy" element={<PharmacyInventory />} />
                <Route path="/inventory" element={<PharmacyInventory />} />
                <Route path="/lab" element={<LabDiagnostics />} />
                <Route path="/lab-diagnostics" element={<LabDiagnostics />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/subscriptions" element={<SubscriptionPlans />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* Default Catch-all */}
            <Route path="*" element={<Navigate to="/sign-in" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
