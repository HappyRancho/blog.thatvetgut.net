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
  } = useAuth();
  const { route, navigateTo } = useNavigation();

  // Mobile sidebar drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  // Active section from route or default to 'overview'
  const activeSection = route.name === 'admin' ? route.section || 'overview' : 'overview';
  const editingArticleId = route.name === 'admin' ? route.articleId : undefined;

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

          {/* Equality notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-950">
            <ShieldCheck className="w-4 h-4 text-emerald-900 shrink-0 mt-0.5" />
            <p>
              <strong>Collaborative Publishing:</strong> All six Co-Founders share equal editorial control. Direct publishing, peer reviews, and article updates are managed here.
            </p>
          </div>

          {/* Primary Google Sign In */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full py-3.5 px-4 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-xs min-h-[48px]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.47 0 2.815.54 3.86 1.425l2.36-2.36C17.065 3.565 14.81 2.7 12.24 2.7 7.085 2.7 2.9 6.885 2.9 12.04c0 5.155 4.185 9.34 9.34 9.34 5.39 0 8.97-3.79 8.97-9.125 0-.62-.065-1.22-.175-1.97H12.24z" />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo({ name: 'home' })}
              className="w-full py-2.5 px-4 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-2xl transition-colors min-h-[44px]"
            >
              ← Return to ThatVetGuy Website
            </button>
          </div>

          {/* Quick Co-Founder Simulation Selection */}
          <div className="pt-4 border-t border-stone-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Quick Access (Co-Founder Accounts)
              </span>
              <span className="text-[10px] text-emerald-900 font-semibold">Equal Authority</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => signInAsPreset('dr-chirag-patidar')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Chirag Patidar</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder</div>
              </button>

              <button
                type="button"
                onClick={() => signInAsPreset('dr-amaan-ahmed')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Amaan Ahmed</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder</div>
              </button>

              <button
                type="button"
                onClick={() => signInAsPreset('dr-shivam-singh-thakur')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Shivam Singh Thakur</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder</div>
              </button>

              <button
                type="button"
                onClick={() => signInAsPreset('dr-ritesh-verma')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Ritesh Verma</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder</div>
              </button>

              <button
                type="button"
                onClick={() => signInAsPreset('dr-deepesh-mathur')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Deepesh Mathur</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder (Large Animal)</div>
              </button>

              <button
                type="button"
                onClick={() => signInAsPreset('dr-deepesh-chaware')}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40 text-xs transition-colors"
              >
                <div className="font-serif font-bold text-stone-900 truncate">Dr. Deepesh Chaware</div>
                <div className="text-[10px] text-stone-500 truncate">Co-Founder (Surgeon)</div>
              </button>
            </div>
          </div>
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
