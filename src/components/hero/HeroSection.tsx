import React, { useRef, useEffect } from 'react';
import { ShoppingBag, MessageCircle, ArrowDown } from 'lucide-react';

interface HeroSectionProps {
  onExploreCatalog: () => void;
  onOpenStudio?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreCatalog,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-sofiya-black-purple pt-28 pb-10">
      {/* 1. Cinematic Looping Floral Video Background (Clean & Vibrant) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-80 transform scale-100 filter saturate-110"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* 2. Pure Editorial Vignette */}
      <div className="absolute inset-0 z-1 pointer-events-none bg-sofiya-black-purple/60" />

      {/* 3. Center Luxury Presentation (Zero AI Plaques, Zero Bubbly Pills) */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center my-auto flex flex-col items-center">
        {/* Prominent High-Contrast Brand Logo */}
        <div className="mb-6">
          <img
            src="/logo-light.png"
            alt="Салон цветов София Нижнекамск"
            className="h-28 sm:h-36 md:h-44 w-auto object-contain mx-auto"
          />
        </div>

        {/* Brand Micro-Descriptor in Haute Couture Spacing */}
        <p className="text-[11px] sm:text-xs font-sans tracking-[0.35em] uppercase text-sofiya-viola font-light mb-4">
          Салон авторской флористики , Нижнекамск, пр. Шинников, 13В
        </p>

        {/* Editorial Heading: Cormorant Garamond */}
        <h1 className="font-sans text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#FAF4F6] font-light tracking-tight leading-[1.04]">
          Доставка живых цветов
          <span className="block font-sans italic text-sofiya-petal font-normal mt-2 sm:mt-3 text-3xl sm:text-5xl md:text-6xl">
            в Нижнекамске от 30 минут
          </span>
        </h1>

        {/* Pure Typography Description (No cards, no glass blobs) */}
        <p className="mt-6 text-sofiya-petal/80 font-sans text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed">
          Свежие поставки редких сортов роз, пионов и гортензий. Собираем авторские букеты и отправляем детальное фото композиции в MAX перед выездом курьера.
        </p>

        {/* Architectural Editorial Action Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-10 w-full sm:w-auto">
          {/* Primary CTA: Catalog */}
          <button
            onClick={onExploreCatalog}
            className="w-full sm:w-auto px-10 py-4 bg-sofiya-red-berry hover:bg-sofiya-red-berry/90 text-white font-sans text-xs uppercase tracking-[0.25em] font-medium border border-sofiya-viola/30 transition-colors duration-300 shadow-[0_4px_20px_rgba(30,7,8,0.6)] hover:border-sofiya-viola flex items-center justify-center gap-3"
          >
            <ShoppingBag className="w-4 h-4 text-sofiya-petal" />
            <span>Смотреть каталог</span>
          </button>

          {/* Secondary CTA: MAX Direct with Real Number */}
          <a
            href="https://max.ru/u/f9LHodD0cOKG3_iDtqDpdmSTjHzJbBZW3_A7Z5AqjsHJp3XnDn_JixYJu6c"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-sofiya-black-purple/60 hover:bg-sofiya-black-purple/90 text-sofiya-petal font-sans text-xs uppercase tracking-[0.2em] font-light border border-sofiya-viola/30 hover:border-sofiya-viola transition-colors duration-300 flex items-center justify-center gap-2.5"
          >
            <MessageCircle className="w-4 h-4 text-sofiya-viola" />
            <span>Заказ в MAX</span>
          </a>
        </div>
      </div>

      {/* 4. Bottom Editorial Baseline: Clean architectural coordinates (Zero Emoji, Zero Plaque Chips) */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-t border-sofiya-viola/20 text-center font-sans text-xs font-light text-sofiya-petal/75">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-viola mb-0.5">Локация</span>
            <span className="text-white">пр. Шинников, 13В</span>
          </div>

          <div className="flex flex-col items-center border-l border-sofiya-viola/15">
            <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-viola mb-0.5">Время работы</span>
            <span className="text-white">Ежедневно 10:00 — 21:00</span>
          </div>

          <div className="flex flex-col items-center border-l border-sofiya-viola/15">
            <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-viola mb-0.5">Контроль качества</span>
            <span className="text-white">Фото букета перед выездом</span>
          </div>

          <div className="flex flex-col items-center border-l border-sofiya-viola/15">
            <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-viola mb-0.5">Связь с салоном</span>
            <a href="tel:+79172563235" className="text-white hover:text-sofiya-viola transition-colors">
              +7 (917) 256-32-35
            </a>
          </div>
        </div>

        {/* Discreet Scroll Indicator */}
        <div className="flex justify-center mt-3">
          <button
            onClick={onExploreCatalog}
            className="text-sofiya-viola/60 hover:text-white transition-colors p-1"
            aria-label="Прокрутить к коллекции"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
