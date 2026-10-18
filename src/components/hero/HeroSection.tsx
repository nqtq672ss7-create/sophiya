import React, { useState } from 'react';
import { Hero3DCanvas } from '../canvas/Hero3DCanvas';
import { ArrowDown, MessageCircle, Compass, ShoppingBag, ShieldCheck, Clock, Award, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface HeroSectionProps {
  onExploreCatalog: () => void;
  onOpenStudio: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreCatalog,
  onOpenStudio,
}) => {
  const [bloom, setBloom] = useState(0.88);
  const [isMuted, setIsMuted] = useState(true);

  // Subtle web audio chime for interaction
  const playChime = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio fallback
    }
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-sofiya-black-purple pt-28 pb-10">
      {/* 3D WebGL Background Botanical Canvas */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Hero3DCanvas bloomProgress={bloom} />
      </div>

      {/* Atmospheric Vignette & Radial Light Gradients */}
      <div className="absolute inset-0 z-1 pointer-events-none bg-gradient-to-t from-sofiya-black-purple via-sofiya-black-purple/35 to-sofiya-black-purple/70" />
      <div className="absolute inset-0 z-1 pointer-events-none bg-radial from-transparent via-sofiya-black-purple/20 to-sofiya-black-purple/85" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-sofiya-red-berry/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Top 3D Interactive Floating Hint & Audio Toggle */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-sofiya-viola/20 text-[11px] text-zinc-300 pointer-events-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-sofiya-viola animate-ping" />
          <span className="font-serif italic tracking-wide">
            Интерактивная 3D-модель • Вращайте бутон курсором
          </span>
        </div>

        <button
          onClick={() => {
            setIsMuted(!isMuted);
            if (isMuted) playChime();
          }}
          title={isMuted ? 'Включить звук лепестков' : 'Выключить звук'}
          className="p-2.5 rounded-full glass-panel hover:bg-sofiya-red-berry/20 text-sofiya-petal border border-sofiya-viola/25 transition-all pointer-events-auto"
        >
          {isMuted ? <VolumeX className="w-4 h-4 opacity-70" /> : <Volume2 className="w-4 h-4 text-sofiya-viola animate-pulse" />}
        </button>
      </div>

      {/* Central Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center my-auto flex flex-col items-center">
        {/* Subtitle Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass-panel border border-sofiya-viola/30 mb-6 shadow-[0_0_20px_rgba(108,30,38,0.2)]">
          <span className="text-[10px] sm:text-xs font-sans tracking-[0.3em] uppercase text-sofiya-petal/90 font-medium">
            Салон авторской флористики • Нижнекамск
          </span>
        </div>

        {/* Main Minimalist Headline */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-normal tracking-wide leading-[1.05]">
          Искусство живой формы{' '}
          <span className="font-serif italic font-normal text-sofiya-viola block mt-1 sm:mt-2 text-glow">
            и трепетных чувств
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="mt-6 text-zinc-300 font-sans text-xs sm:text-sm md:text-base max-w-2xl font-light leading-relaxed">
          Авторские букеты и редкие плантационные сорта с доставкой от 30 минут из салона на{' '}
          <span className="text-white font-medium border-b border-sofiya-viola/40">пр. Шинников, 13В</span>. Фото готового букета в WhatsApp перед вручением.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto">
          {/* Primary Catalog CTA */}
          <button
            onClick={() => {
              playChime();
              onExploreCatalog();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-sofiya-red-berry text-white font-medium text-xs tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(108,30,38,0.5)] hover:shadow-[0_0_45px_rgba(108,30,38,0.75)] hover:bg-sofiya-red-berry/90 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 group"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Выбрать букет из наличия</span>
          </button>

          {/* 3D Atelier CTA */}
          <button
            onClick={() => {
              playChime();
              onOpenStudio();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-full glass-panel hover:bg-sofiya-viola/15 border border-sofiya-viola/40 text-sofiya-petal font-medium text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2.5 group"
          >
            <Compass className="w-4 h-4 text-sofiya-viola group-hover:rotate-45 transition-transform duration-500" />
            <span>Собрать в 3D</span>
          </button>

          {/* WhatsApp Direct */}
          <a
            href="https://wa.me/79870000000?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%A5%D0%BE%D1%87%D1%83%20%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D0%B0%D1%82%D1%8C%20%D1%86%D0%B2%D0%B5%D1%82%D1%8B%20%D0%B2%20%D1%81%D0%B0%D0%BB%D0%BE%D0%BD%D0%B5%20%D0%BD%D0%B0%20%D0%A8%D0%B8%D0%BD%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2%2013%D0%92"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-4 rounded-full glass-panel hover:bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp заказ</span>
          </a>
        </div>
      </div>

      {/* Bottom Minimalist Metrics & Service Proof */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-sofiya-viola/15 glass-panel rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-sofiya-viola shrink-0" />
            <div>
              <span className="text-white font-medium text-xs sm:text-sm block">30–45 минут</span>
              <span className="text-[11px] text-zinc-400 block font-light">Доставка по Нижнекамску</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-white font-medium text-xs sm:text-sm block">100% фотоконтроль</span>
              <span className="text-[11px] text-zinc-400 block font-light">Фото букета в WhatsApp</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-sofiya-viola shrink-0" />
            <div>
              <span className="text-white font-medium text-xs sm:text-sm block">14+ дней</span>
              <span className="text-[11px] text-zinc-400 block font-light">Стойкость высокогорных роз</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-sofiya-viola shrink-0" />
            <div>
              <span className="text-white font-medium text-xs sm:text-sm block">Шинников, 13В</span>
              <span className="text-[11px] text-zinc-400 block font-light">Самовывоз за 15 минут</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-4">
          <button
            onClick={onExploreCatalog}
            className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-sofiya-viola transition-colors tracking-widest uppercase font-light"
          >
            <span>Вниз к каталогу</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce text-sofiya-viola" />
          </button>
        </div>
      </div>
    </section>
  );
};
