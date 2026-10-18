import React from 'react';
import { X, LogOut, Award, ShoppingBag, Calendar, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { calculateLoyaltyTier, LOYALTY_TIERS } from '../../types/customer';

export const CustomerProfileModal: React.FC = () => {
  const { customer, isProfileModalOpen, closeProfileModal, logout } = useAuth();

  if (!isProfileModalOpen || !customer) return null;

  const { tier, nextTier, amountToNextTier } = calculateLoyaltyTier(customer.totalSpent);
  const progressPercent = nextTier
    ? Math.min(100, Math.round(((customer.totalSpent - tier.minSpend) / (nextTier.minSpend - tier.minSpend)) * 100))
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-sofiya-black-purple border border-sofiya-viola/25 p-6 sm:p-10 shadow-2xl text-sofiya-petal max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeProfileModal}
          className="absolute top-6 right-6 text-sofiya-viola/70 hover:text-white transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-sofiya-viola/15">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-sofiya-viola font-sans block mb-1">
              Персональный кабинет клиента
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl text-white font-light">
              {customer.firstName} {customer.lastName}
            </h3>
            <span className="text-xs text-sofiya-petal/60 font-sans tracking-wider block mt-1">
              {customer.phone}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-sofiya-viola/70 hover:text-rose-300 transition-colors uppercase tracking-wider font-light"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>

        {/* Luxury Digital Membership Card */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-sofiya-red-berry/40 via-sofiya-black-purple to-black border border-sofiya-viola/30 shadow-2xl mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sofiya-viola/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full min-h-[170px]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.35em] text-sofiya-viola block mb-1 font-light">
                  Клубная карта салона цветов «София»
                </span>
                <span className="font-serif text-2xl text-white font-normal">
                  {tier.name} статус
                </span>
              </div>
              <div className="text-right">
                <span className="font-serif text-4xl text-white font-light">
                  {customer.discountPercent}%
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-viola block">
                  Персональная скидка
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-sofiya-viola/20 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-petal/50 block">
                  Всего заказов
                </span>
                <span className="text-sm font-sans font-medium text-white">
                  {customer.ordersCount} букетов
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-petal/50 block">
                  Сумма заказов
                </span>
                <span className="text-lg font-serif text-white font-normal">
                  {customer.totalSpent.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-viola block">
                  Филиал
                </span>
                <span className="text-xs text-white/90">
                  Нижнекамск, Шинников 13В
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Progression to Next Discount Tier */}
        {nextTier ? (
          <div className="p-5 border border-sofiya-viola/15 bg-black/30 mb-8 font-sans">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-sofiya-petal/80 font-light">
                Текущий уровень: <strong className="text-white font-medium">{tier.name} ({tier.discountPercent}%)</strong>
              </span>
              <span className="text-sofiya-viola font-medium">
                Следующий: {nextTier.name} ({nextTier.discountPercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-sofiya-black-purple border border-sofiya-viola/20 overflow-hidden mb-2">
              <div
                className="h-full bg-sofiya-red-berry transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-sofiya-petal/60 font-light">
              Для перехода на скидку <strong className="text-white">{nextTier.discountPercent}%</strong> оформите заказов ещё на{' '}
              <strong className="text-sofiya-viola font-medium">{amountToNextTier.toLocaleString('ru-RU')} ₽</strong>
            </p>
          </div>
        ) : (
          <div className="p-4 border border-amber-500/30 bg-amber-950/20 mb-8 text-center text-xs text-amber-200">
            👑 У вас максимальный статус «Платиновый» со скидкой 10% на все заказы!
          </div>
        )}

        {/* Order History */}
        <div>
          <h4 className="font-serif text-2xl text-white font-light mb-4 flex items-center justify-between">
            <span>История ваших заказов</span>
            <span className="text-xs font-sans text-sofiya-petal/50 uppercase tracking-widest font-light">
              {customer.orders.length} записей
            </span>
          </h4>

          {customer.orders.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-sofiya-viola/20 text-xs text-sofiya-petal/50">
              У вас пока нет оформленных заказов. Выберите букет в каталоге, и персональная скидка применится автоматически.
            </div>
          ) : (
            <div className="space-y-3">
              {customer.orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 border border-sofiya-viola/15 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-sofiya-viola tracking-wider uppercase font-light">
                        {ord.date}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-xs text-emerald-400 font-light flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {ord.status}
                      </span>
                    </div>
                    <div className="text-sm text-white font-medium">
                      {ord.items.join(', ')}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0">
                      {ord.discountApplied > 0 && (
                        <span className="text-[11px] text-sofiya-viola line-through">
                          {ord.totalAmount.toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                      <span className="font-serif text-lg text-white font-normal">
                        {ord.finalAmount.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    {ord.discountApplied > 0 && (
                      <span className="text-[10px] text-sofiya-viola uppercase tracking-wider block">
                        Скидка: -{ord.discountApplied} ₽
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
