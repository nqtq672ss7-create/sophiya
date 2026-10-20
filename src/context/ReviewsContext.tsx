import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Review } from '../types/review';
import { INITIAL_REVIEWS } from '../data/reviews';
import { getApiUrl } from '../config/api';

interface ReviewsContextType {
  reviews: Review[];
  publishedReviews: Review[];
  addReview: (newReviewData: Omit<Review, 'id'>) => Review;
  updateReview: (id: string, updates: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  togglePublished: (id: string) => void;
  resetToDefault: () => void;
  refreshReviews: () => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

const STORAGE_KEY = 'sophiya_salon_reviews_v3';
const BACKUP_STORAGE_KEY = 'sophiya_salon_reviews_v2';

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load reviews from storage:', e);
    }
    return INITIAL_REVIEWS;
  });

  const saveToStorage = (items: Review[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist reviews:', e);
    }
  };

  const syncToCloud = async (items: Review[]) => {
    try {
      await fetch(getApiUrl('/api/reviews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
    } catch (e) {
      console.warn('Failed to sync reviews to cloud:', e);
    }
  };

  const refreshReviews = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/api/reviews?t=${Date.now()}`), { headers: { 'Cache-Control': 'no-cache' } });
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote)) {
          setReviews(remote);
          saveToStorage(remote);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote reviews:', err);
    }
  }, []);

  useEffect(() => {
    refreshReviews();
  }, [refreshReviews]);

  const addReview = (newReviewData: Omit<Review, 'id'>): Review => {
    const newReview: Review = {
      ...newReviewData,
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setReviews((prev) => {
      const updated = [newReview, ...prev];
      saveToStorage(updated);
      syncToCloud(updated);
      return updated;
    });
    return newReview;
  };

  const updateReview = (id: string, updates: Partial<Review>) => {
    setReviews((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      saveToStorage(updated);
      syncToCloud(updated);
      return updated;
    });
  };

  const deleteReview = (id: string) => {
    setReviews((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveToStorage(updated);
      syncToCloud(updated);
      return updated;
    });
  };

  const togglePublished = (id: string) => {
    setReviews((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, isPublished: !r.isPublished } : r
      );
      saveToStorage(updated);
      syncToCloud(updated);
      return updated;
    });
  };

  const resetToDefault = () => {
    setReviews(INITIAL_REVIEWS);
    saveToStorage(INITIAL_REVIEWS);
    syncToCloud(INITIAL_REVIEWS);
  };

  const publishedReviews = reviews.filter((r) => r.isPublished);

  return (
    <ReviewsContext.Provider
      value={{
        reviews,
        publishedReviews,
        addReview,
        updateReview,
        deleteReview,
        togglePublished,
        resetToDefault,
        refreshReviews,
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewsProvider');
  }
  return context;
};
