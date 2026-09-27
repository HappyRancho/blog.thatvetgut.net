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

  const pageParam = searchParams.get('page');
  if (pageParam === 'admin' || pageParam === 'login' || pageParam === 'signin') {
    return { name: 'admin' };
  }

  const parts = cleanPath.split('/');

  if (parts[0] === 'admin') {
    // /admin/articles/new
    if (parts[1] === 'articles' && parts[2] === 'new') {
      return { name: 'admin', section: 'edit', articleId: 'new' };
    }
    // /admin/articles/edit/:id
    if (parts[1] === 'articles' && (parts[2] === 'edit' || parts[2]) && (parts[3] || parts[2])) {
      const id = parts[2] === 'edit' ? parts[3] : parts[2];
      return { name: 'admin', section: 'edit', articleId: id };
    }
    // /admin/edit/:id
    if (parts[1] === 'edit' && parts[2]) {
      return { name: 'admin', section: 'edit', articleId: parts[2] };
    }
    // /admin/articles
    if (parts[1] === 'articles') {
      return { name: 'admin', section: 'articles' };
    }
    // /admin/profile
    if (parts[1] === 'profile') {
      return { name: 'admin', section: 'profile' };
    }
    return { name: 'admin', section: 'dashboard' };
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
      if (route.section === 'edit') {
        if (route.articleId && route.articleId !== 'new') {
          return `/admin/articles/edit/${route.articleId}`;
        }
        return '/admin/articles/new';
      }
      if (route.section === 'articles') {
        return '/admin/articles';
      }
      if (route.section === 'profile') {
        return '/admin/profile';
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
