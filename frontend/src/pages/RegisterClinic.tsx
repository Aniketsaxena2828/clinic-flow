import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Building2, User as UserIcon, Mail, Lock, Phone, AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const registerSchema = z.object({
  clinicName: z.string().min(2, 'Clinic name is required'),
  clinicCode: z.string().min(2, 'Clinic code/subdomain is required'),
  ownerName: z.string().min(2, 'Full name is required'),
  ownerEmail: z.string().email('Enter a valid email address'),
  ownerPhone: z.string().min(8, 'Phone number is required'),
  ownerPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  agreeTerms: z.boolean().refine((val) => val === true, 'You must agree to the Terms of Service and Privacy Policy')
}).refine((data) => data.ownerPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterClinic: React.FC = () => {
  const navigate = useNavigate();
  const { registerClinic, loginWithData } = useAuth() as any;
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      clinicName: '',
      clinicCode: '',
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      ownerPassword: '',
      confirmPassword: '',
      agreeTerms: false
    }
  });

  const clinicNameVal = watch('clinicName');

  const handleClinicNameBlur = () => {
    if (clinicNameVal) {
      const slug = clinicNameVal.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 18);
      setValue('clinicCode', slug || 'my-clinic');
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setServerError(null);
      await registerClinic({
        clinicName: values.clinicName.trim(),
        clinicCode: values.clinicCode.trim().toLowerCase(),
        clinicEmail: values.ownerEmail.trim(),
        clinicPhone: values.ownerPhone.trim(),
        ownerName: values.ownerName.trim(),
        ownerEmail: values.ownerEmail.trim(),
        ownerPassword: values.ownerPassword,
        ownerPhone: values.ownerPhone.trim()
      });
      navigate('/dashboard');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try a different clinic code or email.');
    }
  };

  const handleGoogleSignup = async () => {
    setServerError(null);
    const clinicCode = watch('clinicCode') || 'apex-health';
    // Direct redirect to backend OAuth endpoint for real Google signup/login flow
    window.location.href = `/api/auth/google?clinicCode=${encodeURIComponent(clinicCode)}`;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F172A] flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center z-10">
        <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] shadow-xl mb-4 hover:scale-105 transition-transform">
          <Activity className="w-7 h-7" />
        </Link>
        <h1 className="text-3xl font-serif font-extrabold text-[#0F172A] tracking-wider uppercase">
          CREATE ACCOUNT
        </h1>
        <p className="mt-1 text-xs font-semibold tracking-[0.2em] uppercase text-[#B28947]">
          REGISTER YOUR PRACTICE ON CLINICFLOW
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="glass-panel p-8 shadow-xl border-slate-200 bg-white space-y-6">
          {/* Google Continue Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full py-2.5 px-4 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">OR</span>
          </div>

          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Dr. Sarah Connor"
                    {...register('ownerName')}
                    className="w-full glass-input pl-10 text-xs"
                  />
                </div>
                {errors.ownerName && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.ownerName.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    {...register('ownerPhone')}
                    className="w-full glass-input pl-10 text-xs"
                  />
                </div>
                {errors.ownerPhone && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.ownerPhone.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="owner@clinic.com"
                  {...register('ownerEmail')}
                  className="w-full glass-input pl-10 text-xs"
                />
              </div>
              {errors.ownerEmail && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.ownerEmail.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Clinic Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinic / Practice Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Apex Healthcare Clinic"
                    {...register('clinicName')}
                    onBlur={handleClinicNameBlur}
                    className="w-full glass-input pl-10 text-xs"
                  />
                </div>
                {errors.clinicName && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.clinicName.message}</p>
                )}
              </div>

              {/* Clinic Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tenant Code / Subdomain
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="apex-health"
                    {...register('clinicCode')}
                    className="w-full glass-input text-xs font-mono"
                  />
                </div>
                {errors.clinicCode && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.clinicCode.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('ownerPassword')}
                    className="w-full glass-input pl-10 pr-10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.ownerPassword && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.ownerPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className="w-full glass-input pl-10 pr-10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('agreeTerms')}
                  className="mt-0.5 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-xs text-slate-600 leading-tight">
                  I agree to the <span className="font-bold text-[#2563EB]">Terms of Service</span> and <span className="font-bold text-[#2563EB]">Privacy Policy</span>.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.agreeTerms.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full btn-gold mt-4 shadow-md cursor-pointer bg-[#2563EB] text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Creating Clinic Account...
                </>
              ) : (
                <>
                  CREATE ACCOUNT <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Redirect Link */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/sign-in" className="font-bold text-[#2563EB] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
