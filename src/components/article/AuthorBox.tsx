import React from 'react';
import { Award, Linkedin, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { Author } from '../../types';
import { useNavigation } from '../../context/NavigationContext';

interface AuthorBoxProps {
  author: Author;
  reviewer?: Author;
  reviewedDate?: string;
}

export const AuthorBox: React.FC<AuthorBoxProps> = ({ author, reviewer, reviewedDate }) => {
  const { navigateTo } = useNavigation();

  return (
    <div className="my-10 space-y-4">
      {/* Primary Author Card */}
      <div
        id="author-box"
        className="bg-stone-50 rounded-2xl border border-stone-200 p-6 sm:p-7 space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <img
            src={author.avatarUrl}
            alt={author.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-900/20 shadow-xs shrink-0"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif font-bold text-xl text-stone-900">{author.name}</h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 tracking-wide uppercase">
                {author.designation}
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-900">
              {author.professionalRole}
            </p>
            <p className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
              {author.qualifications}
            </p>
            {author.clinicOrAffiliation && (
              <p className="text-xs text-stone-500">{author.clinicOrAffiliation}</p>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">{author.bio}</p>

        {/* Expertise tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-stone-500 mr-1 uppercase tracking-wider">
            Clinical Focus:
          </span>
          {author.expertise.map((item, idx) => (
            <span
              key={idx}
              className="text-[11px] bg-white border border-stone-200 text-stone-700 px-2 py-0.5 rounded-md font-medium"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Links and Author Profile link */}
        <div className="pt-3 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-stone-500">
            {author.socials.linkedin && (
              <a
                href={author.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-emerald-900 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span>LinkedIn</span>
              </a>
            )}
            {author.socials.email && (
              <a
                href={`mailto:${author.socials.email}`}
                className="flex items-center gap-1 hover:text-emerald-900 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact</span>
              </a>
            )}
          </div>

          <button
            onClick={() => navigateTo({ name: 'author', slug: author.slug })}
            className="text-emerald-900 hover:text-emerald-950 font-semibold flex items-center gap-1 min-h-[44px]"
          >
            View Full Clinical Profile & Articles <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reviewer Note (Equal Co-Founder Peer Review) */}
      {reviewer && (
        <div
          id="reviewer-box"
          className="bg-emerald-50/60 rounded-xl border border-emerald-200/80 px-4 py-3 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
            <div>
              <span className="text-stone-600">Medically & Scientifically Reviewed by </span>
              <button
                onClick={() => navigateTo({ name: 'author', slug: reviewer.slug })}
                className="font-semibold text-emerald-950 hover:underline"
              >
                {reviewer.name}
              </button>
              <span className="text-stone-600"> ({reviewer.designation} • {reviewer.professionalRole})</span>
            </div>
          </div>
          {reviewedDate && (
            <span className="text-[11px] text-stone-500 shrink-0">
              {new Date(reviewedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
