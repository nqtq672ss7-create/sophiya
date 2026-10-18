import React, { useState } from 'react';
import { X, Users, MessageCircle, Phone, Search, Award, TrendingUp, Sparkles, Package, Plus, Trash2, CheckCircle2, Image as ImageIcon, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { calculateLoyaltyTier } from '../../types/customer';
import { Bouquet } from '../../types/figma-app';

interface SalonAdminClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalonAdminClientsModal: React.FC<SalonAdminClientsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { allCustomers } = useAuth();
  const { bouquets, addBouquet, deleteBouquet, toggleStock } = useCatalog();

  const [activeTab, setActiveTab] = useState<'clients' | 'catalog'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddBouquetOpen, setIsAddBouquetOpen] = useState(false);

  // New Bouquet Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newCategory, setNewCategory] = useState<'Монобукеты' | 'Авторские' | 'Коробки' | 'Корзины'>('Авторские');
  const [newColor, setNewColor] = useState('Розовый');
  const [newHeight, setNewHeight] = useState('50 см');
  const [newComposition, setNewComposition] = useState('');
  const [newDurability, setNewDurability] = useState('10-14 дней');
  const [newPackaging, setNewPackaging] = useState('Фирменная дизайнерская упаковка «София»');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState('/bouquet-1.jpg');
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);

  if (!isOpen) return null;

  // Filter clients
  const filteredCustomers = allCustomers.filter(
    (c) =>
      c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  // Filter bouquets
  const filteredBouquets = bouquets.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.characteristics.flowersCount.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = allCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
  const inStockCount = bouquets.filter((b) => b.inStock).length;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBouquet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return;

    addBouquet({
      title: newTitle.trim(),
      price: Number(newPrice),
      category: newCategory,
      color: newColor,
      inStock: true,
      image: newImage,
      description: newDescription.trim() || 'Авторская флористическая композиция из свежей поставки цветов высшей категории.',
      characteristics: {
        height: newHeight,
        flowersCount: newComposition || 'Отборные цветы премиум сортов',
        durability: newDurability,
        packaging: newPackaging,
      },
    });

    // Reset Form
    setNewTitle('');
    setNewPrice('');
    setNewComposition('');
    setNewDescription('');
    setIsAddBouquetOpen(false);
    setIsSuccessMessage(true);
    setTimeout(() => setIsSuccessMessage(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-5xl bg-[#1C1215] border border-white/15 p-6 sm:p-8 shadow-2xl text-white max-h-[92vh] flex flex-col rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-[#6C1E26] text-[10px] uppercase tracking-widest text-white font-medium rounded">
                Панель управления салоном
              </span>
              <span className="text-xs text-[#C5A880] font-light">
                г. Нижнекамск, пр. Шинников, 13В
              </span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal">
              CRM Салона цветов «София»
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Каталог букетов vs База клиентов */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-white/10">
          <button
            onClick={() => {
              setActiveTab('catalog');
              setIsAddBouquetOpen(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-[#6C1E26] text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Каталог букетов & Склад ({bouquets.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('clients');
              setIsAddBouquetOpen(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'clients'
                ? 'bg-[#6C1E26] text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>База клиентов & Скидки ({allCustomers.length})</span>
          </button>
        </div>

        {isSuccessMessage && (
          <div className="mt-3 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Новый букет успешно добавлен в витрину и доступен для заказа!</span>
          </div>
        )}

        {/* 1. CATALOG MANAGEMENT TAB */}
        {activeTab === 'catalog' && (
          <div className="flex-1 overflow-y-auto pt-4 flex flex-col pr-1">
            {/* Top Metrics & Add Action */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block">Всего позиций</span>
                <span className="font-serif text-2xl text-white font-normal">{bouquets.length} букетов</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 block">В наличии в салоне</span>
                <span className="font-serif text-2xl text-emerald-300 font-normal">{inStockCount} букетов</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-amber-300 block">Под заказ</span>
                <span className="font-serif text-2xl text-amber-200 font-normal">{bouquets.length - inStockCount} букетов</span>
              </div>

              <button
                onClick={() => setIsAddBouquetOpen(!isAddBouquetOpen)}
                className="p-3.5 rounded-2xl bg-[#6C1E26] hover:bg-[#851D28] text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Добавить букет</span>
              </button>
            </div>

            {/* Creation Form (Collapsible) */}
            {isAddBouquetOpen && (
              <form onSubmit={handleCreateBouquet} className="mb-6 p-5 rounded-2xl bg-black/40 border border-[#6C1E26]/50 shadow-xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="font-serif text-lg text-[#C5A880]">Добавление нового букета в салон</h4>
                  <button
                    type="button"
                    onClick={() => setIsAddBouquetOpen(false)}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Отмена
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Название букета *</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Например: Прованские пионы в шелке"
                      className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Стоимость (₽) *</label>
                    <input
                      type="number"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value) || '')}
                      placeholder="12 500"
                      className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Категория</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#2C1F22] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    >
                      <option value="Монобукеты">Монобукеты</option>
                      <option value="Авторские">Авторские</option>
                      <option value="Коробки">Коробки</option>
                      <option value="Корзины">Корзины</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Состав букета</label>
                    <input
                      type="text"
                      value={newComposition}
                      onChange={(e) => setNewComposition(e.target.value)}
                      placeholder="Например: 25 роз French Pink + эвкалипт"
                      className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Высота / Размер</label>
                    <input
                      type="text"
                      value={newHeight}
                      onChange={(e) => setNewHeight(e.target.value)}
                      placeholder="50 см"
                      className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Стойкость цветов</label>
                    <input
                      type="text"
                      value={newDurability}
                      onChange={(e) => setNewDurability(e.target.value)}
                      placeholder="10-14 дней"
                      className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>

                {/* Photo Upload & Preview */}
                <div>
                  <label className="block text-[11px] text-white/70 mb-1">Фотография букета</label>
                  <div className="flex items-center gap-4">
                    <img
                      src={newImage}
                      alt="Превью"
                      className="w-16 h-16 rounded-xl object-cover border border-white/20 bg-zinc-800 shrink-0"
                    />

                    <div className="flex-1">
                      <label className="cursor-pointer px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-white inline-flex items-center gap-2 transition-colors">
                        <ImageIcon className="w-4 h-4 text-[#C5A880]" />
                        <span>Выбрать фото с устройства (JPG / PNG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="block text-[10px] text-white/40 mt-1">
                        Фото сразу оптимизируется и появится на витрине сайта
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white/70 mb-1">Описание для покупателя</label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Расскажите о сорте, аромате или поводе для подарка..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBouquetOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#6C1E26] hover:bg-[#851D28] text-white text-xs font-semibold shadow-md"
                  >
                    Опубликовать на сайт
                  </button>
                </div>
              </form>
            )}

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или цветам в букете..."
                className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/15 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Bouquets Table / Cards */}
            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {filteredBouquets.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={b.image}
                      alt={b.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-zinc-800"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base text-white font-medium">{b.title}</span>
                        <span className="text-[10px] text-white/50 bg-black/30 px-2 py-0.5 rounded">
                          {b.category}
                        </span>
                      </div>
                      <span className="text-zinc-400 text-[11px] block mt-0.5">
                        {b.characteristics.flowersCount} • {b.characteristics.height}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                    <span className="font-serif text-lg text-[#C5A880] font-semibold">
                      {b.price.toLocaleString('ru-RU')} ₽
                    </span>

                    {/* Stock Status Toggle */}
                    <button
                      onClick={() => toggleStock(b.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                        b.inStock
                          ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-zinc-800 border border-zinc-600 text-zinc-400 hover:bg-zinc-700'
                      }`}
                      title="Нажмите, чтобы изменить статус"
                    >
                      {b.inStock ? '✓ В наличии' : '○ Под заказ'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Удалить букет «${b.title}» из каталога?`)) {
                          deleteBouquet(b.id);
                        }
                      }}
                      className="p-2 text-white/40 hover:text-red-400 transition-colors"
                      title="Удалить позицию"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. CLIENTS TAB */}
        {activeTab === 'clients' && (
          <div className="flex-1 overflow-y-auto pt-4 flex flex-col pr-1">
            {/* Top Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  Всего клиентов в базе
                </span>
                <span className="font-serif text-3xl text-white font-normal">
                  {allCustomers.length} человек
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  Общая сумма заказов
                </span>
                <span className="font-serif text-3xl text-white font-normal">
                  {totalRevenue.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
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
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени, фамилии или номеру телефона..."
                className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/15 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Clients List */}
            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/50">
                  По вашему запросу клиенты не найдены
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-xl text-white font-normal">
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="px-2 py-0.5 border border-[#C5A880]/30 text-[#C5A880] text-[10px] uppercase tracking-wider rounded">
                          {c.tier} статус
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-white/60 font-light">
                        <span className="text-white font-mono">{c.phone}</span>
                        {c.birthDate && (
                          <>
                            <span>•</span>
                            <span>ДР: {new Date(c.birthDate).toLocaleDateString('ru-RU')}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>В клубе с {c.registeredAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                          Куплено на сумму
                        </span>
                        <span className="font-serif text-lg text-white font-normal">
                          {c.totalSpent.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="text-[11px] text-[#C5A880] block">
                          {c.ordersCount} заказов • Скидка {c.discountPercent}%
                        </span>
                      </div>

                      <a
                        href={`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Здравствуйте, ${c.firstName}! Салон цветов «София» на связи. Рады видеть вас в нашем клубе привилегий.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 shadow"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
