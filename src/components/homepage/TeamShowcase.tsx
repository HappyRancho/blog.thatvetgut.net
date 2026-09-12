import React from 'react';
import { Award, Linkedin, ArrowRight, Stethoscope } from 'lucide-react';
import { AUTHORS } from '../../data/authors';
import { useNavigation } from '../../context/NavigationContext';

export const TeamShowcase: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section id="team-showcase-section" className="py-12 sm:py-16 border-b border-stone-200">
      <div className="max-w-4xl mb-8 sm:mb-10">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
          <Stethoscope className="w-4 h-4 text-emerald-800" />
          <span>Collaborative Collective</span>
        </div>
        <h2 className="font-serif font-bold text-2xl sm:text-4xl text-stone-900 tracking-tight">
          Meet the ThatVetGuy Team
        </h2>
        <p className="text-sm sm:text-base text-stone-600 mt-2 leading-relaxed">
          &ldquo;A collaborative team of veterinary professionals creating reliable, accessible animal-health education.&rdquo;
        </p>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Operated with equal editorial authority, peer-reviewed standards, and zero organizational hierarchy among ThatVetGuy Co-Founders.
        </p>
      </div>

      {/* Grid of Equal Co-Founders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {AUTHORS.map((doctor) => (
          <div
            key={doctor.id}
            id={`founder-card-${doctor.slug}`}
            className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-700/50 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Doctor Avatar & Name */}
              <div className="flex items-center gap-4">
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shadow-xs shrink-0"
                />
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-tight">
                    {doctor.name}
                  </h3>
                  <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-950 bg-emerald-100/90 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {doctor.designation}
                  </span>
                  <p className="text-[11px] font-semibold text-stone-700 mt-0.5">
                    {doctor.professionalRole}
                  </p>
                </div>
              </div>

              {/* Qualifications */}
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-start gap-1.5 text-xs font-medium text-stone-700">
                <Award className="w-3.5 h-3.5 text-emerald-800 shrink-0 mt-0.5" />
                <span className="leading-snug">{doctor.qualifications}</span>
              </div>

              {/* Bio Excerpt */}
              <p className="text-xs text-stone-600 line-clamp-3 mt-2.5 leading-relaxed">
                {doctor.bio}
              </p>

              {/* Expertise Badges */}
              <div className="flex flex-wrap gap-1 mt-3">
                {doctor.expertise.slice(0, 3).map((exp, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-medium"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <button
                onClick={() => navigateTo({ name: 'author', slug: doctor.slug })}
                className="text-emerald-900 hover:text-emerald-950 font-semibold flex items-center gap-1 min-h-[44px]"
              >
                Profile & Articles <ArrowRight className="w-3 h-3" />
              </button>

              {doctor.socials.linkedin && (
                <a
                  href={doctor.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-400 hover:text-emerald-900 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`${doctor.name} LinkedIn`}
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View All Contributors CTA */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigateTo({ name: 'contributors' })}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-colors min-h-[44px]"
        >
          <span>Learn About the Full Team & Editorial Philosophy</span>
          <ArrowRight className="w-4 h-4 text-emerald-800" />
        </button>
      </div>
    </section>
  );
};
