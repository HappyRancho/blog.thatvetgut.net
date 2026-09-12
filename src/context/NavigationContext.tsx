import React, { createContext, useContext, useEffect, useState } from 'react';
import { PageRoute } from '../types';

interface NavigationContextType {
  route: PageRoute;
  navigateTo: (route: PageRoute) => void;
  navigatePath: (path: string) => void;
  currentPath: string;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

function parsePath(pathname: string, searchStr: string): PageRoute {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  const searchParams = new URLSearchParams(searchStr);

  if (!cleanPath) {
    return { name: 'home' };
  }

  const parts = cleanPath.split('/');

  if (parts[0] === 'admin') {
    if (parts[1] === 'edit' && parts[2]) {
      return { name: 'admin', section: 'edit', articleId: parts[2] };
    }
    if (parts[1] === 'review' && parts[2]) {
      return { name: 'admin', section: 'review', articleId: parts[2] };
    }
    return { name: 'admin', section: parts[1] || 'dashboard' };
  }

  if (parts[0] === 'article' && parts[1]) {
    return { name: 'article', slug: parts[1] };
  }

  if (parts[0] === 'category' && parts[1]) {
    return { name: 'category', slug: parts[1] };
  }

  if (parts[0] === 'author' && parts[1]) {
    return { name: 'author', slug: parts[1] };
  }

  if (parts[0] === 'articles') {
    return {
      name: 'articles',
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
    };
  }

  if (parts[0] === 'categories') {
    return { name: 'categories' };
  }

  if (parts[0] === 'contributors' || parts[0] === 'team') {
    return { name: 'contributors' };
  }

  if (parts[0] === 'search') {
    return { name: 'search', initialQuery: searchParams.get('q') || '' };
  }

  if (parts[0] === 'about') {
    return { name: 'about' };
  }

  if (parts[0] === 'contact') {
    return { name: 'contact' };
  }

  return { name: 'home' };
}

function routeToPath(route: PageRoute): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'articles':
      if (route.category) return `/articles?category=${encodeURIComponent(route.category)}`;
      if (route.tag) return `/articles?tag=${encodeURIComponent(route.tag)}`;
      return '/articles';
    case 'article':
      return `/article/${route.slug}`;
    case 'categories':
      return '/categories';
    case 'category':
      return `/category/${route.slug}`;
    case 'contributors':
      return '/contributors';
    case 'author':
      return `/author/${route.slug}`;
    case 'search':
      return route.initialQuery ? `/search?q=${encodeURIComponent(route.initialQuery)}` : '/search';
    case 'about':
      return '/about';
    case 'contact':
      return '/contact';
    case 'admin':
      if (route.articleId && route.section === 'edit') {
        return `/admin/edit/${route.articleId}`;
      }
      if (route.articleId && route.section === 'review') {
        return `/admin/review/${route.articleId}`;
      }
      if (route.section && route.section !== 'dashboard') {
        return `/admin/${route.section}`;
      }
      return '/admin';
    default:
      return '/';
  }
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState<PageRoute>(() => {
    if (typeof window !== 'undefined') {
      return parsePath(window.location.pathname, window.location.search);
    }
    return { name: 'home' };
  });

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search;
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const newRoute = parsePath(window.location.pathname, window.location.search);
      setRoute(newRoute);
      setCurrentPath(window.location.pathname + window.location.search);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newRoute: PageRoute) => {
    const newPath = routeToPath(newRoute);
    if (typeof window !== 'undefined') {
      if (window.location.pathname + window.location.search !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    }
    setRoute(newRoute);
    setCurrentPath(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigatePath = (path: string) => {
    const [pathname, searchStr] = path.split('?');
    const newRoute = parsePath(pathname || '/', searchStr ? `?${searchStr}` : '');
    navigateTo(newRoute);
  };

  return (
    <NavigationContext.Provider value={{ route, navigateTo, navigatePath, currentPath }}>
      {children}
    </NavigationContext.Provider>
  );
};

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
