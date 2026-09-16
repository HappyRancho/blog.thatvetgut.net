import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Image as ImageIcon,
  Link,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  AlertCircle,
  BookOpen,
  ExternalLink,
  CheckCircle,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Article, ArticleReference, ArticleStatus, Author } from '../../types';
import { CATEGORIES } from '../../data/categories';
import { TAGS } from '../../data/tags';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  calculateReadingTime,
  generateSlug,
  getArticleByIdFromFirestore,
  saveArticleToFirestore,
  deleteArticleFromFirestore,
} from '../../services/articleService';
import { logAuditEvent } from '../../services/auditService';
import { sanitizeHtml, sanitizePlainText } from '../../lib/sanitizer';
import { uploadImageFile, validateImageFile } from '../../services/imageService';
import { RichTextEditor } from './RichTextEditor';
import { ArticleContent } from '../article/ArticleContent';

interface ArticleEditorProps {
  articleId?: string;
  onClose?: () => void;
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({ articleId, onClose }) => {
  const { currentAuthor, isCoFounder, allAuthors } = useAuth();
  const { navigateTo } = useNavigation();

  // Form states
  const [id, setId] = useState<string>(articleId || '');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState(
    'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200'
  );
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [category, setCategory] = useState('pet-health');
  const [selectedTags, setSelectedTags] = useState<string[]>(['preventive-care']);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>(currentAuthor?.id || 'dr-chirag-patidar');
  const [reviewerId, setReviewerId] = useState<string>('');
  const [status, setStatus] = useState<ArticleStatus>('DRAFT');
  const [references, setReferences] = useState<ArticleReference[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('');
  const [importedAt, setImportedAt] = useState<string | undefined>(undefined);
  const [importedBy, setImportedBy] = useState<string | undefined>(undefined);

  // Preview Mode state
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Image upload states
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false);
  const [featuredUploadError, setFeaturedUploadError] = useState<string | null>(null);
  const featuredFileInputRef = useRef<HTMLInputElement>(null);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(Boolean(articleId));
  const [publishNotification, setPublishNotification] = useState<{
    status: ArticleStatus;
    slug: string;
    title: string;
  } | null>(null);

  // Reference modal
  const [showRefModal, setShowRefModal] = useState(false);
  const [newRefCitation, setNewRefCitation] = useState('');
  const [newRefSource, setNewRefSource] = useState('');
  const [newRefYear, setNewRefYear] = useState<number | undefined>(2025);
  const [newRefUrl, setNewRefUrl] = useState('');

  // Auto-slug from title if not manually edited
  useEffect(() => {
    if (!isSlugManual && title) {
      setSlug(generateSlug(title));
    }
  }, [title, isSlugManual]);

  // Load existing article if editing
  useEffect(() => {
    if (!articleId) {
      if (currentAuthor?.id) {
        setSelectedAuthorId(currentAuthor.id);
      }
      return;
    }

    let isMounted = true;
    const load = async () => {
      setLoadingArticle(true);
      try {
        const art = await getArticleByIdFromFirestore(articleId);
        if (art && isMounted) {
          setId(art.id);
          setTitle(art.title);
          setSubtitle(art.subtitle || '');
          setExcerpt(art.excerpt || art.subtitle || '');
          setSlug(art.slug);
          setIsSlugManual(true);
          setContent(art.content || '');
          setFeaturedImage(art.featuredImage || '');
          setImageAlt(art.imageAlt || '');
          setImageCaption(art.imageCaption || '');
          setCategory(art.category || 'pet-health');
          setSelectedTags(art.tags || []);
          setSelectedAuthorId(art.authorId || currentAuthor?.id || 'dr-chirag-patidar');
          setReviewerId(art.reviewerId || '');
          setStatus(art.status || 'DRAFT');
          setReferences(art.references || []);
          setSeoTitle(art.seoTitle || '');
          setSeoDescription(art.seoDescription || '');
          setCanonicalUrl(art.canonicalUrl || '');
          setSourceUrl(art.sourceUrl || '');
          setSourcePlatform(art.sourcePlatform || '');
          setImportedAt(art.importedAt);
          setImportedBy(art.importedBy);
        }
      } catch (err) {
        console.error('Error loading article:', err);
      } finally {
        if (isMounted) setLoadingArticle(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [articleId, currentAuthor?.id]);

  // Reading time
  const readingTime = calculateReadingTime(content);

  // Autosave function (saves as current status or DRAFT without triggering full review workflow)
  const performAutosave = useCallback(async () => {
    if (!title.trim()) return;

    setSaveStatus('saving');
    try {
      const authorObj = allAuthors.find((a) => a.id === selectedAuthorId) || currentAuthor;
      const reviewerObj = allAuthors.find((a) => a.id === reviewerId);

      const cleanTitle = sanitizePlainText(title.trim());
      const cleanSubtitle = sanitizePlainText(subtitle.trim());
      const cleanExcerpt = sanitizePlainText(excerpt.trim() || cleanSubtitle);
      const cleanContent = sanitizeHtml(content);

      const payload: Partial<Article> = {
        id: id || undefined,
        title: cleanTitle,
        subtitle: cleanSubtitle,
        excerpt: cleanExcerpt,
        slug: slug.trim() || generateSlug(title),
        content: cleanContent,
        featuredImage,
        imageAlt: sanitizePlainText(imageAlt.trim() || cleanTitle),
        imageCaption: sanitizePlainText(imageCaption.trim()),
        category,
        tags: selectedTags,
        authorId: selectedAuthorId,
        authorName: authorObj?.name || 'ThatVetGuy Co-Founder',
        authorProfile: {
          name: authorObj?.name || 'ThatVetGuy Co-Founder',
          designation: authorObj?.designation || 'Co-Founder, ThatVetGuy',
          professionalRole: authorObj?.professionalRole || '',
          avatarUrl: authorObj?.avatarUrl || '',
        },
        reviewerId: reviewerId || undefined,
        reviewer: reviewerObj?.name || undefined,
        status: status || 'DRAFT',
        references,
        seoTitle: sanitizePlainText(seoTitle || `${cleanTitle} | ThatVetGuy`),
        seoDescription: sanitizePlainText(seoDescription || cleanExcerpt || cleanSubtitle),
        canonicalUrl: canonicalUrl || `https://www.thatvetguy.net/article/${slug}`,
        sourceUrl: sourceUrl.trim() || undefined,
        sourcePlatform: sourcePlatform.trim() || undefined,
        importedAt,
        importedBy,
      };

      const saved = await saveArticleToFirestore(payload, authorObj || undefined);
      if (!id) {
        setId(saved.id);
      }

      setSaveStatus('saved');
      const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      setLastSavedTime(timeStr);
    } catch (err) {
      console.warn('Autosave warning:', err);
      setSaveStatus('error');
    }
    setIsDirty(false);
  }, [
    title,
    subtitle,
    excerpt,
    slug,
    content,
    featuredImage,
    imageAlt,
    imageCaption,
    category,
    selectedTags,
    selectedAuthorId,
    reviewerId,
    status,
    references,
    seoTitle,
    seoDescription,
    canonicalUrl,
    sourceUrl,
    sourcePlatform,
    importedAt,
    importedBy,
    id,
    allAuthors,
    currentAuthor,
  ]);

  // Debounced autosave timer
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      performAutosave();
    }, 3500);

    return () => clearTimeout(timer);
  }, [isDirty, performAutosave]);

  const markDirty = () => {
    setIsDirty(true);
    setSaveStatus('idle');
  };

  // Featured Image Upload handler with validation & canvas optimization
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFeaturedUploadError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFeaturedUploadError(validation.error || 'Invalid image file.');
      return;
    }

