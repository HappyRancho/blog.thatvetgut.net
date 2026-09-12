import React from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';
import { AUTHORS } from '../data/authors';
import { ARTICLES } from '../data/articles';
import { SEOHead } from '../components/common/SEOHead';
import { useNavigation } from '../context/NavigationContext';

export const ContributorsPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="space-y-12 sm:space-y-16">
      <SEOHead
        title="Meet the ThatVetGuy Team — Collaborative Veterinary Co-Founders"
        description="A collaborative team of veterinary professionals creating reliable, accessible animal-health education. Equal co-authorship and peer-reviewed medicine."
      />

      {/* Page Header */}
      <div className="border-b border-stone-200 pb-8 space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-950 text-xs font-bold uppercase tracking-wider">
          <Stethoscope className="w-3.5 h-3.5 text-emerald-800" />
          <span>ThatVetGuy Co-Founders</span>
        </div>
        <h1 className="font-serif font-extrabold text-3xl sm:text-5xl text-stone-900 tracking-tight leading-tight">
          Meet the ThatVetGuy Team
        </h1>
        <p className="font-serif text-lg sm:text-xl text-stone-700 leading-relaxed italic">
          &ldquo;A collaborative team of veterinary professionals creating reliable, accessible animal-health education.&rdquo;
        </p>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          ThatVetGuy was forged on the belief that veterinary communication is strongest when clinicians collaborate on equal footing. There is no corporate pyramid, no single owner, and no hierarchy among our core veterinary team. Every Co-Founder shares equal publishing authority and equal dedication to clinical accuracy.
        </p>
      </div>

      {/* Co-Founders Equal Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-2xl text-stone-900">
              The Co-Founding Veterinary Clinicians
            </h2>
            <p className="text-xs text-stone-500">
              Presented collectively with equal visual standing and peer-reviewed collaboration.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            {AUTHORS.length} Core Co-Founders
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AUTHORS.map((doctor) => {
            const authorArticles = ARTICLES.filter((a) => a.authorId === doctor.id);
            return (
              <div
                key={doctor.id}
                id={`contributor-card-${doctor.slug}`}
                className="bg-white rounded-3xl border border-stone-200 hover:border-emerald-700/40 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Photo & Identity */}
                  <div className="flex items-start gap-4">
                    <img
                      src={doctor.avatarUrl}
                      alt={doctor.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-900/20 shadow-xs shrink-0"
                    />
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 leading-tight">
                        {doctor.name}
                      </h3>
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-block text-[11px] font-bold text-emerald-950 bg-emerald-100/90 px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit">
                          {doctor.designation}
                        </span>
                        <span className="text-xs font-semibold text-stone-700">
                          {doctor.professionalRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div className="flex items-start gap-2 text-xs font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <Award className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                    <span className="leading-snug">{doctor.qualifications}</span>
                  </div>

                  {/* Bio */}
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {doctor.bio}
                  </p>

                  {/* Areas of Expertise */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                      Clinical Focus & Expertise:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {doctor.expertise.map((exp, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg font-medium"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Articles Count & Profile Link */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-stone-500">
                    {doctor.socials.linkedin && (
                      <a
                        href={doctor.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-400 hover:text-emerald-900 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`${doctor.name} LinkedIn`}
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {doctor.socials.instagram && (
                      <a
                        href={doctor.socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-400 hover:text-emerald-900 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`${doctor.name} Instagram`}
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {doctor.socials.website && (
                      <a
                        href={doctor.socials.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-400 hover:text-emerald-900 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`${doctor.name} Website`}
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {doctor.socials.email && (
                      <a
                        href={`mailto:${doctor.socials.email}`}
                        className="text-stone-400 hover:text-emerald-900 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`Email ${doctor.name}`}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => navigateTo({ name: 'author', slug: doctor.slug })}
                    className="text-emerald-900 hover:text-emerald-950 font-semibold flex items-center gap-1 min-h-[44px]"
                  >
                    <span>{authorArticles.length} {authorArticles.length === 1 ? 'Article' : 'Articles'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editorial Collaborative Standards Section */}
      <div className="bg-stone-50 rounded-3xl border border-stone-200 p-6 sm:p-10 space-y-6">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>Our Peer-Review Standard</span>
          </div>
          <h3 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            How ThatVetGuy Ensures Medical Credibility
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Every clinical article published on ThatVetGuy undergoes cross-examination by at least two licensed veterinary doctors. We reject AI-fabricated citations, superficial symptoms checklists, and commercial sponsor bias.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 space-y-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-800" />
            <h4 className="font-semibold text-sm text-stone-900">Primary Veterinary Authorship</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Authored directly by practicing veterinary surgeons, medicine specialists, and animal nutritionists.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 space-y-2">
            <Heart className="w-5 h-5 text-emerald-800" />
            <h4 className="font-semibold text-sm text-stone-900">Zero Corporate Hierarchy</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              No single owner or chief editor overrides scientific consensus. Editorial decisions are made collectively.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 space-y-2">
            <BookOpen className="w-5 h-5 text-emerald-800" />
            <h4 className="font-semibold text-sm text-stone-900">Peer-Reviewed Citations</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Every clinical assertion is grounded in established veterinary literature, WSAVA guidelines, and textbooks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
