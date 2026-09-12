import React, { useState, useMemo } from 'react';
import { Search, X, BookOpen, User, Tag as TagIcon, Compass } from 'lucide-react';
import { ARTICLES } from '../data/articles';
import { AUTHORS } from '../data/authors';
import { CATEGORIES } from '../data/categories';
import { TAGS } from '../data/tags';
import { ArticleCard } from '../components/article/ArticleCard';
import { SEOHead } from '../components/common/SEOHead';
import { useNavigation } from '../context/NavigationContext';

interface SearchPageProps {
  initialQuery?: string;
}

export const SearchPage: React.FC<SearchPageProps> = ({ initialQuery = '' }) => {
  const { navigateTo } = useNavigation();
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ARTICLES.filter((article) => {
      // Category filter
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }
      // Author filter
      if (selectedAuthor !== 'all' && article.authorId !== selectedAuthor) {
        return false;
      }
      // Tag filter
      if (selectedTag !== 'all' && !article.tags.includes(selectedTag)) {
        return false;
      }

      // If no text query, return true (filtered by facets)
      if (!q) return true;

      // Check title, subtitle, excerpt
      if (
        article.title.toLowerCase().includes(q) ||
        article.subtitle.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q)
      ) {
        return true;
      }

      // Check author name
      const author = AUTHORS.find((a) => a.id === article.authorId);
      if (author && author.name.toLowerCase().includes(q)) {
        return true;
      }

      // Check tags
      if (article.tags.some((t) => t.toLowerCase().includes(q))) {
        return true;
      }

      // Check content blocks
      return article.contentBlocks.some((b) => b.content && b.content.toLowerCase().includes(q));
    });
  }, [query, selectedCategory, selectedAuthor, selectedTag]);

  const clearAll = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedAuthor('all');
    setSelectedTag('all');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <SEOHead
        title="Search Veterinary Medicine & Pet Health — ThatVetGuy"
        description="Search our peer-reviewed veterinary library by clinical symptom, medication, blood test, diet, or author."
      />

      {/* Header */}
      <div className="space-y-3 border-b border-stone-200 pb-6 text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
          Clinical Index
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-stone-900">
          Search the ThatVetGuy Library
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Find evidence-based veterinary analyses across dog, cat, and companion animal health.
        </p>

        {/* Big Search Bar */}
        <div className="pt-2">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-emerald-800 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by symptom, condition, CBC values, food labels..."
              className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-stone-200 focus:border-emerald-800 rounded-2xl text-stone-900 text-sm shadow-xs focus:outline-hidden min-h-[48px]"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 text-stone-400 hover:text-stone-700 p-1"
                aria-label="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Suggested Quick Searches */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs text-stone-500">
          <span className="font-medium">Quick suggestions:</span>
          {['Vomiting', 'Food Label', 'CBC Values', 'Parvovirus', 'FLUTD', 'One Health'].map((term) => (
            <button
              key={term}
              onClick={() => setQuery(term)}
              className="text-emerald-900 hover:text-emerald-950 font-medium bg-emerald-50 px-2 py-0.5 rounded hover:bg-emerald-100 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Filter facets */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-hidden min-h-[38px]"
            >
              <option value="all">All Specialties</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Author Dropdown */}
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-hidden min-h-[38px]"
            >
              <option value="all">All Co-Founders</option>
              {AUTHORS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Dropdown */}
          <div className="flex items-center gap-1.5">
            <TagIcon className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-hidden min-h-[38px]"
            >
              <option value="all">All Tags</option>
              {TAGS.map((t) => (
                <option key={t.id} value={t.slug}>
                  #{t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-stone-500">
          <span>Found {searchResults.length} matching {searchResults.length === 1 ? 'article' : 'articles'}</span>
          {(query || selectedCategory !== 'all' || selectedAuthor !== 'all' || selectedTag !== 'all') && (
            <button
              onClick={clearAll}
              className="text-emerald-900 font-semibold underline hover:text-emerald-950"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {searchResults.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-stone-900">
            No matching publications found
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try searching for broader clinical terms like &ldquo;vomiting&rdquo;, &ldquo;nutrition&rdquo;, &ldquo;dog&rdquo;, or &ldquo;blood&rdquo;.
          </p>
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-emerald-900 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors inline-block mt-2 min-h-[44px]"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};
