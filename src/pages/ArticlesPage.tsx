import React, { useState, useMemo } from 'react';
import { Bookmark, Filter, Grid, LayoutList, Search, X } from 'lucide-react';
import { ARTICLES } from '../data/articles';
import { CATEGORIES } from '../data/categories';
import { TAGS } from '../data/tags';
import { ArticleCard } from '../components/article/ArticleCard';
import { SEOHead } from '../components/common/SEOHead';
import { useBookmarks } from '../context/BookmarksContext';

interface ArticlesPageProps {
  initialCategory?: string;
  initialTag?: string;
}

export const ArticlesPage: React.FC<ArticlesPageProps> = ({
  initialCategory,
  initialTag,
}) => {
  const { bookmarks } = useBookmarks();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedTag, setSelectedTag] = useState<string>(initialTag || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlySaved, setOnlySaved] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'readingTime' | 'title'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((article) => {
      // Category
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }
      // Tag
      if (selectedTag !== 'all' && !article.tags.includes(selectedTag)) {
        return false;
      }
      // Saved only
      if (onlySaved && !bookmarks.includes(article.id)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesSubtitle = article.subtitle.toLowerCase().includes(q);
        const matchesExcerpt = article.excerpt.toLowerCase().includes(q);
        const matchesTags = article.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSubtitle && !matchesExcerpt && !matchesTags) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
      }
      if (sortBy === 'readingTime') {
        return a.readingTimeMinutes - b.readingTimeMinutes;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [selectedCategory, selectedTag, onlySaved, searchQuery, sortBy, bookmarks]);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedTag('all');
    setSearchQuery('');
    setOnlySaved(false);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' || selectedTag !== 'all' || searchQuery.trim() !== '' || onlySaved;

  return (
    <div className="space-y-8">
      <SEOHead
        title="All Veterinary Articles & Clinical Guides — ThatVetGuy"
        description="Explore peer-reviewed pet healthcare guides, clinical pathology overviews, animal nutrition research, and preventative care articles."
      />

      {/* Page Header */}
      <div className="border-b border-stone-200 pb-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
          Clinical Library
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-stone-900">
          All Veterinary Articles
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl">
          Search and filter evidence-based medical articles, diagnostic breakdowns, and animal-health education written collectively by ThatVetGuy Co-Founders.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search input and View controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by symptom, test, disease, keyword..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Saved Toggle */}
            <button
              onClick={() => setOnlySaved(!onlySaved)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors min-h-[44px] ${
                onlySaved
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? 'fill-emerald-800' : ''}`} />
              <span>Saved ({bookmarks.length})</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-hidden min-h-[44px]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="readingTime">Sort: Quickest Read</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                  viewMode === 'grid' ? 'bg-emerald-900 text-white' : 'text-stone-500 hover:text-stone-800'
                }`}
                aria-label="Grid layout"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                  viewMode === 'list' ? 'bg-emerald-900 text-white' : 'text-stone-500 hover:text-stone-800'
                }`}
                aria-label="List layout"
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              selectedCategory === 'all'
                ? 'bg-emerald-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Specialties
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                selectedCategory === cat.slug
                  ? 'bg-emerald-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[11px] text-stone-500 border-t border-stone-100">
          <span className="font-semibold text-stone-400 shrink-0">Tags:</span>
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-2 py-0.5 rounded transition-colors ${
              selectedTag === 'all' ? 'text-emerald-950 font-bold underline' : 'hover:text-stone-800'
            }`}
          >
            All
          </button>
          {TAGS.slice(0, 10).map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.slug)}
              className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                selectedTag === tag.slug
                  ? 'bg-emerald-100 text-emerald-900 font-bold'
                  : 'hover:text-stone-800'
              }`}
            >
              #{tag.name}
            </button>
          ))}
        </div>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
            <span>
              Showing {filteredArticles.length} of {ARTICLES.length} articles
            </span>
            <button
              onClick={clearFilters}
              className="text-emerald-900 hover:text-emerald-950 font-semibold underline flex items-center gap-1"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Article Results */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <Filter className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-stone-900">No articles matched your criteria</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try adjusting your search query, selecting &ldquo;All Specialties&rdquo;, or resetting tags.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-emerald-900 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors inline-block mt-2 min-h-[44px]"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} layout="horizontal" />
          ))}
        </div>
      )}
    </div>
  );
};
