import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  Eye,
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
import { RichTextEditor } from './RichTextEditor';

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

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(Boolean(articleId));

  // Reference modal / inline adder
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

  // Autosave handler to localStorage & Firestore draft
  const performAutosave = useCallback(async () => {
    if (!title.trim() && !content.trim()) return;
    setSaveStatus('saving');

    const draftKey = `tvg_autosave_${id || 'new'}`;
    const authorObj = allAuthors.find((a) => a.id === selectedAuthorId) || currentAuthor;

    const payload: Partial<Article> = {
      id: id || undefined,
      title: title || 'Untitled Draft',
      subtitle,
      slug: slug || generateSlug(title || 'draft'),
      content,
      featuredImage,
      imageAlt: imageAlt || title,
      imageCaption,
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
      status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      references,
      seoTitle,
      seoDescription,
      canonicalUrl,
    };

    // Save to local storage for immediate persistence
    try {
      localStorage.setItem(draftKey, JSON.stringify({ payload, savedAt: Date.now() }));
    } catch (e) {
      // ignore
    }

    // Save to Firestore as draft if title exists
    if (title.trim()) {
      try {
        const saved = await saveArticleToFirestore(payload, authorObj || undefined);
        if (!id && saved.id) {
          setId(saved.id);
        }
      } catch (err) {
        console.warn('Firestore autosave failed, saved locally:', err);
      }
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setLastSavedTime(timeStr);
    setSaveStatus('saved');
    setIsDirty(false);
  }, [
    title,
    subtitle,
    slug,
    content,
    featuredImage,
    imageAlt,
    imageCaption,
    category,
    selectedTags,
    selectedAuthorId,
    status,
    references,
    seoTitle,
    seoDescription,
    canonicalUrl,
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

  // Mark dirty on changes
  const markDirty = () => {
    setIsDirty(true);
    setSaveStatus('idle');
  };

  // Explicit Save / Publish actions
  const handleSaveWithStatus = async (targetStatus: ArticleStatus) => {
    if (!title.trim()) {
      alert('Please provide an article title.');
      return;
    }

    setIsSubmitting(true);
    setSaveStatus('saving');

    try {
      const authorObj = allAuthors.find((a) => a.id === selectedAuthorId) || currentAuthor;
      const reviewerObj = allAuthors.find((a) => a.id === reviewerId);

      const payload: Partial<Article> = {
        id: id || undefined,
        title: title.trim(),
        subtitle: subtitle.trim(),
        slug: slug.trim() || generateSlug(title),
        content,
        featuredImage,
        imageAlt: imageAlt.trim() || title.trim(),
        imageCaption: imageCaption.trim(),
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
        seoTitle: seoTitle || `${title} | ThatVetGuy`,
        seoDescription: seoDescription || subtitle || '',
        canonicalUrl: canonicalUrl || `https://www.thatvetguy.net/article/${slug}`,
      };

      const saved = await saveArticleToFirestore(payload, authorObj || undefined);
      setId(saved.id);
      setStatus(targetStatus);
      setSaveStatus('saved');
      setIsDirty(false);

      const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      setLastSavedTime(timeStr);

      if (currentAuthor) {
        const actionType = targetStatus === 'PUBLISHED' ? 'ARTICLE_PUBLISH' : targetStatus === 'SUBMITTED FOR REVIEW' ? 'ARTICLE_SUBMIT' : id ? 'ARTICLE_UPDATE' : 'ARTICLE_CREATE';
        await logAuditEvent(
          actionType,
          { id: currentAuthor.id, name: currentAuthor.name, role: currentAuthor.role },
          `${actionType.replace('_', ' ')}: "${title.trim()}" (Status: ${targetStatus})`,
          { id: saved.id, title: saved.title }
        );
      }

      if (targetStatus === 'PUBLISHED') {
        alert('Article published successfully to ThatVetGuy!');
        navigateTo({ name: 'admin', section: 'published' });
      } else if (targetStatus === 'SUBMITTED FOR REVIEW') {
        alert('Article submitted for peer review!');
        navigateTo({ name: 'admin', section: 'submitted' });
      } else {
        alert('Draft saved successfully!');
      }
    } catch (err: any) {
      console.error('Error saving article:', err);
      setSaveStatus('error');
      alert(`Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to permanently delete this article? This action cannot be undone.')) {
      return;
    }
    try {
      if (currentAuthor) {
        await logAuditEvent(
          'ARTICLE_DELETE',
          { id: currentAuthor.id, name: currentAuthor.name, role: currentAuthor.role },
          `Deleted article "${title}" (${id})`,
          { id, title }
        );
      }
      await deleteArticleFromFirestore(id);
      alert('Article deleted.');
      navigateTo({ name: 'admin', section: 'all-articles' });
    } catch (e: any) {
      alert(`Error deleting article: ${e.message}`);
    }
  };

  const handleAddReference = () => {
    if (!newRefCitation.trim() || !newRefSource.trim()) return;
    const newRef: ArticleReference = {
      id: `ref-${Date.now()}`,
      citation: newRefCitation.trim(),
      source: newRefSource.trim(),
      year: newRefYear || undefined,
      url: newRefUrl.trim() || undefined,
    };
    setReferences([...references, newRef]);
    setNewRefCitation('');
    setNewRefSource('');
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

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Top action and autosave banner */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              else navigateTo({ name: 'admin', section: 'all-articles' });
            }}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-none">
              {id ? 'Edit Article' : 'Write New Clinical Article'}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 font-medium">
              <span>{readingTime} min read</span>
              <span>•</span>
              <span className="capitalize">{status.toLowerCase()}</span>
              <span>•</span>
              {saveStatus === 'saving' && (
                <span className="text-amber-700 flex items-center gap-1">
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSaveWithStatus('DRAFT')}
            disabled={isSubmitting}
            className="px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 border border-stone-200 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">Save Draft</span>
            <span className="sm:hidden">Draft</span>
          </button>

          {/* Submit for review (For Contributors, or Co-Founders requesting review) */}
          <button
            type="button"
            onClick={() => handleSaveWithStatus('SUBMITTED FOR REVIEW')}
            disabled={isSubmitting}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-4 h-4 text-emerald-900" />
            <span className="hidden sm:inline">Submit for Review</span>
            <span className="sm:hidden">Submit</span>
          </button>

          {/* Direct Publish (Available to all Co-Founders who have equal publishing authority) */}
          {isCoFounder && (
            <button
              type="button"
              onClick={() => handleSaveWithStatus('PUBLISHED')}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Globe className="w-4 h-4" />
              <span>{status === 'PUBLISHED' ? 'Update Published' : 'Publish Directly'}</span>
            </button>
          )}

          {/* Delete (if existing article and Co-Founder) */}
          {id && isCoFounder && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              title="Delete Article"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Editorial Form */}
      <div className="space-y-6">
        {/* Title & Subtitle */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
              Article Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
              }}
              placeholder="e.g. Parvovirus Enteritis in Canines: 2025 Clinical Protocols"
              className="w-full text-xl sm:text-2xl font-serif font-bold text-stone-900 placeholder:text-stone-300 border border-stone-200 focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 rounded-xl px-4 py-3 min-h-[48px] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
              Subtitle / Clinical Summary
            </label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => {
                setSubtitle(e.target.value);
                markDirty();
              }}
              placeholder="Provide a concise 1-2 sentence clinical summary of the diagnostic, treatment, or management takeaways..."
              className="w-full text-sm text-stone-700 border border-stone-200 focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 rounded-xl px-4 py-2.5 outline-hidden"
            />
          </div>

          {/* Slug (Auto-generated, editable) */}
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-stone-500">Public URL:</span>
            <span className="text-stone-400 font-mono">/article/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManual(true);
                markDirty();
              }}
              className="flex-1 min-w-[200px] font-mono text-emerald-950 font-semibold bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 outline-hidden focus:bg-white"
            />
          </div>
        </div>

        {/* Author, Reviewer & Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Author Selection */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
              Article Author
            </label>
            <select
              value={selectedAuthorId}
              onChange={(e) => {
                setSelectedAuthorId(e.target.value);
                markDirty();
              }}
              className="w-full text-xs sm:text-sm font-medium border border-stone-200 rounded-xl px-3 py-2.5 min-h-[44px] bg-white outline-hidden focus:border-emerald-800"
            >
              {allAuthors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.designation})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-500 mt-1">
              All six Co-Founders have equal publishing authority.
            </p>
          </div>

          {/* Clinical Peer Reviewer */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
              Peer Reviewer (Optional)
            </label>
            <select
              value={reviewerId}
              onChange={(e) => {
                setReviewerId(e.target.value);
                markDirty();
              }}
              className="w-full text-xs sm:text-sm font-medium border border-stone-200 rounded-xl px-3 py-2.5 min-h-[44px] bg-white outline-hidden focus:border-emerald-800"
            >
              <option value="">-- Select Peer Reviewer --</option>
              {allAuthors
                .filter((a) => a.id !== selectedAuthorId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.professionalRole})
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-stone-500 mt-1">
              Displays verified peer-review badge on published article.
            </p>
          </div>

          {/* Category */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
              Primary Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                markDirty();
              }}
              className="w-full text-xs sm:text-sm font-medium border border-stone-200 rounded-xl px-3 py-2.5 min-h-[44px] bg-white outline-hidden focus:border-emerald-800"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-500 mt-1">
              Sections your article into the clinical library.
            </p>
          </div>
        </div>

        {/* Featured Image & Alt Text */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Featured Clinical Image
            </label>
            <span className="text-[11px] text-stone-500">Provide direct image URL</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <img
              src={featuredImage}
              alt={imageAlt || 'Featured preview'}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200';
              }}
              className="w-full sm:w-44 h-28 object-cover rounded-xl border border-stone-200 shadow-xs shrink-0"
            />
            <div className="flex-1 w-full space-y-2.5">
              <input
                type="url"
                value={featuredImage}
                onChange={(e) => {
                  setFeaturedImage(e.target.value);
                  markDirty();
                }}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full text-xs sm:text-sm border border-stone-200 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => {
                    setImageAlt(e.target.value);
                    markDirty();
                  }}
                  placeholder="Image Alt Text (e.g. Veterinarian examining canine abdomen)"
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
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors min-h-[38px] flex items-center gap-1 ${
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
            <span className="text-xs text-stone-500 font-medium">WYSIWYG No-Code Editor</span>
          </div>
          <RichTextEditor
            value={content}
            onChange={(val) => {
              setContent(val);
              markDirty();
            }}
            placeholder="Write clinical findings, veterinary protocols, diagnostic criteria, dosage notes, and patient advice..."
            minHeight="420px"
          />
        </div>

        {/* Scientific References */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-base">
                Peer-Reviewed References & Citations
              </h4>
              <p className="text-xs text-stone-500">
                Ground clinical assertions with peer-reviewed veterinary literature.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRefModal(true)}
              className="px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4 text-emerald-900" />
              <span>Add Citation</span>
            </button>
          </div>

          {references.length === 0 ? (
            <p className="text-xs text-stone-400 italic py-2">
              No references added yet. Click &quot;Add Citation&quot; to cite journal articles or veterinary texts.
            </p>
          ) : (
            <div className="space-y-2">
              {references.map((ref, idx) => (
                <div
                  key={ref.id || idx}
                  className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-emerald-950 mr-1.5">[{idx + 1}]</span>
                    <span className="text-stone-800 font-medium">{ref.citation}</span>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      <span>{ref.source}</span>
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
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveReference(ref.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEO & Meta Details (Collapsible) */}
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
          </div>
        </details>
      </div>

      {/* Add Reference Modal */}
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
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddReference}
                disabled={!newRefCitation.trim() || !newRefSource.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 rounded-xl min-h-[44px] shadow-xs"
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
