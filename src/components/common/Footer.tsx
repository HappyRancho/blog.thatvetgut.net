import React from 'react';
import { Heart, Stethoscope, ArrowUpRight } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { AUTHORS } from '../../data/authors';
import { useNavigation } from '../../context/NavigationContext';

export const Footer: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <footer className="bg-stone-900 text-stone-300 pt-14 pb-10 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-100 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="font-serif font-bold text-2xl tracking-tight text-white block">
                  ThatVetGuy
                </span>
                <span className="text-[11px] text-emerald-400 font-medium tracking-wide">
                  Veterinary Medicine • Animal Health • Pet Education
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-md">
              A collaborative veterinary publication created and operated collectively by veterinary professionals. Dedicated to clinical rigor, scientific integrity, and accessible animal-health education for caregivers and practitioners.
            </p>

            {/* Equal Co-Founders Note */}
            <div className="p-3 bg-stone-800/80 rounded-xl border border-stone-700/60 max-w-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                <span>ThatVetGuy Co-Founders</span>
              </div>
              <p className="text-xs text-stone-400">
                Operated without individual hierarchy. All core veterinary clinicians maintain equal editorial authority and scientific contribution.
              </p>
            </div>
          </div>

          {/* Specialties / Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Specialties</h4>
            <ul className="space-y-2 text-xs">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => navigateTo({ name: 'category', slug: cat.slug })}
                    className="text-stone-400 hover:text-emerald-400 transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => navigateTo({ name: 'categories' })}
                  className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                >
                  All Categories &rarr;
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigateTo({ name: 'articles' })}
                  className="text-stone-400 hover:text-emerald-400 transition-colors"
                >
                  All Articles
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo({ name: 'contributors' })}
                  className="text-stone-400 hover:text-emerald-400 transition-colors"
                >
                  Meet the Team (Co-Founders)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo({ name: 'about' })}
                  className="text-stone-400 hover:text-emerald-400 transition-colors"
                >
                  About Our Collective
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo({ name: 'contact' })}
                  className="text-stone-400 hover:text-emerald-400 transition-colors"
                >
                  Contact & Editorial Feedback
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo({ name: 'search' })}
                  className="text-stone-400 hover:text-emerald-400 transition-colors"
                >
                  Search Medical Library
                </button>
              </li>
            </ul>
          </div>

          {/* Co-Founders Roster Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">The Team</h4>
            <ul className="space-y-2 text-xs">
              {AUTHORS.map((author) => (
                <li key={author.id}>
                  <button
                    onClick={() => navigateTo({ name: 'author', slug: author.slug })}
                    className="text-stone-400 hover:text-emerald-400 transition-colors flex items-center justify-between w-full group text-left"
                  >
                    <span>{author.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-stone-600 group-hover:text-emerald-400 transition-colors" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Veterinary Editorial Notice */}
        <div className="pt-6 border-t border-stone-800 text-xs text-stone-400 space-y-2">
          <p className="leading-relaxed">
            <strong className="text-stone-300">Medical Notice:</strong> Information published by ThatVetGuy is intended for educational purposes and should not replace professional veterinary consultation, physical examination, diagnostic testing, or emergency medical treatment. Always consult a licensed veterinarian regarding the diagnosis and medical management of your companion animals.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>
            &copy; {new Date().getFullYear()} ThatVetGuy. Operated collectively by ThatVetGuy Co-Founders. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-stone-400">
            <span>blog.thatvetguy.net</span>
            <span>•</span>
            <button
              onClick={() => navigateTo({ name: 'about' })}
              className="hover:text-emerald-400 transition-colors"
            >
              Editorial Standards
            </button>
            <span>•</span>
            <button
              onClick={() => navigateTo({ name: 'contact' })}
              className="hover:text-emerald-400 transition-colors"
            >
              Inquiries
            </button>
            <span>•</span>
            <button
              id="footer-staff-login-btn"
              onClick={() => navigateTo({ name: 'admin' })}
              className="hover:text-emerald-400 transition-colors text-stone-400 hover:underline"
            >
              Staff Sign In
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
