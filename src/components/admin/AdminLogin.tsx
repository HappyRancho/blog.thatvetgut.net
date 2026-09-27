import React, { useState } from 'react';
import { Lock, Mail, KeyRound, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const { loginWithEmail, registerCoFounder, loginWithGoogle, sendPasswordReset, authError, clearAuthError } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearAuthError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setLocalError('Please enter your email address.');
      return;
    }

    if (mode === 'reset') {
      setIsSubmitting(true);
      try {
        await sendPasswordReset(cleanEmail);
        setSuccessMessage(`Password reset link sent to ${cleanEmail}. Please check your inbox.`);
      } catch (err: any) {
        setLocalError(err.message || 'Failed to send password reset email.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
      setIsSubmitting(true);
      try {
        await registerCoFounder(cleanEmail, password);
        // Successful registration will trigger onAuthStateChanged in AuthContext
      } catch (err: any) {
        setLocalError(err.message || 'Registration failed.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Default Sign In
    setIsSubmitting(true);
    try {
      await loginWithEmail(cleanEmail, password);
      // Successful sign in will trigger onAuthStateChanged
    } catch (err: any) {
      setLocalError(err.message || 'Sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    clearAuthError();
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setLocalError(err.message || 'Google sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl shadow-xl p-8 sm:p-10 space-y-7">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-emerald-400 mb-2 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 tracking-tight">
            THATVETGUY CMS
          </h1>
          <p className="text-xs text-stone-500 font-medium">
            Editorial Access for Co-Founders
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-semibold text-stone-600">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setLocalError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setLocalError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'hover:text-stone-900'
            }`}
          >
            Set Password
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('reset');
              setLocalError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'reset'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'hover:text-stone-900'
            }`}
          >
            Reset
          </button>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{displayError}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-950 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Co-Founder Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. chirag@thatvetguy.net"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setLocalError(null);
                    }}
                    className="text-[11px] text-emerald-800 hover:text-emerald-950 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 focus:outline-hidden transition-all"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 focus:outline-hidden transition-all"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Must be at least 6 characters. Only authorized Co-Founders can register.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <span>Sign In to CMS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'register' ? (
              <span>Create My Account</span>
            ) : (
              <span>Send Password Reset Email</span>
            )}
          </button>
        </form>

        {/* Google SSO Divider & Button */}
        {mode === 'signin' && (
          <div className="space-y-4 pt-2 border-t border-stone-100">
            <div className="relative flex items-center justify-center">
              <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                Or with Google
              </span>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        {/* Footer Note */}
        <p className="text-[11px] text-center text-stone-600 leading-relaxed pt-2">
          Authorized Co-Founders: Dr. Chirag Patidar, Dr. Amaan Ahmed, Dr. Shivam Singh Thakur, Dr. Ritesh Verma, Dr. Deepesh Mathur, Dr. Deepesh Chaware.
        </p>
      </div>
    </div>
  );
};
