import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  User,
  LogOut,
  Plus,
  Linkedin,
  Clock,
  Eye,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { AdminLogin } from './AdminLogin';
import { ArticleList } from './ArticleList';
import { ArticleEditor } from './ArticleEditor';
import { ProfileEditor } from './ProfileEditor';
import { LinkedInImporterModal } from './LinkedInImporterModal';
import { LinkedInImportData } from '../../services/linkedinImportService';
import { getArticlesFromFirestore } from '../../services/articleService';
import { Article } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { currentAuthor, isAuthorized, loading, logout } = useAuth();
  const { route, navigateTo } = useNavigation();

  // Navigation tab state: 'dashboard' | 'articles' | 'profile' | 'editor'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'profile' | 'editor'>(() => {
    if (route.name === 'admin') {
      if (route.section === 'edit') return 'editor';
      if (route.section === 'articles') return 'articles';
      if (route.section === 'profile') return 'profile';
    }
    return 'dashboard';
  });

  const [editingArticleId, setEditingArticleId] = useState<string | undefined>(
    route.name === 'admin' && route.section === 'edit' ? route.articleId : undefined
  );
  const [importedArticleData, setImportedArticleData] = useState<Partial<Article> | undefined>(undefined);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick stats & recent articles for Dashboard view
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Sync route changes to active tab
  useEffect(() => {
    if (route.name === 'admin') {
      if (route.section === 'edit') {
        setActiveTab('editor');
        setEditingArticleId(route.articleId);
      } else if (route.section === 'articles') {
        setActiveTab('articles');
      } else if (route.section === 'profile') {
        setActiveTab('profile');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [route]);

  // Load dashboard overview data
  useEffect(() => {
    if (!isAuthorized) return;
    let isMounted = true;
    async function loadData() {
      setLoadingDashboard(true);
      try {
        const articles = await getArticlesFromFirestore({ includeAllStatuses: true });
        if (isMounted) {
          const publishedCount = articles.filter((a) => a.status === 'PUBLISHED').length;
          const draftsCount = articles.filter((a) => a.status !== 'PUBLISHED').length;
          setStats({
            total: articles.length,
            published: publishedCount,
            drafts: draftsCount,
          });
          setRecentArticles(articles.slice(0, 5));
        }
      } catch (err) {
        console.warn('Dashboard data fetch notice:', err);
      } finally {
        if (isMounted) setLoadingDashboard(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [isAuthorized, activeTab]);

  // If loading Firebase Auth state
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Verifying ThatVetGuy CMS Credentials...
        </p>
      </div>
    );
  }

  // If not authenticated or not authorized, show clean secure Login Screen
  if (!isAuthorized || !currentAuthor) {
    return <AdminLogin />;
  }

  const handleTabChange = (tab: 'dashboard' | 'articles' | 'profile') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (tab === 'dashboard') {
      navigateTo({ name: 'admin' });
    } else if (tab === 'articles') {
      navigateTo({ name: 'admin', section: 'articles' });
    } else if (tab === 'profile') {
      navigateTo({ name: 'admin', section: 'profile' });
    }
  };

  const handleStartNewArticle = () => {
    setEditingArticleId('new');
    setImportedArticleData(undefined);
    setActiveTab('editor');
    navigateTo({ name: 'admin', section: 'edit', articleId: 'new' });
  };

  const handleEditArticle = (articleId: string) => {
    setEditingArticleId(articleId);
    setImportedArticleData(undefined);
    setActiveTab('editor');
    navigateTo({ name: 'admin', section: 'edit', articleId });
  };

  const handleLinkedInImportSuccess = (data: LinkedInImportData) => {
    setImportedArticleData({
      title: data.title,
      subtitle: data.subtitle,
      excerpt: data.excerpt,
      slug: data.slug,
      content: data.content,
      featuredImage: data.featuredImage,
      sourceUrl: data.sourceUrl,
      sourcePlatform: data.sourcePlatform,
      importedAt: data.importedAt,
      importedBy: currentAuthor.id,
      tags: data.tags,
      status: 'DRAFT',
    });
    setEditingArticleId('new');
    setActiveTab('editor');
    navigateTo({ name: 'admin', section: 'edit', articleId: 'new' });
  };

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* Top CMS Header */}
      <header className="sticky top-0 z-30 bg-stone-900 text-white border-b border-stone-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Left: Brand */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleTabChange('dashboard')}
                className="flex items-center gap-2 group text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-serif font-bold text-lg sm:text-xl text-white tracking-tight">
                  THATVETGUY CMS
                </span>
              </button>
            </div>

            {/* Center / Welcome text */}
            <div className="hidden md:flex items-center gap-2 text-xs text-stone-300">
              <span className="text-stone-500">•</span>
              <span>
                Welcome, <strong className="text-white font-semibold">{currentAuthor.name}</strong>
              </span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Co-Founder
              </span>
            </div>

            {/* Right: Quick Action Buttons & Mobile Hamburger */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleStartNewArticle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Article</span>
              </button>

              <button
                onClick={() => setShowLinkedInModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl border border-stone-700 transition-colors"
                title="Import public article from LinkedIn"
              >
                <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                <span className="hidden sm:inline">Import from LinkedIn</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-stone-400 hover:text-white rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation Bar (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 py-2 border-t border-stone-800/80 text-xs font-medium">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-stone-800 text-white font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleTabChange('articles')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === 'articles' || activeTab === 'editor'
                  ? 'bg-stone-800 text-white font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Articles</span>
            </button>

            <button
              onClick={() => handleTabChange('profile')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-stone-800 text-white font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Profile</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800/60 rounded-lg transition-colors"
                title="End CMS session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-800 px-4 py-3 space-y-1 bg-stone-900 animate-in slide-in-from-top-2">
            <div className="pb-2 border-b border-stone-800 text-xs text-stone-400">
              Logged in as <strong className="text-white">{currentAuthor.name}</strong>
            </div>
            <button
              onClick={() => handleTabChange('dashboard')}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-200 hover:bg-stone-800"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleTabChange('articles')}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-200 hover:bg-stone-800"
            >
              <FileText className="w-4 h-4" />
              <span>Articles</span>
            </button>
            <button
              onClick={() => handleTabChange('profile')}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-200 hover:bg-stone-800"
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-stone-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Main CMS Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* View 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Welcome banner */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  ThatVetGuy Editorial Portal
                </span>
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
                  Welcome, Dr. {currentAuthor.name.replace(/^Dr\.\s*/i, '')}
                </h1>
                <p className="text-xs text-stone-500">
                  All six Co-Founders have equal editorial authority. Create articles, publish manuscripts, and keep your author profile updated.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleStartNewArticle}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>+ New Article</span>
                </button>
                <button
                  onClick={() => setShowLinkedInModal(true)}
                  className="px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-2xs"
                >
                  <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                  <span>Import from LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Total Articles
                </span>
                <p className="font-serif font-bold text-3xl text-stone-900">{stats.total}</p>
                <p className="text-[11px] text-stone-400">Total clinical manuscripts in catalog</p>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  Published Live
                </span>
                <p className="font-serif font-bold text-3xl text-emerald-950">{stats.published}</p>
                <p className="text-[11px] text-stone-400">Publicly visible on thatvetguy.net</p>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                  Drafts
                </span>
                <p className="font-serif font-bold text-3xl text-amber-950">{stats.drafts}</p>
                <p className="text-[11px] text-stone-400">Private unpublished manuscripts</p>
              </div>
            </div>

            {/* Recent Articles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-xl text-stone-900">
                  Recent Articles
                </h3>
                <button
                  onClick={() => handleTabChange('articles')}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
                >
                  View All Articles →
                </button>
              </div>

              {loadingDashboard ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  Loading catalog...
                </div>
              ) : recentArticles.length === 0 ? (
                <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl text-xs text-stone-500">
                  No articles available. Create your first article above.
                </div>
              ) : (
                <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 overflow-hidden shadow-2xs">
                  {recentArticles.map((art) => (
                    <div
                      key={art.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              art.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-950'
                                : 'bg-amber-100 text-amber-950'
                            }`}
                          >
                            {art.status}
                          </span>
                          <span className="text-xs text-stone-500">• By {art.authorName}</span>
                        </div>
                        <h4 className="font-serif font-semibold text-sm sm:text-base text-stone-900 truncate">
                          {art.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditArticle(art.id)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View 2: Articles List */}
        {activeTab === 'articles' && (
          <ArticleList
            onNewArticle={handleStartNewArticle}
            onEditArticle={handleEditArticle}
          />
        )}

        {/* View 3: Article Editor */}
        {activeTab === 'editor' && (
          <ArticleEditor
            articleId={editingArticleId}
            initialData={importedArticleData}
            onClose={() => handleTabChange('articles')}
          />
        )}

        {/* View 4: Author Profile Editor */}
        {activeTab === 'profile' && <ProfileEditor />}
      </main>

      {/* LinkedIn Import Modal */}
      <LinkedInImporterModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
        onImportSuccess={handleLinkedInImportSuccess}
      />
    </div>
  );
};
