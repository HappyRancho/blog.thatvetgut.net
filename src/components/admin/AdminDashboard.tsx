import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Clock,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { DashboardOverview } from './DashboardOverview';
import { ArticleList } from './ArticleList';
import { ArticleEditor } from './ArticleEditor';
import { ReviewQueue } from './ReviewQueue';
import { ContributorsManager } from './ContributorsManager';
import { AdminSettings } from './AdminSettings';
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
    signInAsPreset,
    signOutUser,
    authError,
    clearAuthError,
  } = useAuth();
  const { route, navigateTo } = useNavigation();

  // Mobile sidebar drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Active section from route or default to 'overview'
  const activeSection = route.name === 'admin' ? route.section || 'overview' : 'overview';
  const editingArticleId = route.name === 'admin' ? route.articleId : undefined;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      // Handled in AuthContext
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePresetSignIn = async (authorId: string) => {
    setIsSigningIn(true);
    try {
      await signInAsPreset(authorId);
    } finally {
      setIsSigningIn(false);
    }
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

  // If not authenticated, render the Team Sign-in Screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-950 text-white shadow-md mx-auto mb-1">
              <span className="font-serif font-black text-2xl tracking-tighter">TVG</span>
            </div>
            <h1 className="font-serif font-bold text-2xl text-stone-900">
              ThatVetGuy Editorial CMS
            </h1>
            <p className="text-xs text-stone-600">
              Authorized publishing portal for the six ThatVetGuy Co-Founders and accredited veterinary contributors.
            </p>
          </div>

          {/* Equality notice & Verification Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2 text-xs text-emerald-950">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-900 shrink-0 mt-0.5" />
              <div>
                <strong>Equal Editorial Authority:</strong>
                <p className="text-emerald-900/90 mt-0.5">
                  All six ThatVetGuy Co-Founders possess full, equal administrator rights (publishing, editing, reviewing, and contributor management).
                </p>
              </div>
            </div>
            <div className="text-[11px] text-emerald-800 bg-white/70 p-2 rounded-xl border border-emerald-200/60 font-mono">
              Admin Email: chiragpatidar0369@gmail.com (Verified Lead)
            </div>
          </div>

          {/* Auth Error Banner if present */}
          {authError && (
            <div className="bg-amber-50 border border-amber-300 text-amber-950 p-3.5 rounded-2xl text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="text-base leading-none">⚠️</span>
                <span>{authError}</span>
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

          {/* Featured Admin: Dr. Chirag Patidar (1-Click Instant Login) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              1-Click Admin Verification
            </span>
            <button
              type="button"
              id="cms-login-chirag-btn"
              disabled={isSigningIn}
              onClick={() => handlePresetSignIn('dr-chirag-patidar')}
              className="w-full p-3.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-sm rounded-2xl flex items-center justify-between transition-all shadow-sm group min-h-[50px] cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center font-serif text-xs text-white border border-emerald-700">
                  CP
                </div>
                <div>
                  <div className="font-serif font-bold text-sm leading-tight text-white">
                    Login as Dr. Chirag Patidar
                  </div>
                  <div className="text-[10px] text-emerald-200 font-normal">
                    Co-Founder & Admin (chiragpatidar0369@gmail.com)
                  </div>
                </div>
              </div>
              <span className="text-xs bg-emerald-800/80 px-2.5 py-1 rounded-lg text-emerald-100 font-semibold group-hover:bg-emerald-700">
                {isSigningIn ? 'Verifying...' : 'Enter CMS →'}
              </span>
            </button>
          </div>

          {/* Primary Google Sign In */}
          <div className="space-y-2.5 pt-2 border-t border-stone-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Or Authenticate with Google
            </span>
            <button
              type="button"
              id="cms-google-signin-btn"
              disabled={isSigningIn}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm rounded-2xl border border-stone-300 flex items-center justify-center gap-3 transition-colors shadow-xs min-h-[48px] cursor-pointer"
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
          </div>

          {/* All Co-Founder Accounts */}
          <div className="pt-3 border-t border-stone-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                All 6 Co-Founder Accounts
              </span>
              <span className="text-[10px] text-emerald-900 font-semibold">Equal Authority</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handlePresetSignIn('dr-chirag-patidar')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors cursor-pointer"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Chirag Patidar</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSignIn('dr-amaan-ahmed')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors cursor-pointer"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Amaan Ahmed</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSignIn('dr-shivam-singh-thakur')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors cursor-pointer"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Shivam Singh Thakur</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSignIn('dr-ritesh-verma')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors cursor-pointer"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Ritesh Verma</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSignIn('dr-deepesh-mathur')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors cursor-pointer"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Deepesh Mathur</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder (Large Animal)</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSignIn('dr-deepesh-chaware')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors cursor-pointer"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Deepesh Chaware</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder (Surgeon)</div>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateTo({ name: 'home' })}
            className="w-full py-2 px-4 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-2xl transition-colors min-h-[40px] text-center"
          >
            ← Return to ThatVetGuy Website
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
    { id: 'contributors', label: 'Contributors', icon: Users },
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
          ) : activeSection === 'contributors' ? (
            <ContributorsManager />
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
