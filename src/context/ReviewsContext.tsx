import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Review } from '../types/review';
import { INITIAL_REVIEWS } from '../data/reviews';
import { getApiUrl } from '../config/api';

export interface SubmitReviewInput {
  author: string;
  rating: number;
  bouquetTitle?: string;
  comment: string;
}

function adminAuthHeader(): Record<string, string> {
  try {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('sophiya_admin_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

interface ReviewsContextType {
  reviews: Review[];
  publishedReviews: Review[];
  pendingReviews: Review[];
  addReview: (newReviewData: Omit<Review, 'id'>) => Review;
  submitReview: (data: SubmitReviewInput) => Promise<{ ok: boolean; error?: string }>;
  moderateReview: (id: string, approve: boolean) => Promise<boolean>;
  refreshPending: () => Promise<void>;
  updateReview: (id: string, updates: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  togglePublished: (id: string) => void;
  refreshReviews: () => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextType|undefined>(undefined);

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
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...adminAuthHeader() };
      await fetch(getApiUrl('/api/reviews'), {
        method: 'POST',
        headers,
        body: JSON.stringify(items),
      });
    } catch (e) {
      console.warn('Failed to sync reviews to cloud:', e);
    }
  };

  const refreshReviews = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/api/reviews?t=${Date.now()}`), {
        headers: { 'Cache-Control': 'no-cache', ...adminAuthHeader() },
      });
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

  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);

  const refreshPending = useCallback(async () => {
    const headers = adminAuthHeader();
    if (!headers.Authorization) {
      setPendingReviews([]);
      return;
    }
    try {
      const res = await fetch(getApiUrl(`/api/reviews?pending=1&t=${Date.now()}`), {
        headers: { 'Cache-Control': 'no-cache', ...headers },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingReviews(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch pending reviews:', err);
    }
  }, []);

  // Public visitors send reviews to the moderation queue; nothing is published until the salon approves it.
  const submitReview = async (data: SubmitReviewInput): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(getApiUrl('/api/reviews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', review: data }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.success === true) return { ok: true };
      return { ok: false, error: payload.error || 'Не удалось отправить отзыв. Попробуйте ещё раз.' };
    } catch {
      return { ok: false, error: 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.' };
    }
  };

  const moderateReview = async (id: string, approve: boolean): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl('/api/reviews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminAuthHeader() },
        body: JSON.stringify({ action: 'moderate', id, decision: approve ? 'approve' : 'reject' }),
      });
      if (!res.ok) return false;
      await Promise.all([refreshPending(), refreshReviews()]);
      return true;
    } catch {
      return false;
    }
  };

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

  const publishedReviews = reviews.filter((r) => r.isPublished);

  return (
    <ReviewsContext.Provider
      value={{
        reviews,
        publishedReviews,
        pendingReviews,
        addReview,
        submitReview,
        moderateReview,
        refreshPending,
        updateReview,
        deleteReview,
        togglePublished,
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
