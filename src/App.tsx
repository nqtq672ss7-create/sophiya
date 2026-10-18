import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { FlowerScene } from './components/canvas/FlowerScene';
import { BouquetStudio } from './components/studio/BouquetStudio';
import { FloralCatalog } from './components/catalog/FloralCatalog';
import { PhilosophySection } from './components/about/PhilosophySection';
import { Footer } from './components/layout/Footer';
import { OrderModal } from './components/order/OrderModal';
import { CustomBouquetConfig, FlowerVariety, PetalColorId, CatalogItem } from './types';
import { Sparkles, ArrowDown, Compass, Award, ShieldCheck, Heart } from 'lucide-react';
import { audioEngine } from './utils/audio';

export function App() {
  // Modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [activeOrderTitle, setActiveOrderTitle] = useState('Авторский букет SOPHIYA');
  const [activeOrderPrice, setActiveOrderPrice] = useState(34500);
  const [activeOrderStems, setActiveOrderStems] = useState(25);
  const [activeCustomConfig, setActiveCustomConfig] = useState<CustomBouquetConfig | undefined>();

  // Studio Pre-selection
  const [studioConfig, setStudioConfig] = useState<{
    flower: FlowerVariety;
    color: PetalColorId;
  }>({
    flower: 'rose',
    color: 'baccara',
  });

  // Handle custom studio order
  const handleOrderCustomBouquet = (config: CustomBouquetConfig, cost: number) => {
    setActiveOrderTitle(`Индивидуальный букет • ${config.flower.toUpperCase()}`);
    setActiveOrderPrice(cost);
    setActiveOrderStems(config.stemCount);
    setActiveCustomConfig(config);
    setOrderModalOpen(true);
  };

  // Handle catalog quick order
  const handleQuickOrder = (item: CatalogItem) => {
    setActiveOrderTitle(item.title);
    setActiveOrderPrice(item.price);
    setActiveOrderStems(item.stems);
    setActiveCustomConfig(undefined);
    setOrderModalOpen(true);
  };

  // Handle catalog to studio selection
  const handleSelectForStudio = (flower: FlowerVariety, color: PetalColorId) => {
    setStudioConfig({ flower, color });
  };

  return (
    <div className="min-h-screen bg-atelier-950 text-petal-cream font-sans selection:bg-gold/30 selection:text-gold-light relative">
      {/* Fixed Luxury Navigation */}
      <Navbar
        onOpenStudio={() => {
          const el = document.getElementById('studio');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenOrder={() => {
          setActiveOrderTitle('Индивидуальный заказ VIP');
          setActiveOrderPrice(35000);
          setActiveOrderStems(25);
          setOrderModalOpen(true);
        }}
      />

      {/* Hero Section: Fullscreen 3D Botanical World */}
      <section className="relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Fullscreen 3D Background Flower Scene */}
        <div className="absolute inset-0 z-0">
          <FlowerScene
            variety="rose"
            colorId="baccara"
            bloomStage={0.92}
            isExploded={false}
            atmosphere="midnight"
            enableInteractiveOverlay={false}
          />
        </div>

        {/* Ambient Radial Gradient Layers */}
        <div className="absolute inset-0 z-1 pointer-events-none bg-gradient-to-t from-atelier-950 via-atelier-950/40 to-atelier-950/70" />
        <div className="absolute inset-0 z-1 pointer-events-none bg-radial from-transparent via-atelier-950/30 to-atelier-950/85" />

        {/* Hero Editorial Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-16 flex flex-col items-center">
          {/* Haute Monogram Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-panel border border-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.15)] mb-6 animate-pulse-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-[10px] md:text-xs font-sans tracking-[0.3em] uppercase text-gold font-medium">
              Haute Floristry & 3D Botanical Atelier
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white font-normal tracking-wide leading-[0.95]">
            SOPHIYA
          </h1>

          <p className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-gold-light mt-3 font-normal">
            Искусство живой формы в цифровом измерении
          </p>

          <p className="mt-6 text-zinc-300 font-sans text-xs sm:text-sm md:text-base max-w-2xl font-light leading-relaxed">
            Погрузитесь в интерактивный мир высокой флористики. Каждая роза, пион и орхидея смоделированы с анатомической точностью — настраивайте цветение, исследуйте структуру лепестков и создавайте букеты вашей мечты.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
            <a
              href="#studio"
              onClick={() => audioEngine.playChime(523.25, 0.1)}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-gold via-gold-metallic to-gold-dim text-atelier-950 font-bold text-xs tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.65)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              <span>Открыть 3D Конструктор</span>
            </a>

            <a
              href="#catalog"
              className="w-full sm:w-auto px-8 py-4 rounded-full glass-panel hover:bg-gold/15 border border-gold/30 hover:border-gold text-white font-medium text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Смотреть коллекции</span>
            </a>
          </div>

          {/* Key Indicators */}
          <div className="hidden sm:flex items-center gap-8 mt-14 text-zinc-400 text-xs tracking-wider uppercase border-t border-white/5 pt-6">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Эквадор & Япония (2800м)</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-gold/50" />
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-gold" />
              <span>14+ дней первозданной свежести</span>
            </span>
          </div>
        </div>

        {/* Scroll Hint */}
        <a
          href="#studio"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-zinc-400 hover:text-gold transition-colors"
        >
          <span className="text-[9px] tracking-[0.25em] uppercase font-sans">Исследовать</span>
          <ArrowDown className="w-4 h-4 animate-bounce text-gold" />
        </a>
      </section>

      {/* 3D Bouquet Studio Section */}
      <BouquetStudio
        initialConfig={{
          flower: studioConfig.flower,
          color: studioConfig.color,
        }}
        onOrderCustomBouquet={handleOrderCustomBouquet}
      />

      {/* Seasonal Curated Collections Section */}
      <FloralCatalog
        onSelectForStudio={handleSelectForStudio}
        onQuickOrder={handleQuickOrder}
      />

      {/* Atelier Philosophy & Craftsmanship Section */}
      <PhilosophySection />

      {/* Luxury Footer & Private Concierge */}
      <Footer />

      {/* VIP Order Modal */}
      <OrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title={activeOrderTitle}
        price={activeOrderPrice}
        stemCount={activeOrderStems}
        customConfig={activeCustomConfig}
      />
    </div>
  );
}

export default App;
