import React, { useState } from 'react';
import {
  Linkedin,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  Tag,
  Link as LinkIcon,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { parseLinkedInPost, LinkedInImportResult } from '../../services/linkedinImportService';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { saveArticleToFirestore } from '../../services/articleService';
import { logAuditEvent } from '../../services/auditService';
import { CATEGORIES } from '../../data/categories';

interface LinkedInImporterProps {
  onArticleImported?: (articleId: string) => void;
}

export const LinkedInImporter: React.FC<LinkedInImporterProps> = ({ onArticleImported }) => {
  const { currentAuthor, isCoFounder } = useAuth();
  const { navigateTo } = useNavigation();

  const [rawText, setRawText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [targetCategory, setTargetCategory] = useState('');
  const [targetAuthorId, setTargetAuthorId] = useState(currentAuthor?.id || '');

  // Preview / parsed state
  const [parsed, setParsed] = useState<LinkedInImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdArticleId, setCreatedArticleId] = useState<string | null>(null);

  // Sample LinkedIn Post for quick testing
  const loadSample = () => {
    setSourceUrl('https://www.linkedin.com/posts/dr-chirag-patidar-veterinary-orthopedics-tibial-plateau-leveling');
    setRawText(`🚨 Clinical Case: Tibial Plateau Leveling Osteotomy (TPLO) in an 8-Year-Old Golden Retriever

Cranial Cruciate Ligament (CCL) rupture remains one of the leading causes of hindlimb lameness in companion animal orthopedics. 

In this case, an 8-year-old female Golden Retriever presented with acute grade 3/5 right pelvic limb lameness following an agility exercise. 

Diagnostic workup:
• Cranial drawer sign: Positive under sedation
• Tibial compression test: Demonstrable instability
• Stifle orthogonal radiographs: Severe joint effusion and osteophytosis along the trochlear ridges

Surgical Strategy:
We performed standard Tibial Plateau Leveling Osteotomy (TPLO) utilizing a 24mm biradial saw blade and locking compression plate. Post-operative tibial plateau angle (TPA) was corrected from 28° to 5°.

Key Clinical Takeaways:
• Pre-operative planning with digital templating significantly minimizes intra-articular screw penetration risk.
• Meniscal inspection via medial arthrotomy or arthroscopy is mandatory; bucket-handle tears were identified and excised in 40% of our recent cases.
• Controlled rehabilitation and multi-modal analgesia (NSAIDs + Gabapentin) yielded full weight-bearing at 6 weeks.

#VeterinarySurgery #Orthopedics #CanineHealth #TPLO #VeterinaryMedicine #Surgery #ThatVetGuy`);
    setError(null);
    setParsed(null);
  };

  const handleParse = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setParsed(null);
    setSuccessMessage(null);

    if (!rawText.trim()) {
      setError('Please paste the content of your LinkedIn post or article.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = parseLinkedInPost(rawText, sourceUrl);
      setParsed(result);
      if (!targetCategory) {
        setTargetCategory(result.category);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse LinkedIn post content.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateDraft = async (publishImmediately: boolean = false) => {
    if (!parsed) return;
    setIsSaving(true);
    setError(null);

    try {
      const targetStatus = publishImmediately && isCoFounder ? 'PUBLISHED' : 'DRAFT';
      const categoryToUse = targetCategory || parsed.category || 'companion-animals';

      const newArticle = await saveArticleToFirestore({
        title: parsed.title,
        subtitle: parsed.subtitle,
        slug: parsed.slug,
        category: categoryToUse,
        tags: parsed.tags,
        content: parsed.contentHtml,
        contentBlocks: parsed.contentBlocks,
        excerpt: parsed.excerpt,
        featuredImage: parsed.featuredImage || 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200',
        authorId: targetAuthorId || currentAuthor?.id || 'dr-chirag-patidar',
        authorName: currentAuthor?.name || 'ThatVetGuy Author',
        status: targetStatus,
        readingTimeMinutes: parsed.readingTimeMinutes,
        references: parsed.sourceUrl
          ? [
              {
                id: `ref-${Date.now()}`,
                citation: `Adapted from clinical discussion originally published on LinkedIn`,
                source: 'LinkedIn Professional Network',
                url: parsed.sourceUrl,
                year: new Date().getFullYear(),
              },
            ]
          : [],
      });

      // Audit log
      if (currentAuthor) {
        await logAuditEvent(
          'IMPORT_LINKEDIN',
          { id: currentAuthor.id, name: currentAuthor.name, role: currentAuthor.role },
          `Imported article "${parsed.title}" from LinkedIn as ${targetStatus}`,
          { id: newArticle.id, title: newArticle.title }
        );
      }

      setCreatedArticleId(newArticle.id);
      setSuccessMessage(
        publishImmediately
          ? `Article successfully created and published directly!`
          : `Article successfully imported as a Draft manuscript!`
      );

      if (onArticleImported) {
        onArticleImported(newArticle.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save imported article to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Linkedin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
                LinkedIn Content Importer
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                Convert your professional veterinary LinkedIn posts, case studies, and newsletter articles into ThatVetGuy manuscripts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadSample}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-800" />
            <span>Load Sample Post</span>
          </button>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleParse} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-300 text-red-950 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            {createdArticleId && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigateTo({ name: 'admin', section: 'edit', articleId: createdArticleId })}
                  className="px-3.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Open in Editor
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo({ name: 'admin', section: 'all-articles' })}
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-950 font-semibold text-xs rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  View All Articles
                </button>
              </div>
            )}
          </div>
        )}

        {/* Source URL */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            LinkedIn Post or Article URL (Optional)
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.linkedin.com/posts/dr-chirag-patidar-..."
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 focus:bg-white rounded-xl outline-hidden focus:border-emerald-800 transition-all font-mono"
            />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Adds verified origin reference link at the bottom of the article.
          </p>
        </div>

        {/* Raw Text / HTML Input */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            Paste LinkedIn Content <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={10}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your full LinkedIn post text, markdown, or newsletter article copy here...
• Headers, hashtags, and clinical bullets are auto-detected
• Key clinical takeaways are extracted into formatted callouts
• HTML is automatically sanitized for security"
            className="w-full text-xs sm:text-sm p-4 bg-stone-50 border border-stone-200 focus:bg-white rounded-xl outline-hidden focus:border-emerald-800 transition-all font-sans leading-relaxed"
          />
        </div>

        {/* Parsing Action */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-stone-500">
            {rawText.length > 0 ? `${rawText.length} characters • ~${Math.ceil(rawText.split(/\s+/).length / 200)} min read` : 'No content entered'}
          </span>

          <button
            type="submit"
            disabled={isProcessing || !rawText.trim()}
            className="px-5 py-2.5 bg-emerald-950 hover:bg-emerald-900 disabled:bg-stone-300 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Processing & Sanitizing...' : 'Parse & Preview Manuscript'}</span>
          </button>
        </div>
      </form>

      {/* Preview Section */}
      {parsed && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-850 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Parsed Successfully
              </span>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 mt-1">
                Manuscript Preview & Classification
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCreateDraft(false)}
                disabled={isSaving}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Save as Draft</span>
              </button>

              {isCoFounder && (
                <button
                  type="button"
                  onClick={() => handleCreateDraft(true)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-850 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Directly</span>
                </button>
              )}
            </div>
          </div>

          {/* Classification & Metadata overrides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Assign Category
              </label>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 min-h-[40px] focus:ring-2 focus:ring-emerald-800 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Attributed Author
              </label>
              <input
                type="text"
                disabled
                value={`${currentAuthor?.name || 'Authorized Member'} (${currentAuthor?.role || 'Staff'})`}
                className="w-full text-xs bg-stone-200/60 border border-stone-300 text-stone-700 rounded-xl px-3 py-2 min-h-[40px]"
              />
            </div>
          </div>

          {/* Formatted Preview Cards */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Extracted Title
              </span>
              <h2 className="font-serif font-bold text-2xl text-stone-900">
                {parsed.title}
              </h2>
            </div>

            {parsed.subtitle && (
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Subtitle / Clinical Summary
                </span>
                <p className="text-sm text-stone-700 italic">
                  {parsed.subtitle}
                </p>
              </div>
            )}

            {/* Tags */}
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Detected Clinical Tags ({parsed.tags.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {parsed.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full font-medium"
                  >
                    <Tag className="w-3 h-3 text-stone-400" />
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Sanitized Body HTML Preview */}
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Sanitized Manuscript Body Preview
              </span>
              <div
                className="p-5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 space-y-4 font-sans text-sm leading-relaxed max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: parsed.contentHtml }}
              />
            </div>
          </div>

          {/* Bottom Action bar */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <span className="text-xs text-stone-500">
              {parsed.readingTimeMinutes} min estimated read • Security sanitization applied
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCreateDraft(false)}
                disabled={isSaving}
                className="px-5 py-2.5 bg-emerald-950 hover:bg-emerald-900 disabled:bg-stone-300 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer min-h-[44px]"
              >
                <FileText className="w-4 h-4" />
                <span>{isSaving ? 'Saving Draft...' : 'Confirm & Save as Draft'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
