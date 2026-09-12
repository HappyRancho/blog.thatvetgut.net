import React, { useState } from 'react';
import { Check, Copy, Share2, X as CloseIcon } from 'lucide-react';

interface ShareModalProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ url, title, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API unavailable
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${title} — via ThatVetGuy Veterinary Publication`,
          url,
        });
        onClose();
      } catch {
        // User canceled or failed
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div
        id="share-modal"
        className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-800" />
            <h3 className="font-semibold text-stone-900">Share This Article</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="Close dialog"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-stone-500 line-clamp-2">
            Share <span className="font-medium text-stone-700">{title}</span> with colleagues, pet parents, and veterinary professionals.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors min-h-[44px]"
            >
              WhatsApp
            </a>

            {/* LinkedIn */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-50 text-blue-900 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors min-h-[44px]"
            >
              LinkedIn
            </a>

            {/* X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-100 text-stone-800 hover:bg-stone-200 text-xs font-semibold border border-stone-200 transition-colors min-h-[44px]"
            >
              X (Twitter)
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-50 text-indigo-900 hover:bg-indigo-100 text-xs font-semibold border border-indigo-200 transition-colors min-h-[44px]"
            >
              Facebook
            </a>
          </div>

          {/* Copy link bar */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-stone-600 mb-1.5">Direct Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-600 select-all font-mono"
              />
              <button
                id="copy-share-url-btn"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium shrink-0 transition-colors min-h-[40px]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 transition-colors"
            >
              More sharing options on your device
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
