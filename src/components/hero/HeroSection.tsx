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
    // Ensure video plays smoothly
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Fallback handled by browser policy
      });
    }
  }, []);

  return (
    <section className="relative w-full min-h-[92vh] flex flex-col justify-between overflow-hidden bg-sofiya-black-purple pt-32 pb-12">
      {/* Cinematic Looping Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-75 transform scale-105 filter saturate-110"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Atmospheric Soft Vignette and Vignette Layers for perfect text contrast */}
      <div className="absolute inset-0 z-1 pointer-events-none bg-gradient-to-t from-sofiya-black-purple via-sofiya-black-purple/35 to-sofiya-black-purple/65" />
      <div className="absolute inset-0 z-1 pointer-events-none bg-radial from-transparent via-sofiya-black-purple/30 to-sofiya-black-purple/80" />

      {/* Center Main Stage Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center my-auto flex flex-col items-center">
        {/* Large Prominent Official Logo with Butterfly */}
        <div className="mb-4">
          <img
            src="/logo-light.png"
            alt="Салон цветов София"
            className="h-24 sm:h-32 md:h-36 w-auto object-contain mx-auto filter drop-shadow-[0_8px_32px_rgba(241,225,233,0.35)]"
          />
        </div>

        {/* Clear Brand Monogram / Descriptor */}
        <span className="text-xs sm:text-sm font-sans tracking-[0.3em] uppercase text-sofiya-viola font-medium block mb-3">
          Салон цветов в Нижнекамске • пр. Шинников, 13В
        </span>

        {/* Big, Clear, Unmistakable Headline */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl text-white font-normal tracking-tight leading-[1.08] drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]">
          Доставка цветов{' '}
          <span className="font-serif italic font-normal text-sofiya-petal block mt-1 sm:mt-2 text-glow">
            в Нижнекамске от 30 минут
          </span>
        </h1>

        {/* Clear, direct, no-fluff explanation */}
        <p className="mt-6 text-zinc-200 font-sans text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
          Свежие авторские композиции и розы из салона на <strong className="text-white font-medium">пр. Шинников, 13В</strong>. Фотографируем букет перед выездом курьера и отправляем вам в WhatsApp.
        </p>

        {/* Two Clear, Powerful Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-9 w-full sm:w-auto">
          {/* Primary Action: Go to catalog */}
          <button
            onClick={onExploreCatalog}
            className="w-full sm:w-auto px-9 py-4 rounded-full bg-sofiya-red-berry hover:bg-sofiya-red-berry/90 text-white font-medium text-xs sm:text-sm tracking-[0.15em] uppercase shadow-[0_0_35px_rgba(108,30,38,0.7)] hover:shadow-[0_0_50px_rgba(108,30,38,0.9)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Выбрать букет в каталоге</span>
          </button>

          {/* Secondary Action: Direct WhatsApp */}
          <a
            href="https://wa.me/79870000000?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%A5%D0%BE%D1%87%D1%83%20%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D0%B0%D1%82%D1%8C%20%D1%86%D0%B2%D0%B5%D1%82%D1%8B%20%D0%B2%20%D1%81%D0%B0%D0%BB%D0%BE%D0%BD%D0%B5%20%D0%A1%D0%BE%D1%84%D0%B8%D1%8F%20(%D0%A8%D0%B8%D0%BD%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2%2013%D0%92)"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-sofiya-black-purple/80 hover:bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 backdrop-blur-md shadow-lg"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Заказ в WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Bottom Minimalist Reassurance Line */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 w-full mt-8">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-zinc-300 font-light border-t border-white/10 pt-6">
          <span className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>Доставка от 30 минут по Нижнекамску</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>Фото букета в WhatsApp перед вручением</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-sofiya-viola font-bold">📍</span>
            <span>Самовывоз: пр. Шинников, 13В</span>
          </span>
        </div>

        {/* Subdued Scroll Hint */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onExploreCatalog}
            className="text-zinc-400 hover:text-white transition-colors p-2"
            title="Перейти к каталогу"
          >
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
};
