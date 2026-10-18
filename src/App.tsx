import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { HeroSection } from './components/hero/HeroSection';
import { MapPin, Phone, MessageCircle, Clock, Heart, ShoppingBag, Sparkles } from 'lucide-react';

export function App() {
  const [cartCount, setCartCount] = useState(0);

  const handleExploreCatalog = () => {
    const catalogEl = document.getElementById('catalog-preview');
    catalogEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenStudio = () => {
    alert('3D Конструктор букетов открывается в интерактивном режиме.');
  };

  return (
    <div className="min-h-screen bg-sofiya-black-purple text-sofiya-petal font-sans antialiased selection:bg-sofiya-red-berry/40 selection:text-white">
      {/* Luxury Fixed Navigation Header */}
      <Header
        onOpenStudio={handleOpenStudio}
        onOpenCart={() => alert('Корзина заказа')}
        cartCount={cartCount}
      />

      {/* Main Hero Screen */}
      <HeroSection
        onExploreCatalog={handleExploreCatalog}
        onOpenStudio={handleOpenStudio}
      />

      {/* Immediate Catalog Teaser (Demonstrating Palette & Card Minimalism) */}
      <section id="catalog-preview" className="py-24 max-w-7xl mx-auto px-6 border-t border-sofiya-viola/15">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-sofiya-viola font-sans block mb-2 font-medium">
              В наличии прямо сейчас • пр. Шинников, 13В
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-normal">
              Авторские композиции <span className="font-serif italic text-sofiya-viola">сезона</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Каталог: 3 000+ букетов</span>
          </div>
        </div>

        {/* 3 Editorial Sample Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              id: '1',
              title: 'Бархатный Марсала',
              variety: '25 эквадорских роз Red Berry в матовом шелке',
              price: '4 800 ₽',
              time: 'Доставка 30 мин',
              badge: 'Бестселлер',
            },
            {
              id: '2',
              title: 'Пудровая Мелодия',
              variety: 'Пионы Blanche и эустома в оттенке Viola',
              price: '5 600 ₽',
              time: 'В наличии в салоне',
              badge: 'Новинка',
            },
            {
              id: '3',
              title: 'Французский Поцелуй',
              variety: 'Пионовидные розы Red Piano с эвкалиптом',
              price: '6 200 ₽',
              time: 'Доставка 40 мин',
              badge: 'Хит сезона',
            },
          ].map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl glass-card overflow-hidden border border-sofiya-viola/20 glass-card-hover flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-sofiya-red-berry/25 border border-sofiya-red-berry/40 text-sofiya-petal text-[10px] tracking-wider uppercase font-medium">
                  {item.badge}
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {item.time}
                </span>
              </div>

              <div className="w-full h-56 rounded-2xl bg-gradient-to-br from-sofiya-red-berry/20 via-sofiya-matrix/20 to-sofiya-black-purple border border-sofiya-viola/15 flex items-center justify-center p-6 mb-5 relative overflow-hidden group-hover:border-sofiya-viola/40 transition-colors">
                <div className="absolute inset-0 bg-radial from-sofiya-red-berry/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="font-display text-2xl text-sofiya-petal/80 font-normal group-hover:scale-105 transition-transform duration-500">
                  {item.title}
                </span>
              </div>

              <h3 className="font-display text-2xl text-white font-normal group-hover:text-sofiya-viola transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 font-light leading-relaxed">
                {item.variety}
              </p>

              <div className="pt-6 mt-auto flex items-center justify-between border-t border-sofiya-viola/15">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Стоимость</span>
                  <span className="font-serif text-2xl text-white font-semibold">
                    {item.price}
                  </span>
                </div>

                <button
                  onClick={() => setCartCount((prev) => prev + 1)}
                  className="px-5 py-2.5 rounded-full bg-sofiya-red-berry hover:bg-sofiya-red-berry/90 text-white font-medium text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(108,30,38,0.4)]"
                >
                  Заказать
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-sofiya-viola/20 py-12 bg-sofiya-black-purple/80">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="София" className="h-8 w-auto opacity-80" />
            <span>Салон цветов «София» • г. Нижнекамск, пр. Шинников, 13В</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/79870000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp салона</span>
            </a>
            <span className="text-zinc-600">|</span>
            <span>Ежедневно 10:00 — 21:00</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
