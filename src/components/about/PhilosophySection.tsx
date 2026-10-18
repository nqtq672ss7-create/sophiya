import React from 'react';
import { Mountain, Clock, Award, Shield, Flower2 } from 'lucide-react';

export const PhilosophySection: React.FC = () => {
  return (
    <section id="philosophy" className="relative py-28 bg-atelier-950 overflow-hidden">
      {/* Background Subtle Floral Motif */}
      <div className="absolute top-1/2 -right-48 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Manifesto (7 cols) */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs tracking-[0.25em] uppercase mb-6">
              <Flower2 className="w-3.5 h-3.5" />
              <span>Философия высокой флористики</span>
            </div>

            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white font-normal leading-tight tracking-wide">
              Мы создаем не просто букеты.{' '}
              <span className="italic font-serif gold-gradient-text">
                Мы проектируем эмоцию и пространство.
              </span>
            </h2>

            <p className="mt-6 text-zinc-300 font-sans text-sm md:text-base leading-relaxed max-w-2xl font-light">
              В мире SOPHIYA каждый стебель подчинен законам скульптурной композиции и оптического баланса. Мы отказались от массовых сортов в пользу редких высокогорных экземпляров, которые доставляются приватным авиасообщением прямо из закрытых селекционных оранжерей Эквадора, Японии и Франции.
            </p>

            {/* Haute Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 border-t border-gold/15 pt-8">
              <div>
                <span className="font-display text-3xl md:text-4xl gold-gradient-text block font-normal">
                  2,800м
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 mt-1 block">
                  Высота плантаций в Андах
                </span>
              </div>
              <div>
                <span className="font-display text-3xl md:text-4xl gold-gradient-text block font-normal">
                  48 часов
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 mt-1 block">
                  От срезки до вашего вазона
                </span>
              </div>
              <div>
                <span className="font-display text-3xl md:text-4xl gold-gradient-text block font-normal">
                  14+ дней
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 mt-1 block">
                  Безупречная стойкость
                </span>
              </div>
              <div>
                <span className="font-display text-3xl md:text-4xl gold-gradient-text block font-normal">
                  100%
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 mt-1 block">
                  Авторский кутюр
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Atelier Standards Cards (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-6 rounded-2xl glass-card border border-gold/20 flex gap-4 items-start">
              <div className="p-3 rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
                <Mountain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-white font-medium">
                  Горный климат & Плотность бутона
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Из-за разреженного воздуха и ультрафиолета на высоте 2800м лепестки обретают бархатистую толщину и способность сохранять первозданный тургор более двух недель.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-gold/20 flex gap-4 items-start">
              <div className="p-3 rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-white font-medium">
                  Холодовая цепь +14°C
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Цветы путешествуют в климатических капсулах со стабильной влажностью и непрерывным телеметрическим контролем температуры.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-gold/20 flex gap-4 items-start">
              <div className="p-3 rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-white font-medium">
                  Каллиграфия & Сургучная печать
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Каждый букет сопровождается письмом на итальянской хлопковой бумаге Amalfi, запечатанным вручную золотым или бордовым сургучом.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
