import React from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { getAuthorBySlug } from '../data/authors';
import { getArticlesByAuthor } from '../data/articles';
import { ArticleCard } from '../components/article/ArticleCard';
import { SEOHead } from '../components/common/SEOHead';
import { useNavigation } from '../context/NavigationContext';

interface AuthorDetailPageProps {
  slug: string;
}

export const AuthorDetailPage: React.FC<AuthorDetailPageProps> = ({ slug }) => {
  const { navigateTo } = useNavigation();
  const author = getAuthorBySlug(slug);
  const articles = getArticlesByAuthor(author?.id || slug);

  if (!author) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-stone-900">Author Not Found</h2>
        <p className="text-xs text-stone-500">The requested veterinary clinician profile could not be located.</p>
        <button
          onClick={() => navigateTo({ name: 'contributors' })}
          className="px-5 py-2.5 bg-emerald-900 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors min-h-[44px]"
        >
          View All Co-Founders & Contributors
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <SEOHead
        title={`${author.name} — ${author.designation}`}
        description={`${author.name}, ${author.qualifications}. ${author.bio}`}
      />

      {/* Back Link */}
      <button
        onClick={() => navigateTo({ name: 'contributors' })}
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-emerald-900 transition-colors py-1 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Team</span>
      </button>

      {/* Author Hero Header */}
      <div
        id="author-profile-card"
        className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <img
            src={author.avatarUrl}
            alt={author.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-emerald-900/20 shadow-sm shrink-0"
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-serif font-extrabold text-2xl sm:text-3xl lg:text-4xl text-stone-900">
                {author.name}
              </h1>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 uppercase tracking-wider">
                {author.designation}
              </span>
            </div>

            <p className="text-sm font-semibold text-emerald-950">
              {author.professionalRole}
            </p>

            <p className="text-xs sm:text-sm font-semibold text-stone-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>{author.qualifications}</span>
            </p>

            {author.clinicOrAffiliation && (
              <p className="text-xs text-stone-500">{author.clinicOrAffiliation}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="pt-4 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
            Professional Biography
          </h3>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
            {author.bio}
          </p>
        </div>

        {/* Expertise */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
            Areas of Clinical Practice & Research
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {author.expertise.map((exp, i) => (
              <span
                key={i}
                className="text-xs bg-stone-100 text-stone-800 px-3 py-1 rounded-lg font-medium border border-stone-200/60"
              >
                {exp}
              </span>
            ))}
          </div>
        </div>

        {/* Contact Links */}
        <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-stone-600">
            {author.socials.linkedin && (
              <a
                href={author.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-emerald-900 transition-colors font-medium min-h-[44px]"
              >
                <Linkedin className="w-4 h-4 text-blue-800" />
                <span>LinkedIn</span>
              </a>
            )}
            {author.socials.instagram && (
              <a
                href={author.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-emerald-900 transition-colors font-medium min-h-[44px]"
              >
                <Instagram className="w-4 h-4 text-pink-700" />
                <span>Instagram</span>
              </a>
            )}
            {author.socials.website && (
              <a
                href={author.socials.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-emerald-900 transition-colors font-medium min-h-[44px]"
              >
                <Globe className="w-4 h-4 text-stone-600" />
                <span>Official Website</span>
              </a>
            )}
            {author.socials.email && (
              <a
                href={`mailto:${author.socials.email}`}
                className="flex items-center gap-1.5 hover:text-emerald-900 transition-colors font-medium min-h-[44px]"
              >
                <Mail className="w-4 h-4 text-stone-600" />
                <span>Editorial Contact</span>
              </a>
            )}
          </div>

          <div className="text-stone-400 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>Equal Co-Founding Peer Reviewer</span>
          </div>
        </div>
      </div>

      {/* Authored Articles Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
              Author Archive
            </span>
            <h2 className="font-serif font-bold text-2xl text-stone-900">
              Articles by {author.name}
            </h2>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            {articles.length} {articles.length === 1 ? 'Publication' : 'Publications'}
          </span>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
            Articles by {author.name} are currently in peer-review drafting.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
