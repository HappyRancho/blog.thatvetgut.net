import React from 'react';
import {
  Activity,
  AlertCircle,
  Apple,
  ArrowRight,
  Globe,
  HeartPulse,
  ShieldCheck,
  Smile,
  Stethoscope,
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { ARTICLES } from '../data/articles';
import { SEOHead } from '../components/common/SEOHead';
import { useNavigation } from '../context/NavigationContext';

const ICONS: Record<string, React.ReactNode> = {
  HeartPulse: <HeartPulse className="w-6 h-6 text-emerald-800" />,
  Stethoscope: <Stethoscope className="w-6 h-6 text-emerald-800" />,
  Apple: <Apple className="w-6 h-6 text-emerald-800" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-emerald-800" />,
  AlertCircle: <AlertCircle className="w-6 h-6 text-emerald-800" />,
  Globe: <Globe className="w-6 h-6 text-emerald-800" />,
  Smile: <Smile className="w-6 h-6 text-emerald-800" />,
  Activity: <Activity className="w-6 h-6 text-emerald-800" />,
};

export const CategoriesPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="space-y-8">
      <SEOHead
        title="Veterinary Specialties & Categories — ThatVetGuy"
        description="Explore ThatVetGuy's clinical veterinary categories: Pet Health, Internal Medicine, Clinical Nutrition, One Health, and Emergency Triage."
      />

      <div className="border-b border-stone-200 pb-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
          Editorial Taxonomy
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-stone-900">
          Veterinary Disciplines & Specialties
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl">
          ThatVetGuy organizes clinical insights across core veterinary medical pillars, ensuring comprehensive, accessible education for companion animal caregivers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((category) => {
          const count = ARTICLES.filter((a) => a.category === category.slug).length;
          return (
            <div
              key={category.id}
              onClick={() => navigateTo({ name: 'category', slug: category.slug })}
              className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-700/50 p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  {ICONS[category.iconName] || <Stethoscope className="w-6 h-6 text-emerald-800" />}
                </div>

                <div>
                  <h2 className="font-serif font-bold text-xl text-stone-900 group-hover:text-emerald-950 transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span>{count} {count === 1 ? 'Article' : 'Articles'}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Browse Discipline <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
