import React, { useState } from 'react';
import { X, Users, MessageCircle, Phone, Search, Award, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { calculateLoyaltyTier } from '../../types/customer';

interface SalonAdminClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalonAdminClientsModal: React.FC<SalonAdminClientsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { allCustomers } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = allCustomers.filter(
    (c) =>
      c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const totalRevenue = allCustomers.reduce((acc, c) => acc + c.totalSpent, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-sofiya-black-purple border border-sofiya-viola/30 p-6 sm:p-8 shadow-2xl text-sofiya-petal max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-sofiya-viola/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-sofiya-red-berry text-[10px] uppercase tracking-widest text-white font-medium">
                Панель владелицы
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-sofiya-viola">
                Салон на Шинников, 13В
              </span>
            </div>
            <h3 className="font-serif text-3xl text-white font-light">
              База клиентов и персональные скидки
            </h3>
            <p className="text-xs text-sofiya-petal/70 font-light mt-1">
              Здесь фиксируется история каждого покупателя, накопленные суммы и персональные уровни скидок.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-sofiya-viola/70 hover:text-white transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-sofiya-viola/15 font-sans">
          <div className="p-4 border border-sofiya-viola/20 bg-black/30">
            <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-viola block mb-1">
              Всего клиентов в базе
            </span>
            <span className="font-serif text-3xl text-white font-normal">
              {allCustomers.length} человек
            </span>
          </div>

          <div className="p-4 border border-sofiya-viola/20 bg-black/30">
            <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-viola block mb-1">
              Общая сумма заказов
            </span>
            <span className="font-serif text-3xl text-white font-normal">
              {totalRevenue.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="p-4 border border-sofiya-viola/20 bg-black/30">
            <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-viola block mb-1">
              Средний чек клиента
            </span>
            <span className="font-serif text-3xl text-white font-normal">
              {allCustomers.length > 0
                ? Math.round(totalRevenue / allCustomers.reduce((acc, c) => acc + (c.ordersCount || 1), 0)).toLocaleString('ru-RU')
                : 0}{' '}
              ₽
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="py-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sofiya-viola/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, фамилии или номеру телефона..."
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-sofiya-viola/25 text-white text-xs font-sans focus:outline-none focus:border-sofiya-viola"
            />
          </div>
        </div>

        {/* Clients List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-sofiya-petal/50">
              По вашему запросу клиенты не найдены
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="p-5 border border-sofiya-viola/15 bg-black/25 hover:border-sofiya-viola/35 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans text-xs"
              >
                {/* Client info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-xl text-white font-normal">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="px-2 py-0.5 border border-sofiya-viola/30 text-sofiya-viola text-[10px] uppercase tracking-wider">
                      {c.tier} статус
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sofiya-petal/70 font-light">
                    <span className="text-white font-mono">{c.phone}</span>
                    {c.birthDate && (
                      <>
                        <span className="text-sofiya-viola/40">•</span>
                        <span>ДР: {new Date(c.birthDate).toLocaleDateString('ru-RU')}</span>
                      </>
                    )}
                    <span className="text-sofiya-viola/40">•</span>
                    <span>В клубе с {c.registeredAt}</span>
                  </div>
                </div>

                {/* Metrics & Fast Contact Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-sofiya-viola/10 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-sofiya-petal/50 block">
                      Куплено на сумму
                    </span>
                    <span className="font-serif text-lg text-white font-normal">
                      {c.totalSpent.toLocaleString('ru-RU')} ₽
                    </span>
                    <span className="text-[11px] text-sofiya-viola block">
                      {c.ordersCount} {c.ordersCount === 1 ? 'заказ' : 'заказов'} • Скидка {c.discountPercent}%
                    </span>
                  </div>

                  {/* WhatsApp Quick Message */}
                  <a
                    href={`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Здравствуйте, ${c.firstName}! Салон цветов «София» на связи. Рады видеть вас в нашем клубе привилегий.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 border border-sofiya-viola/30 hover:border-sofiya-viola bg-sofiya-red-berry/20 hover:bg-sofiya-red-berry/40 text-white text-[11px] tracking-wider uppercase transition-colors flex items-center gap-1.5 shrink-0"
                    title="Написать клиенту в WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-sofiya-viola" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
