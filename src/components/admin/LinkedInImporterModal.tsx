import React, { useState } from 'react';
import { X, Link2, AlertCircle, ArrowRight, Linkedin } from 'lucide-react';
import { extractLinkedInArticle, LinkedInImportData } from '../../services/linkedinImportService';

interface LinkedInImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: LinkedInImportData) => void;
}

export const LinkedInImporterModal: React.FC<LinkedInImporterModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Please enter a LinkedIn article URL.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await extractLinkedInArticle(cleanUrl);
      onImportSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import article from LinkedIn.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] flex items-center justify-center">
              <Linkedin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Import from LinkedIn
              </h3>
              <p className="text-xs text-stone-500">
                Convert a public LinkedIn article into a draft manuscript
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleImport} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              LinkedIn Article / Newsletter URL
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.linkedin.com/pulse/..."
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 focus:outline-hidden transition-all"
              />
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Only publicly accessible LinkedIn URLs can be extracted. Imported articles are saved as <strong>Draft</strong> for Co-Founder review and formatting before publishing.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#0A66C2] hover:bg-[#004182] disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting Article...</span>
                </>
              ) : (
                <>
                  <span>Import Article</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
