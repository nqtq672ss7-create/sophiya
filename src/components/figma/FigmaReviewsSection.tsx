import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, MessageSquare } from 'lucide-react';
import { useReviews } from '../../context/ReviewsContext';
import { LeaveReviewModal } from '../reviews/LeaveReviewModal';

export const FigmaReviewsSection: React.FC = () => {
  const { publishedReviews } = useReviews();

  const [cardsPerView, setCardsPerView] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Responsive cardsPerView detection
  useEffect(() => {
    const updateCardsPerView = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 640) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(4);
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const total = publishedReviews.length;

  // Background auto-rotation timer (every 4.5 seconds)
  useEffect(() => {
    if (isPaused || total <= cardsPerView) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, total, cardsPerView]);

  // Seamless infinite loop handler
  const handleTransitionEnd = () => {
    if (total > 0 && currentIndex >= total) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  // Re-enable smooth transition after instant reset
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  if (total === 0) return null;

  // Extended array for seamless infinite sliding
  const extendedReviews = [...publishedReviews, ...publishedReviews.slice(0, cardsPerView)];

  // Active dot index (0 to total - 1)
  const activeDotIndex = currentIndex % total;

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 select-none font-sans"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <span className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#6C1E26] font-medium block mb-2">
            Отзывы клиентов • Салон «София»
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-zinc-900 font-normal tracking-tight">
            Истории заботы и моменты радости
          </h2>
        </div>

        {/* Direct on-site review CTA */}
        <div>
          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs font-medium transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer hover:shadow-md"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Оставить отзыв</span>
          </button>
        </div>
      </div>

      {/* Rotating Carousel Track */}
      <div className="overflow-hidden relative mt-8 -mx-2 sm:-mx-3">
        <div
          className="flex"
          style={{
            transform: `translateX(-${(currentIndex * 100) / cardsPerView}%)`,
            transition: isTransitioning ? 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedReviews.map((rev, idx) => (
            <div
              key={`${rev.id}-${idx}`}
              style={{ width: `${100 / cardsPerView}%` }}
              className="shrink-0 p-2 sm:p-3"
            >
              <div className="h-full p-5 sm:p-6 bg-[#6C1E26] text-white rounded-3xl border border-[#8C1B2F]/60 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Rating Stars & Verified Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-300">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      ))}
                    </div>

                    {rev.isVerified && (
                      <span className="text-[10px] text-white bg-white/15 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium border border-white/20">
                        <CheckCircle className="w-3 h-3 text-emerald-300" />
                        <span>Проверен</span>
                      </span>
                    )}
                  </div>

                  {/* Bouquet Title Reference */}
                  {rev.bouquetTitle && (
                    <span className="text-xs text-amber-200 font-semibold block truncate">
                      {rev.bouquetTitle}
                    </span>
                  )}

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-white/90 font-normal leading-relaxed line-clamp-4">
                    «{rev.comment}»
                  </p>
                </div>

                {/* Author & Date Footer */}
                <div className="pt-4 mt-4 border-t border-white/15 flex items-center justify-between text-xs">
                  <span className="font-sans text-sm sm:text-base text-white font-bold">
                    {rev.author}
                  </span>
                  <span className="text-white/60 text-[11px] font-medium">
                    {rev.date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle Minimal Dots */}
      <div className="mt-6 flex justify-center items-center gap-1.5">
        {publishedReviews.map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => {
              setIsTransitioning(true);
              setCurrentIndex(dotIdx);
            }}
            className={`h-1 rounded-full transition-all duration-500 ${
              dotIdx === activeDotIndex
                ? 'w-6 bg-[#6C1E26]'
                : 'w-1.5 bg-zinc-200 hover:bg-zinc-300'
            }`}
            title={`Отзыв ${dotIdx + 1}`}
            aria-label={`Отзыв ${dotIdx + 1}`}
          />
        ))}
      </div>

      {/* Direct Review Modal */}
      <LeaveReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </section>
  );
};
