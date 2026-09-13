import React, { useState } from 'react';
import { Bookmark, Lock, LogIn, Menu, Search, Stethoscope } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useBookmarks } from '../../context/BookmarksContext';
import { useAuth } from '../../context/AuthContext';
import { MobileNavDrawer } from './MobileNavDrawer';

export const Header: React.FC = () => {
  const { navigateTo, route } = useNavigation();
  const { bookmarks } = useBookmarks();
  const { isAuthorized, currentAuthor } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top Notice Bar */}
      <div className="bg-[#064E3B] text-emerald-100 text-[11px] sm:text-xs py-1 px-3 text-center tracking-wide font-medium flex items-center justify-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Collaborative Veterinary Publication • Operated Collectively by ThatVetGuy Co-Founders</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Positioning */}
          <div
            id="brand-logo"
            onClick={() => navigateTo({ name: 'home' })}
            className="cursor-pointer flex items-center gap-3 select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-900 text-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-800 transition-colors">
              <Stethoscope className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif font-extrabold text-2xl tracking-tight text-stone-900 group-hover:text-emerald-950 transition-colors">
                  ThatVetGuy
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-900 uppercase tracking-wider">
                  Editorial
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 font-medium tracking-tight">
                Veterinary Medicine • Animal Health • Pet Education
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <button
              id="desktop-nav-articles"
              onClick={() => navigateTo({ name: 'articles' })}
              className={`text-sm font-medium transition-colors hover:text-emerald-900 ${
                route.name === 'articles'
                  ? 'text-emerald-900 font-semibold border-b-2 border-emerald-900 py-1'
                  : 'text-stone-700'
              }`}
            >
              Articles
            </button>

            <button
              id="desktop-nav-categories"
              onClick={() => navigateTo({ name: 'categories' })}
              className={`text-sm font-medium transition-colors hover:text-emerald-900 ${
                route.name === 'categories' || route.name === 'category'
                  ? 'text-emerald-900 font-semibold border-b-2 border-emerald-900 py-1'
                  : 'text-stone-700'
              }`}
            >
              Categories
            </button>

            <button
              id="desktop-nav-contributors"
              onClick={() => navigateTo({ name: 'contributors' })}
              className={`text-sm font-medium transition-colors hover:text-emerald-900 ${
                route.name === 'contributors' || route.name === 'author'
                  ? 'text-emerald-900 font-semibold border-b-2 border-emerald-900 py-1'
                  : 'text-stone-700'
              }`}
            >
              Meet the Team
            </button>

            <button
              id="desktop-nav-about"
              onClick={() => navigateTo({ name: 'about' })}
              className={`text-sm font-medium transition-colors hover:text-emerald-900 ${
                route.name === 'about'
                  ? 'text-emerald-900 font-semibold border-b-2 border-emerald-900 py-1'
                  : 'text-stone-700'
              }`}
            >
              About
            </button>

            <button
              id="desktop-nav-contact"
              onClick={() => navigateTo({ name: 'contact' })}
              className={`text-sm font-medium transition-colors hover:text-emerald-900 ${
                route.name === 'contact'
                  ? 'text-emerald-900 font-semibold border-b-2 border-emerald-900 py-1'
                  : 'text-stone-700'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              id="header-search-btn"
              onClick={() => navigateTo({ name: 'search' })}
              className="p-2 sm:px-3 sm:py-2 text-stone-600 hover:text-emerald-950 hover:bg-stone-100 rounded-xl transition-colors flex items-center gap-2 min-h-[44px] min-w-[44px] justify-center"
              aria-label="Search articles"
              title="Search articles"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-medium text-stone-500">Search</span>
            </button>

            {/* Saved Bookmarks count indicator */}
            {bookmarks.length > 0 && (
              <button
                id="header-bookmarks-btn"
                onClick={() => navigateTo({ name: 'articles' })}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors min-h-[44px]"
                title="View saved articles"
              >
                <Bookmark className="w-3.5 h-3.5 text-emerald-800 fill-emerald-800" />
                <span>Saved ({bookmarks.length})</span>
              </button>
            )}

            {/* Author / Staff Sign-In or CMS Access Trigger */}
            <button
              id="header-staff-signin-btn"
              onClick={() => navigateTo({ name: 'admin' })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200 hover:border-emerald-300 rounded-xl transition-all min-h-[44px]"
              title={isAuthorized ? `Editorial CMS (${currentAuthor?.name || 'Authorized'})` : 'Author / Staff Sign In'}
            >
              {isAuthorized ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Portal</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              id="header-menu-hamburger"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </header>
  );
};
