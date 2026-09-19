import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Building2, Mail, Lock, AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  clinicCode: z.string().min(1, 'Clinic code is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth() as any;
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      clinicCode: '',
      email: '',
      password: ''
    }
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setServerError(null);
      await login(values);
      navigate('/dashboard');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleQuickDemo = () => {
    setValue('clinicCode', 'demo-clinic');
    setValue('email', 'owner@democlinic.com');
    setValue('password', 'Password123');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F172A] flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] shadow-xl mb-4 hover:scale-105 transition-transform">
          <Activity className="w-7 h-7" />
        </Link>
        <h1 className="text-3xl font-serif font-extrabold text-[#0F172A] tracking-wider uppercase">
          CLINICFLOW
        </h1>
        <p className="mt-1 text-xs font-semibold tracking-[0.2em] uppercase text-[#B28947]">
          WELCOME BACK — SIGN IN TO PRACTICE
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel p-8 shadow-xl border-slate-200 bg-white space-y-5">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Clinic Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinic Code / Subdomain
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. demo-clinic"
                  {...register('clinicCode')}
                  className="w-full glass-input pl-10 text-xs font-mono"
                />
              </div>
              {errors.clinicCode && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.clinicCode.message}</p>
              )}
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
                  placeholder="doctor@clinic.com"
                  {...register('email')}
                  className="w-full glass-input pl-10 text-xs"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
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
              {errors.password && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full btn-gold mt-4 shadow-md cursor-pointer bg-[#2563EB] text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Authenticating...
                </>
              ) : (
                <>
                  SIGN IN TO PRACTICE <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-xs text-[#2563EB] hover:underline font-bold uppercase tracking-wider cursor-pointer"
            >
              Fill Demo Credentials (demo-clinic)
            </button>
          </div>
        </div>

        {/* Register SaaS Clinic CTA */}
        <p className="mt-6 text-center text-xs text-slate-500 font-medium">
          Don't have a practice account?{' '}
          <Link to="/sign-up" className="font-bold text-[#2563EB] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
