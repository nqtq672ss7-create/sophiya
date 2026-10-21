import React from 'react';
import { Truck, ShieldCheck, Heart, Sparkles, MapPin, Clock } from 'lucide-react';

export const FigmaSeoSection: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-12 border-t border-zinc-200/80 font-sans text-zinc-900 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Heading and Brand Narrative */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-[#6C1E26]">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <span className="text-[11px] uppercase tracking-[0.25em] font-semibold">
              Флористика и сервис • Нижнекамск
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl text-zinc-900 font-normal leading-tight">
            Доставка цветов в Нижнекамске от салона «София»
          </h2>

          <p className="text-xs sm:text-sm text-zinc-600 font-light leading-relaxed">
            Салон цветов «София» на проспекте Шинников, 13В — это пространство эстетики, где каждый букет собирается вручную опытными флористами из свежайших поставок голландских и эквадорских цветов.
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs text-zinc-500 font-light">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#6C1E26]" />
              <span>Шинников, 13В</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#6C1E26]" />
              <span>08:00 — 21:00 ежедневно</span>
            </div>
          </div>
        </div>

        {/* Right Column: 4 SEO Feature Highlights */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#6C1E26] text-white border border-[#8C1B2F]/60 shadow-md space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="font-sans text-base text-white font-bold">
              Доставка от 30 минут
            </h3>
            <p className="text-xs text-white/85 font-normal leading-relaxed">
              Быстрая бережная доставка по всем районам Нижнекамска в аквабоксах с водой. Цветы приезжают свежими в любую погоду.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#6C1E26] text-white border border-[#8C1B2F]/60 shadow-md space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-sans text-base text-white font-bold">
              Фото в WhatsApp перед выездом
            </h3>
            <p className="text-xs text-white/85 font-normal leading-relaxed">
              Вы всегда точно знаете, как выглядит букет. Флорист присылает детальные фотографии готовой композиции перед отправкой.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#6C1E26] text-white border border-[#8C1B2F]/60 shadow-md space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <h3 className="font-sans text-base text-white font-bold">
              Открытка и подкормка в подарок
            </h3>
            <p className="text-xs text-white/85 font-normal leading-relaxed">
              К каждому букету бесплатно прилагается авторская карточка для ваших теплых слов и фирменное средство стойкости Chrysal.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#6C1E26] text-white border border-[#8C1B2F]/60 shadow-md space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-sans text-base text-white font-bold">
              Стойкость от 10 до 14 дней при правильном уходе
            </h3>
            <p className="text-xs text-white/85 font-normal leading-relaxed">
              Прямые поставки французских роз, пионов и гортензий. Только отборная срезка первой категории свежести.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
