import React from 'react';
import { Compass, Sparkles, MapPin, Phone, Mail, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="concierge" className="bg-atelier-950 border-t border-gold/20 pt-20 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/5">
          {/* Col 1: Brand & Manifesto (5 cols) */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl tracking-[0.25em] gold-gradient-text font-normal">
                SOPHIYA
              </span>
              <span className="text-gold text-sm">⚜</span>
            </div>
            <span className="text-[10px] tracking-[0.35em] text-zinc-400 font-sans uppercase block mt-1">
              Haute Floristry & Botanical 3D Atelier
            </span>
            <p className="mt-5 text-zinc-400 text-xs md:text-sm font-light leading-relaxed max-w-sm">
              Синтез редкой живой флоры, передовых 3D-технологий визуализации и парижских традиций высокой аранжировки. Доставка в климатических капсулах высшего класса.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <span className="text-xs text-gold font-serif italic">Приватный консьерж:</span>
              <a
                href="tel:+74950008888"
                className="text-xs text-white hover:text-gold transition-colors font-mono tracking-wider"
              >
                +7 (495) 000-88-88
              </a>
            </div>
          </div>

          {/* Col 2: Atelier Locations (4 cols) */}
          <div className="lg:col-span-4">
            <h4 className="font-display text-lg text-white font-normal tracking-wider mb-5">
              Ателье & Бутики
            </h4>
            <ul className="space-y-4 text-xs text-zinc-400 font-light">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="text-white block font-medium">Москва, Романов пер. 4</span>
                  <span className="text-[11px] text-zinc-400">Закрытое ателье и зимний сад</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="text-white block font-medium">Париж, 18 Place Vendôme</span>
                  <span className="text-[11px] text-zinc-400">Boutique Haute Horlogerie & Floristry</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="text-white block font-medium">Дубай, DIFC Gate Village 03</span>
                  <span className="text-[11px] text-zinc-400">VIP Salon & Botanical Studio</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 3: Hours & Private Salon (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="font-display text-lg text-white font-normal tracking-wider mb-5">
              Часы Работы
            </h4>
            <div className="space-y-3 text-xs text-zinc-400 font-light">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="text-white block font-medium">Прием заказов 24/7</span>
                  <span className="text-[11px] text-zinc-400">Круглосуточный ночной консьерж</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="text-white block font-medium">Визиты в ателье</span>
                  <span className="text-[11px] text-zinc-400">По предварительной записи 10:00 - 22:00</span>
                </div>
              </div>
            </div>

            {/* Newsletter input */}
            <div className="mt-6">
              <span className="text-[10px] tracking-wider uppercase text-zinc-400 block mb-2">
                Закрытый клуб коллекционеров
              </span>
              <div className="flex items-center rounded-xl bg-atelier-900 border border-gold/20 overflow-hidden p-1">
                <input
                  type="email"
                  placeholder="Ваш e-mail..."
                  className="w-full text-xs px-3 py-1.5 bg-transparent text-white focus:outline-none placeholder-zinc-500"
                />
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-gold text-atelier-950 font-semibold text-xs hover:bg-gold-light transition-all"
                >
                  ⚜
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-4">
          <span>© {new Date().getFullYear()} SOPHIYA Atelier Floral. Все права защищены.</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gold transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-gold transition-colors">Условия VIP-обслуживания</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
