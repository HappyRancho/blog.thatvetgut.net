import React from 'react';
import { BookOpen, Compass, Heart, Home, Info, Lock, LogIn, Mail, Search, Users, X } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  const { navigateTo } = useNavigation();
  const { isAuthorized, currentAuthor } = useAuth();

  if (!isOpen) return null;

  const handleNav = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        id="mobile-nav-drawer"
        className="fixed inset-y-0 left-0 w-[85%] max-w-[340px] bg-[#FAF9F6] border-r border-stone-200 shadow-2xl flex flex-col justify-between overflow-y-auto"
      >
        <div>
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-white">
            <div>
              <span className="font-serif font-bold text-xl tracking-tight text-emerald-950 block">
                ThatVetGuy
              </span>
              <span className="text-[10px] text-emerald-800 font-medium tracking-wide uppercase">
                Veterinary Publication
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Nav Links */}
          <div className="p-4 space-y-1">
            <button
              id="mobile-nav-home"
              onClick={() => handleNav(() => navigateTo({ name: 'home' }))}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 text-sm font-medium transition-colors min-h-[44px]"
            >
              <Home className="w-4 h-4 text-emerald-800 shrink-0" />
              Home
            </button>

            <button
              id="mobile-nav-articles"
              onClick={() => handleNav(() => navigateTo({ name: 'articles' }))}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 text-sm font-medium transition-colors min-h-[44px]"
            >
              <BookOpen className="w-4 h-4 text-emerald-800 shrink-0" />
              All Articles
            </button>

            <button
              id="mobile-nav-categories"
              onClick={() => handleNav(() => navigateTo({ name: 'categories' }))}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 text-sm font-medium transition-colors min-h-[44px]"
            >
              <Compass className="w-4 h-4 text-emerald-800 shrink-0" />
              Categories
            </button>

            <button
              id="mobile-nav-contributors"
              onClick={() => handleNav(() => navigateTo({ name: 'contributors' }))}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 text-sm font-medium transition-colors min-h-[44px]"
            >
              <Users className="w-4 h-4 text-emerald-800 shrink-0" />
              Meet the Team
            </button>

            <button
              id="mobile-nav-search"
              onClick={() => handleNav(() => navigateTo({ name: 'search' }))}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 text-sm font-medium transition-colors min-h-[44px]"
            >
              <Search className="w-4 h-4 text-emerald-800 shrink-0" />
              Search Library
            </button>

            <button
              id="mobile-nav-about"
              onClick={() => handleNav(() => navigateTo({ name: 'about' }))}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 text-sm font-medium transition-colors min-h-[44px]"
            >
              <Info className="w-4 h-4 text-emerald-800 shrink-0" />
              About ThatVetGuy
            </button>

            <button
              id="mobile-nav-contact"
              onClick={() => handleNav(() => navigateTo({ name: 'contact' }))}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 text-sm font-medium transition-colors min-h-[44px]"
            >
              <Mail className="w-4 h-4 text-emerald-800 shrink-0" />
              Contact & Inquiries
            </button>

            <button
              id="mobile-nav-staff-signin"
              onClick={() => handleNav(() => navigateTo({ name: 'admin' }))}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-stone-100 hover:bg-emerald-50 text-emerald-950 hover:text-emerald-900 text-sm font-semibold border border-stone-200 transition-colors min-h-[44px] mt-1"
            >
              {isAuthorized ? (
                <>
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Editorial Portal ({currentAuthor?.name?.split(' ')[0] || 'Staff'})</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>Editorial Staff Sign In</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Categories Section */}
          <div className="px-5 pt-3 pb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
              Featured Specialties
            </h4>
            <div className="space-y-0.5">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleNav(() => navigateTo({ name: 'category', slug: cat.slug }))}
                  className="w-full text-left py-2 px-2.5 rounded-lg text-xs text-stone-600 hover:text-emerald-900 hover:bg-stone-200/50 transition-colors"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="p-4 border-t border-stone-200 bg-white space-y-2 text-xs text-stone-500">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <Heart className="w-3.5 h-3.5 text-emerald-700" />
            <span>Co-Founded by Veterinary Doctors</span>
          </div>
          <p className="text-[11px] leading-relaxed text-stone-500">
            Equal co-authorship. Written for animal welfare, veterinary science, and pet guardian education.
          </p>
        </div>
      </div>
    </div>
  );
};
