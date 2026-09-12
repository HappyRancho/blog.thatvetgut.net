import React from 'react';
import { AlertCircle, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import { ArticleContentBlock } from '../../types';

interface ArticleContentProps {
  blocks: ArticleContentBlock[];
}

export const ArticleContent: React.FC<ArticleContentProps> = ({ blocks }) => {
  return (
    <div className="article-body space-y-6 sm:space-y-8 text-stone-800 leading-relaxed">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <p
                key={index}
                className="text-base sm:text-[17px] text-stone-700 leading-relaxed font-normal whitespace-pre-line"
              >
                {block.content}
              </p>
            );

          case 'heading2':
            return (
              <h2
                key={index}
                className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 tracking-tight pt-4 pb-1 border-b border-stone-100"
              >
                {block.content}
              </h2>
            );

          case 'heading3':
            return (
              <h3
                key={index}
                className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight pt-2"
              >
                {block.content}
              </h3>
            );

          case 'takeaways':
            return (
              <div
                key={index}
                className="my-6 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-5 sm:p-6"
              >
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm uppercase tracking-wider mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-800" />
                  <span>Key Clinical Takeaways</span>
                </div>
                <div className="text-sm sm:text-base text-emerald-950 space-y-2 whitespace-pre-line font-medium leading-relaxed">
                  {block.content}
                </div>
              </div>
            );

          case 'callout': {
            const isAlert = block.calloutType === 'clinical-alert';
            return (
              <div
                key={index}
                className={`my-6 rounded-2xl p-5 sm:p-6 border ${
                  isAlert
                    ? 'bg-amber-50/80 border-amber-300/80 text-amber-950'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 mt-0.5">
                    {isAlert ? (
                      <AlertCircle className="w-5 h-5 text-amber-800" />
                    ) : block.calloutType === 'pro-tip' ? (
                      <Lightbulb className="w-5 h-5 text-emerald-800" />
                    ) : (
                      <Info className="w-5 h-5 text-stone-700" />
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line">
                    {block.content}
                  </div>
                </div>
              </div>
            );
          }

          case 'table':
            if (!block.tableData) return null;
            return (
              <div
                key={index}
                className="my-6 overflow-x-auto rounded-xl border border-stone-200 shadow-xs bg-white"
              >
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-stone-100/80 border-b border-stone-200">
                      {block.tableData.headers.map((h, i) => (
                        <th
                          key={i}
                          className="py-3 px-4 font-semibold text-stone-800 uppercase tracking-wider text-[11px]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {block.tableData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-stone-50/70 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`py-3 px-4 align-top ${
                              cIdx === 0 ? 'font-medium text-stone-900' : 'text-stone-600'
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'quote':
            return (
              <figure
                key={index}
                className="my-8 pl-5 sm:pl-7 border-l-4 border-emerald-800 italic space-y-2"
              >
                <blockquote className="font-serif text-lg sm:text-xl text-stone-900 leading-snug">
                  &ldquo;{block.content}&rdquo;
                </blockquote>
                {block.quoteAuthor && (
                  <figcaption className="text-xs text-stone-500 not-italic font-medium">
                    — {block.quoteAuthor}
                  </figcaption>
                )}
              </figure>
            );

          case 'image':
            return (
              <div key={index} className="my-6 space-y-2">
                <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
                  <img
                    src={block.imageUrl}
                    alt={block.imageAlt || ''}
                    className="w-full h-auto object-cover max-h-[500px]"
                  />
                </div>
                {block.imageCaption && (
                  <p className="text-xs text-stone-500 italic text-center">
                    {block.imageCaption}
                  </p>
                )}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
