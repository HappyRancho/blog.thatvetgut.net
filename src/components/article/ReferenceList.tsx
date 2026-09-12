import React from 'react';
import { BookMarked, ExternalLink } from 'lucide-react';
import { ArticleReference } from '../../types';

interface ReferenceListProps {
  references: ArticleReference[];
}

export const ReferenceList: React.FC<ReferenceListProps> = ({ references }) => {
  if (!references || references.length === 0) return null;

  return (
    <section
      id="article-references-section"
      className="mt-12 pt-8 border-t border-stone-200 space-y-4"
    >
      <div className="flex items-center gap-2 text-stone-900">
        <BookMarked className="w-5 h-5 text-emerald-800" />
        <h3 className="font-serif font-bold text-lg text-stone-900">
          Scientific & Clinical References
        </h3>
      </div>
      <p className="text-xs text-stone-500">
        ThatVetGuy adheres strictly to peer-reviewed veterinary literature, clinical consensus statements, and established standards of veterinary medicine.
      </p>

      <ol className="space-y-3 pl-4 list-decimal text-xs text-stone-600">
        {references.map((ref) => (
          <li key={ref.id} className="pl-1 leading-relaxed">
            <span className="font-normal text-stone-700">{ref.citation}</span>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-500">
              <span className="font-semibold text-emerald-900">{ref.source}</span>
              {ref.year && <span>({ref.year})</span>}
              {ref.doi && (
                <span className="font-mono text-stone-400">DOI: {ref.doi}</span>
              )}
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-800 hover:text-emerald-950 underline inline-flex items-center gap-0.5"
                >
                  Source <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
