import React, { useState, useRef, lazy, Suspense } from 'react';
import {
  Star,
  MessageSquare,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useReviews } from '../../context/ReviewsContext';
import { YandexIcon } from '../common/YandexIcon';

const LeaveReviewModal = lazy(() =>
  import('../reviews/LeaveReviewModal').then((m) => ({ default: m.LeaveReviewModal }))
);

export const FigmaReviewsSection: React.FC = () => {
  const { publishedReviews } = useReviews();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'prev'|'next') => {
    const el = carouselRef.current;
    if (!el) return;
    const step = Math.min(340, el.clientWidth * 0.85);
    el.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    });
  };

  const ratingBars = [
    { stars: 5, percent: 96 },
    { stars: 4, percent: 4 },
    { stars: 3, percent: 0 },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 mt-14 sm:mt-20 select-none font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E5DDD9]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-[#E5DDD9] mb-2.5 shadow-sm">
            <YandexIcon className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-semibold text-[#1C1215]">5.0</span>
            <div className="flex items-center text-amber-400">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[11px] text-[#7C636B]">· 101 оценка на Яндекс Картах</span>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold tracking-tight">
            Отзывы наших покупателей
          </h2>
          <p className="text-xs sm:text-sm text-[#5C454C] font-normal mt-1 max-w-2xl">
            Реальные впечатления клиентов салона цветов «София» на пр. Шинников, 13В.
          </p>
        </div>

        {/* Carousel Arrows */}
        {publishedReviews.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-end">
            <button
              type="button"
              onClick={() => handleScroll('prev')}
              className="w-9 h-9 rounded-xl bg-white border border-[#E5DDD9] hover:border-[#922E3D] text-[#1C1215] hover:text-[#922E3D] flex items-center justify-center transition-colors shadow-sm cursor-pointer active:scale-95"
              aria-label="Предыдущие отзывы"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('next')}
              className="w-9 h-9 rounded-xl bg-white border border-[#E5DDD9] hover:border-[#922E3D] text-[#1C1215] hover:text-[#922E3D] flex items-center justify-center transition-colors shadow-sm cursor-pointer active:scale-95"
              aria-label="Следующие отзывы"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Hybrid Layout: Left Trust Panel (V5) + Right Single-Row Carousel (V3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6 items-stretch">
        {/* Left: Yandex Rating Breakdown Card */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-white rounded-xl border border-[#E5DDD9] p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <YandexIcon className="w-5 h-5 shrink-0" />
              <span className="text-xs font-semibold text-[#1C1215]">Яндекс Карты</span>
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl sm:text-5xl font-bold text-[#1C1215] tracking-tight leading-none">
                5.0
              </span>
              <div>
                <div className="flex items-center text-amber-400">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] text-[#7C636B] block mt-0.5">
                  На основе 101 оценки
                </span>
              </div>
            </div>

            {/* Rating Distribution Bars */}
            <div className="space-y-2">
              {ratingBars.map((bar) => (
                <div key={bar.stars} className="flex items-center gap-2.5 text-[11px] text-[#5C454C]">
                  <span className="w-7 shrink-0 font-medium inline-flex items-center gap-0.5">
                    <span>{bar.stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-1.5 rounded-sm bg-[#F1EAE6] overflow-hidden">
                    <div
                      className="h-full bg-[#922E3D] rounded-sm"
                      style={{ width: `${bar.percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[#7C636B] tabular-nums">{bar.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-3 border-t border-[#F1EAE6]">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#922E3D] hover:bg-[#611720] text-white text-xs font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Написать отзыв</span>
            </button>

            <a
              href="https://yandex.ru/maps/org/sofiya/105599949171/reviews/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-[#FAF7F5] hover:bg-white border border-[#E5DDD9] hover:border-[#922E3D] text-[#5C454C] hover:text-[#922E3D] text-xs font-medium transition-colors flex items-center justify-center gap-2"
              title="Открыть все отзывы на Яндекс Картах"
            >
              <span>Все 80 отзывов на Яндекс</span>
              <ExternalLink className="w-3 h-3 text-[#7C636B]" />
            </a>
          </div>
        </aside>

        {/* Right: Smooth Horizontal Carousel Track */}
        <div className="lg:col-span-8 xl:col-span-9 min-w-0 flex">
          {publishedReviews.length > 0 && (
            <div
              ref={carouselRef}
              className="flex gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth w-full pb-1"
            >
              {publishedReviews.map((rev) => (
                <article
                  key={rev.id}
                  className="snap-start shrink-0 w-[82%] sm:w-[300px] lg:w-[310px] p-5 bg-white text-[#1C1215] rounded-xl border border-[#E5DDD9] shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] text-[#7C636B] font-medium shrink-0">
                        {rev.date}
                      </span>
                    </div>

                    {rev.bouquetTitle && (
                      <span className="text-xs text-[#922E3D] font-semibold block truncate">
                        {rev.bouquetTitle}
                      </span>
                    )}

                    <p className="text-xs sm:text-[13px] text-[#5C454C] font-normal leading-relaxed line-clamp-5">
                      «{rev.comment}»
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F1EAE6] flex items-center justify-between gap-2 text-xs">
                    <span className="font-sans text-xs text-[#1C1215] font-semibold block truncate min-w-0">
                      {rev.author}
                    </span>
                    <YandexIcon className="w-4 h-4 shrink-0" />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Direct Review Modal */}
      {isReviewModalOpen && (
        <Suspense fallback={null}>
          <LeaveReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
          />
        </Suspense>
      )}
    </section>
  );
};
