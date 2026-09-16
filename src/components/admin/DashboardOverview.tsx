import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  Edit3,
  Users,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Linkedin,
  Activity,
} from 'lucide-react';
import { Article, Author } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { getArticlesFromFirestore } from '../../services/articleService';
import { getAllContributors } from '../../services/contributorService';

export const DashboardOverview: React.FC = () => {
  const { currentAuthor, isCoFounder, role } = useAuth();
  const { navigateTo } = useNavigation();

  const [articles, setArticles] = useState<Article[]>([]);
  const [contributors, setContributors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [arts, users] = await Promise.all([
          getArticlesFromFirestore(),
          getAllContributors(),
        ]);
        setArticles(arts);
        setContributors(users);
      } catch (err) {
        console.error('Error loading dashboard overview:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalArticles = articles.length;
  const publishedArticles = articles.filter((a) => a.status === 'PUBLISHED').length;
  const underReviewArticles = articles.filter(
    (a) =>
      a.status === 'SUBMITTED FOR REVIEW' ||
      a.status === 'UNDER REVIEW' ||
      a.status === 'CHANGES REQUESTED'
  ).length;
  const draftArticles = articles.filter((a) => a.status === 'DRAFT').length;
  const totalContributors = contributors.length;

  // Recent activity or recent articles
  const recentArticles = articles.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome & Co-Founder Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-800/80 border border-emerald-700/50 text-[11px] font-semibold text-emerald-100 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>{currentAuthor?.designation || 'ThatVetGuy Editorial Portal'}</span>
            </div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">
              Welcome, {currentAuthor?.name}
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
              {isCoFounder
                ? 'As one of the six Co-Founders, you possess equal publishing authority to review, approve, edit, and publish clinical articles directly.'
                : 'Welcome to ThatVetGuy. Write clinical manuscripts and submit them to the Co-Founder editorial team for review.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo({ name: 'admin', section: 'edit' })}
              className="px-5 py-3 rounded-xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-sm min-h-[44px]"
            >
              <Plus className="w-4 h-4 text-emerald-900" />
              <span>Write Article</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics / Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Articles */}
        <div
          onClick={() => navigateTo({ name: 'admin', section: 'all-articles' })}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-800/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Total Articles
            </span>
            <FileText className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {loading ? '—' : totalArticles}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">All clinical manuscripts</span>
        </div>

        {/* Published Articles */}
        <div
          onClick={() => navigateTo({ name: 'admin', section: 'published' })}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-800/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-emerald-900 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950">
              Published
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950">
            {loading ? '—' : publishedArticles}
          </div>
          <span className="text-[11px] text-emerald-900/70 mt-1 block">Live on ThatVetGuy</span>
        </div>

        {/* Review Queue */}
        <div
          onClick={() => navigateTo({ name: 'admin', section: 'review-queue' })}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-amber-800/40 cursor-pointer transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              In Review
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-900">
            {loading ? '—' : underReviewArticles}
          </div>
          <span className="text-[11px] text-amber-700/80 mt-1 block">Awaiting peer actions</span>
        </div>

        {/* Drafts */}
        <div
          onClick={() => navigateTo({ name: 'admin', section: 'drafts' })}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Drafts
            </span>
            <Edit3 className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">
            {loading ? '—' : draftArticles}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Work in progress</span>
        </div>

        {/* Total Contributors */}
        <div
          onClick={() => navigateTo({ name: 'admin', section: 'contributors' })}
          className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-800/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Contributors
            </span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {loading ? '—' : totalContributors}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Co-Founders & authors</span>
        </div>
      </div>

      {/* Two Column Layout: Quick Actions & Recent Manuscripts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Actions & Review alert */}
        <div className="space-y-4">
          {/* Review Alert if items in queue */}
          {underReviewArticles > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    {underReviewArticles} Article{underReviewArticles > 1 ? 's' : ''} Awaiting Review
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Peer submissions are ready for Co-Founder feedback, change requests, or publication.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo({ name: 'admin', section: 'review-queue' })}
                    className="mt-3 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl flex items-center gap-1 transition-colors min-h-[38px]"
                  >
                    <span>Open Review Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Nav Cards */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-3">
            <h4 className="font-serif font-bold text-stone-900 text-sm">Editorial Shortcuts</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigateTo({ name: 'admin', section: 'edit' })}
                className="w-full text-left p-3 rounded-xl hover:bg-stone-50 border border-stone-100 flex items-center justify-between group transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-4 h-4 text-emerald-900" />
                  <span className="text-xs font-semibold text-stone-800">Write New Article</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigateTo({ name: 'admin', section: 'my-articles' })}
                className="w-full text-left p-3 rounded-xl hover:bg-stone-50 border border-stone-100 flex items-center justify-between group transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-stone-700" />
                  <span className="text-xs font-semibold text-stone-800">My Written Articles</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigateTo({ name: 'admin', section: 'contributors' })}
                className="w-full text-left p-3 rounded-xl hover:bg-stone-50 border border-stone-100 flex items-center justify-between group transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-stone-700" />
                  <span className="text-xs font-semibold text-stone-800">Manage Team Profiles</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigateTo({ name: 'admin', section: 'linkedin-import' })}
                className="w-full text-left p-3 rounded-xl hover:bg-[#0A66C2]/5 border border-stone-100 flex items-center justify-between group transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                  <span className="text-xs font-semibold text-stone-800">Import from LinkedIn</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
              </button>

              {isCoFounder && (
                <button
                  type="button"
                  onClick={() => navigateTo({ name: 'admin', section: 'audit-logs' })}
                  className="w-full text-left p-3 rounded-xl hover:bg-stone-50 border border-stone-100 flex items-center justify-between group transition-colors min-h-[44px]"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-emerald-900" />
                    <span className="text-xs font-semibold text-stone-800">Security Audit Logs</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
                </button>
              )}
            </div>
          </div>

          {/* Equality Architecture Statement */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 sm:p-5 text-xs text-stone-600 space-y-2">
            <h5 className="font-bold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <span>Equal Co-Founder Authority</span>
            </h5>
            <p className="leading-relaxed">
              Dr. Chirag Patidar, Dr. Amaan Ahmed, Dr. Shivam Singh Thakur, Dr. Ritesh Verma, Dr. Deepesh Mathur, and Dr. Deepesh Chaware all hold equal status as ThatVetGuy Co-Founders.
            </p>
          </div>
        </div>

        {/* Right: Recent Articles List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-serif font-bold text-stone-900 text-base">
              Recent Clinical Manuscripts
            </h3>
            <button
              type="button"
              onClick={() => navigateTo({ name: 'admin', section: 'all-articles' })}
              className="text-xs font-semibold text-emerald-950 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400">Loading articles...</div>
          ) : recentArticles.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">No articles found.</div>
          ) : (
            <div className="space-y-3">
              {recentArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => navigateTo({ name: 'admin', section: 'edit', articleId: art.id })}
                  className="p-3.5 rounded-xl border border-stone-100 hover:border-stone-300 hover:bg-stone-50/70 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          art.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-950'
                            : art.status === 'DRAFT'
                            ? 'bg-stone-100 text-stone-700'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {art.status}
                      </span>
                      <span className="text-[11px] text-stone-500 truncate">
                        By {art.authorName}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-stone-900 text-sm leading-snug line-clamp-1">
                      {art.title}
                    </h4>
                  </div>
                  <div className="text-[11px] text-stone-400 shrink-0 font-mono">
                    {new Date(art.updatedDate || art.publishedDate || 0).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
