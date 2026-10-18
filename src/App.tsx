import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { HeroSection } from './components/hero/HeroSection';
import { AuthModal } from './components/auth/AuthModal';
import { CustomerProfileModal } from './components/profile/CustomerProfileModal';
import { SalonAdminClientsModal } from './components/admin/SalonAdminClientsModal';
import { MessageCircle, Phone, MapPin, ArrowRight, Sparkles, Check } from 'lucide-react';

function FlowerSalonContent() {
  const { customer, openAuthModal, openProfileModal, addOrderToCustomer } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [isAdminClientsOpen, setIsAdminClientsOpen] = useState(false);
  const [lastOrderedBouquet, setLastOrderedBouquet] = useState<string | null>(null);

  const handleExploreCatalog = () => {
    const catalogEl = document.getElementById('catalog-preview');
    catalogEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOrderBouquet = (title: string, rawPrice: number) => {
    if (customer) {
      addOrderToCustomer({
        items: [title],
        totalAmount: rawPrice,
      });
      setLastOrderedBouquet(title);
      setCartCount((prev) => prev + 1);
      setTimeout(() => setLastOrderedBouquet(null), 4000);
    } else {
      setCartCount((prev) => prev + 1);
      // Prompt customer to log in to get their discount
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen bg-sofiya-black-purple text-sofiya-petal font-sans antialiased selection:bg-sofiya-red-berry/40 selection:text-white">
      {/* Editorial Luxury Header with Auth & CRM Links */}
      <Header
        onOpenCart={() => (customer ? openProfileModal() : openAuthModal())}
        onOpenAdminClients={() => setIsAdminClientsOpen(true)}
        cartCount={cartCount}
      />

      {/* Main Hero Screen */}
      <HeroSection onExploreCatalog={handleExploreCatalog} />

      {/* Order Toast Notification */}
      {lastOrderedBouquet && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-sofiya-black-purple border border-sofiya-viola/40 shadow-2xl flex items-center gap-3 animate-slideUp text-xs font-sans">
          <div className="w-8 h-8 rounded-full bg-sofiya-red-berry/30 border border-sofiya-viola/40 flex items-center justify-center text-emerald-400">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-medium block">
              Букет «{lastOrderedBouquet}» добавлен
            </span>
            <span className="text-sofiya-viola text-[11px]">
              Скидка {customer?.discountPercent}% учтена в сумме заказов
            </span>
          </div>
        </div>
      )}

      {/* Catalog Preview: Editorial Lookbook */}
      <section id="catalog-preview" className="py-28 max-w-7xl mx-auto px-6 border-t border-sofiya-viola/15">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] uppercase tracking-[0.3em] text-sofiya-viola font-sans font-light">
                Эксклюзивная коллекция • пр. Шинников, 13В
              </span>
              {customer && (
                <span className="px-2 py-0.5 border border-sofiya-viola/30 bg-sofiya-red-berry/20 text-sofiya-petal text-[10px] uppercase tracking-wider">
                  Ваша скидка: {customer.discountPercent}%
                </span>
              )}
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white font-light tracking-tight">
              Избранные композиции <span className="font-serif italic text-sofiya-viola">сезона</span>
            </h2>
          </div>

          <div className="text-left md:text-right">
            {!customer ? (
              <button
                onClick={openAuthModal}
                className="text-xs uppercase tracking-[0.2em] text-sofiya-viola hover:text-white underline decoration-sofiya-viola/50 transition-colors block mb-1"
              >
                Войдите по номеру для накопительной скидки →
              </button>
            ) : (
              <button
                onClick={openProfileModal}
                className="text-xs uppercase tracking-[0.2em] text-sofiya-viola hover:text-white transition-colors block mb-1"
              >
                {customer.firstName}: накоплено {customer.totalSpent.toLocaleString('ru-RU')} ₽ (Кабинет →)
              </button>
            )}
            <span className="text-sm font-serif italic text-sofiya-petal/60">
              Сборка в салоне от 15 минут
            </span>
          </div>
        </div>

        {/* 3 Editorial Portrait Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              id: '1',
              title: 'Бархатный Марсала',
              variety: '25 премиальных роз сорта Red Naomi в матовом фирменном оформлении',
              price: 4800,
              status: 'В наличии в салоне',
            },
            {
              id: '2',
              title: 'Пудровая Мелодия',
              variety: 'Французские розы, пудровые пионы и эустома в палитре Viola',
              price: 5600,
              status: 'Доставка за 30 мин',
            },
            {
              id: '3',
              title: 'Французский Сад',
              variety: 'Пионовидные розы Red Piano, свежий эвкалипт и диантусы',
              price: 6200,
              status: 'В наличии в салоне',
            },
          ].map((item) => {
            const discountPercent = customer?.discountPercent || 0;
            const finalPrice = discountPercent > 0
              ? Math.round(item.price * (1 - discountPercent / 100))
              : item.price;

            return (
              <article
                key={item.id}
                className="group flex flex-col border border-sofiya-viola/15 bg-sofiya-black-purple/50 hover:border-sofiya-viola/40 transition-colors duration-500 p-6"
              >
                {/* Product Visual Presentation */}
                <div className="w-full aspect-[4/5] bg-gradient-to-b from-sofiya-red-berry/20 via-sofiya-matrix/10 to-sofiya-black-purple border border-sofiya-viola/10 flex flex-col items-center justify-center p-8 relative overflow-hidden group-hover:border-sofiya-viola/30 transition-all duration-700">
                  <div className="text-center">
                    <span className="font-serif italic text-3xl sm:text-4xl text-sofiya-petal/90 block mb-2 transition-transform duration-700 group-hover:scale-105">
                      {item.title}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-sofiya-viola font-light block">
                      Салон «София»
                    </span>
                  </div>
                </div>

                {/* Title & Info */}
                <div className="pt-6 flex flex-col flex-grow">
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="font-serif text-2xl text-white font-normal group-hover:text-sofiya-viola transition-colors">
                      {item.title}
                    </h3>
                    <div className="text-right">
                      {discountPercent > 0 && (
                        <span className="text-xs text-sofiya-viola line-through block font-sans">
                          {item.price.toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                      <span className="font-serif text-2xl text-white font-light tracking-wide">
                        {finalPrice.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-sofiya-petal/70 font-light leading-relaxed mb-6">
                    {item.variety}
                  </p>

                  {/* Card Action */}
                  <div className="pt-4 mt-auto border-t border-sofiya-viola/15 flex items-center justify-between">
                    <span className="text-[11px] text-sofiya-viola font-sans uppercase tracking-[0.15em] font-light">
                      {item.status}
                    </span>

                    <button
                      onClick={() => handleOrderBouquet(item.title, item.price)}
                      className="text-xs uppercase tracking-[0.2em] text-white hover:text-sofiya-viola transition-colors flex items-center gap-1.5 font-medium py-1"
                    >
                      <span>Заказать</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Haute Couture Architectural Footer */}
      <footer className="border-t border-sofiya-viola/20 py-16 bg-sofiya-black-purple">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 pb-12 border-b border-sofiya-viola/15">
            {/* Salon Info */}
            <div className="text-center md:text-left">
              <img
                src="/logo-light.png"
                alt="Салон цветов София"
                className="h-12 w-auto mx-auto md:mx-0 mb-4"
              />
              <p className="text-xs text-sofiya-petal/70 font-light max-w-sm leading-relaxed">
                Единственный салон авторской флористики в Нижнекамске. Свежие поставки редких сортов и бережная доставка цветов.
              </p>
            </div>

            {/* Contacts Column */}
            <div className="flex flex-col items-center md:items-end gap-3 font-sans text-xs">
              <span className="text-[10px] uppercase tracking-[0.25em] text-sofiya-viola">
                Контакты и заказ
              </span>
              <a
                href="tel:+79172563235"
                className="text-white hover:text-sofiya-viola text-lg font-serif transition-colors"
              >
                +7 (917) 256-32-35
              </a>
              <a
                href="https://wa.me/79172563235?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%A5%D0%BE%D1%87%D1%83%20%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D0%B0%D1%82%D1%8C%20%D1%86%D0%B2%D0%B5%D1%82%D1%8B"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sofiya-viola hover:text-white flex items-center gap-2 transition-colors uppercase tracking-[0.15em] text-[11px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Чат в WhatsApp</span>
              </a>
              <span className="text-sofiya-petal/60 text-[11px] tracking-wider">
                г. Нижнекамск, пр-кт Шинников, 13В • 10:00 — 21:00
              </span>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-sofiya-petal/50 font-light gap-4">
            <span>© {new Date().getFullYear()} Салон цветов «София». Все права защищены.</span>
            <button
              onClick={() => setIsAdminClientsOpen(true)}
              className="text-sofiya-viola/70 hover:text-white transition-colors uppercase tracking-wider text-[10px]"
            >
              Вход для владелицы (CRM клиентов)
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal & Profile Modal */}
      <AuthModal />
      <CustomerProfileModal />

      {/* Salon Owner CRM Modal */}
      <SalonAdminClientsModal
        isOpen={isAdminClientsOpen}
        onClose={() => setIsAdminClientsOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <FlowerSalonContent />
    </AuthProvider>
  );
}

export default App;
