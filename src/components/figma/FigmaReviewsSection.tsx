import React, { useState, useEffect, useRef } from 'react';
import { Star, CheckCircle, MessageSquare, ChevronLeft, ChevronRight, Pause, Play, Shuffle, Sparkles, Quote } from 'lucide-react';
import { useReviews } from '../../context/ReviewsContext';

export const FigmaReviewsSection: React.FC = () => {
  const { publishedReviews } = useReviews();

  const [cardsPerView, setCardsPerView] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

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

  // Auto-rotation timer (every 4.5 seconds)
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

  // Next / Prev actions
  const handleNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(total);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          setCurrentIndex(total - 1);
        });
      });
    } else {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShuffle = () => {
    setIsTransitioning(false);
    const randomIndex = Math.floor(Math.random() * total);
    setCurrentIndex(randomIndex);
    requestAnimationFrame(() => {
      setIsTransitioning(true);
    });
  };

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#6C1E26] font-medium">
              Отзывы клиентов • Салон «София»
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Автосмена ленты</span>
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl text-zinc-900 font-normal tracking-tight">
            Истории заботы и моменты радости
          </h2>
        </div>

        {/* Header Right: Rating summary, Carousel Controls & WhatsApp CTA */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Average Rating Badge */}
          <div className="bg-white px-3.5 py-2 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <span className="font-serif text-base font-bold text-zinc-900">4.9</span>
            <span className="text-xs text-zinc-400 font-light">/ 5.0</span>
          </div>

          {/* Carousel Navigation Buttons */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors"
              title="Предыдущий отзыв"
              aria-label="Предыдущий отзыв"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors text-xs"
              title={isPaused ? 'Возобновить автосмену' : 'Приостановить автосмену'}
              aria-label={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-zinc-500" />}
            </button>

            <button
              onClick={handleShuffle}
              className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors"
              title="Перемешать отзывы"
              aria-label="Перемешать отзывы"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors"
              title="Следующий отзыв"
              aria-label="Следующий отзыв"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* WhatsApp Review Button */}
          <a
            href="https://wa.me/79172563235?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%A5%D0%BE%D1%87%D1%83%20%D0%BE%D1%81%D1%82%D0%B0%D0%B2%D0%B8%D1%82%D1%8C%20%D0%BE%D1%82%D0%B7%D1%8B%D0%B2%20%D0%BE%20%D0%B1%D1%83%D0%BA%D0%B5%D1%82%D0%B5"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs font-medium transition-colors shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Оставить отзыв</span>
          </a>
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
              <div className="h-full p-5 sm:p-6 bg-white rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-[#6C1E26]/30 transition-all flex flex-col justify-between relative overflow-hidden group">
                {/* Background Watermark Quote */}
                <Quote className="absolute right-4 bottom-4 w-16 h-16 text-zinc-100 -rotate-12 pointer-events-none group-hover:text-amber-50/70 transition-colors" />

                <div className="space-y-3 relative z-10">
                  {/* Rating Stars & Verified Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>

                    {rev.isVerified && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border border-emerald-100">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Проверен</span>
                      </span>
                    )}
                  </div>

                  {/* Bouquet Title Reference */}
                  {rev.bouquetTitle && (
                    <span className="text-[11px] text-[#6C1E26] font-medium block truncate">
                      {rev.bouquetTitle}
                    </span>
                  )}

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-zinc-600 font-light leading-relaxed line-clamp-4 group-hover:text-zinc-800 transition-colors">
                    «{rev.comment}»
                  </p>
                </div>

                {/* Author & Date Footer */}
                <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs relative z-10">
                  <span className="font-serif text-base text-zinc-900 font-medium">
                    {rev.author}
                  </span>
                  <span className="text-zinc-400 text-[11px] font-light">
                    {rev.date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Status & Pagination Dots */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#6C1E26]" />
          <span className="text-[11px] font-light">
            Показаны отзывы клиентов салона «София» в Нижнекамске • Сменяются автоматически
          </span>
        </div>

        {/* Clickable Dots Indicator */}
        <div className="flex items-center gap-1.5">
          {publishedReviews.map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => {
                setIsTransitioning(true);
                setCurrentIndex(dotIdx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                dotIdx === activeDotIndex
                  ? 'w-6 bg-[#6C1E26]'
                  : 'w-1.5 bg-zinc-300 hover:bg-zinc-400'
              }`}
              title={`Перейти к отзыву ${dotIdx + 1}`}
              aria-label={`Перейти к отзыву ${dotIdx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
