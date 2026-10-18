import React, { useState } from 'react';
import { X, Users, MessageCircle, Phone, Search, Award, TrendingUp, Sparkles, Package, Plus, Trash2, CheckCircle2, Image as ImageIcon, Check, Star, Eye, EyeOff, RotateCcw, Lock, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { useReviews } from '../../context/ReviewsContext';
import { calculateLoyaltyTier } from '../../types/customer';
import { Bouquet } from '../../types/figma-app';
import { CustomerDatabaseService } from '../../services/customerDb';

interface SalonAdminClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalonAdminClientsModal: React.FC<SalonAdminClientsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { allCustomers, refreshCustomers } = useAuth();
  const { bouquets, addBouquet, deleteBouquet, toggleStock, clearAllBouquets, resetToDefault } = useCatalog();
  const { reviews, publishedReviews, addReview, deleteReview, togglePublished, resetToDefault: resetReviewsToDefault } = useReviews();

  // Security Gate PIN State (Default PIN: 3235 — last 4 digits of salon phone)
  const MASTER_PIN = '3235';
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('sophiya_crm_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<'catalog' | 'reviews' | 'clients'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddBouquetOpen, setIsAddBouquetOpen] = useState(false);
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);

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

  // New Review Form State
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewDate, setReviewDate] = useState('Сегодня');
  const [reviewBouquet, setReviewBouquet] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewIsVerified, setReviewIsVerified] = useState(true);
  const [reviewIsPublished, setReviewIsPublished] = useState(true);

  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === MASTER_PIN) {
      setIsUnlocked(true);
      setPinError(false);
      try {
        sessionStorage.setItem('sophiya_crm_unlocked', 'true');
      } catch (err) {
        console.error(err);
      }
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPinInput('');
    try {
      sessionStorage.removeItem('sophiya_crm_unlocked');
    } catch (err) {
      console.error(err);
    }
    onClose();
  };

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

  // Filter reviews
  const filteredReviews = reviews.filter(
    (r) =>
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.bouquetTitle && r.bouquetTitle.toLowerCase().includes(searchQuery.toLowerCase()))
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
    setSuccessNotice('Новый букет успешно добавлен в витрину и доступен для заказа!');
    setIsSuccessMessage(true);
    setTimeout(() => setIsSuccessMessage(false), 3000);
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;

    addReview({
      author: reviewAuthor.trim(),
      rating: reviewRating,
      date: reviewDate.trim() || 'Сегодня',
      bouquetTitle: reviewBouquet.trim() || undefined,
      comment: reviewComment.trim(),
      isVerified: reviewIsVerified,
      isPublished: reviewIsPublished,
    });

    setReviewAuthor('');
    setReviewComment('');
    setReviewBouquet('');
    setIsAddReviewOpen(false);
    setSuccessNotice('Отзыв успешно добавлен и сохранен в системе!');
    setIsSuccessMessage(true);
    setTimeout(() => setIsSuccessMessage(false), 3000);
  };

  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none font-sans">
        <div className="relative w-full max-w-md bg-[#1C1215] border border-white/15 p-6 sm:p-8 shadow-2xl text-white rounded-3xl overflow-hidden text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-[#6C1E26] border border-[#C5A880]/30 flex items-center justify-center mx-auto mb-4 shadow-lg text-[#C5A880]">
            <Lock className="w-7 h-7" />
          </div>

          <span className="px-2.5 py-0.5 bg-[#6C1E26] text-[10px] uppercase tracking-widest text-white font-medium rounded inline-block mb-2">
            Закрытая зона управления
          </span>

          <h3 className="font-serif text-2xl text-white font-normal mb-1">
            Вход для владелицы салона
          </h3>
          <p className="text-xs text-white/60 font-light mb-6">
            Введите персональный PIN-код доступа для входа в панель управления
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="PIN-код"
                className={`w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 bg-white/5 border rounded-2xl text-white placeholder-white/30 focus:outline-none transition-colors ${
                  pinError
                    ? 'border-red-500 focus:border-red-500 bg-red-950/20'
                    : 'border-white/15 focus:border-[#C5A880]'
                }`}
              />
              {pinError && (
                <p className="text-red-400 text-xs mt-2 animate-fadeIn">
                  Неверный PIN-код доступа. Попробуйте снова.
                </p>
              )}
            </div>

            <p className="text-[11px] text-white/40 font-light">
              Подсказка: последние 4 цифры официального телефона (3235)
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-[#6C1E26] hover:bg-[#851D28] text-xs text-white font-medium transition-colors shadow-lg"
              >
                Войти в CRM
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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

          <div className="flex items-center gap-2">
            <button
              onClick={handleLock}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-light transition-colors flex items-center gap-1.5"
              title="Заблокировать CRM и выйти"
            >
              <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="hidden sm:inline">Выйти из CRM</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Каталог букетов vs Отзывы клиентов vs База клиентов */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setActiveTab('catalog');
              setIsAddBouquetOpen(false);
              setIsAddReviewOpen(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'catalog'
                ? 'bg-[#6C1E26] text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Каталог букетов ({bouquets.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reviews');
              setIsAddBouquetOpen(false);
              setIsAddReviewOpen(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'reviews'
                ? 'bg-[#6C1E26] text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Отзывы клиентов ({reviews.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('clients');
              setIsAddBouquetOpen(false);
              setIsAddReviewOpen(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'clients'
                ? 'bg-[#6C1E26] text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>База клиентов ({allCustomers.length})</span>
          </button>
        </div>

        {isSuccessMessage && (
          <div className="mt-3 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successNotice || 'Действие успешно выполнено!'}</span>
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

            {/* Search Input & Bulk Actions */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию или цветам в букете..."
                  className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/15 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {bouquets.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Удалить все демо-букеты из каталога, чтобы добавить свои с нуля?')) {
                      clearAllBouquets();
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-200 text-xs transition-colors shrink-0 flex items-center gap-1.5"
                  title="Очистить все демо-букеты"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Очистить демо</span>
                </button>
              )}

              {bouquets.length === 0 && (
                <button
                  type="button"
                  onClick={resetToDefault}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 text-xs transition-colors shrink-0"
                >
                  Восстановить демо
                </button>
              )}
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

        {/* 2. REVIEWS MANAGEMENT TAB */}
        {activeTab === 'reviews' && (
          <div className="flex-1 overflow-y-auto pt-4 flex flex-col pr-1">
            {/* Top Metrics & Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block">Всего отзывов</span>
                <span className="font-serif text-2xl text-white font-normal">{reviews.length} отзывов</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 block">Опубликовано на сайте</span>
                <span className="font-serif text-2xl text-emerald-300 font-normal">{publishedReviews.length} отзывов</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-amber-300 block">Средний рейтинг</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-serif text-2xl text-amber-200 font-normal">
                    {reviews.length > 0
                      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                      : '5.0'}
                  </span>
                  <span className="text-xs text-white/40">/ 5.0</span>
                </div>
              </div>

              <button
                onClick={() => setIsAddReviewOpen(!isAddReviewOpen)}
                className="p-3.5 rounded-2xl bg-[#6C1E26] hover:bg-[#851D28] text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Добавить отзыв</span>
              </button>
            </div>

            {/* Creation Form for Reviews */}
            {isAddReviewOpen && (
              <form onSubmit={handleCreateReview} className="mb-6 p-5 rounded-2xl bg-black/40 border border-[#6C1E26]/50 shadow-xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="font-serif text-lg text-[#C5A880]">Добавление отзыва клиента</h4>
                  <button
                    type="button"
                    onClick={() => setIsAddReviewOpen(false)}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Отмена
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Имя клиента *</label>
                    <input
                      type="text"
                      required
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      placeholder="Например: Алина Сафина"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Оценка (звёзды) *</label>
                    <div className="flex items-center gap-2 py-1.5">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReviewRating(val)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              val <= reviewRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-white/20'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-[#C5A880] ml-2 font-medium">{reviewRating} из 5</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1">Букет из заказа</label>
                    <input
                      type="text"
                      value={reviewBouquet}
                      onChange={(e) => setReviewBouquet(e.target.value)}
                      placeholder="Например: Букет «Аделин»"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white/70 mb-1">Текст отзыва *</label>
                  <textarea
                    rows={3}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Напишите впечатление клиента о цветах, доставке и свежести букета..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80">
                      <input
                        type="checkbox"
                        checked={reviewIsVerified}
                        onChange={(e) => setReviewIsVerified(e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-[#6C1E26] focus:ring-0"
                      />
                      <span>Отметка «Проверенный заказ»</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80">
                      <input
                        type="checkbox"
                        checked={reviewIsPublished}
                        onChange={(e) => setReviewIsPublished(e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-[#6C1E26] focus:ring-0"
                      />
                      <span>Опубликовать на витрине сайта</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddReviewOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#6C1E26] hover:bg-[#851D28] text-xs text-white font-medium transition-colors shadow-lg"
                    >
                      Сохранить отзыв
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Search and Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по автору, букету или тексту отзыва..."
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <button
                onClick={() => {
                  if (confirm('Восстановить исходные отзывы салона?')) {
                    resetReviewsToDefault();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-light transition-colors flex items-center gap-1.5 shrink-0"
                title="Восстановить демо-отзывы"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Восстановить демо</span>
              </button>
            </div>

            {/* Reviews List */}
            <div className="space-y-3 pb-6">
              {filteredReviews.length === 0 ? (
                <div className="p-8 text-center text-white/40 border border-white/10 rounded-2xl">
                  По вашему запросу отзывы не найдены
                </div>
              ) : (
                filteredReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>

                        <span className="font-serif text-lg text-white font-normal ml-1">
                          {rev.author}
                        </span>

                        {rev.bouquetTitle && (
                          <span className="px-2 py-0.5 bg-[#6C1E26]/40 border border-[#6C1E26] text-[#C5A880] text-[10px] rounded-full">
                            {rev.bouquetTitle}
                          </span>
                        )}

                        {rev.isVerified && (
                          <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Проверен</span>
                          </span>
                        )}

                        <span className="text-[11px] text-white/40 font-light ml-auto md:ml-2">
                          {rev.date}
                        </span>
                      </div>

                      <p className="text-white/80 font-light text-xs leading-relaxed">
                        «{rev.comment}»
                      </p>
                    </div>

                    {/* Actions: Toggle Publish + Delete */}
                    <div className="flex items-center gap-3 border-t md:border-t-0 border-white/10 pt-3 md:pt-0 shrink-0">
                      <button
                        onClick={() => togglePublished(rev.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                          rev.isPublished
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50'
                            : 'bg-white/10 text-white/50 border border-white/10 hover:bg-white/20 hover:text-white'
                        }`}
                        title={rev.isPublished ? 'Нажмите, чтобы скрыть с сайта' : 'Нажмите, чтобы опубликовать на сайте'}
                      >
                        {rev.isPublished ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>На сайте</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Скрыт</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Удалить отзыв от «${rev.author}»?`)) {
                            deleteReview(rev.id);
                          }
                        }}
                        className="p-2 text-white/40 hover:text-red-400 transition-colors"
                        title="Удалить отзыв"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. CLIENTS TAB */}
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

            {/* Search Bar & Cloud Sync Button */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени, фамилии или номеру телефона..."
                  className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/15 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-[#C5A880]"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  await refreshCustomers();
                  setSuccessNotice('База клиентов синхронизирована с облаком');
                  setIsSuccessMessage(true);
                  setTimeout(() => setIsSuccessMessage(false), 2500);
                }}
                className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/80 hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
                title="Синхронизировать базу клиентов с сервером"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">Синхронизировать</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (allCustomers.length === 0) {
                    alert('В базе пока нет клиентов для выгрузки.');
                    return;
                  }
                  CustomerDatabaseService.exportToCSV(allCustomers);
                  setSuccessNotice(`Файл базы (${allCustomers.length} клиентов) скачан на ваш компьютер!`);
                  setIsSuccessMessage(true);
                  setTimeout(() => setIsSuccessMessage(false), 3000);
                }}
                className="px-3 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 hover:text-white flex items-center gap-1.5 transition-colors shrink-0 shadow"
                title="Скачать резервную копию всей базы клиентов в файл Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Экспорт в Excel (CSV)</span>
              </button>
            </div>

            {/* Clients List */}
            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="py-16 text-center text-xs text-white/50 flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 text-white/20" />
                  <span className="max-w-md">
                    {searchQuery
                      ? 'По вашему запросу клиенты не найдены'
                      : 'В базе пока нет зарегистрированных клиентов. Новые гости появятся здесь автоматически после оформления клубной карты на сайте.'}
                  </span>
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
