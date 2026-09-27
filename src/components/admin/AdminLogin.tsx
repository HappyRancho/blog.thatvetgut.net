import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Phone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { normalizePhoneNumber } from '../../services/phoneAuthService';

const RESEND_COOLDOWN_SECONDS = 30;

export const AdminLogin: React.FC = () => {
  const {
    sendPhoneOtp,
    verifyPhoneOtp,
    resendPhoneOtp,
    resetPhoneAuth,
    confirmationResult,
    maskedPhone,
    authError,
    clearAuthError,
  } = useAuth();

  // Screen 1: Phone number entry
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Screen 2: OTP verification
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Screen 1 submit: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessNotice(null);
    clearAuthError();

    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized || normalized.length < 10) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    try {
      await sendPhoneOtp(normalized, 'recaptcha-container');
      setSuccessNotice('OTP sent to your registered phone number.');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Screen 2 submit: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setLocalError('Please enter the full 6-digit OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await verifyPhoneOtp(fullOtp);
      // Auth state change will automatically route to dashboard
    } catch (err: any) {
      setLocalError(err.message || 'Verification failed. Please check the OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Screen 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSendingOtp) return;
    setLocalError(null);
    clearAuthError();
    setIsSendingOtp(true);
    try {
      await resendPhoneOtp('recaptcha-container');
      setSuccessNotice('A new OTP has been sent to your registered phone number.');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // OTP input handling: Digit change & auto-advance
  const handleOtpDigitChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, '');

    // If user pasted a full OTP code
    if (cleaned.length > 1) {
      const pasteDigits = cleaned.slice(0, 6).split('');
      const updated = [...otpDigits];
      pasteDigits.forEach((digit, i) => {
        if (i < 6) updated[i] = digit;
      });
      setOtpDigits(updated);
      const nextIndex = Math.min(pasteDigits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = cleaned;
    setOtpDigits(updated);

    // Auto-advance to next input if single digit typed
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // OTP input handling: Backspace navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Return to Screen 1
  const handleBackToPhone = () => {
    resetPhoneAuth();
    setOtpDigits(['', '', '', '', '', '']);
    setLocalError(null);
    setSuccessNotice(null);
    clearAuthError();
  };

  const displayError = localError || authError;
  const isOtpStep = Boolean(confirmationResult);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12">
      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container" />

      <div className="w-full max-w-md bg-white border border-stone-200/90 rounded-3xl shadow-xl p-6 sm:p-10 space-y-7">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-emerald-400 mb-1 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Staff Authentication</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 tracking-tight">
            THATVETGUY CMS
          </h1>
          <p className="text-xs text-stone-500 font-medium">
            {!isOtpStep
              ? 'Sign in with your authorized phone number'
              : 'Enter the 6-digit verification code'}
          </p>
        </div>

        {/* Global Error Banner */}
        {displayError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{displayError}</p>
          </div>
        )}

        {/* Global Success Banner */}
        {successNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-950 text-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="font-semibold">{successNotice}</p>
          </div>
        )}

        {/* SCREEN 1: PHONE NUMBER ENTRY */}
        {!isOtpStep ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Authorized Phone Number
              </label>
              <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50 focus-within:bg-white focus-within:border-emerald-600 transition-all overflow-hidden">
                <span className="px-3.5 py-2.5 bg-stone-100/80 border-r border-stone-200 text-stone-700 text-xs font-semibold select-none">
                  +91
                </span>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    autoFocus
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full pl-9 pr-4 py-2.5 bg-transparent text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
                  />
                </div>
              </div>
              <p className="text-[11px] text-stone-500">
                Enter your 10-digit Indian mobile number registered in the CMS allowlist.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSendingOtp || phoneNumber.trim().length < 8}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              {isSendingOtp ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* SCREEN 2: 6-DIGIT OTP VERIFICATION */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {/* Masked Phone Info Bar */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-stone-600 truncate">
                  Sent to <strong className="text-stone-900 font-semibold">{maskedPhone}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleBackToPhone}
                className="text-[11px] text-emerald-800 hover:text-emerald-950 font-medium hover:underline shrink-0 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change</span>
              </button>
            </div>

            {/* 6 Individual Digit Inputs */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700 text-center">
                Enter 6-Digit OTP Code
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-hidden transition-all shadow-2xs"
                  />
                ))}
              </div>
            </div>

            {/* Verify OTP Button */}
            <button
              type="submit"
              disabled={isVerifyingOtp || otpDigits.join('').length !== 6}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              {isVerifyingOtp ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend OTP with Cooldown */}
            <div className="text-center pt-1">
              {resendCooldown > 0 ? (
                <p className="text-xs text-stone-500 font-medium">
                  Resend OTP in <span className="font-semibold text-stone-700">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  disabled={isSendingOtp}
                  onClick={handleResendOtp}
                  className="text-xs text-emerald-800 hover:text-emerald-950 hover:underline font-semibold flex items-center justify-center gap-1.5 mx-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                  <span>Resend OTP</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Security Notice Footer */}
        <div className="pt-2 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-500 leading-relaxed">
            Only authorized ThatVetGuy Co-Founders can access the CMS. OTP verification is processed securely via Firebase Authentication.
          </p>
        </div>
      </div>
    </div>
  );
};
