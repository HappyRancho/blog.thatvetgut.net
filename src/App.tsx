/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { BookmarksProvider } from './context/BookmarksContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { ContributorsPage } from './pages/ContributorsPage';
import { AuthorDetailPage } from './pages/AuthorDetailPage';
import { SearchPage } from './pages/SearchPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminDashboard } from './components/admin/AdminDashboard';

const AppContent: React.FC = () => {
  const { route } = useNavigation();

  // If on admin route, render the full-screen mobile-optimized Admin CMS
  if (route.name === 'admin') {
    return <AdminDashboard />;
  }

  const renderPage = () => {
    switch (route.name) {
      case 'home':
        return <HomePage />;
      case 'articles':
        return <ArticlesPage initialCategory={route.category} initialTag={route.tag} />;
      case 'article':
        return <ArticleDetailPage slug={route.slug} />;
      case 'categories':
        return <CategoriesPage />;
      case 'category':
        return <CategoryDetailPage slug={route.slug} />;
      case 'contributors':
        return <ContributorsPage />;
      case 'author':
        return <AuthorDetailPage slug={route.slug} />;
      case 'search':
        return <SearchPage initialQuery={route.initialQuery} />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1C1917]">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <NavigationProvider>
      <AuthProvider>
        <BookmarksProvider>
          <AppContent />
        </BookmarksProvider>
      </AuthProvider>
    </NavigationProvider>
  );
}
