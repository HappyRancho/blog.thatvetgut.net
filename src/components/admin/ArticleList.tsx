import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  Filter,
  FileText,
  Plus,
  Search,
  Trash2,
  User,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { Article, ArticleStatus } from '../../types';
import { CATEGORIES } from '../../data/categories';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  getArticlesFromFirestore,
  deleteArticleFromFirestore,
} from '../../services/articleService';

interface ArticleListProps {
  initialStatusFilter?: ArticleStatus | 'ALL' | 'MY_ARTICLES';
  title?: string;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  initialStatusFilter = 'ALL',
  title = 'All Articles',
}) => {
  const { currentAuthor, isCoFounder, allAuthors } = useAuth();
  const { navigateTo } = useNavigation();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(
    initialStatusFilter === 'MY_ARTICLES' ? 'ALL' : initialStatusFilter
  );
  const [authorFilter, setAuthorFilter] = useState<string>(
    initialStatusFilter === 'MY_ARTICLES' ? currentAuthor?.id || 'ALL' : 'ALL'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data = await getArticlesFromFirestore();
      setArticles(data);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = async (art: Article) => {
    if (!isCoFounder && art.authorId !== currentAuthor?.id) {
      alert('Only Co-Founders or the article author can delete this article.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete "${art.title}"?`)) {
      return;
    }
    try {
      await deleteArticleFromFirestore(art.id);
      await fetchArticles();
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  // Filter & Search computation
  const filtered = articles
    .filter((a) => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(query);
        const matchesExcerpt = (a.subtitle || a.excerpt || '').toLowerCase().includes(query);
        const matchesAuthor = (a.authorName || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesExcerpt && !matchesAuthor) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && a.status !== statusFilter) {
        return false;
      }

      // Author
      if (authorFilter !== 'ALL') {
        const targetAuthor = authorFilter === 'dr-shivam' ? 'dr-shivam-singh-thakur' : authorFilter;
        const artAuthor = a.authorId === 'dr-shivam' ? 'dr-shivam-singh-thakur' : a.authorId;
        if (artAuthor !== targetAuthor) return false;
      }

      // Category
      if (categoryFilter !== 'ALL' && a.category !== categoryFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.updatedDate || b.publishedDate || 0).getTime() - new Date(a.updatedDate || a.publishedDate || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.updatedDate || a.publishedDate || 0).getTime() - new Date(b.updatedDate || b.publishedDate || 0).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="space-y-6">
      {/* Header with Title and "Write Article" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
            {initialStatusFilter === 'MY_ARTICLES' ? 'My Articles' : title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Manage clinical manuscripts, drafts, submissions, and publications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigateTo({ name: 'admin', section: 'edit' })}
          className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl min-h-[44px] flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Write Article</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, clinical keyword, or author..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl min-h-[44px] outline-hidden focus:border-emerald-800"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-medium border border-stone-200 rounded-xl px-2.5 py-2 min-h-[40px] bg-white outline-hidden focus:border-emerald-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED FOR REVIEW">Submitted for Review</option>
              <option value="UNDER REVIEW">Under Review</option>
              <option value="CHANGES REQUESTED">Changes Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNPUBLISHED">Unpublished</option>
            </select>
          </div>

          {/* Author */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Author
            </label>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="w-full text-xs font-medium border border-stone-200 rounded-xl px-2.5 py-2 min-h-[40px] bg-white outline-hidden focus:border-emerald-800"
            >
              <option value="ALL">All Authors</option>
              {allAuthors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs font-medium border border-stone-200 rounded-xl px-2.5 py-2 min-h-[40px] bg-white outline-hidden focus:border-emerald-800"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs font-medium border border-stone-200 rounded-xl px-2.5 py-2 min-h-[40px] bg-white outline-hidden focus:border-emerald-800"
            >
              <option value="newest">Recently Updated</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* List or Table */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-xs">Loading articles from Firestore...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center">
          <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-stone-800 text-base">No Articles Found</h3>
          <p className="text-stone-500 text-xs mt-1">
            No articles match the current filter or search criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setAuthorFilter('ALL');
              setCategoryFilter('ALL');
            }}
            className="mt-4 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 rounded-xl inline-block"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((art) => {
            const isAuthor = art.authorId === currentAuthor?.id;
            const canEdit = isCoFounder || isAuthor;

            return (
              <div
                key={art.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        art.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-950'
                          : art.status === 'DRAFT'
                          ? 'bg-stone-100 text-stone-700'
                          : art.status === 'SUBMITTED FOR REVIEW'
                          ? 'bg-amber-100 text-amber-900'
                          : art.status === 'CHANGES REQUESTED'
                          ? 'bg-red-100 text-red-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {art.status}
                    </span>
                    <span className="text-xs text-stone-500 font-medium capitalize">
                      {art.category.replace('-', ' ')}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-xs text-stone-400 font-mono">
                      {art.readingTimeMinutes || 3} min read
                    </span>
                  </div>

                  <h3
                    onClick={() => {
                      if (canEdit) {
                        navigateTo({ name: 'admin', section: 'edit', articleId: art.id });
                      }
                    }}
                    className={`font-serif font-bold text-stone-900 text-base sm:text-lg leading-snug line-clamp-1 ${
                      canEdit ? 'hover:text-emerald-900 cursor-pointer' : ''
                    }`}
                  >
                    {art.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                    <span className="font-semibold text-stone-700">By {art.authorName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {new Date(art.updatedDate || art.publishedDate || 0).toLocaleDateString()}
                    </span>
                    {art.reviewer && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-950 font-medium">
                          Reviewed by {art.reviewer}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Public preview link if published */}
                  {art.status === 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => navigateTo({ name: 'article', slug: art.slug })}
                      className="p-2 text-stone-500 hover:text-emerald-950 hover:bg-stone-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                      title="View Public Article"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  {/* Edit */}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() =>
                        navigateTo({ name: 'admin', section: 'edit', articleId: art.id })
                      }
                      className="px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-900" />
                      <span>Edit</span>
                    </button>
                  )}

                  {/* Delete (Co-Founders or author) */}
                  {(isCoFounder || isAuthor) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(art)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                      title="Delete Article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
