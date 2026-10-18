import React, { useState } from 'react';
import { CATALOG_ITEMS } from '../../utils/constants';
import { CatalogItem, FlowerVariety, PetalColorId } from '../../types';
import { Compass, Sparkles, ShoppingBag, Eye, Wind } from 'lucide-react';
import { audioEngine } from '../../utils/audio';

interface FloralCatalogProps {
  onSelectForStudio: (flower: FlowerVariety, color: PetalColorId) => void;
  onQuickOrder: (item: CatalogItem) => void;
}

export const FloralCatalog: React.FC<FloralCatalogProps> = ({
  onSelectForStudio,
  onQuickOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'haute' | 'nocturne' | 'architectural' | 'solarium'>('all');

  const filteredItems = activeTab === 'all'
    ? CATALOG_ITEMS
    : CATALOG_ITEMS.filter((item) => item.collection === activeTab);

  const tabs: { id: 'all' | 'haute' | 'nocturne' | 'architectural' | 'solarium'; label: string }[] = [
    { id: 'all', label: 'Все коллекции' },
    { id: 'haute', label: 'Haute Couture' },
    { id: 'nocturne', label: 'Ноктюрн' },
    { id: 'architectural', label: 'Архитектура' },
    { id: 'solarium', label: 'Соляриум' },
  ];

  return (
    <section id="catalog" className="relative py-28 bg-atelier-900 border-t border-b border-gold/15">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs tracking-[0.25em] uppercase mb-4">
              <span>Сезонное собрание</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white font-normal tracking-wide">
              Кураторская <span className="gold-gradient-text italic font-serif">Коллекция</span>
            </h2>
            <p className="mt-3 text-zinc-400 font-sans text-sm md:text-base max-w-xl leading-relaxed">
              Редкие высокогорные сорта, архитектурная выправка каждого стебля и продуманная парфюмерная драматургия композиций.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-atelier-950/80 p-1.5 rounded-2xl border border-gold/15">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  audioEngine.playTap();
                }}
                className={`px-4 py-2 rounded-xl text-xs tracking-wider uppercase transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gold text-atelier-950 font-semibold shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl glass-card overflow-hidden border border-gold/15 glass-card-hover flex flex-col"
            >
              {/* Card Header & Visual Badge */}
              <div className="relative p-7 pb-4 flex items-start justify-between">
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-gold font-sans font-medium">
                    {item.collection.toUpperCase()} • {item.stems} СТЕБЛЕЙ
                  </span>
                  <h3 className="font-display text-2xl text-white font-normal mt-1 group-hover:text-gold transition-colors duration-300">
                    {item.title}
                  </h3>
                </div>
                {item.featured && (
                  <span className="px-2.5 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[10px] font-sans tracking-widest uppercase">
                    Бестселлер
                  </span>
                )}
              </div>

              {/* Description & Subtitle */}
              <div className="px-7 py-2">
                <p className="font-serif italic text-sm text-zinc-300">
                  {item.subtitle}
                </p>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Olfactory / Scent Notes Breakdown */}
              <div className="px-7 py-4 mt-2 border-t border-white/5 bg-atelier-950/40">
                <div className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-zinc-400 mb-2">
                  <Wind className="w-3 h-3 text-gold" />
                  <span>Парфюмерный шлейф:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.scentNotes.map((note, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-zinc-300 text-[11px] font-serif"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price & Actions Footer */}
              <div className="p-7 pt-5 mt-auto border-t border-white/5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] tracking-wider uppercase text-zinc-400 block">
                    Стоимость
                  </span>
                  <span className="text-xl font-serif text-white font-semibold">
                    {item.price.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectForStudio(item.flowerType, item.defaultColor);
                      audioEngine.playChime(523.25, 0.1);
                      const studioEl = document.getElementById('studio');
                      studioEl?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    title="Исследовать в 3D студии"
                    className="p-2.5 rounded-xl border border-gold/30 hover:border-gold text-gold hover:bg-gold/10 transition-all duration-300"
                  >
                    <Compass className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      onQuickOrder(item);
                      audioEngine.playTap();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold text-atelier-950 font-medium text-xs tracking-wider uppercase hover:bg-gold-light transition-all duration-300 shadow-md"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Заказать</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
