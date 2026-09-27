import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Globe,
  FileText,
  Calendar,
  User,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Article, ArticleStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  getArticlesFromFirestore,
  deleteArticleFromFirestore,
  updateArticleStatusInFirestore,
} from '../../services/articleService';

interface ArticleListProps {
  onNewArticle: () => void;
  onEditArticle: (articleId: string) => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  onNewArticle,
  onEditArticle,
}) => {
  const { currentAuthor } = useAuth();
  const { navigateTo } = useNavigation();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'DRAFTS' | 'PUBLISHED'>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await getArticlesFromFirestore({ includeAllStatuses: true });
      setArticles(data);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleTogglePublish = async (art: Article) => {
    const newStatus: ArticleStatus = art.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await updateArticleStatusInFirestore(art.id, newStatus, {
        authorId: currentAuthor?.id,
        authorName: currentAuthor?.name,
      });
      setArticles((prev) =>
        prev.map((a) => (a.id === art.id ? { ...a, status: newStatus } : a))
      );
    } catch (err: any) {
      setActionError(err.message || 'Could not update publication status.');
    }
  };

  const handleDelete = async (articleId: string) => {
    try {
      await deleteArticleFromFirestore(articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      setDeleteConfirmId(null);
    } catch (err: any) {
      setActionError(err.message || 'Could not delete article.');
    }
  };

  // Filter & Search
  const filtered = articles.filter((art) => {
    // Search
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchTitle = (art.title || '').toLowerCase().includes(query);
      const matchAuthor = (art.authorName || '').toLowerCase().includes(query);
      const matchCategory = (art.category || '').toLowerCase().includes(query);
      if (!matchTitle && !matchAuthor && !matchCategory) return false;
    }

    // Filter status
    if (filter === 'DRAFTS') {
      return art.status !== 'PUBLISHED';
    }
    if (filter === 'PUBLISHED') {
      return art.status === 'PUBLISHED';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900">Articles</h2>
          <p className="text-xs text-stone-500 mt-1">
            Manage, edit, publish, and create clinical veterinary articles.
          </p>
        </div>
        <button
          onClick={onNewArticle}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>New Article</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="font-medium">{actionError}</p>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title, author, or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 focus:outline-hidden transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-semibold text-stone-600 shrink-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
            }`}
          >
            All ({articles.length})
          </button>
          <button
            onClick={() => setFilter('DRAFTS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'DRAFTS' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
            }`}
          >
            Drafts ({articles.filter((a) => a.status !== 'PUBLISHED').length})
          </button>
          <button
            onClick={() => setFilter('PUBLISHED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'PUBLISHED' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
            }`}
          >
            Published ({articles.filter((a) => a.status === 'PUBLISHED').length})
          </button>
        </div>
      </div>

      {/* Articles List / Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-medium">Loading articles...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-stone-200 rounded-3xl bg-stone-50/50 space-y-3 p-6">
          <FileText className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-serif font-bold text-base text-stone-800">
            No articles found
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {search
              ? 'No articles match your current search query.'
              : filter === 'DRAFTS'
              ? 'There are no active draft articles.'
              : filter === 'PUBLISHED'
              ? 'There are no published articles yet.'
              : 'Get started by creating your first veterinary article.'}
          </p>
          <button
            onClick={onNewArticle}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Create Article</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="divide-y divide-stone-100">
            {filtered.map((art) => {
              const isPublished = art.status === 'PUBLISHED';
              const updatedDateStr = art.updatedDate || art.updatedAt || art.publishedDate;
              const formattedDate = updatedDateStr
                ? new Date(updatedDateStr).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recently';

              return (
                <div
                  key={art.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors"
                >
                  {/* Article Info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isPublished
                            ? 'bg-emerald-100 text-emerald-950'
                            : 'bg-amber-100 text-amber-950'
                        }`}
                      >
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">
                        • {art.category || 'General'}
                      </span>
                      {art.sourcePlatform === 'LinkedIn' && (
                        <span className="text-[10px] font-semibold bg-[#0A66C2]/10 text-[#0A66C2] px-2 py-0.5 rounded-full">
                          LinkedIn Import
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-stone-900 text-base leading-snug line-clamp-2">
                      {art.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-0.5">
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        {art.authorName || 'ThatVetGuy Author'}
                      </span>
                      <span className="flex items-center gap-1 text-stone-400">
                        <Calendar className="w-3.5 h-3.5" />
                        Updated {formattedDate}
                      </span>
                      {isPublished && (
                        <button
                          onClick={() => navigateTo({ name: 'article', slug: art.slug })}
                          className="text-emerald-800 hover:text-emerald-950 font-medium flex items-center gap-1 transition-colors"
                          title="View live public article"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Live</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <button
                      onClick={() => handleTogglePublish(art)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isPublished
                          ? 'bg-stone-100 hover:bg-amber-50 text-stone-700 hover:text-amber-900'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950'
                      }`}
                      title={isPublished ? 'Unpublish back to Draft' : 'Publish Article'}
                    >
                      {isPublished ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Unpublish</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Publish</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onEditArticle(art.id)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(art.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete Article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Delete Article?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Are you sure you want to permanently delete this article? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
