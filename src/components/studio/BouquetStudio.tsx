import React, { useState, useMemo } from 'react';
import { FlowerScene } from '../canvas/FlowerScene';
import { CustomBouquetConfig, FlowerVariety, LightingAtmosphere, PetalColorId } from '../../types';
import { FLOWER_VARIETIES, PETAL_COLORS, FOLIAGE_OPTIONS, WRAP_OPTIONS, RIBBON_OPTIONS } from '../../utils/constants';
import { Sparkles, Check, Info, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { audioEngine } from '../../utils/audio';

interface BouquetStudioProps {
  initialConfig?: Partial<CustomBouquetConfig>;
  onOrderCustomBouquet: (config: CustomBouquetConfig, totalCost: number) => void;
}

export const BouquetStudio: React.FC<BouquetStudioProps> = ({
  initialConfig,
  onOrderCustomBouquet,
}) => {
  const [variety, setVariety] = useState<FlowerVariety>(initialConfig?.flower || 'rose');
  const [colorId, setColorId] = useState<PetalColorId>(initialConfig?.color || 'baccara');
  const [stemCount, setStemCount] = useState<number>(initialConfig?.stemCount || 25);
  const [bloomStage, setBloomStage] = useState<number>(initialConfig?.bloomStage ?? 0.85);
  const [isExploded, setIsExploded] = useState<boolean>(initialConfig?.isExploded ?? false);
  const [atmosphere, setAtmosphere] = useState<LightingAtmosphere>(initialConfig?.atmosphere || 'midnight');
  const [selectedFoliage, setSelectedFoliage] = useState<string[]>(initialConfig?.foliage || ['eucalyptus']);
  const [selectedWrap, setSelectedWrap] = useState<string>(initialConfig?.wrap || 'silk');
  const [selectedRibbon, setSelectedRibbon] = useState<string>(initialConfig?.ribbon || 'gold_metallic');
  const [monogram, setMonogram] = useState<string>(initialConfig?.monogram || 'S');

  // Active variety details
  const activeVarietyInfo = useMemo(() => {
    return FLOWER_VARIETIES.find((v) => v.id === variety) || FLOWER_VARIETIES[0];
  }, [variety]);

  // Price Calculation
  const totalPrice = useMemo(() => {
    // Base cost per stem
    const stemPrice = Math.round(activeVarietyInfo.basePrice / 15);
    const flowersCost = stemPrice * stemCount;

    // Foliage cost
    const foliageCost = selectedFoliage.reduce((acc, fId) => {
      const fol = FOLIAGE_OPTIONS.find((f) => f.id === fId);
      return acc + (fol ? fol.price : 0);
    }, 0);

    // Wrap cost
    const wrapObj = WRAP_OPTIONS.find((w) => w.id === selectedWrap);
    const wrapCost = wrapObj ? wrapObj.price : 0;

    return flowersCost + foliageCost + wrapCost;
  }, [activeVarietyInfo, stemCount, selectedFoliage, selectedWrap]);

  const toggleFoliage = (id: string) => {
    audioEngine.playTap();
    setSelectedFoliage((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOrderClick = () => {
    audioEngine.playChime(587.33, 0.15); // D5
    const config: CustomBouquetConfig = {
      flower: variety,
      color: colorId,
      stemCount,
      bloomStage,
      isExploded,
      foliage: selectedFoliage,
      wrap: selectedWrap,
      ribbon: selectedRibbon,
      monogram,
      atmosphere,
    };
    onOrderCustomBouquet(config, totalPrice);
  };

  return (
    <section id="studio" className="relative w-full py-24 bg-atelier-950 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gold/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-petal-velvet/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs tracking-[0.25em] uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Интерактивная 3D Лаборатория</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white font-normal tracking-wide">
            Архитектура <span className="gold-gradient-text italic font-serif">Вашего Букета</span>
          </h2>
          <p className="mt-4 text-zinc-400 font-sans text-sm md:text-base leading-relaxed">
            Исследуйте ботаническую геометрию каждого цветка в 360°, управляйте степенью раскрытия бутона и создавайте персональное флористическое произведение искусства в реальном времени.
          </p>
        </div>

        {/* Studio Grid: Left 3D Viewport, Right Haute Atelier Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 3D Scene Viewport (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative w-full h-[520px] lg:h-[680px] rounded-3xl overflow-hidden glass-card shadow-2xl border border-gold/20 flex-1">
              <FlowerScene
                variety={variety}
                colorId={colorId}
                bloomStage={bloomStage}
                isExploded={isExploded}
                atmosphere={atmosphere}
                onVarietyChange={setVariety}
                onColorChange={setColorId}
                onBloomChange={setBloomStage}
                onExplodedChange={setIsExploded}
                onAtmosphereChange={setAtmosphere}
                enableInteractiveOverlay={true}
              />
            </div>

            {/* Variety Sensory Profile Card */}
            <div className="mt-4 p-5 rounded-2xl glass-panel border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-gold font-sans block mb-1">
                  Ботанический сорт
                </span>
                <h4 className="font-serif text-lg text-white font-medium">
                  {activeVarietyInfo.nameRu}{' '}
                  <span className="italic text-zinc-400 font-normal text-sm">
                    ({activeVarietyInfo.botanicalName})
                  </span>
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
                  {activeVarietyInfo.description}
                </p>
              </div>

              <div className="flex flex-col text-right shrink-0">
                <span className="text-[10px] tracking-wider uppercase text-zinc-400">Стойкость в срезе</span>
                <span className="text-sm font-medium text-emerald-400 mt-0.5">
                  {activeVarietyInfo.vaseLife}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Atelier Customization Controls (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 p-6 md:p-8 rounded-3xl glass-card border border-gold/20 shadow-2xl">
            {/* Step 1: Stem Count & Geometry */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs tracking-[0.2em] uppercase text-zinc-300 font-medium">
                  1. Количество цветов: <span className="text-gold font-serif text-base">{stemCount} шт.</span>
                </label>
                <span className="text-[11px] text-zinc-400">
                  {stemCount <= 15 ? 'Камерный этюд' : stemCount <= 35 ? 'Классический объем' : 'Гранд-композиция'}
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="9"
                max="101"
                step="2"
                value={stemCount}
                onChange={(e) => {
                  setStemCount(parseInt(e.target.value));
                  audioEngine.playTap();
                }}
                className="w-full accent-gold h-1.5 bg-atelier-800 rounded-lg cursor-pointer"
              />

              {/* Quick Presets */}
              <div className="flex items-center justify-between gap-2 mt-3">
                {[9, 15, 25, 51, 101].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setStemCount(count);
                      audioEngine.playTap();
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-serif transition-all ${
                      stemCount === count
                        ? 'bg-gold/20 border border-gold text-gold font-semibold'
                        : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Foliage & Botanical Accents */}
            <div className="border-t border-white/5 pt-5">
              <label className="text-xs tracking-[0.2em] uppercase text-zinc-300 font-medium block mb-3">
                2. Ботанические акценты & Зелень
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {FOLIAGE_OPTIONS.map((fol) => {
                  const isSelected = selectedFoliage.includes(fol.id);
                  return (
                    <button
                      key={fol.id}
                      onClick={() => toggleFoliage(fol.id)}
                      className={`p-3 rounded-xl border text-left transition-all duration-300 relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-gold bg-gold/10 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                          : 'border-white/5 bg-atelier-900/60 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-zinc-200 font-medium leading-snug">
                          {fol.nameRu.split(' ')[0]} {fol.nameRu.split(' ')[1] || ''}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />}
                      </div>
                      <span className="text-[10px] text-gold/80 mt-2 font-serif">
                        +{fol.price.toLocaleString('ru-RU')} ₽
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Luxury Presentation & Packaging */}
            <div className="border-t border-white/5 pt-5">
              <label className="text-xs tracking-[0.2em] uppercase text-zinc-300 font-medium block mb-3">
                3. Авторское оформление
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {WRAP_OPTIONS.map((wrap) => {
                  const isSelected = selectedWrap === wrap.id;
                  return (
                    <button
                      key={wrap.id}
                      onClick={() => {
                        setSelectedWrap(wrap.id);
                        audioEngine.playTap();
                      }}
                      className={`p-3 rounded-xl border text-left transition-all duration-300 ${
                        isSelected
                          ? 'border-gold bg-gold/10 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                          : 'border-white/5 bg-atelier-900/60 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-200 font-medium leading-snug">
                          {wrap.nameRu.split(' ')[0]} {wrap.nameRu.split(' ')[1] || ''}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-gold shrink-0" />}
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-1 block truncate">
                        {wrap.material}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Ribbon & Monogram */}
            <div className="border-t border-white/5 pt-5 flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-[11px] tracking-wider uppercase text-zinc-400 block mb-2">
                  Шелковая лента
                </label>
                <div className="flex items-center gap-2">
                  {RIBBON_OPTIONS.map((rib) => (
                    <button
                      key={rib.id}
                      onClick={() => {
                        setSelectedRibbon(rib.id);
                        audioEngine.playTap();
                      }}
                      title={rib.nameRu}
                      className={`w-7 h-7 rounded-full border transition-all ${
                        selectedRibbon === rib.id
                          ? 'scale-110 border-gold ring-2 ring-gold/40'
                          : 'border-white/20 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: rib.colorHex }}
                    />
                  ))}
                </div>
              </div>

              <div className="w-24">
                <label className="text-[11px] tracking-wider uppercase text-zinc-400 block mb-2">
                  Инициалы
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={monogram}
                  onChange={(e) => setMonogram(e.target.value.toUpperCase())}
                  placeholder="S.O."
                  className="w-full text-center py-1 px-2 rounded-lg bg-atelier-900 border border-gold/30 text-gold font-serif text-sm uppercase focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Total Price & Direct Order CTA */}
            <div className="border-t border-gold/20 pt-6 mt-auto">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 block">
                    Стоимость композиции
                  </span>
                  <div className="text-2xl md:text-3xl font-serif text-white font-semibold">
                    {totalPrice.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <div className="text-right text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Премиальная доставка</span>
                </div>
              </div>

              <button
                onClick={handleOrderClick}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold via-gold-metallic to-gold-dim text-atelier-950 font-semibold text-sm tracking-[0.15em] uppercase shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
              >
                <span>Оформить заказ букета</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
