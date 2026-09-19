import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, KeyRound, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithData } = useAuth() as any;

  const stateIdentifier = location.state?.identifier || '';
  const initialOtp = location.state?.otpCode || '';

  const [identifier, setIdentifier] = useState(stateIdentifier || 'owner@democlinic.com');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins total expiry
  const [resendCooldown, setResendCooldown] = useState(60); // 60s resend cooldown
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill demo OTP code if supplied
  useEffect(() => {
    if (initialOtp && initialOtp.length === 6) {
      setOtpDigits(initialOtp.split(''));
    }
  }, [initialOtp]);

  // Expiry Countdown Timer
  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  // Resend Cooldown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal && val !== '') return;
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next field
    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData.length > 0) {
      const chars = pastedData.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = chars[i] || '';
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(chars.length, 5);
      const targetInput = document.getElementById(`otp-input-${focusIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.post('/auth/request-otp', { identifier });
      setTimerSeconds(300);
      setResendCooldown(60);
      setSuccessMsg(res.data?.message || 'A new 6-digit verification code has been sent.');
      if (res.data?.otpCode) {
        setOtpDigits(res.data.otpCode.split(''));
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to resend OTP code.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/auth/verify-otp', { identifier, otpCode: code });
      if (res.data?.data) {
        if (loginWithData) {
          loginWithData(res.data.data);
        }
        navigate('/dashboard');
      } else {
        setErrorMsg('Invalid response from authentication server.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired 6-digit verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F172A] flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] shadow-xl mb-4">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-serif font-extrabold text-[#0F172A] tracking-wider uppercase">
          VERIFY ACCOUNT
        </h1>
        <p className="mt-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
          Enter 6-digit verification code sent to {identifier}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel p-8 shadow-xl border-slate-200 bg-white">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {/* Identifier input if not passed */}
            {!stateIdentifier && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full glass-input text-xs"
                  placeholder="enter email or phone"
                  required
                />
              </div>
            )}

            {/* 6-Digit Boxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
                6-Digit Security Code
              </label>
              <div className="flex justify-between items-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-11 h-12 text-center text-lg font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A] outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Timer & Resend */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">
                Code expires in: <strong className="text-[#2563EB]">{formatTime(timerSeconds)}</strong>
              </span>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-[#2563EB] hover:underline font-bold disabled:opacity-50 cursor-pointer"
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <button type="submit" disabled={isLoading} className="w-full btn-gold shadow-md cursor-pointer bg-[#2563EB] text-white">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Verifying Code...
                </>
              ) : (
                <>
                  Verify & Sign In <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <Link to="/sign-in" className="text-xs text-slate-600 hover:text-[#2563EB] font-bold">
              ← Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
