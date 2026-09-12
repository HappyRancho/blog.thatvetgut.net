import React, { createContext, useContext, useEffect, useState } from 'react';

interface BookmarksContextType {
  bookmarks: string[];
  toggleBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export const BookmarksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('thatvetguy_bookmarks');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('thatvetguy_bookmarks', JSON.stringify(bookmarks));
    } catch {
      // storage quota or private mode
    }
  }, [bookmarks]);

  const toggleBookmark = (articleId: string) => {
    setBookmarks((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );
  };

  const isBookmarked = (articleId: string) => bookmarks.includes(articleId);

  return (
    <BookmarksContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarksContext.Provider>
  );
};

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within BookmarksProvider');
  }
  return context;
}
