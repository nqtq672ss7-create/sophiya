import React from 'react';
import { User, LogOut, CheckCircle, Clock, ShieldCheck, Sparkles, MessageSquare, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FigmaProfileScreenProps {
  onOpenAuth: () => void;
  onOpenCrm: () => void;
  onGoToCatalog?: () => void;
}

export const FigmaProfileScreen: React.FC<FigmaProfileScreenProps> = ({
  onOpenAuth,
  onOpenCrm,
  onGoToCatalog,
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
          className="px-8 py-3.5 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
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

  // Initials for prestigious luxury monogram avatar (e.g. "ВП" for Владислав Петров)
  const initials =
    `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase() ||
    customer.firstName?.[0]?.toUpperCase() ||
    'К';

  // Real customer orders segregation
  const allOrders = customer.orders || [];
  const activeOrders = allOrders.filter(
    (o) => o.status === 'Собирается' || o.status === 'В пути'
  );
  const completedOrders = allOrders.filter(
    (o) => o.status === 'Доставлен'
  );

  // 2. Logged In State (Responsive 2-column layout on Desktop, single-column on Mobile)
  return (
    <div className="min-h-screen bg-[#FAF7F5] pb-32 text-zinc-900 font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-gradient-to-b from-[#8C1B2F] via-[#731525] to-[#5A121A] text-white pt-10 pb-8 px-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3.5">
            {/* Prestigious Initials Monogram Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6C1E26] via-[#851D28] to-[#450A0A] border-2 border-[#C5A880]/60 shadow-lg flex items-center justify-center font-serif text-xl font-medium text-[#FAF7F5] shrink-0 tracking-wider">
              {initials}
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
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#6C1E26] transition-colors cursor-pointer"
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
                {/* Luxury Initials Monogram */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6C1E26] via-[#851D28] to-[#450A0A] border-2 border-[#C5A880]/50 shadow-md flex items-center justify-center font-serif text-2xl font-medium text-[#FAF7F5] shrink-0 tracking-wider">
                  {initials}
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

            {/* Salon CRM Link (Only visible if logged in with salon owner's phone) */}
            {customer && customer.phone.replace(/\D/g, '') === '79172563235' && (
              <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm text-center">
                <button
                  onClick={onOpenCrm}
                  className="w-full py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-[#6C1E26] hover:text-white text-zinc-700 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Панель управления салоном</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Orders & History (8 cols on Desktop) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1: Текущие заказы */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-2xl text-zinc-900 font-normal">
                  Текущие заказы
                </h3>
                {activeOrders.length > 0 ? (
                  <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-200/60">
                    <Clock className="w-3 h-3" />
                    <span>{activeOrders.length} активный заказ</span>
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400 font-light bg-zinc-100 px-2.5 py-1 rounded-full">
                    0 активных
                  </span>
                )}
              </div>

              {activeOrders.length > 0 ? (
                <div className="space-y-4">
                  {activeOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                            <Clock className="w-6 h-6" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {ord.status === 'В пути' ? 'В пути • Курьер выехал' : 'Подтвержден • Собирается флористом'}
                              </span>
                            </div>
                            <h4 className="text-sm sm:text-base font-medium text-zinc-900 mt-1">
                              {ord.items.join(', ')}
                            </h4>
                            <span className="text-xs text-zinc-500 font-light block mt-1">
                              Дата заказа: {ord.date} • г. Нижнекамск, доставка салона «София»
                            </span>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span className="text-xs text-zinc-400 block font-light">К оплате</span>
                          <span className="font-serif text-2xl text-[#6C1E26] font-semibold">
                            {ord.finalAmount.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
                        <a
                          href="https://wa.me/79172563235"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-3 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-colors text-center flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Уточнить детали в WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 sm:p-10 bg-white rounded-3xl border border-zinc-200/90 shadow-sm text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif text-xl text-zinc-900 font-normal">
                      У вас пока нет активных заказов
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-500 font-light max-w-sm mx-auto leading-relaxed">
                      Когда вы оформите доставку букета, здесь появится статус сборки цветов флористом и время выезда курьера.
                    </p>
                  </div>
                  {onGoToCatalog && (
                    <div className="pt-2">
                      <button
                        onClick={onGoToCatalog}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <span>Выбрать букет в каталоге</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: История заказов */}
            <div>
              <h3 className="font-serif text-2xl text-zinc-900 font-normal mb-4">
                История заказов
              </h3>

              {completedOrders.length > 0 ? (
                <div className="space-y-3">
                  {completedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
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
                            Салон «София»: пр. Шинников, 13В
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
              ) : (
                <div className="p-6 sm:p-8 bg-white rounded-3xl border border-dashed border-zinc-200 text-center space-y-1">
                  <span className="font-serif text-base text-zinc-700 font-normal block">
                    История заказов пуста
                  </span>
                  <span className="text-xs text-zinc-400 font-light block">
                    После оформления первой покупки здесь сохранится ваш электронный чек и состав композиции.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
