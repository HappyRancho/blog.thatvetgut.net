import React from 'react';
import {
  Activity,
  AlertCircle,
  Apple,
  Globe,
  HeartPulse,
  ShieldCheck,
  Smile,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { ARTICLES } from '../../data/articles';
import { useNavigation } from '../../context/NavigationContext';

const ICON_MAP: Record<string, React.ReactNode> = {
  HeartPulse: <HeartPulse className="w-5 h-5 text-emerald-800" />,
  Stethoscope: <Stethoscope className="w-5 h-5 text-emerald-800" />,
  Apple: <Apple className="w-5 h-5 text-emerald-800" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5 text-emerald-800" />,
  AlertCircle: <AlertCircle className="w-5 h-5 text-emerald-800" />,
  Globe: <Globe className="w-5 h-5 text-emerald-800" />,
  Smile: <Smile className="w-5 h-5 text-emerald-800" />,
  Activity: <Activity className="w-5 h-5 text-emerald-800" />,
};

export const CategoryStrip: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section id="homepage-categories-section" className="py-8 sm:py-12 border-b border-stone-200">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
            Clinical Disciplines
          </span>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Explore by Veterinary Specialty
          </h2>
        </div>
        <button
          onClick={() => navigateTo({ name: 'categories' })}
          className="text-xs sm:text-sm font-semibold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 min-h-[44px] self-start sm:self-auto"
        >
          View all specialties <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {CATEGORIES.map((category) => {
          const count = ARTICLES.filter((a) => a.category === category.slug).length;
          return (
            <div
              key={category.id}
              onClick={() => navigateTo({ name: 'category', slug: category.slug })}
              className="group bg-white rounded-2xl border border-stone-200 hover:border-emerald-700/50 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                {ICON_MAP[category.iconName] || <Stethoscope className="w-5 h-5 text-emerald-800" />}
              </div>

              <div>
                <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 group-hover:text-emerald-950 transition-colors">
                  {category.name}
                </h3>
                <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">
                  {category.description}
                </p>
              </div>

              <div className="text-[11px] text-emerald-800 font-medium pt-1 flex items-center justify-between border-t border-stone-100">
                <span>{count} {count === 1 ? 'Article' : 'Articles'}</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
