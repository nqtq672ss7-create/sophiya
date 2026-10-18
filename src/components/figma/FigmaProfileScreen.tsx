import React from 'react';
import { User, LogOut, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#6C1E26] via-[#5A121A] to-[#140506] text-white flex flex-col items-center justify-center p-6 text-center select-none pb-28">
        <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center mb-4 bg-white/5">
          <User className="w-8 h-8 text-[#FAF7F5]" />
        </div>

        <h2 className="font-serif text-3xl font-light mb-2">
          Личный кабинет
        </h2>
        <p className="text-xs text-white/70 font-light max-w-xs mb-8 leading-relaxed">
          Войдите по номеру телефона, чтобы видеть историю заказов и получать персональные накопительные скидки
        </p>

        <button
          onClick={onOpenAuth}
          className="px-8 py-3.5 rounded-2xl bg-white text-[#6C1E26] text-xs font-medium uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          Войти по номеру
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5] pb-32 text-zinc-900 font-sans">
      {/* Top Header Background with Avatar (Exact Figma frame 14) */}
      <div className="bg-gradient-to-b from-[#8C1B2F] via-[#731525] to-[#5A121A] text-white pt-10 pb-8 px-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3.5">
            {/* Red Rose Avatar */}
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

        {/* Customer Discount & Total Spent Status Pill */}
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

      <div className="px-5 pt-6 max-w-lg mx-auto space-y-6">
        {/* Section 1: Текущие заказы (Exact Figma frame 14) */}
        <div>
          <h3 className="text-sm font-medium text-zinc-900 mb-3">
            Текущие заказы
          </h3>

          <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <img
                src="/bouquet-1.jpg"
                alt="Букет"
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <span className="font-serif text-lg text-[#6C1E26] font-semibold">
                    12 800 ₽
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Подтвержден
                  </span>
                </div>
                <h4 className="text-xs text-zinc-800 font-normal mt-0.5">
                  Розы розовые французские (25 шт)
                </h4>
                <span className="text-[10px] text-zinc-400 block mt-1">
                  Доставка: сегодня к 19:30 • пр. Сююмбике
                </span>
              </div>
            </div>

            {/* Action Buttons: Отмена заказа & Изменить заказ (Exact Figma frame 14) */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-100">
              <button
                onClick={() => alert('Заявка на отмену принята. Наш флорист свяжется с вами в WhatsApp.')}
                className="py-2.5 rounded-xl border border-zinc-300 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-colors"
              >
                Отмена заказа
              </button>

              <button
                onClick={() => alert('Изменение заказа: вы можете написать флористу в WhatsApp +7 (917) 256-32-35')}
                className="py-2.5 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs font-medium transition-colors"
              >
                Изменить заказ
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Прошлые заказы (Exact Figma frame 14) */}
        <div>
          <h3 className="text-sm font-medium text-zinc-900 mb-3">
            Прошлые заказы
          </h3>

          <div className="space-y-3">
            {customer.orders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 bg-white rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between gap-3"
              >
                <img
                  src="/bouquet-2.jpg"
                  alt="Букет"
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-base text-zinc-900 font-semibold">
                      {ord.finalAmount.toLocaleString('ru-RU')} ₽
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Доставлен
                    </span>
                  </div>
                  <h4 className="text-xs text-zinc-700 font-normal truncate mt-0.5">
                    {ord.items.join(', ')}
                  </h4>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {ord.date} • пр. Шинников, 13В
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Salon Owner CRM Link */}
        <div className="pt-4 text-center">
          <button
            onClick={onOpenCrm}
            className="text-xs text-[#6C1E26] hover:underline uppercase tracking-wider font-medium"
          >
            Открыть панель CRM владелицы салона →
          </button>
        </div>
      </div>
    </div>
  );
};
