import React from 'react';
import { Star, CheckCircle, MessageSquare, Heart } from 'lucide-react';
import { useReviews } from '../../context/ReviewsContext';

export const FigmaReviewsSection: React.FC = () => {
  const { publishedReviews } = useReviews();

  if (publishedReviews.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 select-none font-sans">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <span className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#6C1E26] font-medium block mb-2">
            Отзывы клиентов • Салон «София»
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-zinc-900 font-normal tracking-tight">
            Истории заботы и моменты радости
          </h2>
        </div>

        {/* Rating summary & WhatsApp review CTA */}
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <span className="font-serif text-lg font-bold text-zinc-900">4.9</span>
            <span className="text-xs text-zinc-400 font-light">/ 5.0</span>
          </div>

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

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
        {publishedReviews.map((rev) => (
          <div
            key={rev.id}
            className="p-5 sm:p-6 bg-white rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="space-y-3">
              {/* Stars & Verified Badge */}
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>

                {rev.isVerified && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3 h-3" />
                    <span>Проверенный заказ</span>
                  </span>
                )}
              </div>

              {/* Bouquet Reference */}
              {rev.bouquetTitle && (
                <span className="text-[11px] text-[#6C1E26] font-medium block">
                  {rev.bouquetTitle}
                </span>
              )}

              {/* Comment */}
              <p className="text-xs sm:text-sm text-zinc-600 font-light leading-relaxed">
                «{rev.comment}»
              </p>
            </div>

            {/* Author & Date */}
            <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="font-serif text-base text-zinc-900 font-medium">
                {rev.author}
              </span>
              <span className="text-zinc-400 text-[11px] font-light">
                {rev.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
