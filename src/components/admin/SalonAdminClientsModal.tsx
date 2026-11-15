import React, { useState, useEffect } from 'react';
import { X, Users, MessageCircle, Phone, Search, Award, TrendingUp, Sparkles, Package, Plus, Trash2, CheckCircle2, AlertCircle, Image as ImageIcon, Check, Star, Eye, EyeOff, RotateCcw, Lock, Download, RefreshCw, Pencil, ShoppingBag, CreditCard, Truck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { useReviews } from '../../context/ReviewsContext';
import { calculateLoyaltyTier } from '../../types/customer';
import { Bouquet } from '../../types/figma-app';
import { CustomerDatabaseService } from '../../services/customerDb';
import { getApiUrl } from '../../config/api';

interface SalonAdminClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalonAdminClientsModal: React.FC<SalonAdminClientsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { allCustomers, refreshCustomers } = useAuth();
  const { bouquets, addBouquet, updateBouquet, deleteBouquet, toggleStock, clearAllBouquets, resetToDefault, isSyncing, lastSyncedAt, syncCatalog, refreshCatalog } = useCatalog();
  const { reviews, publishedReviews, pendingReviews, addReview, deleteReview, togglePublished, moderateReview, refreshReviews, refreshPending } = useReviews();

  // Security Gate Server Auth State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const isTokenExpired = (token: string|null): boolean => {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return true;
      const base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      if (payload.exp && Date.now() > payload.exp) {
        return true;
      }
      return false;
    } catch {
      return true;
    }
  };

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      const token = sessionStorage.getItem('sophiya_admin_token');
      if (!token || isTokenExpired(token)) {
        sessionStorage.removeItem('sophiya_admin_token');
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleExpired = () => {
      setIsUnlocked(false);
      setPinError('Время сессии истекло. Пожалуйста, введите пароль снова.');
    };
    window.addEventListener('sophiya_admin_session_expired', handleExpired);
    return () => window.removeEventListener('sophiya_admin_session_expired', handleExpired);
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      refreshReviews();
      refreshPending();
    }
  }, [isUnlocked, refreshReviews, refreshPending]);

  const [activeTab, setActiveTab] = useState<'catalog'|'orders'|'reviews'|'clients'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddBouquetOpen, setIsAddBouquetOpen] = useState(false);
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);

  // Online Orders State
  const [orders, setOrders] = useState<Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    customerName: string;
    phone: string;
    deliveryType: 'delivery'|'pickup';
    address?: string;
    deliveryDate: string;
    items: Array<{ title: string; quantity: number; price: number }>;
    totalAmount: number;
    paymentMethod: 'sbp'|'card'|'sberpay';
    paymentStatus: 'paid'|'pending';
    orderStatus: 'new'|'assembling'|'in_transit'|'delivered';
    postcardText?: string;
  }>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sophiya_admin_orders_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return [
      {
        id: 'ord_1',
        orderNumber: '№ 8492',
        createdAt: 'Сегодня, 21:40',
        customerName: 'Айрат Мингазов',
        phone: '+7 (917) 256-42-18',
        deliveryType: 'delivery',
        address: 'г. Нижнекамск, пр. Мира, 48, кв. 112',
        deliveryDate: 'Завтра, 10:00 - 12:00',
        items: [
          { title: '«Розовая мечта» большой букет из хризантемы', quantity: 1, price: 4100 },
        ],
        totalAmount: 4100,
        paymentMethod: 'sbp',
        paymentStatus: 'paid',
        orderStatus: 'assembling',
        postcardText: 'Любимой мамочке с днем рождения! Спасибо за твою теплоту и заботу.',
      },
      {
        id: 'ord_2',
        orderNumber: '№ 8491',
        createdAt: 'Сегодня, 19:15',
        customerName: 'Руслан Зарипов',
        phone: '+7 (987) 415-33-90',
        deliveryType: 'pickup',
        address: 'Самовывоз из салона (пр. Шинников, 13В)',
        deliveryDate: 'Завтра к 13:30',
        items: [
          { title: 'Букет 11 красных роз Ред Наоми', quantity: 1, price: 2700 },
        ],
        totalAmount: 2700,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'new',
        postcardText: '',
      },
      {
        id: 'ord_3',
        orderNumber: '№ 8488',
        createdAt: '15 ноября, 14:20',
        customerName: 'Диана Султанова',
        phone: '+7 (905) 311-88-24',
        deliveryType: 'delivery',
        address: 'г. Нижнекамск, ул. Сююмбике, 9, подъезд 2',
        deliveryDate: '15 ноября к 18:00',
        items: [
          { title: 'Букет с короной и шары сердца', quantity: 1, price: 8300 },
        ],
        totalAmount: 8300,
        paymentMethod: 'sberpay',
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        postcardText: 'С юбилеем нашей свадьбы! Люблю бесконечно.',
      },
      {
        id: 'ord_4',
        orderNumber: '№ 8485',
        createdAt: '14 ноября, 16:50',
        customerName: 'Екатерина Петрова',
        phone: '+7 (919) 628-90-11',
        deliveryType: 'delivery',
        address: 'г. Нижнекамск, ул. Строителей, 32, кв. 44',
        deliveryDate: '14 ноября, 19:00',
        items: [
          { title: 'Авторский букет 3 кустовых пионовидных роз', quantity: 1, price: 3500 },
        ],
        totalAmount: 3500,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        postcardText: 'С днем учителя!',
      },
    ];
  });

  const [orderFilter, setOrderFilter] = useState<'all'|'new'|'assembling'|'in_transit'|'delivered'>('all');
  const [orderSearch, setOrderSearch] = useState('');

  const handleUpdateOrderStatus = (orderId: string, newStatus: 'new'|'assembling'|'in_transit'|'delivered') => {
    setOrders((prev) => {
      const updated = prev.map((ord) => (ord.id === orderId ? { ...ord, orderStatus: newStatus } : ord));
      try {
        localStorage.setItem('sophiya_admin_orders_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    triggerSuccess('Статус заказа успешно обновлен!');
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.orderStatus !== orderFilter) return false;
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      (o.address && o.address.toLowerCase().includes(q))
    );
  });

  // Notifications State
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessNotice(msg);
    setIsSuccessMessage(true);
    setTimeout(() => setIsSuccessMessage(false), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setIsErrorMessage(true);
    setTimeout(() => setIsErrorMessage(false), 6000);
  };

  // New Bouquet Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState<number|''>('');
  const [newCategory, setNewCategory] = useState<'Монобукеты'|'Авторские'|'Коробки'|'Корзины'>('Авторские');
  const [newColor, setNewColor] = useState('Розовый');
  const [newHeight, setNewHeight] = useState('50 см');
  const [newComposition, setNewComposition] = useState('');
  const [newDurability, setNewDurability] = useState('10-14 дней');
  const [newPackaging, setNewPackaging] = useState('Фирменная дизайнерская упаковка «София»');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState('/bouquet-1.jpg');
  const [imageCompressionNotice, setImageCompressionNotice] = useState<string>('');
  const [isSavingBouquet, setIsSavingBouquet] = useState(false);

  // Edit Bouquet Form State
  const [editingBouquet, setEditingBouquet] = useState<Bouquet|null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState<number|''>('');
  const [editCategory, setEditCategory] = useState<'Монобукеты'|'Авторские'|'Коробки'|'Корзины'>('Авторские');
  const [editColor, setEditColor] = useState('Розовый');
  const [editHeight, setEditHeight] = useState('50 см');
  const [editComposition, setEditComposition] = useState('');
  const [editDurability, setEditDurability] = useState('10-14 дней');
  const [editPackaging, setEditPackaging] = useState('Фирменная дизайнерская упаковка «София»');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState('/bouquet-1.jpg');
  const [editCompressionNotice, setEditCompressionNotice] = useState<string>('');
  const [isUpdatingBouquet, setIsUpdatingBouquet] = useState(false);

  const handleStartEdit = (b: Bouquet) => {
    setEditingBouquet(b);
    setEditTitle(b.title);
    setEditPrice(b.price);
    setEditCategory((b.category as any) || 'Авторские');
    setEditColor((b.color as any) || 'Розовый');
    setEditHeight(b.characteristics?.height || '50 см');
    setEditComposition(b.characteristics?.flowersCount || '');
    setEditDurability(b.characteristics?.durability || '10-14 дней');
    setEditPackaging(b.characteristics?.packaging || 'Фирменная дизайнерская упаковка «София»');
    setEditDescription(b.description || '');
    setEditImage(b.image || '/bouquet-1.jpg');
    setEditCompressionNotice('');
    setIsAddBouquetOpen(false);
  };

  // New Review Form State
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewDate, setReviewDate] = useState('Сегодня');
  const [reviewBouquet, setReviewBouquet] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewIsVerified, setReviewIsVerified] = useState(true);
  const [reviewIsPublished, setReviewIsPublished] = useState(true);

  const handleUnlock = async (e?: React.FormEvent, bypassPin?: string) => {
    if (e) e.preventDefault();
    const pin = (bypassPin || pinInput).trim();
    if (!pin) {
      setPinError('Введите PIN-код доступа');
      return;
    }

    setIsAuthenticating(true);
    setPinError('');

    try {
      const res = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pin, honeypot: '' }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.token) {
        setIsUnlocked(true);
        setPinError('');
        setPinInput('');
        sessionStorage.setItem('sophiya_admin_token', data.token);
        refreshCustomers();
        refreshReviews();
        refreshPending();
      } else {
        setPinError(data.error || 'Неверный пароль доступа. Попробуйте снова.');
        setPinInput('');
      }
    } catch (err) {
      console.error('Login request failed:', err);
      setPinError('Не удалось подключиться к серверу авторизации.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPinInput('');
    setPinError('');
    try {
      sessionStorage.removeItem('sophiya_admin_token');
      sessionStorage.removeItem('sophiya_crm_unlocked');
      localStorage.removeItem('sophiya_crm_unlocked');
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
      setImageCompressionNotice('Оптимизация изображения...');
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const rawResult = reader.result;
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const maxDim = 720;
              let width = img.width;
              let height = img.height;
              if (width > height) {
                if (width > maxDim) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                }
              } else {
                if (height > maxDim) {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                let compressed = canvas.toDataURL('image/webp', 0.75);
                if (!compressed.startsWith('data:image/webp')) {
                  compressed = canvas.toDataURL('image/jpeg', 0.72);
                }
                if (compressed.length > 180000) {
                  compressed = canvas.toDataURL('image/jpeg', 0.64);
                }
                const approxKb = Math.round((compressed.length * 3) / 4 / 1024);
                setImageCompressionNotice(`✓ Сжато: ~${approxKb} КБ (мгновенная загрузка)`);
                setNewImage(compressed);
              } else {
                setNewImage(rawResult);
                setImageCompressionNotice('');
              }
            } catch {
              setNewImage(rawResult);
              setImageCompressionNotice('');
            }
          };
          img.onerror = () => {
            setNewImage(rawResult);
            setImageCompressionNotice('');
          };
          img.src = rawResult;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBouquet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice || isSavingBouquet) return;

    setIsSavingBouquet(true);
    try {
      await addBouquet({
        title: newTitle.trim(),
        price: Number(newPrice),
        category: newCategory,
        color: newColor,
        inStock: true,
        image: newImage,
        hasRealPhoto: true,
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
      triggerSuccess('Новый букет успешно добавлен и синхронизирован со всеми устройствами!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось сохранить в облако.';
      triggerError(msg);
    } finally {
      setIsSavingBouquet(false);
    }
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditCompressionNotice('Оптимизация изображения...');
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const rawResult = reader.result;
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const maxDim = 720;
              let width = img.width;
              let height = img.height;
              if (width > height) {
                if (width > maxDim) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                }
              } else {
                if (height > maxDim) {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                let compressed = canvas.toDataURL('image/webp', 0.75);
                if (!compressed.startsWith('data:image/webp')) {
                  compressed = canvas.toDataURL('image/jpeg', 0.72);
                }
                if (compressed.length > 180000) {
                  compressed = canvas.toDataURL('image/jpeg', 0.64);
                }
                const approxKb = Math.round((compressed.length * 3) / 4 / 1024);
                setEditCompressionNotice(`✓ Новое фото готово (~${approxKb} КБ)`);
                setEditImage(compressed);
              } else {
                setEditImage(rawResult);
                setEditCompressionNotice('');
              }
            } catch {
              setEditImage(rawResult);
              setEditCompressionNotice('');
            }
          };
          img.onerror = () => {
            setEditImage(rawResult);
            setEditCompressionNotice('');
          };
          img.src = rawResult;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBouquetEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBouquet || !editTitle.trim() || !editPrice || isUpdatingBouquet) return;

    setIsUpdatingBouquet(true);
    try {
      await updateBouquet(editingBouquet.id, {
        title: editTitle.trim(),
        price: Number(editPrice),
        category: editCategory,
        color: editColor,
        image: editImage,
        description: editDescription.trim() || 'Авторская флористическая композиция из свежей поставки цветов высшей категории.',
        characteristics: {
          height: editHeight.trim() || '50 см',
          flowersCount: editComposition.trim() || 'Отборные сортовые цветы',
          durability: editDurability.trim() || '10-14 дней',
          packaging: editPackaging.trim() || 'Фирменная дизайнерская упаковка «София»',
        },
      });

      triggerSuccess(`Букет «${editTitle.trim()}» успешно обновлен на сайте!`);
      setEditingBouquet(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось обновить букет в облачной базе.';
      triggerError(msg);
    } finally {
      setIsUpdatingBouquet(false);
    }
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fadeIn select-none font-sans">
        <div className="relative w-full max-w-md bg-[#1C1215] border border-white/15 p-6 sm:p-8 shadow-2xl text-white rounded-xl overflow-hidden text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-xl bg-[#6C1E26] border border-[#C5A880]/30 flex items-center justify-center mx-auto mb-4 shadow-lg text-[#C5A880]">
            <Lock className="w-7 h-7" />
          </div>

          <span className="px-2.5 py-0.5 bg-[#6C1E26] text-[10px] uppercase tracking-widest text-white font-medium rounded inline-block mb-2">
            Закрытая зона управления
          </span>

          <h3 className="font-sans font-medium text-2xl text-white font-normal mb-1">
            Вход для владелицы салона
          </h3>
          <p className="text-xs text-white/60 font-light mb-6">
            Введите персональный PIN-код доступа для входа в панель управления
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={32}
                autoFocus
                disabled={isAuthenticating}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                placeholder="Пароль доступа"
                className={`w-full text-center tracking-wider font-sans text-base py-3 px-4 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none transition-colors ${
                  pinError
                    ? 'border-red-500 focus:border-red-500 bg-red-950/20'
                    : 'border-white/15 focus:border-[#C5A880]'
                }`}
              />
              {/* Invisible bot honeypot input */}
              <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              {pinError && (
                <p className="text-red-400 text-xs mt-2 animate-fadeIn text-center">
                  {pinError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isAuthenticating}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                disabled={isAuthenticating}
                className="flex-1 py-3 px-4 rounded-xl bg-[#6C1E26] hover:bg-[#851D28] text-xs text-white font-semibold transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Проверка...</span>
                  </>
                ) : (
                  <span>Войти в CRM</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-5xl bg-[#1C1215] border border-white/15 p-6 sm:p-8 shadow-2xl text-white max-h-[92vh] flex flex-col rounded-xl overflow-hidden">
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
            <h3 className="font-sans font-medium text-2xl sm:text-3xl text-white font-normal">
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
              className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shrink-0 ${
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
              setActiveTab('orders');
              setIsAddBouquetOpen(false);
              setIsAddReviewOpen(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'orders'
                ? 'bg-[#6C1E26] text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Заказы онлайн ({orders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reviews');
              setIsAddBouquetOpen(false);
              setIsAddReviewOpen(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shrink-0 ${
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 shrink-0 ${
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
          <div className="mt-3 p-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice || 'Действие успешно выполнено!'}</span>
          </div>
        )}

        {isErrorMessage && (
          <div className="mt-3 p-3 bg-[#3A0A10]/90 border border-[#8E2433] text-rose-200 text-xs rounded-xl flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage || 'Произошла ошибка при выполнении операции.'}</span>
            </div>
            {isAddBouquetOpen && (
              <button
                type="button"
                onClick={() => handleCreateBouquet({ preventDefault: () => {} } as any)}
                disabled={isSavingBouquet}
                className="px-3 py-1 bg-[#8E2433] hover:bg-[#A32A3B] text-white rounded-lg font-medium text-[11px] shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSavingBouquet ? 'Сохранение...' : 'Повторить попытку'}
              </button>
            )}
            {editingBouquet && (
              <button
                type="button"
                onClick={() => handleSaveBouquetEdit({ preventDefault: () => {} } as any)}
                disabled={isUpdatingBouquet}
                className="px-3 py-1 bg-[#8E2433] hover:bg-[#A32A3B] text-white rounded-lg font-medium text-[11px] shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingBouquet ? 'Сохранение...' : 'Повторить попытку'}
              </button>
            )}
          </div>
        )}

        {/* 1. CATALOG MANAGEMENT TAB */}
        {activeTab === 'catalog' && (
          <div className="flex-1 overflow-y-auto pt-4 flex flex-col pr-1">
            {/* Helpful instructions banner */}
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-[#6C1E26]/20 border border-[#C5A880]/30 text-white text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span>Подсказка: чтобы изменить фото, цену или состав букета — нажмите кнопку <strong>«Изменить»</strong> на карточке любого букета.</span>
              </span>
            </div>
            {/* Top Metrics & Add Action */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block">Всего позиций</span>
                <span className="font-sans font-medium text-2xl text-white font-normal">{bouquets.length} букетов</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 block">В наличии в салоне</span>
                <span className="font-sans font-medium text-2xl text-emerald-300 font-normal">{inStockCount} букетов</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-amber-300 block">Под заказ</span>
                <span className="font-sans font-medium text-2xl text-amber-200 font-normal">{bouquets.length - inStockCount} букетов</span>
              </div>

              <button
                onClick={() => setIsAddBouquetOpen(!isAddBouquetOpen)}
                className="p-3.5 rounded-xl bg-[#6C1E26] hover:bg-[#851D28] text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Добавить букет</span>
              </button>
            </div>

            {/* Creation Form (Collapsible) */}
            {isAddBouquetOpen && (
              <form onSubmit={handleCreateBouquet} className="mb-6 p-5 rounded-xl bg-black/40 border border-[#6C1E26]/50 shadow-xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="font-sans font-medium text-lg text-[#C5A880]">Добавление нового букета в салон</h4>
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
                      className="w-16 h-16 rounded-xl object-cover border border-white/20 bg-[#2A181C] shrink-0"
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
                      {imageCompressionNotice ? (
                        <span className="block text-[11px] text-emerald-400 font-medium mt-1">
                          {imageCompressionNotice}
                        </span>
                      ) : (
                        <span className="block text-[10px] text-white/40 mt-1">
                          Фото автоматически сжимается до ~100–250 КБ для быстрой работы
                        </span>
                      )}
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
                    
                    disabled={isSavingBouquet}
                    className="px-6 py-2.5 rounded-xl bg-[#6C1E26] hover:bg-[#851D28] text-white text-xs font-semibold shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingBouquet ? 'Сохранение в облако...' : 'Опубликовать на сайт'}
                  </button>
                </div>
              </form>
            )}

            {/* Edit Bouquet Form (Collapsible / Focused) */}
            {editingBouquet && (
              <form onSubmit={handleSaveBouquetEdit} className="mb-6 p-5 rounded-xl bg-[#201014] border-2 border-[#C5A880]/80 shadow-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-[#C5A880]/30">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-[#C5A880]" />
                    <h4 className="font-sans font-medium text-lg text-[#FAF7F5]">
                      Редактирование: <span className="text-[#C5A880]">«{editingBouquet.title}»</span>
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingBouquet(null)}
                    className="text-xs text-white/60 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Закрыть
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-white/70 mb-1 font-medium">Название букета *</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Например: Букет 11 красных роз"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#C5A880] mb-1 font-semibold">Стоимость (₽) *</label>
                    <input
                      type="number"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value) || '')}
                      placeholder="9500"
                      className="w-full px-3 py-2 bg-white/15 border border-[#C5A880]/60 rounded-xl text-sm font-semibold text-[#FAF7F5] focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1 font-medium">Категория</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#2C1F22] border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
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
                    <label className="block text-[11px] text-white/70 mb-1 font-medium">Состав и количество цветов *</label>
                    <input
                      type="text"
                      value={editComposition}
                      onChange={(e) => setEditComposition(e.target.value)}
                      placeholder="Например: 11 красных роз Red Naomi + эвкалипт"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    />
                    <span className="block text-[10px] text-white/40 mt-0.5">Меняйте количество при смене объема букета</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1 font-medium">Высота / Размер</label>
                    <input
                      type="text"
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                      placeholder="50 см"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 mb-1 font-medium">Стойкость цветов</label>
                    <input
                      type="text"
                      value={editDurability}
                      onChange={(e) => setEditDurability(e.target.value)}
                      placeholder="10-14 дней"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>

                {/* Photo Replace & Preview */}
                <div className="p-3 rounded-xl bg-black/30 border border-white/10">
                  <label className="block text-[11px] text-white/70 mb-2 font-medium">Фотография букета</label>
                  <div className="flex items-center gap-4">
                    <img
                      src={editImage}
                      alt="Превью букета"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-[#C5A880]/50 bg-[#2A181C] shrink-0 shadow-md"
                    />

                    <div className="flex-1">
                      <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs text-white inline-flex items-center gap-2 transition-colors">
                        <ImageIcon className="w-4 h-4 text-[#C5A880]" />
                        <span className="font-medium">Заменить фото букета (JPG / PNG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageUpload}
                          className="hidden"
                        />
                      </label>
                      {editCompressionNotice ? (
                        <span className="block text-[11px] text-emerald-400 font-medium mt-1.5">
                          {editCompressionNotice}
                        </span>
                      ) : (
                        <span className="block text-[10px] text-white/40 mt-1">
                          Загрузите новое фото: оно автоматически оптимизируется для сайта
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white/70 mb-1 font-medium">Описание для покупателя</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Расскажите о сорте, аромате или поводе для подарка..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[11px] text-white/50">
                    ID позиции: <code className="text-[#C5A880]">{editingBouquet.id}</code>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingBouquet(null)}
                      className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      disabled={isUpdatingBouquet}
                      className="px-6 py-2.5 rounded-xl bg-[#8E2433] hover:bg-[#A32B3C] text-white text-xs font-semibold shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isUpdatingBouquet ? 'Сохранение в облако...' : 'Сохранить изменения'}</span>
                    </button>
                  </div>
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

              {/* Cloud Sync Button */}
              <button
                type="button"
                onClick={async () => {
                  const ok = await syncCatalog();
                  if (ok) {
                    setSuccessNotice('Каталог успешно синхронизирован с облаком для всех покупателей');
                    setIsSuccessMessage(true);
                    setTimeout(() => setIsSuccessMessage(false), 2500);
                  }
                }}
                disabled={isSyncing}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Синхронизировать весь каталог с облачной базой"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#C5A880] ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Синхронизация</span>
              </button>

              {/* Refresh from cloud button */}
              <button
                type="button"
                onClick={async () => {
                  await refreshCatalog();
                  setSuccessNotice('Каталог обновлен из облачной базы данных');
                  setIsSuccessMessage(true);
                  setTimeout(() => setIsSuccessMessage(false), 2000);
                }}
                disabled={isSyncing}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Загрузить свежие букеты из облачной базы"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-[#C5A880] ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Обновить</span>
              </button>

              {/* Backup & Export Button */}
              <button
                type="button"
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bouquets, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `sophiya_catalog_backup_${new Date().toISOString().slice(0, 10)}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                title="Скачать резервную копию всех букетов"
              >
                <Download className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">Бэкап</span>
              </button>

              {bouquets.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (true) {
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
                  className="px-3.5 py-2.5 rounded-xl bg-[#2A181C] hover:bg-white/10 border border-white/20 text-white/70 text-xs transition-colors shrink-0"
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
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                    editingBouquet?.id === b.id
                      ? 'bg-[#2A1218] border-[#C5A880] shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={b.image}
                      alt={b.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#2A181C]"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-medium text-base text-white font-medium">{b.title}</span>
                        <span className="text-[10px] text-white/50 bg-black/30 px-2 py-0.5 rounded">
                          {b.category}
                        </span>
                      </div>
                      <span className="text-white/50 text-[11px] block mt-0.5">
                        {b.characteristics.flowersCount} — {b.characteristics.height}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                    <span className="font-sans font-medium text-lg text-[#C5A880] font-semibold">
                      {b.price.toLocaleString('ru-RU')} ₽
                    </span>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleStartEdit(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                        editingBouquet?.id === b.id
                          ? 'bg-[#C5A880] text-[#1C1215] font-semibold shadow'
                          : 'bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 hover:text-white hover:border-[#C5A880]/50'
                      }`}
                      title="Редактировать букет (цена, фото, состав, объем)"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Изменить</span>
                    </button>

                    {/* Stock Status Toggle */}
                    <button
                      onClick={() => toggleStock(b.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                        b.inStock
                          ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-[#2A181C] border border-white/20 text-white/50 hover:bg-white/10'
                      }`}
                      title="Нажмите, чтобы изменить статус"
                    >
                      {b.inStock ? '✓ В наличии' : '○ Под заказ'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={async () => {
                        await deleteBouquet(b.id);
                        triggerSuccess(`Букет «${b.title}» удален со всех устройств`);
                      }}
                      className="p-2 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
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

        {/* 2. Раздел онлайн-заказов */}
        {activeTab === 'orders' && (
          <div className="flex-1 overflow-y-auto pt-4 flex flex-col pr-1 animate-fadeIn">
            {/* Top Order Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block">Всего онлайн-заказов</span>
                <span className="font-sans font-medium text-2xl text-white font-normal">{orders.length}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 block">Оплачено клиентами</span>
                <span className="font-sans font-medium text-2xl text-emerald-300 font-normal">
                  {orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-amber-300 block">В работе флориста</span>
                <span className="font-sans font-medium text-2xl text-amber-200 font-normal">
                  {orders.filter((o) => o.orderStatus === 'new' || o.orderStatus === 'assembling' || o.orderStatus === 'in_transit').length}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-[#C5A880] block">Успешно доставлено</span>
                <span className="font-sans font-medium text-2xl text-[#FAF7F5] font-normal">
                  {orders.filter((o) => o.orderStatus === 'delivered').length}
                </span>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Поиск по номеру заказа, имени, телефону или адресу..."
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setOrderFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    orderFilter === 'all' ? 'bg-[#6C1E26] text-white shadow' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  Все ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('new')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    orderFilter === 'new' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  Новые ({orders.filter((o) => o.orderStatus === 'new').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('assembling')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    orderFilter === 'assembling' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  В сборке ({orders.filter((o) => o.orderStatus === 'assembling').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('in_transit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    orderFilter === 'in_transit' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  У курьера ({orders.filter((o) => o.orderStatus === 'in_transit').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('delivered')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    orderFilter === 'delivered' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  Доставлены ({orders.filter((o) => o.orderStatus === 'delivered').length})
                </button>
              </div>
            </div>

            {/* Orders Cards List */}
            <div className="space-y-3 pb-6">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-white/50 text-xs border border-white/10 rounded-xl bg-white/5">
                  Заказы по заданным фильтрам не найдены.
                </div>
              ) : (
                filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-colors space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-medium text-base text-white">{ord.orderNumber}</span>
                        <span className="text-[11px] text-white/40">{ord.createdAt}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>
                            {ord.paymentMethod === 'sbp' ? 'Оплачено через СБП' : ord.paymentMethod === 'sberpay' ? 'Оплачено через SberPay' : 'Оплачено банковской картой'}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            ord.orderStatus === 'new'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : ord.orderStatus === 'assembling'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : ord.orderStatus === 'in_transit'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : 'bg-white/10 text-white/70'
                          }`}
                        >
                          {ord.orderStatus === 'new'
                            ? 'Новый заказ (оплачен)'
                            : ord.orderStatus === 'assembling'
                            ? 'Флорист собирает букет'
                            : ord.orderStatus === 'in_transit'
                            ? 'Передан курьеру на доставку'
                            : 'Доставлен получателю'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-0.5">Покупатель</span>
                        <div className="text-white font-medium">{ord.customerName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${ord.phone.replace(/[^0-9+]/g, '')}`}
                            className="text-[11px] text-[#C5A880] hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{ord.phone}</span>
                          </a>
                          <a
                            href={`https://wa.me/${ord.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 transition-colors"
                            title="Открыть WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-0.5">Получение и адрес</span>
                        <div className="text-white">
                          {ord.deliveryType === 'delivery' ? `Курьер: ${ord.address}` : ord.address}
                        </div>
                        <div className="text-white/60 text-[11px] mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#C5A880]" />
                          <span>{ord.deliveryDate}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-0.5">Состав заказа</span>
                        {ord.items.map((item, i) => (
                          <div key={i} className="text-white flex items-center justify-between">
                            <span>{item.title}</span>
                            <span className="text-white/60">{item.quantity} шт. × {item.price.toLocaleString('ru-RU')} ₽</span>
                          </div>
                        ))}
                        <div className="mt-1 pt-1 border-t border-white/10 flex justify-between font-medium text-[#C5A880]">
                          <span>Итого к выдаче:</span>
                          <span>{ord.totalAmount.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      </div>
                    </div>

                    {ord.postcardText && (
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                        <span className="text-[10px] uppercase tracking-wider text-[#C5A880] block mb-0.5">Текст открытки к букету:</span>
                        <p className="text-white/90 italic">«{ord.postcardText}»</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                      <div className="text-[11px] text-white/40">
                        Действия с заказом:
                      </div>
                      <div className="flex items-center gap-2">
                        {ord.orderStatus === 'new' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, 'assembling')}
                            className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 text-xs font-medium border border-amber-500/40 transition-colors"
                          >
                            Взять в сборку флористом →
                          </button>
                        )}
                        {ord.orderStatus === 'assembling' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, 'in_transit')}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-medium border border-blue-500/40 transition-colors"
                          >
                            Передать курьеру на доставку →
                          </button>
                        )}
                        {ord.orderStatus === 'in_transit' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-200 text-xs font-medium border border-emerald-500/40 transition-colors"
                          >
                            Отметить: «Заказ доставлен» ✓
                          </button>
                        )}
                        {ord.orderStatus === 'delivered' && (
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Заказ успешно завершен</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. REVIEWS MANAGEMENT TAB */}
        {activeTab === 'reviews' && (
          <div className="flex-1 overflow-y-auto pt-4 flex flex-col pr-1">
            {/* Top Metrics & Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block">Всего отзывов</span>
                <span className="font-sans font-medium text-2xl text-white font-normal">{reviews.length} отзывов</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 block">Опубликовано на сайте</span>
                <span className="font-sans font-medium text-2xl text-emerald-300 font-normal">{publishedReviews.length} отзывов</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-amber-300 block">Средний рейтинг</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-sans font-medium text-2xl text-amber-200 font-normal">
                    {reviews.length > 0
                      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                      : '5.0'}
                  </span>
                  <span className="text-xs text-white/40">/ 5.0</span>
                </div>
              </div>

              <button
                onClick={() => setIsAddReviewOpen(!isAddReviewOpen)}
                className="p-3.5 rounded-xl bg-[#6C1E26] hover:bg-[#851D28] text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Добавить отзыв</span>
              </button>
            </div>

            {/* Creation Form for Reviews */}
            {isAddReviewOpen && (
              <form onSubmit={handleCreateReview} className="mb-6 p-5 rounded-xl bg-black/40 border border-[#6C1E26]/50 shadow-xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="font-sans font-medium text-lg text-[#C5A880]">Добавление отзыва клиента</h4>
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
            </div>

            {/* Pending moderation queue */}
            {pendingReviews.length > 0 && (
              <div className="mb-5 space-y-3">
                <span className="text-xs text-amber-300 block">
                  Ждут проверки: {pendingReviews.length}
                </span>
                {pendingReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                        <span className="font-sans font-medium text-lg text-white ml-1">{rev.author}</span>
                        {rev.bouquetTitle && (
                          <span className="px-2 py-0.5 bg-[#6C1E26]/40 border border-[#6C1E26] text-[#C5A880] text-[10px] rounded-lg">
                            {rev.bouquetTitle}
                          </span>
                        )}
                        <span className="text-[11px] text-white/40 font-light ml-auto md:ml-2">{rev.date}</span>
                      </div>
                      <p className="text-white/80 font-light text-xs leading-relaxed">«{rev.comment}»</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => moderateReview(rev.id, true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50 transition-colors"
                      >
                        Опубликовать
                      </button>
                      <button
                        onClick={() => moderateReview(rev.id, false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 text-white/70 border border-white/10 hover:text-red-300 hover:border-red-400/40 transition-colors"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-3 pb-6">
              {filteredReviews.length === 0 ? (
                <div className="p-8 text-center text-white/40 border border-white/10 rounded-xl">
                  По вашему запросу отзывы не найдены
                </div>
              ) : (
                filteredReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>

                        <span className="font-sans font-medium text-lg text-white font-normal ml-1">
                          {rev.author}
                        </span>

                        {rev.bouquetTitle && (
                          <span className="px-2 py-0.5 bg-[#6C1E26]/40 border border-[#6C1E26] text-[#C5A880] text-[10px] rounded-lg">
                            {rev.bouquetTitle}
                          </span>
                        )}

                        {rev.isVerified && (
                          <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] rounded-lg flex items-center gap-1">
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
                          if (true) {
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
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  Всего клиентов в базе
                </span>
                <span className="font-sans font-medium text-3xl text-white font-normal">
                  {allCustomers.length} человек
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  Общая сумма заказов
                </span>
                <span className="font-sans font-medium text-3xl text-white font-normal">
                  {totalRevenue.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  Средний чек клиента
                </span>
                <span className="font-sans font-medium text-3xl text-white font-normal">
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
                    setSuccessNotice('В базе пока нет клиентов для выгрузки.');
                    setIsSuccessMessage(true);
                    setTimeout(() => setIsSuccessMessage(false), 3000);
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
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-medium text-xl text-white font-normal">
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
                        <span className="font-sans font-medium text-lg text-white font-normal">
                          {c.totalSpent.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="text-[11px] text-[#C5A880] block">
                          {c.ordersCount} заказов — Скидка {c.discountPercent}%
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
