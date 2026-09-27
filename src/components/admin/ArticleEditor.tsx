import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  Globe,
  Tag,
  FolderOpen,
  User,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import { Article, ArticleStatus } from '../../types';
import { CATEGORIES } from '../../data/categories';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  generateSlug,
  calculateReadingTime,
  getArticleByIdFromFirestore,
  saveArticleToFirestore,
  deleteArticleFromFirestore,
} from '../../services/articleService';
import { uploadImageFile } from '../../services/imageService';
import { RichTextEditor } from './RichTextEditor';

interface ArticleEditorProps {
  articleId?: string;
  initialData?: Partial<Article>;
  onClose: () => void;
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({
  articleId,
  initialData,
  onClose,
}) => {
  const { currentAuthor, allAuthors } = useAuth();
  const { navigateTo } = useNavigation();

  const isNew = !articleId || articleId === 'new';

  // Form states
  const [title, setTitle] = useState(initialData?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || initialData?.excerpt || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [authorId, setAuthorId] = useState(
    initialData?.authorId || currentAuthor?.id || 'dr-chirag-patidar'
  );
  const [category, setCategory] = useState(initialData?.category || 'pet-health');
  const [tagsInput, setTagsInput] = useState(
    (initialData?.tags || ['veterinary-medicine', 'preventive-care']).join(', ')
  );
  const [featuredImage, setFeaturedImage] = useState(
    initialData?.featuredImage ||
      'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200'
  );
  const [content, setContent] = useState(initialData?.content || '');
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || '');
  const [status, setStatus] = useState<ArticleStatus>(initialData?.status || 'DRAFT');

  // Metadata for imported articles
  const [sourceUrl] = useState(initialData?.sourceUrl || '');
  const [sourcePlatform] = useState(initialData?.sourcePlatform || '');
  const [importedAt] = useState(initialData?.importedAt || '');
  const [importedBy] = useState(initialData?.importedBy || '');

  // UI state
  const [isLoadingArticle, setIsLoadingArticle] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load article if editing existing
  useEffect(() => {
    if (isNew) return;

    let isMounted = true;
    async function load() {
      setIsLoadingArticle(true);
      try {
        const art = await getArticleByIdFromFirestore(articleId!);
        if (art && isMounted) {
          setTitle(art.title || '');
          setSubtitle(art.subtitle || art.excerpt || '');
          setSlug(art.slug || '');
          setIsSlugManual(true);
          setAuthorId(art.authorId || currentAuthor?.id || 'dr-chirag-patidar');
          setCategory(art.category || 'pet-health');
          setTagsInput((art.tags || []).join(', '));
          setFeaturedImage(art.featuredImage || '');
          setContent(art.content || '');
          setSeoTitle(art.seoTitle || '');
          setSeoDescription(art.seoDescription || '');
          setStatus(art.status || 'DRAFT');
        }
      } catch (err: any) {
        if (isMounted) setErrorMessage('Could not load article data: ' + err.message);
      } finally {
        if (isMounted) setIsLoadingArticle(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [articleId, isNew, currentAuthor]);

  // Auto-generate slug from title unless manually edited
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManual) {
      setSlug(generateSlug(val));
    }
    if (!seoTitle) {
      setSeoTitle(`${val} | ThatVetGuy`);
    }
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsUploadingImage(true);
    try {
      const res = await uploadImageFile(file, {
        folder: 'articles',
        id: slug || 'featured',
        maxWidth: 1600,
        maxHeight: 1200,
      });
      setFeaturedImage(res.url);
      setSuccessMessage('Featured cover image uploaded successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload featured image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (targetStatus: ArticleStatus) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('Please enter an article title.');
      return;
    }

    const cleanSlug = (slug || generateSlug(cleanTitle)).trim();
    if (!cleanSlug) {
      setErrorMessage('Please enter or generate an article slug.');
      return;
    }

    const assignedAuthor = allAuthors.find((a) => a.id === authorId) || currentAuthor;
    const authorName = assignedAuthor?.name || 'ThatVetGuy Co-Founder';

    const tagsList = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      const articlePayload: Partial<Article> = {
        title: cleanTitle,
        subtitle: subtitle.trim(),
        excerpt: subtitle.trim() || cleanTitle,
        slug: cleanSlug,
        authorId: authorId,
        authorName: authorName,
        category: category,
        tags: tagsList.length > 0 ? tagsList : ['veterinary-medicine'],
        featuredImage: featuredImage.trim(),
        content: content,
        status: targetStatus,
        seoTitle: seoTitle.trim() || `${cleanTitle} | ThatVetGuy`,
        seoDescription: seoDescription.trim() || subtitle.trim(),
        readingTime: calculateReadingTime(content),
        readingTimeMinutes: calculateReadingTime(content),
        canonicalUrl: `https://www.thatvetguy.net/article/${cleanSlug}`,
        sourceUrl: sourceUrl || undefined,
        sourcePlatform: sourcePlatform || undefined,
        importedAt: importedAt || undefined,
        importedBy: importedBy || undefined,
      };

      const finalId = isNew ? cleanSlug : articleId!;
      await saveArticleToFirestore({ ...articlePayload, id: finalId }, assignedAuthor);
      setStatus(targetStatus);
      setSuccessMessage(
        targetStatus === 'PUBLISHED'
          ? 'Article published successfully! It is now live on the public website.'
          : 'Draft saved successfully.'
      );

      // Return to articles view after save
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save article.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!articleId || isNew) return;
    setIsSaving(true);
    try {
      await deleteArticleFromFirestore(articleId);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not delete article.');
      setIsSaving(false);
    }
  };

  if (isLoadingArticle) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-medium">Loading article data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors shrink-0"
            title="Return to Articles list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
              {isNew ? 'New Clinical Article' : 'Edit Article'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-950'
                    : 'bg-amber-100 text-amber-950'
                }`}
              >
                {status}
              </span>
              <span>•</span>
              <span>By {allAuthors.find((a) => a.id === authorId)?.name || 'Co-Founder'}</span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {!isNew && status === 'PUBLISHED' && (
            <button
              type="button"
              onClick={() => navigateTo({ name: 'article', slug: slug })}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Public</span>
            </button>
          )}

          {!isNew && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Delete Article"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-950 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="space-y-6">
        {/* Title & Subtitle */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Article Headline / Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Canine Cardiac Emergencies: Initial Clinical Stabilization Protocol"
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-2xl font-serif text-lg sm:text-xl text-stone-900 focus:outline-hidden focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Clinical Subtitle / Summary Excerpt
            </label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="A concise clinical summary or key takeaway for pet parents and practitioners..."
              className="w-full p-3.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600 leading-relaxed"
            />
          </div>
        </div>

        {/* Metadata Grid (Author, Category, Slug) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5">
          {/* Author */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-800" />
              Authoring Co-Founder *
            </label>
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
            >
              {allAuthors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} ({author.designation})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-emerald-800" />
              Primary Specialty / Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-800" />
              URL Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManual(true);
              }}
              placeholder="e.g. canine-cardiac-emergencies"
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Featured Image */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-800" />
            Featured Article Cover Photo
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {featuredImage && (
              <img
                src={featuredImage}
                alt="Cover Preview"
                className="w-full sm:w-48 h-32 rounded-xl object-cover border border-stone-200 shadow-2xs shrink-0"
              />
            )}

            <div className="space-y-2 flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{isUploadingImage ? 'Uploading...' : 'Upload from Device/Phone'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={isUploadingImage}
                    onChange={handleFeaturedImageUpload}
                  />
                </label>
              </div>
              <input
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="Or paste image URL here..."
                className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Content Body Editor */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider">
            Article Content *
          </label>
          <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write the full clinical article content here. Use formatting buttons above for headings, bold, lists, quotes, and links..."
              minHeight="420px"
            />
          </div>
        </div>

        {/* Clinical Tags */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-800" />
            Clinical Tags (Comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. canine-health, cardiology, emergency-medicine, clinical-protocol"
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
          />
        </div>

        {/* SEO Settings */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-800" />
            Search Engine Optimization (SEO)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={`${title || 'Article Title'} | ThatVetGuy`}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                SEO Meta Description
              </label>
              <input
                type="text"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder={subtitle || 'A concise summary for search engine results...'}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave('DRAFT')}
              className="px-5 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-2xs"
            >
              <Save className="w-3.5 h-3.5 text-stone-500" />
              <span>Save Draft</span>
            </button>

            {status === 'PUBLISHED' ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave('DRAFT')}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Unpublish</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave('PUBLISHED')}
                className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-300" />
                <span>Publish Article</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
                Are you sure you want to delete this article? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
