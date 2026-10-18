import React from 'react';
import { User, LogOut, CheckCircle, Clock, AlertCircle, ShieldCheck, Sparkles, MapPin, Phone, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FigmaProfileScreenProps {
  onOpenAuth: () => void;
  onOpenCrm: () => void;
}

export const FigmaProfileScreen: React.FC<FigmaProfileScreenProps> = ({
  onOpenAuth,
  onOpenCrm,
}) => {
  const { customer, logout } = useAuth();

  // 1. Not Logged In State
  if (!customer) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none max-w-lg mx-auto my-8">
        <div className="w-20 h-20 rounded-full bg-[#6C1E26]/10 border border-[#6C1E26]/20 flex items-center justify-center mb-6 text-[#6C1E26]">
          <User className="w-10 h-10" />
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl text-zinc-900 font-normal mb-3">
          Личный кабинет
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 font-light max-w-md mb-8 leading-relaxed">
          Войдите по номеру телефона, чтобы отслеживать статус сборки букетов, историю доставок и копить персональные скидки до 10% в салоне «София».
        </p>

        <button
          onClick={onOpenAuth}
          className="px-8 py-3.5 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          Войти по номеру телефона
        </button>
      </div>
    );
  }

  // Calculate next tier target
  let nextTierAmount = 15000;
  let nextTierPercent = 5;
  if (customer.totalSpent >= 30000) {
    nextTierAmount = 50000;
    nextTierPercent = 10;
  } else if (customer.totalSpent >= 15000) {
    nextTierAmount = 30000;
    nextTierPercent = 7;
  }
  const progressPercent = Math.min(100, Math.round((customer.totalSpent / nextTierAmount) * 100));

  // 2. Logged In State (Responsive 2-column layout on Desktop, single-column on Mobile)
  return (
    <div className="min-h-screen bg-[#FAF7F5] pb-32 text-zinc-900 font-sans">
      {/* Mobile Top Header (Exact Figma Frame 14) */}
      <div className="md:hidden bg-gradient-to-b from-[#8C1B2F] via-[#731525] to-[#5A121A] text-white pt-10 pb-8 px-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/40 shadow-lg bg-zinc-800">
              <img
                src="/bouquet-1.jpg"
                alt="Аватар пользователя"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <span className="font-serif text-2xl font-light block leading-tight">
                Здравствуй!
              </span>
              <span className="text-xs text-white/90 font-medium">
                {customer.firstName} {customer.lastName}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Выйти из кабинета"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-3.5 rounded-2xl bg-black/25 border border-white/10 flex items-center justify-between text-xs font-light">
          <div>
            <span className="text-[10px] text-white/60 uppercase tracking-wider block">
              Клубная скидка ({customer.tier})
            </span>
            <span className="font-serif text-xl font-normal text-white">
              {customer.discountPercent}%
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-white/60 uppercase tracking-wider block">
              Сумма всех заказов
            </span>
            <span className="font-serif text-lg font-normal text-white">
              {customer.totalSpent.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>

      {/* Main Desktop Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Desktop Breadcrumb/Title */}
        <div className="hidden md:flex items-baseline justify-between border-b border-zinc-200 pb-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#6C1E26] font-normal tracking-wider uppercase">
              ЛИЧНЫЙ КАБИНЕТ
            </h1>
            <span className="text-xs text-zinc-500 font-light">
              Клуб постоянных клиентов салона «София» • Нижнекамск
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#6C1E26] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти из аккаунта</span>
          </button>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Profile Card & Loyalty Club (4 cols on Desktop) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Desktop User Info Card */}
            <div className="hidden md:block bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#6C1E26] shadow bg-zinc-100 shrink-0">
                  <img
                    src="/bouquet-1.jpg"
                    alt="Аватар"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <span className="text-xs text-zinc-400 font-light block">Клиент салона</span>
                  <h3 className="font-serif text-xl text-zinc-900 font-medium truncate">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  <span className="text-xs text-zinc-600 font-mono block mt-0.5">
                    {customer.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Loyalty Card (Burgundy & Gold Gradient) */}
            <div className="bg-gradient-to-br from-[#8C1B2F] via-[#731525] to-[#5A121A] text-white rounded-3xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Клубная карта</span>
                </span>
                <span className="text-xs bg-black/30 border border-white/10 px-2.5 py-1 rounded-full text-white/90">
                  Уровень: {customer.tier}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-xs text-white/70 font-light block">Ваша постоянная скидка</span>
                  <span className="font-serif text-4xl font-bold text-white tracking-tight">
                    {customer.discountPercent}%
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-white/70 font-light block">Всего покупок</span>
                  <span className="font-serif text-xl font-normal text-white">
                    {customer.totalSpent.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {customer.discountPercent < 10 && (
                <div className="pt-3 border-t border-white/15 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-white/80">
                    <span>До скидки {nextTierPercent}%:</span>
                    <span>{(nextTierAmount - customer.totalSpent).toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C5A880] to-amber-300 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Club Perks */}
              <div className="mt-5 pt-4 border-t border-white/15 space-y-2 text-xs text-white/80 font-light">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                  <span>Скидка {customer.discountPercent}% на весь ассортимент салона</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                  <span>Фотоотчет в WhatsApp перед выездом курьера</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                  <span>Фирменная подкормка для цветов в подарок</span>
                </div>
              </div>
            </div>

            {/* Salon CRM Link */}
            <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm text-center">
              <button
                onClick={onOpenCrm}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-[#6C1E26] hover:text-white text-zinc-700 text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Открыть панель CRM владелицы</span>
              </button>
            </div>
          </div>

          {/* Right Column: Active Orders & History (8 cols on Desktop) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1: Текущие заказы (Exact Figma frame 14) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-2xl text-zinc-900 font-normal">
                  Текущие заказы
                </h3>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>1 активный заказ</span>
                </span>
              </div>

              <div className="p-5 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src="/bouquet-1.jpg"
                      alt="Букет"
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-sm"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Подтвержден • Собирается флористом
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-medium text-zinc-900 mt-1">
                        Розы розовые французские (25 шт)
                      </h4>
                      <span className="text-xs text-zinc-500 font-light block mt-1">
                        Доставка курьером: сегодня к 19:30 • г. Нижнекамск, пр. Сююмбике
                      </span>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-xs text-zinc-400 block font-light">К оплате</span>
                    <span className="font-serif text-2xl text-[#6C1E26] font-semibold">
                      12 800 ₽
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Отмена заказа & Изменить заказ (Exact Figma frame 14) */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
                  <button
                    onClick={() => alert('Заявка на отмену заказа принята. Наш флорист свяжется с вами в течение 5 минут.')}
                    className="py-3 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs sm:text-sm font-medium transition-colors"
                  >
                    Отмена заказа
                  </button>

                  <a
                    href="https://wa.me/79172563235"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-colors text-center flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Изменить заказ в WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Section 2: Прошлые заказы (Exact Figma frame 14) */}
            <div>
              <h3 className="font-serif text-2xl text-zinc-900 font-normal mb-4">
                История заказов
              </h3>

              <div className="space-y-3">
                {customer.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src="/bouquet-2.jpg"
                        alt="Букет"
                        className="w-16 h-16 rounded-2xl object-cover shrink-0"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-medium bg-zinc-100 px-2 py-0.5 rounded-full">
                            Доставлен
                          </span>
                          <span className="text-xs text-zinc-400 font-light">
                            {ord.date}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-medium text-zinc-800 mt-1">
                          {ord.items.join(', ')}
                        </h4>
                        <span className="text-xs text-zinc-500 font-light block mt-0.5">
                          Салон: пр. Шинников, 13В
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span className="font-serif text-xl text-zinc-900 font-semibold block">
                        {ord.finalAmount.toLocaleString('ru-RU')} ₽
                      </span>
                      <a
                        href="https://wa.me/79172563235"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#6C1E26] hover:underline font-medium inline-block mt-1"
                      >
                        Повторить заказ →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
