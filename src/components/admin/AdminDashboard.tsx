import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Clock,
  Check,
  CheckCircle,
  Edit3,
  Users,
  Settings,
  Send,
  Plus,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Globe,
  ArrowLeft,
  Sliders,
  Sparkles,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
  Linkedin,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { DashboardOverview } from './DashboardOverview';
import { ArticleList } from './ArticleList';
import { ArticleEditor } from './ArticleEditor';
import { ReviewQueue } from './ReviewQueue';
import { ContributorsManager } from './ContributorsManager';
import { AdminSettings } from './AdminSettings';
import { LinkedInImporter } from './LinkedInImporter';
import { AuditLogsViewer } from './AuditLogsViewer';
import { getArticlesFromFirestore } from '../../services/articleService';

export const AdminDashboard: React.FC = () => {
  const {
    user,
    currentAuthor,
    role,
    isCoFounder,
    isAuthorized,
    loading,
    signInWithGoogle,
    loginWithCredentials,
    resetPasswordWithKey,
    getLockoutSeconds,
    allAuthors,
    signOutUser,
    authError,
    clearAuthError,
  } = useAuth();
  const { route, navigateTo } = useNavigation();

  // Mobile sidebar drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Secure Auth State: Username & Password
  const [authMethod, setAuthMethod] = useState<'credentials' | 'google' | 'reset'>('credentials');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Reset Password State
  const [resetUsername, setResetUsername] = useState<string>('');
  const [resetRecoveryKey, setResetRecoveryKey] = useState<string>('');
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState<string>('');
  const [resetError, setResetError] = useState<string | null>(null);

  // Active section from route or default to 'overview'
  const activeSection = route.name === 'admin' ? route.section || 'overview' : 'overview';
  const editingArticleId = route.name === 'admin' ? route.articleId : undefined;

  // Track and count down lockout timer
  useEffect(() => {
    const sec = getLockoutSeconds();
    setLockoutSeconds(sec);
    if (sec > 0) {
      const interval = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [getLockoutSeconds]);

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationFeedback(null);
    clearAuthError();

    if (!usernameInput.trim()) {
      return;
    }
    if (!passwordInput.trim()) {
      return;
    }

    const res = loginWithCredentials(usernameInput.trim(), passwordInput.trim());
    if (res.success) {
      setVerificationFeedback(res.message);
      setPasswordInput('');
    } else {
      if (res.remainingSeconds && res.remainingSeconds > 0) {
        setLockoutSeconds(res.remainingSeconds);
      }
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!resetUsername.trim()) {
      setResetError('Please enter your username or registered email.');
      return;
    }
    if (!resetRecoveryKey.trim()) {
      setResetError('Please provide the Master Recovery Key.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match. Please verify.');
      return;
    }

    const res = resetPasswordWithKey(
      resetUsername.trim(),
      resetRecoveryKey.trim(),
      resetNewPassword.trim()
    );

    if (res.success) {
      setVerificationFeedback('Password reset successfully! Please sign in with your new password.');
      setUsernameInput(resetUsername.trim());
      setPasswordInput(resetNewPassword.trim());
      setAuthMethod('credentials');
      setResetUsername('');
      setResetRecoveryKey('');
      setResetNewPassword('');
      setResetConfirmPassword('');
    } else {
      setResetError(res.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setVerificationFeedback(null);
    clearAuthError();
    try {
      await signInWithGoogle();
    } catch (e) {
      // Handled in AuthContext
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  // Poll or fetch review count
  useEffect(() => {
    if (!isAuthorized) return;
    const checkQueue = async () => {
      try {
        const list = await getArticlesFromFirestore();
        const pending = list.filter(
          (a) =>
            a.status === 'SUBMITTED FOR REVIEW' ||
            a.status === 'UNDER REVIEW' ||
            a.status === 'CHANGES REQUESTED'
        ).length;
        setReviewCount(pending);
      } catch (e) {
        // ignore
      }
    };
    checkQueue();
  }, [isAuthorized, activeSection]);

  // If loading auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm font-semibold text-stone-700">
            Verifying ThatVetGuy Editorial Access...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, render the Secure Authenticated Team Sign-in Screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-950 text-white shadow-md mx-auto mb-1">
              <span className="font-serif font-black text-2xl tracking-tighter">TVG</span>
            </div>
            <h1 className="font-serif font-bold text-2xl text-stone-900">
              ThatVetGuy Editorial Portal
            </h1>
            <p className="text-xs text-stone-600">
              Secured Username & Password Access for Co-Founders & Accredited Editorial Staff.
            </p>
          </div>

          {/* Authentication Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl gap-1 border border-stone-200 text-xs font-semibold">
            <button
              type="button"
              id="cms-auth-tab-credentials"
              onClick={() => {
                setAuthMethod('credentials');
                clearAuthError();
              }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMethod === 'credentials' || authMethod === 'reset'
                  ? 'bg-white text-emerald-950 shadow-xs border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-emerald-850" />
              <span>Username & Password</span>
            </button>
            <button
              type="button"
              id="cms-auth-tab-google"
              onClick={() => {
                setAuthMethod('google');
                clearAuthError();
              }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMethod === 'google'
                  ? 'bg-white text-emerald-950 shadow-xs border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google OAuth</span>
            </button>
          </div>

          {/* Verification Feedback Banner */}
          {verificationFeedback && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3.5 rounded-2xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{verificationFeedback}</span>
            </div>
          )}

          {/* Auth Error Banner */}
          {authError && (
            <div className="bg-amber-50 border border-amber-300 text-amber-950 p-3.5 rounded-2xl text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-tight">{authError}</span>
              </div>
              <button
                type="button"
                onClick={clearAuthError}
                className="text-amber-700 hover:text-amber-950 font-bold px-1"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Lockout Notification Banner */}
          {lockoutSeconds > 0 && (
            <div className="bg-red-50 border border-red-300 text-red-950 p-3.5 rounded-2xl text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-700 shrink-0" />
              <div>
                <strong className="block font-semibold">Security Lockout Active</strong>
                <span>
                  Too many incorrect password attempts. Authentication blocked for{' '}
                  <span className="font-mono font-bold text-red-700">{lockoutSeconds}</span> seconds.
                </span>
              </div>
            </div>
          )}

          {/* TAB 1: Username & Password Authentication */}
          {authMethod === 'credentials' && (
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              {/* Username / Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="cms-username-input"
                  className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block"
                >
                  Username or Registered Email
                </label>
                <div className="relative">
                  <input
                    id="cms-username-input"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      clearAuthError();
                    }}
                    disabled={lockoutSeconds > 0}
                    placeholder="e.g. chirag, amaan, or email"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-2xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800 disabled:bg-stone-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="cms-password-input"
                    className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5 text-emerald-850" />
                    <span>Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('reset');
                      setResetUsername(usernameInput);
                      clearAuthError();
                    }}
                    className="text-[11px] text-emerald-850 hover:text-emerald-950 font-semibold underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="cms-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      clearAuthError();
                    }}
                    disabled={lockoutSeconds > 0}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-stone-300 rounded-2xl text-xs font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-800 disabled:bg-stone-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Authentication Button */}
              <button
                type="submit"
                id="cms-submit-login-btn"
                disabled={lockoutSeconds > 0 || !usernameInput.trim() || !passwordInput.trim()}
                className="w-full py-3 px-4 bg-emerald-950 hover:bg-emerald-900 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer min-h-[48px]"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {lockoutSeconds > 0
                    ? `Locked (${lockoutSeconds}s)`
                    : 'Sign In to Editorial Portal'}
                </span>
              </button>
            </form>
          )}

          {/* TAB RESET: Password Reset Flow */}
          {authMethod === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-800" />
                  <span className="font-serif font-bold text-sm text-stone-900">
                    Reset Member Password
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('credentials');
                    setResetError(null);
                  }}
                  className="text-xs text-stone-500 hover:text-stone-800 font-semibold"
                >
                  ← Back to Login
                </button>
              </div>

              <p className="text-xs text-stone-600">
                Enter your username and the Master Recovery Key (or verify with an authorized Co-Founder) to establish a new password.
              </p>

              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                  Username or Registered Email
                </label>
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="e.g. chirag or chiragpatidar0369@gmail.com"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                  Master Administrator Recovery Key
                </label>
                <input
                  type="password"
                  value={resetRecoveryKey}
                  onChange={(e) => setResetRecoveryKey(e.target.value)}
                  placeholder="Enter recovery key"
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer min-h-[46px]"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save New Password & Sign In</span>
              </button>
            </form>
          )}

          {/* TAB 2: Google Workspace OAuth */}
          {authMethod === 'google' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs text-stone-700 space-y-2">
                <div className="font-semibold text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-900" />
                  <span>Google Single Sign-On</span>
                </div>
                <p>
                  Sign in with your authorized Google account. Your editorial account privileges will be verified against the official ThatVetGuy team roster automatically.
                </p>
              </div>

              <button
                type="button"
                id="cms-google-signin-btn"
                disabled={isSigningIn}
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs uppercase tracking-wider rounded-2xl border border-stone-300 flex items-center justify-center gap-3 transition-colors shadow-xs min-h-[50px] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google Account'}</span>
              </button>

              {/* Browser sandbox notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-950 space-y-2">
                <p>
                  <strong>Sandbox Notice:</strong> If your browser restricts popups inside the preview frame, use the Username & Password option or open in a full window:
                </p>
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 hover:text-emerald-950 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open ThatVetGuy CMS in Full Window</span>
                </button>
              </div>
            </div>
          )}

          {/* Return link */}
          <button
            type="button"
            onClick={() => navigateTo({ name: 'home' })}
            className="w-full py-2 px-4 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors text-center cursor-pointer"
          >
            ← Return to ThatVetGuy Public Site
          </button>
        </div>
      </div>
    );
  }

  // Navigation menu items
  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'my-articles', label: 'My Articles', icon: FileText },
    {
      id: 'review-queue',
      label: 'Review Queue',
      icon: Clock,
      badge: reviewCount > 0 ? reviewCount : undefined,
    },
    { id: 'all-articles', label: 'All Articles', icon: FileText },
    { id: 'drafts', label: 'Drafts', icon: Edit3 },
    { id: 'submitted', label: 'Submitted', icon: Send },
    { id: 'published', label: 'Published', icon: CheckCircle },
    { id: 'linkedin-import', label: 'LinkedIn Importer', icon: Linkedin },
    { id: 'contributors', label: 'Contributors', icon: Users },
    { id: 'audit-logs', label: 'Audit Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (sectionId: string) => {
    navigateTo({ name: 'admin', section: sectionId });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Top Mobile/Desktop CMS Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <div
            onClick={() => navigateTo({ name: 'home' })}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-950 flex items-center justify-center text-white font-serif font-black text-base">
              TVG
            </div>
            <div>
              <span className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-none block">
                ThatVetGuy
              </span>
              <span className="text-[10px] font-semibold text-emerald-900 uppercase tracking-wider block">
                Editorial CMS
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Write article button, user status, public site link */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigateTo({ name: 'admin', section: 'edit' })}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Write Article</span>
            <span className="sm:hidden">Write</span>
          </button>

          {/* Public site link */}
          <button
            type="button"
            onClick={() => navigateTo({ name: 'home' })}
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            title="View Public Website"
          >
            <Globe className="w-4 h-4" />
          </button>

          {/* User Avatar with Profile details */}
          <div
            onClick={() => navigateTo({ name: 'admin', section: 'settings' })}
            className="flex items-center gap-2 pl-2 border-l border-stone-200 cursor-pointer hover:opacity-80 transition-opacity"
            title="Account Settings"
          >
            <img
              src={currentAuthor?.avatarUrl}
              alt={currentAuthor?.name}
              className="w-8 h-8 rounded-xl object-cover border border-stone-200"
            />
            <div className="hidden md:block text-left">
              <span className="text-xs font-serif font-bold text-stone-900 block truncate max-w-[130px]">
                {currentAuthor?.name}
              </span>
              <span className="text-[10px] text-emerald-950 font-semibold block uppercase">
                {role === 'CO_FOUNDER' ? 'Co-Founder' : 'Contributor'}
              </span>
            </div>
          </div>

          {/* Quick Header Sign Out */}
          <button
            type="button"
            onClick={signOutUser}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors min-h-[44px]"
            title="Sign out of CMS"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar (Left) */}
        <aside className="hidden lg:block w-64 p-6 shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Nav list */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id && !editingArticleId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-colors ${
                      isActive
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-white text-emerald-900' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Equal Co-Founder Banner */}
            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 text-stone-600 text-xs space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
                <span>ThatVetGuy Co-Founders</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-snug">
                Equal publishing rights across all six clinical leads.
              </p>
            </div>

            {/* Desktop Sign Out */}
            <button
              type="button"
              onClick={signOutUser}
              className="w-full py-2.5 px-3.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50/80 rounded-xl flex items-center gap-2 transition-colors min-h-[44px] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of CMS</span>
            </button>
          </div>
        </aside>

        {/* Mobile Slide-Out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/40 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <span className="font-serif font-bold text-stone-900 text-base">
                    CMS Navigation
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-stone-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold min-h-[44px] transition-colors ${
                          isActive
                            ? 'bg-emerald-900 text-white'
                            : 'text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={signOutUser}
                  className="w-full py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* Render Active Sub-View */}
          {activeSection === 'edit' ? (
            <ArticleEditor
              articleId={editingArticleId}
              onClose={() => navigateTo({ name: 'admin', section: 'all-articles' })}
            />
          ) : activeSection === 'overview' ? (
            <DashboardOverview />
          ) : activeSection === 'my-articles' ? (
            <ArticleList initialStatusFilter="MY_ARTICLES" title="My Articles" />
          ) : activeSection === 'review-queue' ? (
            <ReviewQueue />
          ) : activeSection === 'all-articles' ? (
            <ArticleList initialStatusFilter="ALL" title="All Articles" />
          ) : activeSection === 'drafts' ? (
            <ArticleList initialStatusFilter="DRAFT" title="Draft Articles" />
          ) : activeSection === 'submitted' ? (
            <ArticleList
              initialStatusFilter="SUBMITTED FOR REVIEW"
              title="Submitted for Review"
            />
          ) : activeSection === 'published' ? (
            <ArticleList initialStatusFilter="PUBLISHED" title="Published Articles" />
          ) : activeSection === 'linkedin-import' ? (
            <LinkedInImporter
              onArticleImported={(newId) =>
                navigateTo({ name: 'admin', section: 'edit', articleId: newId })
              }
            />
          ) : activeSection === 'contributors' ? (
            <ContributorsManager />
          ) : activeSection === 'audit-logs' ? (
            <AuditLogsViewer />
          ) : activeSection === 'settings' ? (
            <AdminSettings />
          ) : (
            <DashboardOverview />
          )}
        </main>
      </div>
    </div>
  );
};