    setIsUploadingFeatured(true);
    try {
      const res = await uploadImageFile(file, { folder: 'articles', id });
      setFeaturedImage(res.url);
      if (!imageAlt) {
        setImageAlt(file.name.replace(/\.[^/.]+$/, ''));
      }
      markDirty();
    } catch (err: any) {
      setFeaturedUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploadingFeatured(false);
    }
  };

  // Explicit Save / Publish actions
  const handleSaveWithStatus = async (targetStatus: ArticleStatus) => {
    if (!title.trim()) {
      alert('Please provide an article title before saving.');
      return;
    }

    setIsSubmitting(true);
    setSaveStatus('saving');

    try {
      const authorObj = allAuthors.find((a) => a.id === selectedAuthorId) || currentAuthor;
      const reviewerObj = allAuthors.find((a) => a.id === reviewerId);

      const cleanTitle = sanitizePlainText(title.trim());
      const cleanSubtitle = sanitizePlainText(subtitle.trim());
      const cleanExcerpt = sanitizePlainText(excerpt.trim() || cleanSubtitle);
      const cleanContent = sanitizeHtml(content);

      const payload: Partial<Article> = {
        id: id || undefined,
        title: cleanTitle,
        subtitle: cleanSubtitle,
        excerpt: cleanExcerpt,
        slug: slug.trim() || generateSlug(title),
        content: cleanContent,
        featuredImage,
        imageAlt: sanitizePlainText(imageAlt.trim() || cleanTitle),
        imageCaption: sanitizePlainText(imageCaption.trim()),
        category,
        tags: selectedTags,
        authorId: selectedAuthorId,
        authorName: authorObj?.name || 'ThatVetGuy Co-Founder',
        authorProfile: {
          name: authorObj?.name || 'ThatVetGuy Co-Founder',
          designation: authorObj?.designation || 'Co-Founder, ThatVetGuy',
          professionalRole: authorObj?.professionalRole || '',
          avatarUrl: authorObj?.avatarUrl || '',
        },
        reviewerId: reviewerId || undefined,
        reviewer: reviewerObj?.name || undefined,
        status: targetStatus,
        references,
        seoTitle: sanitizePlainText(seoTitle || `${cleanTitle} | ThatVetGuy`),
        seoDescription: sanitizePlainText(seoDescription || cleanExcerpt || cleanSubtitle),
        canonicalUrl: canonicalUrl || `https://www.thatvetguy.net/article/${slug}`,
        sourceUrl: sourceUrl.trim() || undefined,
        sourcePlatform: sourcePlatform.trim() || undefined,
        importedAt,
        importedBy,
      };

      const saved = await saveArticleToFirestore(payload, authorObj || undefined);
      setId(saved.id);
      setStatus(targetStatus);
      setSaveStatus('saved');
      setIsDirty(false);

      const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      setLastSavedTime(timeStr);

      if (currentAuthor) {
        const actionType =
          targetStatus === 'PUBLISHED'
            ? 'ARTICLE_PUBLISH'
            : targetStatus === 'SUBMITTED FOR REVIEW'
            ? 'ARTICLE_SUBMIT'
            : id
            ? 'ARTICLE_UPDATE'
            : 'ARTICLE_CREATE';
        await logAuditEvent(
          actionType,
          { id: currentAuthor.id, name: currentAuthor.name, role: currentAuthor.role },
          `${actionType.replace('_', ' ')}: "${cleanTitle}" (Status: ${targetStatus})`,
          { id: saved.id, title: saved.title }
        );
      }

      setPublishNotification({
        status: targetStatus,
        slug: saved.slug,
        title: saved.title,
      });

      // Auto-dismiss notification after 8 seconds
      setTimeout(() => {
        setPublishNotification(null);
      }, 8000);
    } catch (err: any) {
      console.error('Error saving article:', err);
      alert(`Failed to save: ${err.message || 'Unknown error'}`);
      setSaveStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete article
  const handleDelete = async () => {
    if (!id) return;
    if (confirm(`Are you sure you want to delete "${title || 'this article'}"? This action cannot be undone.`)) {
      await deleteArticleFromFirestore(id);
      if (currentAuthor) {
        await logAuditEvent(
          'ARTICLE_DELETE',
          { id: currentAuthor.id, name: currentAuthor.name, role: currentAuthor.role },
          `Deleted article "${title}"`,
          { id }
        );
      }
      if (onClose) onClose();
      else navigateTo({ name: 'admin', section: 'all-articles' });
    }
  };

  // Add reference citation
  const handleAddReference = () => {
    if (!newRefCitation.trim() || !newRefSource.trim()) return;

    const newRef: ArticleReference = {
      id: `ref-${Date.now()}`,
      citation: sanitizePlainText(newRefCitation.trim()),
      source: sanitizePlainText(newRefSource.trim()),
      year: newRefYear,
      url: newRefUrl.trim() || undefined,
    };

    setReferences([...references, newRef]);
    setNewRefCitation('');
    setNewRefSource('');
    setNewRefYear(2025);
    setNewRefUrl('');
    setShowRefModal(false);
    markDirty();
  };

  const handleRemoveReference = (refId: string) => {
    setReferences(references.filter((r) => r.id !== refId));
    markDirty();
  };

  const toggleTag = (tagSlug: string) => {
    if (selectedTags.includes(tagSlug)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagSlug));
    } else {
      setSelectedTags([...selectedTags, tagSlug]);
    }
    markDirty();
  };

  if (loadingArticle) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-600 text-sm">Loading article editor...</p>
      </div>
    );
  }

  const authorDetails = allAuthors.find((a) => a.id === selectedAuthorId) || currentAuthor;
  const reviewerDetails = allAuthors.find((a) => a.id === reviewerId);
  const activeCategory = CATEGORIES.find((c) => c.slug === category);

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Top sticky action & status bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              else navigateTo({ name: 'admin', section: 'all-articles' });
            }}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-none">
              {isPreviewMode
                ? 'Publication Live Preview'
                : id
                ? 'Edit Article'
                : 'Write New Clinical Article'}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 font-medium">
              <span>{readingTime} min read</span>
              <span>•</span>
              <span className="capitalize font-semibold text-stone-700">
                {status.toLowerCase()}
              </span>
              <span>•</span>
              {saveStatus === 'saving' && (
                <span className="text-amber-700 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
                </span>
              )}
              {saveStatus === 'idle' && isDirty && (
                <span className="text-stone-400">Unsaved edits</span>
              )}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons: Save Draft, Preview, Publish */}
        <div className="flex items-center gap-2">
          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSaveWithStatus('DRAFT')}
            disabled={isSubmitting}
            className="px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 border border-stone-200 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Save as private draft (invisible on public blog)"
          >
            <Save className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">Save Draft</span>
            <span className="sm:hidden">Draft</span>
          </button>

          {/* Preview Toggle Button */}
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isPreviewMode
                ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50'
            }`}
            title="Preview how article renders publicly on ThatVetGuy"
          >
            {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-900" />}
            <span className="hidden sm:inline">{isPreviewMode ? 'Exit Preview' : 'Preview'}</span>
            <span className="sm:hidden">{isPreviewMode ? 'Edit' : 'Preview'}</span>
          </button>

          {/* Submit for review (For Contributors) */}
          {!isCoFounder && (
            <button
              type="button"
              onClick={() => handleSaveWithStatus('SUBMITTED FOR REVIEW')}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-900" />
              <span className="hidden sm:inline">Submit for Review</span>
              <span className="sm:hidden">Submit</span>
            </button>
          )}

          {/* Direct Publish (Available to Co-Founders) */}
          {isCoFounder && (
            <button
              type="button"
              onClick={() => handleSaveWithStatus('PUBLISHED')}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>{status === 'PUBLISHED' ? 'Update Published' : 'Publish'}</span>
            </button>
          )}

          {/* Delete (Existing article & Co-Founder) */}
          {id && isCoFounder && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
              title="Delete Article"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Save / Publish Outcome Notification Banner */}
      {publishNotification && (
        <div className="mb-6 p-5 rounded-2xl bg-emerald-950 text-white shadow-md border border-emerald-800 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-800/80 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                <CheckCircle className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">
                  {publishNotification.status === 'PUBLISHED'
                    ? 'Article Published & Live!'
                    : publishNotification.status === 'SUBMITTED FOR REVIEW'
                    ? 'Submitted for Clinical Peer Review'
                    : 'Draft Saved Locally'}
                </h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  {publishNotification.status === 'PUBLISHED'
                    ? 'Your changes are now live and publicly readable on ThatVetGuy for all veterinarians, students, and readers.'
                    : publishNotification.status === 'SUBMITTED FOR REVIEW'
                    ? 'The manuscript has been queued for Co-Founder review.'
                    : 'Your draft has been saved. Drafts remain strictly private to the CMS and do not appear on the public blog.'}
                </p>
              </div>
            </div>

            {publishNotification.status === 'PUBLISHED' && (
              <button
                type="button"
                onClick={() => navigateTo({ name: 'article', slug: publishNotification.slug })}
                className="px-4 py-2 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <span>View Live Blog</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW MODE: True-to-life public rendering of the article               */}
      {/* ========================================================================= */}
      {isPreviewMode ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Banner explaining preview state */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>
                <strong>Live Preview Mode:</strong> This preview reflects exact public styling, sanitization, and typography as it will appear on ThatVetGuy.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPreviewMode(false)}
              className="px-3 py-1.5 bg-white text-emerald-900 hover:bg-emerald-100 font-semibold rounded-lg border border-emerald-300 shrink-0 cursor-pointer"
            >
              Exit Preview & Edit
            </button>
          </div>

          <article className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-6">
            {/* Category badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-900 tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {activeCategory?.name || category}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {readingTime} min read
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-stone-900 leading-tight">
              {title || 'Untitled Article'}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-lg sm:text-xl text-stone-600 leading-relaxed font-normal">
                {subtitle}
              </p>
            )}

            {/* Excerpt callout */}
            {excerpt && excerpt !== subtitle && (
              <div className="p-4 bg-stone-50 border-l-4 border-emerald-900 rounded-r-xl text-sm text-stone-700 italic">
                <span className="font-semibold not-italic text-stone-900 mr-2">Summary:</span>
                {excerpt}
              </div>
            )}

            {/* Author Profile Header */}
            <div className="py-4 border-y border-stone-200 flex items-center gap-3">
              {authorDetails?.avatarUrl && (
                <img
                  src={authorDetails.avatarUrl}
                  alt={authorDetails.name}
                  className="w-12 h-12 rounded-full object-cover border border-emerald-900/30"
                />
              )}
              <div>
                <p className="font-semibold text-stone-900 text-sm">
                  {authorDetails?.name || 'ThatVetGuy Author'}
                </p>
                <p className="text-xs text-stone-500">
                  {authorDetails?.designation || 'Contributor'} • Published on ThatVetGuy
                </p>
              </div>
            </div>

            {/* Featured Image */}
            {featuredImage && (
              <figure className="my-6">
                <img
                  src={featuredImage}
                  alt={imageAlt || title || 'Featured article image'}
                  className="w-full max-h-[460px] object-cover rounded-2xl border border-stone-200 shadow-sm"
                />
                {imageCaption && (
                  <figcaption className="text-xs text-stone-500 mt-2 italic text-center">
                    {imageCaption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Sanitized Article Body Content */}
            <div className="pt-4">
              <ArticleContent contentHtml={content} />
            </div>

            {/* Peer Reviewer note if present */}
            {reviewerDetails && (
              <div className="mt-8 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0" />
                <div className="text-xs text-emerald-950">
                  <span className="font-bold">Peer-Reviewed:</span> Clinically verified by{' '}
                  <span className="font-semibold">{reviewerDetails.name}</span> ({reviewerDetails.designation}).
                </div>
              </div>
            )}

            {/* References list */}
            {references.length > 0 && (
              <div className="pt-8 border-t border-stone-200 space-y-3">
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  Clinical References & Literature Citations
                </h3>
                <ol className="list-decimal pl-5 space-y-2 text-xs text-stone-600">
                  {references.map((ref) => (
                    <li key={ref.id}>
                      <span className="font-medium text-stone-800">{ref.citation}</span>{' '}
                      <span className="italic">{ref.source}</span>
                      {ref.year && <span> ({ref.year})</span>}
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-emerald-900 underline inline-flex items-center gap-0.5"
                        >
                          <Link className="w-3 h-3" />
                          <span>Link</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tags */}
            {selectedTags.length > 0 && (
              <div className="pt-6 border-t border-stone-200 flex flex-wrap gap-2">
                {selectedTags.map((tagSlug) => (
                  <span
                    key={tagSlug}
                    className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full font-medium"
                  >
                    #{tagSlug}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>
      ) : (
        /* ========================================================================= */
        /* EDIT MODE: Complete CMS Editorial Workflow Form                           */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Main Title & Subtitle Card */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Article Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Canine Diabetic Ketoacidosis: Emergency Protocol and Electrolyte Management"
                className="w-full text-lg sm:text-xl font-serif font-bold border border-stone-300 rounded-xl px-4 py-3 outline-hidden focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-all min-h-[48px]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Clinical Subtitle (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => {
                  setSubtitle(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. A step-by-step veterinary critical care guide for managing hydration, acid-base status, and regular insulin infusion."
                className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2.5 outline-hidden focus:border-emerald-800 min-h-[44px]"
              />
            </div>

            {/* Excerpt field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Article Excerpt / Teaser
                </label>
                <span className="text-[11px] text-stone-500">
                  {excerpt.length} characters (140-160 recommended)
                </span>
              </div>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  markDirty();
                }}
                placeholder="Concise overview summarizing key clinical takeaways for article archive cards, social sharing, and search previews..."
                className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 outline-hidden focus:border-emerald-800 leading-relaxed"
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  URL Slug
                </label>
                <button
                  type="button"
                  onClick={() => setIsSlugManual(!isSlugManual)}
                  className="text-xs text-emerald-900 font-semibold hover:underline"
                >
                  {isSlugManual ? 'Auto-generate from Title' : 'Edit Manually'}
                </button>
              </div>
              <div className="flex items-center rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-mono text-stone-600 min-h-[44px]">
                <span className="shrink-0 text-stone-400">thatvetguy.net/article/</span>
                <input
                  type="text"
                  value={slug}
                  disabled={!isSlugManual}
                  onChange={(e) => {
                    setSlug(generateSlug(e.target.value));
                    markDirty();
                  }}
                  className="w-full bg-transparent outline-hidden ml-1 font-mono text-stone-800 disabled:opacity-75"
                />
              </div>
            </div>
          </div>

          {/* Author, Peer Reviewer & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Author */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Author
              </label>
              <select
                value={selectedAuthorId}
                onChange={(e) => {
                  setSelectedAuthorId(e.target.value);
                  markDirty();
                }}
                className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 outline-hidden focus:border-emerald-800 min-h-[44px] bg-white"
              >
                {allAuthors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name} ({author.role === 'CO_FOUNDER' ? 'Co-Founder' : 'Contributor'})
                  </option>
                ))}
              </select>
            </div>

            {/* Clinical Peer Reviewer */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Peer Reviewer (Optional)
              </label>
              <select
                value={reviewerId}
                onChange={(e) => {
                  setReviewerId(e.target.value);
                  markDirty();
                }}
                className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 outline-hidden focus:border-emerald-800 min-h-[44px] bg-white"
              >
                <option value="">None (Pending Review)</option>
                {allAuthors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Clinical Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  markDirty();
                }}
                className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 outline-hidden focus:border-emerald-800 min-h-[44px] bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Featured Image Upload & Details */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Featured Clinical Image
              </label>
              <span className="text-[11px] text-stone-500">
                Upload image file or enter direct web URL
              </span>
            </div>

            {featuredUploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{featuredUploadError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative group shrink-0 w-full sm:w-52 h-36 rounded-xl border border-stone-200 overflow-hidden bg-stone-100">
                <img
                  src={featuredImage}
                  alt={imageAlt || 'Featured preview'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200';
                  }}
                  className="w-full h-full object-cover"
                />
                {isUploadingFeatured && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-xs gap-1.5 backdrop-blur-xs">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Optimizing...</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={featuredImage}
                    onChange={(e) => {
                      setFeaturedImage(e.target.value);
                      markDirty();
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 text-xs sm:text-sm border border-stone-200 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                  <input
                    type="file"
                    ref={featuredFileInputRef}
                    onChange={handleFeaturedImageUpload}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => featuredFileInputRef.current?.click()}
                    disabled={isUploadingFeatured}
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Upload image from device"
                  >
                    <Upload className="w-4 h-4 text-emerald-900" />
                    <span className="hidden sm:inline">Upload Photo</span>
                    <span className="sm:hidden">Upload</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => {
                      setImageAlt(e.target.value);
                      markDirty();
                    }}
                    placeholder="Image Alt Text (e.g. Veterinarian examining canine patient)"
                    className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => {
                      setImageCaption(e.target.value);
                      markDirty();
                    }}
                    placeholder="Image Caption (e.g. Clinical assessment at ThatVetGuy)"
                    className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tags Multi-select */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-2.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Clinical Topics & Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => {
                const active = selectedTags.includes(t.slug);
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => toggleTag(t.slug)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors min-h-[38px] flex items-center gap-1 cursor-pointer ${
                      active
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>#{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Article Content <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-stone-500 font-medium">
                WYSIWYG Rich Editor (Sanitized before publishing)
              </span>
            </div>
            <RichTextEditor
              value={content}
              onChange={(val) => {
                setContent(val);
                markDirty();
              }}
              placeholder="Write clinical findings, veterinary protocols, diagnostic criteria, dosage notes, and patient advice..."
              minHeight="440px"
            />
          </div>

          {/* Clinical References & Citations */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Peer-Reviewed Citations & References
                </h3>
                <p className="text-xs text-stone-500">
                  Accredit veterinary literature, peer-reviewed studies, and clinical protocols.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRefModal(true)}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Citation</span>
              </button>
            </div>

            {references.length === 0 ? (
              <div className="p-6 border border-dashed border-stone-200 rounded-xl text-center text-xs text-stone-500">
                No citations added yet. Click &quot;Add Citation&quot; to cite peer-reviewed veterinary journals.
              </div>
            ) : (
              <div className="space-y-2">
                {references.map((ref, idx) => (
                  <div
                    key={ref.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <span className="font-bold text-stone-900 mr-1.5">[{idx + 1}]</span>
                      <span className="font-medium text-stone-800">{ref.citation}</span> —{' '}
                      <span className="italic text-stone-600">{ref.source}</span>
                      {ref.year && <span className="text-stone-500"> ({ref.year})</span>}
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-emerald-900 underline inline-flex items-center gap-0.5"
                        >
                          <Link className="w-3 h-3" />
                          <span>Link</span>
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReference(ref.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors cursor-pointer"
                      title="Remove Citation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO & Search Metadata (Collapsible) */}
          <details className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-xs group">
            <summary className="font-serif font-bold text-stone-900 text-sm sm:text-base cursor-pointer select-none flex items-center justify-between">
              <span>Search Engine Optimization (SEO) & Metadata</span>
              <span className="text-xs text-emerald-900 font-sans font-medium group-open:hidden">
                Show SEO Fields ↓
              </span>
            </summary>
            <div className="mt-4 space-y-3 pt-3 border-t border-stone-100">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Custom SEO Title
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    markDirty();
                  }}
                  placeholder={title ? `${title} | ThatVetGuy` : 'Title | ThatVetGuy'}
                  className="w-full text-xs sm:text-sm border border-stone-200 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  SEO Meta Description
                </label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoDescription(e.target.value);
                    markDirty();
                  }}
                  placeholder="150-160 characters summary for Google search snippet..."
                  className="w-full text-xs sm:text-sm border border-stone-200 rounded-xl px-3 py-2 outline-hidden focus:border-emerald-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Canonical URL
                </label>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => {
                    setCanonicalUrl(e.target.value);
                    markDirty();
                  }}
                  placeholder={`https://www.thatvetguy.net/article/${slug}`}
                  className="w-full text-xs font-mono border border-stone-200 rounded-xl px-3 py-2 min-h-[44px] outline-hidden focus:border-emerald-800"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Original Source URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => {
                      setSourceUrl(e.target.value);
                      markDirty();
                    }}
                    placeholder="https://..."
                    className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Source Platform (Optional)
                  </label>
                  <input
                    type="text"
                    value={sourcePlatform}
                    onChange={(e) => {
                      setSourcePlatform(e.target.value);
                      markDirty();
                    }}
                    placeholder="e.g. LinkedIn, Vet Journal, Internal"
                    className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                </div>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Add Reference Citation Modal */}
      {showRefModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-stone-200">
            <h4 className="font-serif font-bold text-stone-900 text-base mb-3">
              Add Peer-Reviewed Citation
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Citation / Authors & Title <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={newRefCitation}
                  onChange={(e) => setNewRefCitation(e.target.value)}
                  placeholder="e.g. Smith J, Davis R. Canine parvovirus type 2: diagnosis and critical care management."
                  className="w-full text-xs border border-stone-300 rounded-xl p-2.5 outline-hidden focus:border-emerald-800"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Journal / Publication <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRefSource}
                    onChange={(e) => setNewRefSource(e.target.value)}
                    placeholder="Journal of Vet Internal Med"
                    className="w-full text-xs border border-stone-300 rounded-xl px-3 py-2 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Year of Publication
                  </label>
                  <input
                    type="number"
                    value={newRefYear || ''}
                    onChange={(e) => setNewRefYear(Number(e.target.value) || undefined)}
                    placeholder="2024"
                    className="w-full text-xs border border-stone-300 rounded-xl px-3 py-2 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  PubMed / DOI / Web Link (Optional)
                </label>
                <input
                  type="url"
                  value={newRefUrl}
                  onChange={(e) => setNewRefUrl(e.target.value)}
                  placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                  className="w-full text-xs border border-stone-300 rounded-xl px-3 py-2 min-h-[44px] outline-hidden focus:border-emerald-800"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRefModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddReference}
                disabled={!newRefCitation.trim() || !newRefSource.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 rounded-xl min-h-[44px] shadow-xs cursor-pointer"
              >
                Add Citation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
