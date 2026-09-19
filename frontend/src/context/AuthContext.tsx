import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Clinic } from '../types';
import api from '../services/api';
import { storageService } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  clinic: Clinic | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { clinicCode: string; email: string; password: string }) => Promise<void>;
  registerClinic: (data: any) => Promise<void>;
  loginWithData: (data: any) => void;
  logout: () => void;
  switchTenantClinic: (clinic: Clinic) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Normalize a clinic object from the backend.
 * The backend returns { id, name, ... } but the frontend expects { _id, name, ... }.
 * This ensures _id is always set so localStorage stores the real clinic ID.
 */
function normalizeClinic(raw: any): Clinic {
  const id = raw._id || raw.id || '';
  return {
    _id: String(id),
    name: raw.name || '',
    code: raw.code || '',
    email: raw.email || '',
    phone: raw.phone || '',
    address: typeof raw.address === 'string' ? raw.address : (raw.address?.street || ''),
    gstNumber: raw.gstNumber,
    specialties: raw.specialties || [],
    subscriptionPlan: raw.subscriptionPlan || raw.subscriptionTier || 'Free',
    workingHours: raw.workingHours || { start: '09:00 AM', end: '06:00 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    createdAt: raw.createdAt
  };
}

/**
 * Normalize a user object from the backend.
 * The backend returns { id, name, role, ... } but the frontend User type uses { userId, ... }.
 */
function normalizeUser(raw: any, clinicId: string): User {
  return {
    userId: String(raw.userId || raw.id || raw._id || ''),
    clinicId: raw.clinicId ? String(raw.clinicId) : clinicId,
    email: raw.email || '',
    role: raw.role || raw.roleName || 'Owner',
    name: raw.name || ''
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const u = sessionStorage.getItem('clinicflow_user') || localStorage.getItem('clinicflow_user');
      if (!u || u === 'undefined' || u === 'null') return null;
      return JSON.parse(u);
    } catch {
      return null;
    }
  });

  const [clinic, setClinic] = useState<Clinic | null>(() => {
    try {
      const c = sessionStorage.getItem('clinicflow_clinic') || localStorage.getItem('clinicflow_clinic');
      if (!c || c === 'undefined' || c === 'null') return null;
      const parsed = JSON.parse(c);
      if (parsed && (!parsed._id || parsed._id === 'undefined' || parsed._id === 'null')) {
        const realId = parsed.id && parsed.id !== 'undefined' ? parsed.id : '';
        if (realId) {
          parsed._id = String(realId);
          sessionStorage.setItem('clinicflow_clinic', JSON.stringify(parsed));
          sessionStorage.setItem('clinicflow_clinic_id', parsed._id);
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    const t = sessionStorage.getItem('clinicflow_token') || localStorage.getItem('clinicflow_token');
    if (!t || t === 'undefined' || t === 'null') return null;
    return t;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sanitize clinicflow_clinic_id if corrupted
  useEffect(() => {
    const storedId = sessionStorage.getItem('clinicflow_clinic_id');
    if (!storedId || storedId === 'undefined' || storedId === 'null') {
      if (clinic?._id && clinic._id !== 'undefined' && clinic._id !== 'null') {
        sessionStorage.setItem('clinicflow_clinic_id', clinic._id);
      } else {
        sessionStorage.removeItem('clinicflow_clinic_id');
      }
    }
  }, [clinic]);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data?.data) {
            const rawClinic = res.data.data.clinic;
            const rawUser = res.data.data.user;
            let currentClinicId = '';
            if (rawClinic) {
              const normalized = normalizeClinic(rawClinic);
              currentClinicId = normalized._id;
              setClinic(normalized);
              sessionStorage.setItem('clinicflow_clinic', JSON.stringify(normalized));
              sessionStorage.setItem('clinicflow_clinic_id', normalized._id);
            }
            if (rawUser) {
              const normalized = normalizeUser(rawUser, currentClinicId || sessionStorage.getItem('clinicflow_clinic_id') || '');
              setUser(normalized);
              sessionStorage.setItem('clinicflow_user', JSON.stringify(normalized));
            }
          }
        })
        .catch(() => {
          // Token expired or invalid
        });
    }
  }, []);

  const login = async (credentials: { clinicCode: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', credentials);
      const data = res.data.data;
      const clinicData = normalizeClinic(data.clinic);
      const tokenStr = data.tokens?.accessToken || data.accessToken;
      const userData = normalizeUser(data.user, clinicData._id);

      // Clear any previous tenant cache/storage in this tab
      storageService.clearTenantCache();

      // Store in per-tab sessionStorage
      sessionStorage.setItem('clinicflow_token', tokenStr);
      sessionStorage.setItem('clinicflow_user', JSON.stringify(userData));
      sessionStorage.setItem('clinicflow_clinic', JSON.stringify(clinicData));
      sessionStorage.setItem('clinicflow_clinic_id', clinicData._id);

      // Clean up legacy global localStorage
      localStorage.removeItem('clinicflow_token');
      localStorage.removeItem('clinicflow_user');
      localStorage.removeItem('clinicflow_clinic');
      localStorage.removeItem('clinicflow_clinic_id');

      setUser(userData);
      setClinic(clinicData);
      setToken(tokenStr);
    } finally {
      setIsLoading(false);
    }
  };

  const registerClinic = async (formData: any) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register-clinic', formData);
      const data = res.data.data;
      const clinicData = normalizeClinic(data.clinic);
      const tokenStr = data.tokens?.accessToken || data.accessToken;
      const userData = normalizeUser(data.user, clinicData._id);

      // Clear any previous tenant cache/storage in this tab
      storageService.clearTenantCache();

      // Store in per-tab sessionStorage
      sessionStorage.setItem('clinicflow_token', tokenStr);
      sessionStorage.setItem('clinicflow_user', JSON.stringify(userData));
      sessionStorage.setItem('clinicflow_clinic', JSON.stringify(clinicData));
      sessionStorage.setItem('clinicflow_clinic_id', clinicData._id);

      // Clean up legacy global localStorage
      localStorage.removeItem('clinicflow_token');
      localStorage.removeItem('clinicflow_user');
      localStorage.removeItem('clinicflow_clinic');
      localStorage.removeItem('clinicflow_clinic_id');

      setUser(userData);
      setClinic(clinicData);
      setToken(tokenStr);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithData = (data: any) => {
    const clinicData = normalizeClinic(data.clinic || {});
    const tokenStr = data.tokens?.accessToken || data.accessToken;
    const userData = normalizeUser(data.user || {}, clinicData._id);

    // Clear any previous tenant cache/storage in this tab
    storageService.clearTenantCache();

    // Store in per-tab sessionStorage
    sessionStorage.setItem('clinicflow_token', tokenStr);
    sessionStorage.setItem('clinicflow_user', JSON.stringify(userData));
    sessionStorage.setItem('clinicflow_clinic', JSON.stringify(clinicData));
    sessionStorage.setItem('clinicflow_clinic_id', clinicData._id);

    // Clean up legacy global localStorage
    localStorage.removeItem('clinicflow_token');
    localStorage.removeItem('clinicflow_user');
    localStorage.removeItem('clinicflow_clinic');
    localStorage.removeItem('clinicflow_clinic_id');

    setUser(userData);
    setClinic(clinicData);
    setToken(tokenStr);
  };

  const logout = () => {
    try {
      api.post('/auth/logout').catch(() => {});
    } catch (e) {}
    sessionStorage.removeItem('clinicflow_token');
    sessionStorage.removeItem('clinicflow_user');
    sessionStorage.removeItem('clinicflow_clinic');
    sessionStorage.removeItem('clinicflow_clinic_id');
    localStorage.removeItem('clinicflow_token');
    localStorage.removeItem('clinicflow_user');
    localStorage.removeItem('clinicflow_clinic');
    localStorage.removeItem('clinicflow_clinic_id');
    storageService.clearTenantCache();
    setUser(null);
    setClinic(null);
    setToken(null);
  };

  const switchTenantClinic = (newClinic: Clinic) => {
    setClinic(newClinic);
    sessionStorage.setItem('clinicflow_clinic', JSON.stringify(newClinic));
    sessionStorage.setItem('clinicflow_clinic_id', newClinic._id);
    if (user) {
      const updatedUser = { ...user, clinicId: newClinic._id };
      setUser(updatedUser);
      sessionStorage.setItem('clinicflow_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        clinic,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        registerClinic,
        loginWithData,
        logout,
        switchTenantClinic
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
