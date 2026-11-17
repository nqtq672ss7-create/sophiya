import React, { useState } from 'react';
import {
  User,
  LogOut,
  CheckCircle,
  Clock,
  Sparkles,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SALON_MAX_URL } from '../../config/contacts';
import { MaxIcon } from '../common/MaxIcon';

interface FigmaProfileScreenProps {
  onOpenAuth: () => void;
  onOpenCrm?: () => void;
  onGoToCatalog?: () => void;
}

export const FigmaProfileScreen: React.FC<FigmaProfileScreenProps> = ({
  onOpenAuth,
  onGoToCatalog,
}) => {
  const { customer, logout } = useAuth();
  const [showHistory, setShowHistory] = useState(false);

  // 1. Not Logged In State
  if (!customer) {
    return (
      <div className="min-h-[68vh] flex flex-col items-center justify-center p-6 text-center select-none max-w-lg mx-auto my-8">
        <div className="w-16 h-16 rounded-xl bg-[#922E3D]/10 border border-[#922E3D]/20 flex items-center justify-center mb-5 text-[#922E3D]">
          <User className="w-8 h-8" />
        </div>

        <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold mb-2.5">
          Личный кабинет
        </h2>
        <p className="text-xs sm:text-sm text-[#5C454C] font-light max-w-md mb-7 leading-relaxed">
          Войдите по номеру телефона, чтобы отслеживать статус сборки букетов, историю доставок и копить персональные скидки до 10% в салоне «София».
        </p>

        <button
          onClick={onOpenAuth}
          className="px-7 py-3.5 rounded-xl bg-[#922E3D] hover:bg-[#611720] text-white text-xs sm:text-sm font-medium transition-colors shadow-md active:scale-95 cursor-pointer"
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
  const remainingToNext = Math.max(0, nextTierAmount - customer.totalSpent);
  const progressPercent = Math.min(100, Math.round((customer.totalSpent / nextTierAmount) * 100));

  const initials =
    `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase() ||
    customer.firstName?.[0]?.toUpperCase() ||
    'К';

  const allOrders = customer.orders || [];
  const activeOrders = allOrders.filter(
    (o) => o.status === 'Собирается' || o.status === 'В пути'
  );
  const completedOrders = allOrders.filter((o) => o.status === 'Доставлен');

  // 2. Logged In State (Hybrid Bento + Wallet Card Focus)
  return (
    <div className="min-h-screen bg-[#FAF7F5] pb-28 text-[#1C1215] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Top Profile Strip */}
        <div className="bg-white rounded-xl border border-[#E5DDD9] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#922E3D] text-white font-bold text-base flex items-center justify-center shrink-0 tracking-wide shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#1C1215] truncate">
                  {customer.firstName} {customer.lastName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md bg-[#922E3D]/10 text-[#922E3D] text-[11px] font-semibold">
                  {customer.tier}
                </span>
              </div>
              <p className="text-xs text-[#7C636B] mt-0.5">
                {customer.phone}, клуб постоянных клиентов «София»
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-[#FAF7F5] hover:bg-[#EFE7E3] border border-[#E5DDD9] text-xs font-medium text-[#5C454C] hover:text-[#1C1215] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>

        {/* Hero Bento Row: Wallet Club Card (Left) + KPIs & Concierge (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Wallet-style Club Card */}
          <div className="lg:col-span-6 bg-[#6C1E26] text-white rounded-xl p-6 flex flex-col justify-between gap-6 shadow-md border border-[#E5C398]/35 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 relative z-10">
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[#E5C398] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Клубная карта «София»</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/15 border border-white/20 text-[11px] font-medium">
                {customer.tier}
              </span>
            </div>

            <div className="flex items-end justify-between gap-4 relative z-10">
              <div>
                <span className="text-xs text-white/75 block">Ваша постоянная скидка</span>
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none mt-1 block">
                  {customer.discountPercent}%
                </span>
              </div>
              <div className="text-right text-[11px] text-[#FAF0F2]/85 space-y-0.5">
                <div>Фотоотчёт в MAX до выезда</div>
                <div>Доставка по городу от 30 мин</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-white/15 relative z-10">
              <div className="flex justify-between text-[11px] text-white/85">
                <span>Накоплено: {customer.totalSpent.toLocaleString('ru-RU')} ₽</span>
                <span className="text-[#E5C398] font-medium">
                  До скидки {nextTierPercent}%: {remainingToNext.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/30 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-[#E5C398] rounded-lg transition-[width] duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Bento Stack: 3 KPIs + MAX Concierge */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl border border-[#E5DDD9] p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[11px] text-[#7C636B]">Всего покупок</span>
                <span className="text-base sm:text-xl font-bold text-[#1C1215] mt-2">
                  {customer.totalSpent.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="bg-white rounded-xl border border-[#E5DDD9] p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[11px] text-[#7C636B]">До скидки {nextTierPercent}%</span>
                <span className="text-base sm:text-xl font-bold text-[#922E3D] mt-2">
                  {remainingToNext.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="bg-white rounded-xl border border-[#E5DDD9] p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[11px] text-[#7C636B]">Заказов</span>
                <span className="text-base sm:text-xl font-bold text-[#1C1215] mt-2">
                  {allOrders.length}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5DDD9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm flex-1">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-[#1C1215]">
                  Персональный флорист в MAX
                </div>
                <p className="text-xs text-[#5C454C] leading-relaxed">
                  Подбор редких сортов, согласование открытки и фото готового букета до выезда курьера.
                </p>
              </div>
              <a
                href={SALON_MAX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#922E3D]/10 hover:bg-[#922E3D]/20 text-[#922E3D] border border-[#922E3D]/20 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors shrink-0"
              >
                <MaxIcon className="w-4 h-4" />
                <span>Написать в MAX</span>
              </a>
            </div>
          </div>
        </div>

        {/* Orders & History Tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5DDD9] pb-2.5">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                !showHistory
                  ? 'bg-[#922E3D] text-white shadow-sm'
                  : 'text-[#5C454C] hover:bg-white hover:text-[#1C1215]'
              }`}
            >
              Текущие заказы ({activeOrders.length})
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                showHistory
                  ? 'bg-[#922E3D] text-white shadow-sm'
                  : 'text-[#5C454C] hover:bg-white hover:text-[#1C1215]'
              }`}
            >
              История покупок ({completedOrders.length})
            </button>
          </div>

          {!showHistory && (
            activeOrders.length > 0 ? (
              <div className="space-y-4">
                {activeOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 sm:p-6 bg-white rounded-xl border border-[#E5DDD9] shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 border border-amber-200/60">
                            <CheckCircle className="w-3 h-3" />
                            <span>
                              {ord.status === 'В пути'
                                ? 'В пути — курьер выехал'
                                : 'Подтверждён — собирается флористом'}
                            </span>
                          </span>
                          <h4 className="text-sm sm:text-base font-semibold text-[#1C1215] mt-1.5">
                            {ord.items.join(', ')}
                          </h4>
                          <span className="text-xs text-[#7C636B] block mt-0.5">
                            Дата заказа: {ord.date}, г. Нижнекамск
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="text-xs text-[#7C636B] block">К оплате</span>
                        <span className="font-sans text-2xl text-[#922E3D] font-bold">
                          {ord.finalAmount.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#EFE7E3] flex flex-wrap gap-2.5">
                      <a
                        href={SALON_MAX_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-[#922E3D]/10 hover:bg-[#922E3D]/20 text-[#922E3D] border border-[#922E3D]/20 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                      >
                        <MaxIcon className="w-4 h-4" />
                        <span>Уточнить детали в MAX</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 sm:p-10 bg-white rounded-xl border border-[#E5DDD9] shadow-sm text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#922E3D]/10 text-[#922E3D] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans text-lg sm:text-xl text-[#1C1215] font-semibold">
                    У вас пока нет активных заказов
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5C454C] font-light max-w-md mx-auto leading-relaxed">
                    Когда вы оформите доставку букета, здесь появится статус сборки цветов флористом и время выезда курьера.
                  </p>
                </div>
                {onGoToCatalog && (
                  <div className="pt-1">
                    <button
                      onClick={onGoToCatalog}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#922E3D] hover:bg-[#611720] text-white text-xs sm:text-sm font-medium transition-colors shadow-sm active:scale-95 cursor-pointer"
                    >
                      <span>Выбрать букет в каталоге</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {showHistory && (
            completedOrders.length > 0 ? (
              <div className="space-y-3">
                {completedOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 sm:p-5 bg-white rounded-xl border border-[#E5DDD9] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                            Доставлен
                          </span>
                          <span className="text-xs text-[#7C636B]">{ord.date}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[#1C1215] mt-1">
                          {ord.items.join(', ')}
                        </h4>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <span className="font-sans text-lg text-[#1C1215] font-bold">
                        {ord.finalAmount.toLocaleString('ru-RU')} ₽
                      </span>
                      <a
                        href={SALON_MAX_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#922E3D]/10 hover:bg-[#922E3D]/20 text-[#922E3D] text-xs font-medium transition-colors"
                      >
                        Повторить заказ →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-white rounded-xl border border-dashed border-[#E5DDD9] text-center space-y-1.5">
                <span className="font-sans text-base text-[#1C1215] font-semibold block">
                  История заказов пуста
                </span>
                <span className="text-xs text-[#7C636B] block">
                  После оформления первой покупки здесь сохранится ваш электронный чек и состав композиции.
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
