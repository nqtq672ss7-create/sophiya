import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Users, MessageCircle, Phone, Search, Award, Package, Plus, Trash2,
  Image as ImageIcon, Check, Star, RotateCcw, Lock, RefreshCw, Pencil,
  ShoppingBag, Camera, SlidersHorizontal, LayoutGrid, LogOut, Bell, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { useReviews } from '../../context/ReviewsContext';
import { calculateLoyaltyTier } from '../../types/customer';
import { Bouquet, BouquetColor, EDITABLE_CATEGORIES } from '../../types/figma-app';
import { getApiUrl } from '../../config/api';

interface SalonAdminClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'catalog'|'orders'|'reviews'|'clients'|'more';
type StaffRole = 'Админ'|'Флорист'|'Курьер';
type SortMode = 'default'|'price_asc'|'price_desc'|'stock_asc';

interface RecipeItem {
  name: string;
  qty: string;
}

interface AdminOrder {
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
  photoReportUrl?: string;
}

const DEFAULT_ORDERS: AdminOrder[] = [];

const ORDER_STATUS_META: Record<
  AdminOrder['orderStatus'],
  { label: string; next: AdminOrder['orderStatus']|null; nextLabel: string|null; badge: string }
> = {
  new: { label: 'Новый', next: 'assembling', nextLabel: 'В сборку', badge: 'bg-[#922E3D]/35 text-[#F6B6C0]' },
  assembling: { label: 'Сборка', next: 'in_transit', nextLabel: 'В путь', badge: 'bg-amber-500/20 text-amber-300' },
  in_transit: { label: 'В пути', next: 'delivered', nextLabel: 'Доставлен', badge: 'bg-sky-500/20 text-sky-300' },
  delivered: { label: 'Доставлен', next: null, nextLabel: null, badge: 'bg-emerald-500/20 text-emerald-300' },
};

const COLORS: BouquetColor[] = ['Розовый', 'Красный', 'Белый', 'Бордовый', 'Персиковый'];

const readJsonStorage = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const compressImageFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Не удалось прочитать файл'));
        return;
      }
      const raw = reader.result;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 720;
          let { width, height } = img;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height >= width && height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(raw);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          let out = canvas.toDataURL('image/webp', 0.75);
          if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/jpeg', 0.72);
          if (out.length > 180000) out = canvas.toDataURL('image/jpeg', 0.64);
          resolve(out);
        } catch {
          resolve(raw);
        }
      };
      img.onerror = () => resolve(raw);
      img.src = raw;
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });

export const SalonAdminClientsModal: React.FC<SalonAdminClientsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { allCustomers, refreshCustomers } = useAuth();
  const {
    bouquets,
    addBouquet,
    updateBouquet,
    deleteBouquet,
    toggleStock,
    clearAllBouquets,
    resetToDefault,
    isSyncing,
    lastSyncedAt,
    syncCatalog,
    refreshCatalog,
  } = useCatalog();
  const {
    reviews,
    addReview,
    updateReview,
    deleteReview,
    togglePublished,
    moderateReview,
    refreshReviews,
    refreshPending,
  } = useReviews();

  // Auth state
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
      return Boolean(payload.exp && Date.now() > payload.exp);
    } catch {
      return true;
    }
  };

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const token =
        sessionStorage.getItem('sophiya_admin_token') ||
        localStorage.getItem('sophiya_admin_token_v1');
      if (!token || isTokenExpired(token)) {
        sessionStorage.removeItem('sophiya_admin_token');
        localStorage.removeItem('sophiya_admin_token_v1');
        return false;
      }
      sessionStorage.setItem('sophiya_admin_token', token);
      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleExpired = () => {
      setIsUnlocked(false);
      setPinError('Время сессии истекло. Введите пароль снова.');
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

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<AdminTab>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [chipFilter, setChipFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortMode>('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Bulk actions
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Role & Notifications
  const [role, setRole] = useState<StaffRole>(() =>
    readJsonStorage<StaffRole>('sophiya_admin_role_v1', 'Админ')
  );
  const [pushEnabled, setPushEnabled] = useState<boolean>(() =>
    readJsonStorage<boolean>('sophiya_admin_push_v1', true)
  );
  const [toast, setToast] = useState<{ type: 'ok'|'err'; text: string }|null>(null);

  const showToast = (type: 'ok'|'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast((prev) => (prev?.text === text ? null : prev)), 3500);
  };

  useEffect(() => {
    try {
      localStorage.setItem('sophiya_admin_role_v1', JSON.stringify(role));
    } catch {}
  }, [role]);

  useEffect(() => {
    try {
      localStorage.setItem('sophiya_admin_push_v1', JSON.stringify(pushEnabled));
    } catch {}
  }, [pushEnabled]);

  // Stock counts & Recipes stored locally per bouquet
  const [stockCounts, setStockCounts] = useState<Record<string, number>>(() =>
    readJsonStorage<Record<string, number>>('sophiya_admin_stock_v1', {})
  );
  const [recipesMap, setRecipesMap] = useState<Record<string, RecipeItem[]>>(() =>
    readJsonStorage<Record<string, RecipeItem[]>>('sophiya_admin_recipes_v1', {})
  );

  const getStockCount = (b: Bouquet) => {
    if (typeof stockCounts[b.id] === 'number') return stockCounts[b.id];
    return b.inStock ? 5 : 0;
  };

  const updateStockCount = (b: Bouquet, nextCount: number) => {
    const safe = Math.max(0, nextCount);
    const updated = { ...stockCounts, [b.id]: safe };
    setStockCounts(updated);
    try {
      localStorage.setItem('sophiya_admin_stock_v1', JSON.stringify(updated));
    } catch {}
    if ((safe === 0 && b.inStock) || (safe > 0 && !b.inStock)) {
      toggleStock(b.id);
    }
  };

  // Orders (ignore legacy demo orders if any were cached)
  const [orders, setOrders] = useState<AdminOrder[]>(() => {
    const saved = readJsonStorage<AdminOrder[]>('sophiya_admin_orders_v1', []);
    return saved.filter(
      (o) =>
        !(
          (o.id === 'ord_1' && o.customerName === 'Айрат Мингазов') ||
          (o.id === 'ord_2' && o.customerName === 'Елена Сафина')
        )
    );
  });

  useEffect(() => {
    try {
      localStorage.setItem('sophiya_admin_orders_v1', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  // Review replies
  const [reviewReplies, setReviewReplies] = useState<Record<string, string>>(() =>
    readJsonStorage<Record<string, string>>('sophiya_admin_review_replies_v1', {})
  );

  // Promos & Banner
  const [promos, setPromos] = useState<
    Array<{ code: string; discount: string; description: string; active: boolean }>
  >(() =>
    readJsonStorage('sophiya_admin_promos_v1', [
      { code: 'VESNA10', discount: '10%', description: 'Скидка на первый заказ', active: true },
      { code: 'VIP15', discount: '15%', description: 'Для постоянных клиентов', active: true },
    ])
  );
  const [promoBannerText, setPromoBannerText] = useState<string>(() =>
    readJsonStorage('sophiya_admin_promo_banner_v1', 'Бесплатная доставка по городу от 30 минут')
  );
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('10%');
  const [newPromoDesc, setNewPromoDesc] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('sophiya_admin_promos_v1', JSON.stringify(promos));
    } catch {}
  }, [promos]);

  useEffect(() => {
    try {
      localStorage.setItem('sophiya_admin_promo_banner_v1', JSON.stringify(promoBannerText));
    } catch {}
  }, [promoBannerText]);

  // Active Sheets / Modals
  const [editingBouquet, setEditingBouquet] = useState<Bouquet|null>(null);
  const [isAddBouquetOpen, setIsAddBouquetOpen] = useState(false);
  const [isSavingBouquet, setIsSavingBouquet] = useState(false);

  // Draft form fields (shared for Add & Edit)
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formOldPrice, setFormOldPrice] = useState('');
  const [formCategory, setFormCategory] = useState<string>(EDITABLE_CATEGORIES[0]);
  const [formColor, setFormColor] = useState<BouquetColor>('Розовый');
  const [formImage, setFormImage] = useState('/bouquet-1.jpg');
  const [formStock, setFormStock] = useState('5');
  const [formDescription, setFormDescription] = useState('');
  const [formRecipe, setFormRecipe] = useState<RecipeItem[]>([
    { name: 'Роза Эквадор', qty: '5 шт.' },
  ]);

  const [photoOrderModal, setPhotoOrderModal] = useState<AdminOrder|null>(null);
  const [replyModalReviewId, setReplyModalReviewId] = useState<string|null>(null);
  const [draftReply, setDraftReply] = useState('');
  const [draftReviewDate, setDraftReviewDate] = useState('');
  const [clientHistoryModal, setClientHistoryModal] = useState<string|null>(null);
  const [moreSubSection, setMoreSubSection] = useState<'promos'|'loyalty'|'logistics'|'settings'|null>(null);
  const [dangerModal, setDangerModal] = useState<'clear'|'reset'|null>(null);
  const [dangerConfirmInput, setDangerConfirmInput] = useState('');
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const [newRevAuthor, setNewRevAuthor] = useState('');
  const [newRevRating, setNewRevRating] = useState(5);
  const [newRevText, setNewRevText] = useState('');

  // Auth handlers
  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pin = pinInput.trim();
    if (!pin) {
      setPinError('Введите пароль доступа');
      return;
    }
    setIsAuthenticating(true);
    setPinError('');
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;
      const res = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pin, honeypot: '' }),
        signal: controller?.signal,
      });
      if (timeoutId) clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        setIsUnlocked(true);
        setPinInput('');
        sessionStorage.setItem('sophiya_admin_token', data.token);
        localStorage.setItem('sophiya_admin_token_v1', data.token);
        refreshCustomers();
        refreshReviews();
        refreshPending();
      } else {
        setPinError(data.error || 'Неверный пароль доступа');
        setPinInput('');
      }
    } catch {
      setPinError('Не удалось подключиться к серверу авторизации');
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
      localStorage.removeItem('sophiya_admin_token_v1');
    } catch {}
  };

  // Bouquet Add / Edit
  const openAddForm = () => {
    setEditingBouquet(null);
    setFormTitle('');
    setFormPrice('');
    setFormOldPrice('');
    setFormCategory(EDITABLE_CATEGORIES[0]);
    setFormColor('Розовый');
    setFormImage('/bouquet-1.jpg');
    setFormStock('5');
    setFormDescription('');
    setFormRecipe([{ name: 'Роза Эквадор', qty: '5 шт.' }]);
    setIsAddBouquetOpen(true);
  };

  const openEditForm = (b: Bouquet) => {
    setIsAddBouquetOpen(false);
    setEditingBouquet(b);
    setFormTitle(b.title);
    setFormPrice(String(b.price));
    setFormOldPrice(b.oldPrice ? String(b.oldPrice) : '');
    setFormCategory(b.category);
    setFormColor(b.color || 'Розовый');
    setFormImage(b.image || '/bouquet-1.jpg');
    setFormStock(String(getStockCount(b)));
    setFormDescription(b.description || '');
    const savedRecipe = recipesMap[b.id];
    setFormRecipe(
      savedRecipe && savedRecipe.length > 0
        ? savedRecipe
        : [{ name: b.characteristics?.flowersCount || 'Отборные цветы', qty: '1 сет' }]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setFormImage(compressed);
      showToast('ok', 'Фото сжато и готово к сохранению');
    } catch {
      showToast('err', 'Не удалось загрузить фото');
    }
  };

  const handleSaveBouquet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrice || isSavingBouquet) return;
    setIsSavingBouquet(true);
    const parsedStock = Math.max(0, parseInt(formStock, 10) || 0);
    const recipeSummary = formRecipe
      .filter((r) => r.name.trim())
      .map((r) => `${r.name.trim()} (${r.qty.trim() || '1 шт.'})`)
      .join(', ');

    try {
      if (editingBouquet) {
        await updateBouquet(editingBouquet.id, {
          title: formTitle.trim(),
          price: Number(formPrice),
          oldPrice: formOldPrice && Number(formOldPrice) > Number(formPrice) ? Number(formOldPrice) : 0,
          category: formCategory,
          color: formColor,
          inStock: parsedStock > 0,
          image: formImage,
          images: [formImage],
          description: formDescription.trim() || 'Авторская флористическая композиция.',
          characteristics: {
            height: editingBouquet.characteristics?.height || '50 см',
            flowersCount: recipeSummary || 'Отборные сортовые цветы',
            durability: editingBouquet.characteristics?.durability || '10-14 дней',
            packaging: editingBouquet.characteristics?.packaging || 'Фирменная упаковка «София»',
          },
        });
        const nextStock = { ...stockCounts, [editingBouquet.id]: parsedStock };
        const nextRecipes = { ...recipesMap, [editingBouquet.id]: formRecipe };
        setStockCounts(nextStock);
        setRecipesMap(nextRecipes);
        localStorage.setItem('sophiya_admin_stock_v1', JSON.stringify(nextStock));
        localStorage.setItem('sophiya_admin_recipes_v1', JSON.stringify(nextRecipes));
        setEditingBouquet(null);
        showToast('ok', `Букет «${formTitle.trim()}» обновлён`);
      } else {
        await addBouquet({
          title: formTitle.trim(),
          price: Number(formPrice),
          ...(formOldPrice && Number(formOldPrice) > Number(formPrice) ? { oldPrice: Number(formOldPrice) } : {}),
          category: formCategory,
          color: formColor,
          inStock: parsedStock > 0,
          image: formImage,
          images: [formImage],
          hasRealPhoto: true,
          description: formDescription.trim() || 'Авторская флористическая композиция.',
          characteristics: {
            height: '50 см',
            flowersCount: recipeSummary || 'Отборные сортовые цветы',
            durability: '10-14 дней',
            packaging: 'Фирменная упаковка «София»',
          },
        });
        setIsAddBouquetOpen(false);
        showToast('ok', 'Новый букет добавлен в каталог');
      }
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setIsSavingBouquet(false);
    }
  };

  const applyBulk = async (action: 'hide'|'show'|'mono') => {
    if (!selectedIds.length) return;
    for (const id of selectedIds) {
      const b = bouquets.find((x) => x.id === id);
      if (!b) continue;
      if (action === 'hide' && b.inStock) await toggleStock(id);
      if (action === 'show' && !b.inStock) await toggleStock(id);
      if (action === 'mono') await updateBouquet(id, { category: 'Монобукеты' });
    }
    setBulkMode(false);
    setSelectedIds([]);
    showToast('ok', 'Массовое действие применено');
  };

  // Order photo report
  const handleOrderPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await compressImageFile(file);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, photoReportUrl: url } : o)));
      setPhotoOrderModal((prev) => (prev && prev.id === orderId ? { ...prev, photoReportUrl: url } : prev));
      showToast('ok', 'Фотоотчёт прикреплён к заказу');
    } catch {
      showToast('err', 'Ошибка загрузки фото');
    }
  };

  // Filtered lists
  const filteredBouquets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = bouquets.filter((b) => {
      if (q && !b.title.toLowerCase().includes(q) && !b.category.toLowerCase().includes(q)) return false;
      const cnt = getStockCount(b);
      if (chipFilter === 'inStock') return b.inStock && cnt > 0;
      if (chipFilter === 'low') return b.inStock && cnt > 0 && cnt <= 2;
      if (chipFilter === 'hidden') return !b.inStock || cnt === 0;
      if (EDITABLE_CATEGORIES.includes(chipFilter)) return b.category === chipFilter;
      return true;
    });
    if (sortBy === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === 'stock_asc') list = [...list].sort((a, b) => getStockCount(a) - getStockCount(b));
    return list;
  }, [bouquets, searchQuery, chipFilter, sortBy, stockCounts]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter(
      (o) => !q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reviews.filter(
      (r) => !q || r.author.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)
    );
  }, [reviews, searchQuery]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCustomers.filter((c) => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
      return !q || fullName.includes(q) || c.phone.includes(q);
    });
  }, [allCustomers, searchQuery]);

  const newOrdersCount = orders.filter((o) => o.orderStatus === 'new').length;
  const pendingReviewsCount = reviews.filter((r) => !r.isPublished).length;

  const todayRevenue = useMemo(
    () => orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0),
    [orders]
  );

  if (!isOpen) return null;

  // ===========================================================================
  // LOCKED / LOGIN SCREEN
  // ===========================================================================
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#1C1215] border border-[#3A282E] rounded-xl p-6 text-[#F7EFF2] shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-[#271B1F] border border-[#3A282E] flex items-center justify-center text-[#C9B7BD] hover:text-white"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex flex-col items-center text-center gap-3 mt-2">
            <div className="w-12 h-12 rounded-xl bg-[#922E3D] flex items-center justify-center text-white font-bold text-xl">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Вход в админ-панель</h2>
            <p className="text-xs text-[#A8949A]">Салон цветов «София», Введите пароль сотрудника</p>
          </div>
          <form onSubmit={handleUnlock} className="mt-5 space-y-3">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Пароль доступа"
              autoFocus
              className="w-full h-11 px-4 rounded-xl bg-[#271B1F] border border-[#3F2C32] text-sm text-white focus:outline-none focus:border-[#922E3D]"
            />
            {pinError && <div className="text-xs text-rose-400">{pinError}</div>}
            <button
              type="button"
              onClick={() => handleUnlock()}
              disabled={isAuthenticating}
              className="w-full h-11 rounded-xl bg-[#922E3D] hover:bg-[#a63647] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {isAuthenticating ? 'Проверка...' : 'Войти в панель'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: AdminTab; label: string; badge?: number; icon: React.ReactNode }> = [
    { id: 'catalog', label: 'Каталог', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'Заказы', badge: newOrdersCount, icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'reviews', label: 'Отзывы', badge: pendingReviewsCount, icon: <Star className="w-4 h-4" /> },
    { id: 'clients', label: 'Клиенты', icon: <Users className="w-4 h-4" /> },
    { id: 'more', label: 'Ещё', icon: <LayoutGrid className="w-4 h-4" /> },
  ];

  // ===========================================================================
  // MAIN RESPONSIVE SHELL (Mobile Bottom Tab Bar + Desktop Sidebar)
  // ===========================================================================
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center lg:p-5">
      <div className="w-full h-full lg:max-w-6xl lg:h-[90vh] bg-[#1C1215] text-[#F7EFF2] lg:rounded-xl lg:border lg:border-[#3A282E] flex flex-col lg:flex-row overflow-hidden relative shadow-2xl">
        {/* Toast */}
        {toast && (
          <div
            className={`absolute top-4 right-4 left-4 lg:left-auto lg:w-96 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-xl ${
              toast.type === 'ok'
                ? 'bg-[#24191D] border-emerald-500/50 text-emerald-300'
                : 'bg-[#2B171C] border-rose-500/60 text-rose-200'
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex w-64 shrink-0 bg-[#160E11] border-r border-[#2F2025] flex-col p-4 justify-between">
          <div>
            <div className="flex items-center gap-3 px-2 pb-5 border-b border-[#2F2025]">
              <div className="w-9 h-9 rounded-xl bg-[#922E3D] flex items-center justify-center font-extrabold text-white">
                S
              </div>
              <div>
                <div className="text-sm font-bold">Sophiya Admin</div>
                <div className="text-[11px] text-[#A8949A]">Роль: {role}</div>
              </div>
            </div>

            <nav className="mt-4 space-y-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setBulkMode(false);
                    setSelectedIds([]);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    activeTab === item.id
                      ? 'bg-[#922E3D] text-white'
                      : 'text-[#B5A3A9] hover:bg-[#24191D] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="px-2 py-0.5 rounded-lg text-[11px] bg-black/30 text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#2F2025]">
            <button
              onClick={handleLock}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#25191D] border border-[#3A282E] text-[#E8A8B3] hover:bg-[#322026]"
            >
              <LogOut className="w-4 h-4" />
              Выйти из админки
            </button>
            <button
              onClick={onClose}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#25191D] border border-[#3A282E] text-[#C9B7BD] hover:text-white"
            >
              <X className="w-4 h-4" />
              Закрыть окно
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* TOP BAR */}
          <header className="px-4 py-3 border-b border-[#2F2025] flex items-center justify-between gap-2 shrink-0 bg-[#1C1215]">
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-[#922E3D] flex items-center justify-center font-extrabold text-sm text-white">
                S
              </div>
              <div>
                <div className="text-sm font-bold leading-tight">Sophiya</div>
                <div className="text-[11px] text-[#A8949A]">Роль: {role}</div>
              </div>
            </div>

            <div className="hidden lg:block">
              <h2 className="text-base font-bold">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'catalog' && (
                <>
                  <button
                    onClick={openAddForm}
                    className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#922E3D] hover:bg-[#a63647] text-white text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4" /> Добавить букет
                  </button>
                  <button
                    onClick={() => {
                      setBulkMode(!bulkMode);
                      setSelectedIds([]);
                    }}
                    className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                      bulkMode
                        ? 'bg-[#922E3D] border-[#B44253] text-white'
                        : 'bg-[#271B1F] border-[#3A282E] text-[#E8D9DE]'
                    }`}
                  >
                    {bulkMode ? 'Готово' : 'Выбрать'}
                  </button>
                </>
              )}

              {activeTab === 'reviews' && (
                <button
                  onClick={() => setIsAddReviewOpen(true)}
                  className="h-9 px-3 rounded-xl bg-[#271B1F] border border-[#3A282E] text-xs font-semibold text-[#E8D9DE] hover:border-[#922E3D]"
                >
                  + Отзыв
                </button>
              )}

              <button
                onClick={handleLock}
                title="Выйти из админ-панели"
                className="lg:hidden h-9 w-9 rounded-xl bg-[#271B1F] border border-[#3A282E] flex items-center justify-center text-[#E8A8B3]"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Закрыть"
                className="h-9 w-9 rounded-xl bg-[#271B1F] border border-[#3A282E] flex items-center justify-center text-[#C9B7BD] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* SEARCH & CHIPS */}
          {activeTab !== 'more' && (
            <div className="px-4 pt-3 pb-2 space-y-2.5 shrink-0 bg-[#1C1215]">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8F7D83] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#271B1F] border border-[#3A292E] text-sm text-white placeholder:text-[#8F7D83] focus:outline-none focus:border-[#922E3D]"
                  />
                </div>
                {activeTab === 'catalog' && (
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className={`h-10 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                      sortBy !== 'default'
                        ? 'bg-[#922E3D]/25 border-[#922E3D] text-white'
                        : 'bg-[#271B1F] border-[#3A292E] text-[#E8D9DE]'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" /> Фильтр
                  </button>
                )}
              </div>

              {activeTab === 'catalog' && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    ['all', 'Все'],
                    ['inStock', 'В наличии'],
                    ['low', 'Мало (≤2)'],
                    ['hidden', 'Скрытые / Стоп'],
                    ...EDITABLE_CATEGORIES.slice(0, 5).map((c) => [c, c]),
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setChipFilter(id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors ${
                        chipFilter === id
                          ? 'bg-[#922E3D] border-[#B44253] text-white'
                          : 'bg-[#25191D] border-[#3A292E] text-[#C9B7BD]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto px-4 pb-24 lg:pb-6 pt-2">
            {/* CATALOG TAB */}
            {activeTab === 'catalog' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredBouquets.map((b) => {
                  const cnt = getStockCount(b);
                  const isSel = selectedIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      className={`rounded-xl p-3 border transition-colors flex flex-col justify-between ${
                        isSel
                          ? 'bg-[#2D1C22] border-[#922E3D]'
                          : 'bg-[#25191D] border-[#37252B]'
                      } ${!b.inStock ? 'opacity-75' : ''}`}
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => {
                          if (bulkMode) {
                            setSelectedIds((prev) =>
                              prev.includes(b.id) ? prev.filter((x) => x !== b.id) : [...prev, b.id]
                            );
                          } else {
                            openEditForm(b);
                          }
                        }}
                      >
                        {bulkMode && (
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                              isSel ? 'bg-[#922E3D] border-[#922E3D] text-white' : 'border-[#5B434B]'
                            }`}
                          >
                            {isSel && <Check className="w-3.5 h-3.5" />}
                          </div>
                        )}
                        <img
                          src={b.image || '/bouquet-1.jpg'}
                          alt={b.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#160E11]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{b.title}</div>
                          <div className="text-[11px] text-[#A8949A] truncate">
                            {b.category}, {b.color}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm font-extrabold text-[#F5B8C2]">
                              {b.price.toLocaleString('ru-RU')} ₽
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                                !b.inStock || cnt === 0
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : cnt <= 2
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {!b.inStock || cnt === 0 ? 'Нет в наличии' : `В наличии, ${cnt} шт.`}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStock(b.id);
                          }}
                          className={`w-11 h-6 rounded-lg p-0.5 transition-colors shrink-0 ${
                            b.inStock ? 'bg-[#922E3D]' : 'bg-[#453238]'
                          }`}
                          aria-label="Переключить наличие"
                        >
                          <div
                            className={`w-5 h-5 rounded-lg bg-white transition-transform ${
                              b.inStock ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {!bulkMode && (
                        <div className="flex flex-wrap items-center justify-between mt-2.5 pt-2.5 border-t border-[#352329] gap-2">
                          <div className="inline-flex items-center gap-1 bg-[#1C1215] border border-[#3D2B31] rounded-lg px-1 py-0.5 shrink-0">
                            <button
                              onClick={() => updateStockCount(b, cnt - 1)}
                              className="w-6 h-6 rounded bg-[#2F2025] text-white text-xs font-bold flex items-center justify-center"
                            >
                              −
                            </button>
                            <span className="text-xs font-bold min-w-[40px] text-center whitespace-nowrap">
                              {cnt} шт.
                            </span>
                            <button
                              onClick={() => updateStockCount(b, cnt + 1)}
                              className="w-6 h-6 rounded bg-[#2F2025] text-white text-xs font-bold flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                            {cnt > 0 && b.inStock ? (
                              <button
                                onClick={() => updateStockCount(b, 0)}
                                title="Убрать с витрины"
                                className="h-7 px-2.5 rounded-lg bg-[#2C1E23] border border-[#3D2B31] text-[11px] font-semibold text-[#E8D9DE] whitespace-nowrap"
                              >
                                Скрыть
                              </button>
                            ) : (
                              <button
                                onClick={() => updateStockCount(b, Math.max(1, cnt || 5))}
                                title="Вернуть в наличие"
                                className="h-7 px-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 whitespace-nowrap"
                              >
                                На витрину
                              </button>
                            )}
                            <button
                              onClick={() => openEditForm(b)}
                              className="h-7 px-2.5 rounded-lg bg-[#2C1E23] border border-[#5A3842] text-[11px] font-semibold text-white inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <Pencil className="w-3 h-3 shrink-0" /> Изменить
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredOrders.length === 0 ? (
                  <div className="col-span-full text-center py-12 px-4 rounded-xl bg-[#25191D] border border-[#37252B] space-y-1.5">
                    <ShoppingBag className="w-7 h-7 text-[#922E3D] mx-auto" />
                    <div className="text-sm font-bold">Заказов пока нет</div>
                    <div className="text-xs text-[#A8949A]">
                      Новые заказы, оформленные через корзину на сайте, будут появляться здесь.
                    </div>
                  </div>
                ) : (
                  filteredOrders.map((o) => {
                  const st = ORDER_STATUS_META[o.orderStatus];
                  const cleanPhone = o.phone.replace(/\D/g, '');
                  return (
                    <div key={o.id} className="rounded-xl p-3.5 bg-[#25191D] border border-[#37252B] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold">{o.orderNumber}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${st.badge}`}>
                            {st.label}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                            o.photoReportUrl
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-white/10 text-[#C9B7BD]'
                          }`}
                        >
                          {o.photoReportUrl ? 'Фотоотчёт ✓' : 'Без фото'}
                        </span>
                      </div>
                      <div className="text-sm font-semibold">{o.customerName}</div>
                      <div className="text-xs text-[#A8949A]">
                        {o.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}, {o.address} ({o.deliveryDate})
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-[#352329]">
                        <span className="text-[#D7C7CD]">
                          {o.items.map((it) => `${it.title} × ${it.quantity}`).join(', ')}
                        </span>
                        <strong className="text-sm text-white">{o.totalAmount.toLocaleString('ru-RU')} ₽</strong>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          onClick={() => setPhotoOrderModal(o)}
                          className="flex-1 h-8 px-2.5 rounded-lg bg-[#2C1E23] border border-[#3D2B31] text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" /> Фотоотчёт
                        </button>
                        <a
                          href={`tel:+${cleanPhone}`}
                          className="h-8 px-2.5 rounded-lg bg-[#2C1E23] border border-[#3D2B31] text-xs font-semibold inline-flex items-center justify-center"
                          title="Позвонить"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-2.5 rounded-lg bg-[#2C1E23] border border-[#3D2B31] text-xs font-semibold inline-flex items-center justify-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WA
                        </a>
                        {st.next && (
                          <button
                            onClick={() =>
                              setOrders((prev) =>
                                prev.map((x) => (x.id === o.id ? { ...x, orderStatus: st.next! } : x))
                              )
                            }
                            className="h-8 px-3 rounded-lg bg-[#922E3D] text-white text-xs font-semibold"
                          >
                            → {st.nextLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredReviews.map((r) => {
                  const replyText = reviewReplies[r.id];
                  return (
                    <div key={r.id} className="rounded-xl p-3.5 bg-[#25191D] border border-[#37252B] space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-sm">{r.author}</strong>
                          <span
                            className={`text-[11px] ml-2 ${
                              r.date === 'Сегодня' ? 'text-amber-300 font-semibold' : 'text-[#9E8A91]'
                            }`}
                          >
                            {r.date}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                            r.isPublished ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {r.isPublished ? 'Опубликован' : 'Модерация'}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-[#4F3B42]'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs leading-relaxed text-[#EAE0E3]">{r.comment}</p>
                      {replyText && (
                        <div className="p-2.5 rounded-xl bg-[#1C1215] border-l-2 border-[#922E3D] text-xs text-[#D5C5CA]">
                          <strong className="text-[#F5B8C2]">Ответ салона: </strong>
                          {replyText}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            setReplyModalReviewId(r.id);
                            setDraftReply(replyText || '');
                            setDraftReviewDate(r.date || '');
                          }}
                          className="flex-1 h-8 rounded-lg bg-[#2C1E23] border border-[#3D2B31] text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> {replyText ? 'Изменить ответ / дату' : 'Ответить / дата'}
                        </button>
                        <button
                          onClick={() => (r.isPublished ? togglePublished(r.id) : moderateReview(r.id, true))}
                          className="h-8 px-3 rounded-lg bg-[#2C1E23] border border-[#3D2B31] text-xs font-semibold"
                        >
                          {r.isPublished ? 'Скрыть' : 'Опубликовать'}
                        </button>
                        <button
                          onClick={() => deleteReview(r.id)}
                          className="h-8 w-8 rounded-lg bg-[#2C1E23] border border-[#3D2B31] flex items-center justify-center text-rose-300"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CLIENTS TAB */}
            {activeTab === 'clients' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredClients.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-sm text-[#A8949A]">
                    Клиенты пока не найдены
                  </div>
                ) : (
                  filteredClients.map((c) => {
                    const { tier } = calculateLoyaltyTier(c.totalSpent || 0);
                    const cleanPhone = (c.phone || '').replace(/\D/g, '');
                    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Клиент';
                    return (
                      <div key={c.id} className="rounded-xl p-3.5 bg-[#25191D] border border-[#37252B] space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold">{fullName}</div>
                            <div className="text-xs text-[#A8949A]">{c.phone}</div>
                            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#922E3D]/35 text-[#F6B6C0]">
                              <Award className="w-3 h-3" /> {tier.name}, скидка {tier.discountPercent}%
                            </span>
                          </div>
                          <a
                            href={`tel:+${cleanPhone}`}
                            className="w-9 h-9 rounded-xl bg-[#2C1E23] border border-[#3D2B31] flex items-center justify-center"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#352329] text-xs">
                          <span>
                            Покупок: <strong>{c.ordersCount || 0}</strong> ·{' '}
                            <strong>{(c.totalSpent || 0).toLocaleString('ru-RU')} ₽</strong>
                          </span>
                          <button
                            onClick={() => setClientHistoryModal(c.id)}
                            className="h-7 px-2.5 rounded-lg bg-[#2C1E23] border border-[#3D2B31] text-[11px] font-semibold"
                          >
                            История →
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* MORE TAB */}
            {activeTab === 'more' && (
              <div className="max-w-3xl space-y-3">
                {role === 'Админ' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl p-3.5 bg-[#25191D] border border-[#37252B]">
                      <div className="text-[11px] text-[#B4A0A7]">Заказы сегодня</div>
                      <div className="text-xl font-extrabold mt-1">{todayRevenue.toLocaleString('ru-RU')} ₽</div>
                      <div className="text-[11px] text-emerald-300 mt-0.5">{orders.length} заказов</div>
                    </div>
                    <div className="rounded-xl p-3.5 bg-[#25191D] border border-[#37252B]">
                      <div className="text-[11px] text-[#B4A0A7]">Средний чек</div>
                      <div className="text-xl font-extrabold mt-1">
                        {orders.length ? Math.round(todayRevenue / orders.length).toLocaleString('ru-RU') : 0} ₽
                      </div>
                    </div>
                    <div className="rounded-xl p-3.5 bg-[#25191D] border border-[#37252B] col-span-2 sm:col-span-1">
                      <div className="text-[11px] text-[#B4A0A7]">В каталоге</div>
                      <div className="text-xl font-extrabold mt-1">{bouquets.length} поз.</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl p-3.5 bg-[#25191D] border border-[#5E3A43] text-xs text-[#D5C5CA]">
                    Режим роли <strong>{role}</strong>: финансовая аналитика скрыта правами доступа.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    ['promos', 'Промокоды и акции', `Активно: ${promos.filter((p) => p.active).length}`],
                    ['loyalty', 'Клубные карты', 'Уровни скидок и кэшбэка'],
                    ['logistics', 'Логистика и зоны', 'Центр 0 ₽, Пригород 400 ₽, Промзона 400 ₽'],
                    ['settings', 'Настройки, роли и Push', `Роль: ${role}, Push: ${pushEnabled ? 'Вкл' : 'Выкл'}`],
                  ].map(([id, title, sub]) => (
                    <button
                      key={id}
                      onClick={() => setMoreSubSection(id as typeof moreSubSection)}
                      className="rounded-xl p-3.5 bg-[#25191D] border border-[#37252B] flex items-center justify-between text-left hover:border-[#922E3D]"
                    >
                      <div>
                        <div className="text-sm font-bold">{title}</div>
                        <div className="text-xs text-[#A8949A] mt-0.5">{sub}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#A8949A]" />
                    </button>
                  ))}
                </div>

                {/* Sync & Catalog Maintenance */}
                <div className="rounded-xl p-3.5 bg-[#25191D] border border-[#37252B] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">Облачная синхронизация каталога</span>
                    <span className="text-[#A8949A]">
                      {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('ru-RU') : 'Локально'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => syncCatalog()}
                      disabled={isSyncing}
                      className="h-9 px-3 rounded-xl bg-[#922E3D] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      Синхронизировать
                    </button>
                    <button
                      onClick={() => refreshCatalog()}
                      className="h-9 px-3 rounded-xl bg-[#2C1E23] border border-[#3D2B31] text-xs font-semibold"
                    >
                      Обновить с сервера
                    </button>
                    <button
                      onClick={() => {
                        setDangerConfirmInput('');
                        setDangerModal('reset');
                      }}
                      className="h-9 px-3 rounded-xl bg-[#2C1E23] border border-[#3D2B31] text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Сброс каталога
                    </button>
                    <button
                      onClick={() => {
                        setDangerConfirmInput('');
                        setDangerModal('clear');
                      }}
                      className="h-9 px-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-semibold"
                    >
                      Очистить всё...
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BULK ACTION BAR */}
          {bulkMode && selectedIds.length > 0 && (
            <div className="mx-4 mb-2 p-3 rounded-xl bg-[#2E1D23] border border-[#922E3D] flex flex-wrap items-center justify-between gap-2 shadow-xl">
              <span className="text-xs font-bold">Выбрано: {selectedIds.length}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => applyBulk('hide')}
                  className="h-8 px-3 rounded-lg bg-[#25191D] border border-[#3D2B31] text-xs font-semibold"
                >
                  Скрыть
                </button>
                <button
                  onClick={() => applyBulk('show')}
                  className="h-8 px-3 rounded-lg bg-[#25191D] border border-[#3D2B31] text-xs font-semibold"
                >
                  В наличие
                </button>
                <button
                  onClick={() => applyBulk('mono')}
                  className="h-8 px-3 rounded-lg bg-[#922E3D] text-white text-xs font-semibold"
                >
                  В «Монобукеты»
                </button>
              </div>
            </div>
          )}

          {/* MOBILE FAB */}
          {activeTab === 'catalog' && !bulkMode && (
            <button
              onClick={openAddForm}
              className="lg:hidden fixed right-4 bottom-20 w-14 h-14 rounded-xl bg-[#922E3D] border border-[#B64556] text-white shadow-xl flex items-center justify-center z-20"
              aria-label="Добавить букет"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}

          {/* MOBILE BOTTOM TAB BAR (5 TABS) */}
          <nav className="lg:hidden grid grid-cols-5 gap-1 px-1.5 pt-1.5 pb-2.5 bg-[#160E11] border-t border-[#2F2025] shrink-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setBulkMode(false);
                  setSelectedIds([]);
                }}
                className={`relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[10.5px] font-semibold ${
                  activeTab === item.id ? 'bg-[#922E3D]/25 text-white' : 'text-[#8F7C82]'
                }`}
              >
                {item.badge ? (
                  <span className="absolute top-0.5 right-3 min-w-[16px] h-4 px-1 rounded-lg bg-[#922E3D] text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ================================================================= */}
        {/* BOTTOM SHEETS (MOBILE) / MODALS (DESKTOP)                         */}
        {/* ================================================================= */}

        {/* Add / Edit Bouquet */}
        {(isAddBouquetOpen || editingBouquet) && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center lg:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsAddBouquetOpen(false);
                setEditingBouquet(null);
              }
            }}
          >
            <form
              onSubmit={handleSaveBouquet}
              className="w-full lg:max-w-lg bg-[#22171B] border-t lg:border border-[#3D2B31] rounded-t-xl lg:rounded-xl p-5 max-h-[90vh] overflow-y-auto space-y-3"
            >
              <div className="w-10 h-1 rounded-lg bg-white/20 mx-auto lg:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">
                  {editingBouquet ? 'Редактировать букет' : 'Новый букет'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddBouquetOpen(false);
                    setEditingBouquet(null);
                  }}
                  className="text-[#C9B7BD] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1B1215] border border-[#35242A]">
                <img src={formImage} alt="Превью" className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2C1E23] border border-[#3D2B31] text-xs font-semibold cursor-pointer">
                    <ImageIcon className="w-3.5 h-3.5" /> Загрузить фото
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="или URL картинки"
                    className="w-full h-8 px-2.5 rounded-lg bg-[#271B1F] border border-[#3A292E] text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#CBB9BF] mb-1">Название</label>
                <input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Например: Букет из пионов"
                  className="w-full h-10 px-3 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-[#CBB9BF] mb-1">Цена (₽)</label>
                  <input
                    required
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#CBB9BF] mb-1">Старая</label>
                  <input
                    type="number"
                    value={formOldPrice}
                    onChange={(e) => setFormOldPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#CBB9BF] mb-1">Остаток</label>
                  <input
                    type="number"
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#CBB9BF] mb-1">Категория</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
                  >
                    {EDITABLE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#CBB9BF] mb-1">Оттенок</label>
                  <select
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value as BouquetColor)}
                    className="w-full h-10 px-2.5 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
                  >
                    {COLORS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#CBB9BF] mb-1">Описание</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white resize-none"
                />
              </div>

              {/* Recipe */}
              <div className="p-3 rounded-xl bg-[#1B1215] border border-[#35242A] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">Рецептура (состав букета)</div>
                    <div className="text-[11px] text-[#9E8A91]">Для учёта списания со склада</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormRecipe((prev) => [...prev, { name: 'Эвкалипт', qty: '2 ветки' }])}
                    className="h-7 px-2.5 rounded-lg bg-[#2C1E23] border border-[#3D2B31] text-[11px] font-semibold"
                  >
                    + Цветок
                  </button>
                </div>
                {formRecipe.map((item, idx) => (
                  <div key={idx} className="flex gap-1.5">
                    <input
                      value={item.name}
                      onChange={(e) =>
                        setFormRecipe((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r))
                        )
                      }
                      placeholder="Цветок"
                      className="flex-1 h-8 px-2.5 rounded-lg bg-[#2B1D22] border border-[#3F2C32] text-xs text-white"
                    />
                    <input
                      value={item.qty}
                      onChange={(e) =>
                        setFormRecipe((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, qty: e.target.value } : r))
                        )
                      }
                      placeholder="Кол-во"
                      className="w-24 h-8 px-2.5 rounded-lg bg-[#2B1D22] border border-[#3F2C32] text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setFormRecipe((prev) => prev.filter((_, i) => i !== idx))}
                      className="h-8 px-2 rounded-lg bg-[#2C1E23] text-xs text-rose-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                {editingBouquet && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteBouquet(editingBouquet.id);
                      setEditingBouquet(null);
                    }}
                    className="h-11 px-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveBouquet}
                  disabled={isSavingBouquet}
                  className="flex-1 h-11 rounded-xl bg-[#922E3D] text-white text-sm font-semibold"
                >
                  {isSavingBouquet ? 'Сохранение...' : 'Сохранить букет'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter & Sort Sheet */}
        {isFilterOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center lg:p-4"
            onClick={(e) => e.target === e.currentTarget && setIsFilterOpen(false)}
          >
            <div className="w-full lg:max-w-sm bg-[#22171B] border-t lg:border border-[#3D2B31] rounded-t-xl lg:rounded-xl p-5 space-y-3">
              <div className="w-10 h-1 rounded-lg bg-white/20 mx-auto lg:hidden" />
              <h3 className="text-base font-bold">Сортировка каталога</h3>
              <div className="space-y-2">
                {(
                  [
                    ['default', 'По умолчанию'],
                    ['price_asc', 'Сначала дешевле'],
                    ['price_desc', 'Сначала дороже'],
                    ['stock_asc', 'Сначала заканчиваются (остаток)'],
                  ] as Array<[SortMode, string]>
                ).map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => {
                      setSortBy(val);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                      sortBy === val
                        ? 'bg-[#922E3D]/25 border-[#922E3D] text-white'
                        : 'bg-[#2C1E23] border-[#3D2B31] text-[#D7C7CD]'
                    }`}
                  >
                    <span>{lbl}</span>
                    {sortBy === val && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setChipFilter('all');
                  setSortBy('default');
                  setIsFilterOpen(false);
                }}
                className="w-full h-10 rounded-xl bg-[#922E3D] text-white text-xs font-semibold"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        )}

        {/* Photo Report Sheet */}
        {photoOrderModal && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center lg:p-4"
            onClick={(e) => e.target === e.currentTarget && setPhotoOrderModal(null)}
          >
            <div className="w-full lg:max-w-md bg-[#22171B] border-t lg:border border-[#3D2B31] rounded-t-xl lg:rounded-xl p-5 space-y-3">
              <div className="w-10 h-1 rounded-lg bg-white/20 mx-auto lg:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Фотоотчёт, {photoOrderModal.orderNumber}</h3>
                <button onClick={() => setPhotoOrderModal(null)}>
                  <X className="w-5 h-5 text-[#C9B7BD]" />
                </button>
              </div>
              {photoOrderModal.photoReportUrl ? (
                <img
                  src={photoOrderModal.photoReportUrl}
                  alt="Фотоотчёт"
                  className="w-full h-52 object-cover rounded-xl border border-[#3D2B31]"
                />
              ) : (
                <div className="h-36 rounded-xl border border-dashed border-[#6B4752] bg-[#1B1215] flex flex-col items-center justify-center text-xs text-[#C9B7BD] gap-2">
                  <Camera className="w-7 h-7 text-[#922E3D]" />
                  <span>Загрузите фото собранного букета</span>
                </div>
              )}
              <label className="w-full h-11 rounded-xl bg-[#922E3D] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer">
                <Camera className="w-4 h-4" />
                {photoOrderModal.photoReportUrl ? 'Заменить фото' : 'Сделать / выбрать фото'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleOrderPhotoUpload(e, photoOrderModal.id)}
                />
              </label>
            </div>
          </div>
        )}

        {/* Review Reply Sheet */}
        {replyModalReviewId && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center lg:p-4"
            onClick={(e) => e.target === e.currentTarget && setReplyModalReviewId(null)}
          >
            <div className="w-full lg:max-w-md bg-[#22171B] border-t lg:border border-[#3D2B31] rounded-t-xl lg:rounded-xl p-5 space-y-3">
              <div className="w-10 h-1 rounded-lg bg-white/20 mx-auto lg:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Ответ салона и дата отзыва</h3>
                <button onClick={() => setReplyModalReviewId(null)}>
                  <X className="w-5 h-5 text-[#C9B7BD]" />
                </button>
              </div>
              <div>
                <label className="block text-xs text-[#CBB9BF] mb-1">Дата отзыва</label>
                <input
                  value={draftReviewDate}
                  onChange={(e) => setDraftReviewDate(e.target.value)}
                  placeholder="Например: 6 ноября 2026"
                  className="w-full h-10 px-3 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#CBB9BF] mb-1">Ответ салона</label>
                <textarea
                  rows={3}
                  value={draftReply}
                  onChange={(e) => setDraftReply(e.target.value)}
                  placeholder="Напишите ответ клиенту..."
                  className="w-full p-3 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
                />
              </div>
              <button
                onClick={() => {
                  const next = { ...reviewReplies, [replyModalReviewId]: draftReply.trim() };
                  setReviewReplies(next);
                  localStorage.setItem('sophiya_admin_review_replies_v1', JSON.stringify(next));
                  if (draftReviewDate.trim()) {
                    updateReview(replyModalReviewId, { date: draftReviewDate.trim() });
                  }
                  setReplyModalReviewId(null);
                  showToast('ok', 'Отзыв обновлён');
                }}
                className="w-full h-11 rounded-xl bg-[#922E3D] text-white text-sm font-semibold"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        )}

        {/* Add Review Modal */}
        {isAddReviewOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center lg:p-4"
            onClick={(e) => e.target === e.currentTarget && setIsAddReviewOpen(false)}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newRevAuthor.trim() || !newRevText.trim()) return;
                addReview({
                  author: newRevAuthor.trim(),
                  rating: newRevRating,
                  date: new Date().toLocaleDateString('ru-RU'),
                  comment: newRevText.trim(),
                  isVerified: true,
                  isPublished: true,
                });
                setNewRevAuthor('');
                setNewRevText('');
                setIsAddReviewOpen(false);
                showToast('ok', 'Отзыв добавлен');
              }}
              className="w-full lg:max-w-md bg-[#22171B] border-t lg:border border-[#3D2B31] rounded-t-xl lg:rounded-xl p-5 space-y-3"
            >
              <h3 className="text-base font-bold">Новый отзыв</h3>
              <input
                required
                value={newRevAuthor}
                onChange={(e) => setNewRevAuthor(e.target.value)}
                placeholder="Имя клиента"
                className="w-full h-10 px-3 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
              />
              <select
                value={newRevRating}
                onChange={(e) => setNewRevRating(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    Оценка: {n} из 5
                  </option>
                ))}
              </select>
              <textarea
                required
                rows={3}
                value={newRevText}
                onChange={(e) => setNewRevText(e.target.value)}
                placeholder="Текст отзыва"
                className="w-full p-3 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-sm text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newRevAuthor.trim() || !newRevText.trim()) return;
                  addReview({
                    author: newRevAuthor.trim(),
                    rating: newRevRating,
                    date: new Date().toLocaleDateString('ru-RU'),
                    comment: newRevText.trim(),
                    isVerified: true,
                    isPublished: true,
                  });
                  setNewRevAuthor('');
                  setNewRevText('');
                  setIsAddReviewOpen(false);
                  showToast('ok', 'Отзыв добавлен');
                }}
                className="w-full h-11 rounded-xl bg-[#922E3D] text-white text-sm font-semibold"
              >
                Добавить отзыв
              </button>
            </form>
          </div>
        )}

        {/* Client History Sheet */}
        {clientHistoryModal && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center lg:p-4"
            onClick={(e) => e.target === e.currentTarget && setClientHistoryModal(null)}
          >
            {(() => {
              const client = allCustomers.find((c) => c.id === clientHistoryModal);
              if (!client) return null;
              const { tier } = calculateLoyaltyTier(client.totalSpent || 0);
              const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Клиент';
              const clientOrders = orders.filter(
                (o) => o.phone.replace(/\D/g, '') === (client.phone || '').replace(/\D/g, '')
              );
              return (
                <div className="w-full lg:max-w-md bg-[#22171B] border-t lg:border border-[#3D2B31] rounded-t-xl lg:rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold">{fullName}</h3>
                      <div className="text-xs text-[#F5B8C2]">
                        {tier.name}, скидка {tier.discountPercent}%
                      </div>
                    </div>
                    <button onClick={() => setClientHistoryModal(null)}>
                      <X className="w-5 h-5 text-[#C9B7BD]" />
                    </button>
                  </div>
                  <div className="text-xs text-[#A8949A]">
                    Всего заказов: {client.ordersCount || 0}, На сумму:{' '}
                    {(client.totalSpent || 0).toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {clientOrders.length === 0 ? (
                      <div className="text-xs text-[#9E8A91] py-4 text-center">
                        Детализированных заказов в локальном журнале пока нет
                      </div>
                    ) : (
                      clientOrders.map((co) => (
                        <div
                          key={co.id}
                          className="p-2.5 rounded-xl bg-[#1B1215] border border-[#35242A] flex justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold">{co.orderNumber}</div>
                            <div className="text-[#9E8A91]">{co.createdAt}</div>
                          </div>
                          <strong>{co.totalAmount.toLocaleString('ru-RU')} ₽</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* More Subsections Sheet */}
        {moreSubSection && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center lg:p-4"
            onClick={(e) => e.target === e.currentTarget && setMoreSubSection(null)}
          >
            <div className="w-full lg:max-w-md bg-[#22171B] border-t lg:border border-[#3D2B31] rounded-t-xl lg:rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">
                  {moreSubSection === 'promos'
                    ? 'Промокоды и акции'
                    : moreSubSection === 'loyalty'
                    ? 'Клубные карты'
                    : moreSubSection === 'logistics'
                    ? 'Логистика и зоны доставки'
                    : 'Настройки, роли и Push'}
                </h3>
                <button onClick={() => setMoreSubSection(null)}>
                  <X className="w-5 h-5 text-[#C9B7BD]" />
                </button>
              </div>

              {moreSubSection === 'promos' && (
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-xs text-[#CBB9BF] mb-1">Текст акции на сайте</label>
                    <input
                      value={promoBannerText}
                      onChange={(e) => setPromoBannerText(e.target.value)}
                      placeholder="Текст баннера акции"
                      className="w-full h-9 px-3 rounded-xl bg-[#2B1D22] border border-[#3F2C32] text-xs text-white"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#1B1215] border border-[#35242A] space-y-2">
                    <div className="text-xs font-bold">Добавить новый промокод</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={newPromoCode}
                        onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                        placeholder="Код (напр. BUKET10)"
                        className="h-9 px-2.5 rounded-lg bg-[#2B1D22] border border-[#3F2C32] text-xs text-white"
                      />
                      <input
                        value={newPromoDiscount}
                        onChange={(e) => setNewPromoDiscount(e.target.value)}
                        placeholder="Скидка (10% или 500 ₽)"
                        className="h-9 px-2.5 rounded-lg bg-[#2B1D22] border border-[#3F2C32] text-xs text-white"
                      />
                    </div>
                    <input
                      value={newPromoDesc}
                      onChange={(e) => setNewPromoDesc(e.target.value)}
                      placeholder="Условие (необязательно)"
                      className="w-full h-9 px-2.5 rounded-lg bg-[#2B1D22] border border-[#3F2C32] text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = newPromoCode.trim().toUpperCase();
                        if (!code) return;
                        setPromos((prev) => [
                          {
                            code,
                            discount: newPromoDiscount.trim() || '10%',
                            description: newPromoDesc.trim() || 'Акционный промокод',
                            active: true,
                          },
                          ...prev.filter((x) => x.code !== code),
                        ]);
                        setNewPromoCode('');
                        setNewPromoDesc('');
                        showToast('ok', `Промокод ${code} добавлен`);
                      }}
                      className="w-full h-9 rounded-lg bg-[#922E3D] text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Добавить промокод
                    </button>
                  </div>

                  <div className="space-y-2">
                    {promos.map((p, idx) => (
                      <div
                        key={p.code}
                        className="p-3 rounded-xl bg-[#1B1215] border border-[#35242A] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div>
                            <strong className="text-sm">{p.code}</strong>
                            <span className="text-xs text-[#F5B8C2] ml-2">−{p.discount}</span>
                          </div>
                          {p.description && (
                            <div className="text-[11px] text-[#9E8A91] truncate">{p.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              setPromos((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, active: !item.active } : item))
                              )
                            }
                            className={`w-11 h-6 rounded-lg p-0.5 transition-colors ${
                              p.active ? 'bg-[#922E3D]' : 'bg-[#453238]'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-lg bg-white transition-transform ${
                                p.active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => setPromos((prev) => prev.filter((_, i) => i !== idx))}
                            className="w-7 h-7 rounded-lg bg-[#2C1E23] text-rose-300 flex items-center justify-center"
                            title="Удалить промокод"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {moreSubSection === 'loyalty' && (
                <div className="text-xs space-y-2 text-[#DFD2D6] leading-relaxed">
                  <div>• Базовый уровень: 0% (приветственный)</div>
                  <div>• Серебряная карта: от 10 000 ₽ — постоянная скидка 5%</div>
                  <div>• Золотая карта: от 25 000 ₽ — скидка 7% + приоритетная доставка</div>
                </div>
              )}

              {moreSubSection === 'logistics' && (
                <div className="text-xs space-y-2 text-[#DFD2D6] leading-relaxed">
                  <div>• Зона 1 (Центр и мкр.): <strong>0 ₽ (бесплатно)</strong>, 30–60 мин</div>
                  <div>• Зона 2 (Пригородные посёлки): <strong>400 ₽</strong>, 45–75 мин</div>
                  <div>• Зона 3 (Предприятия и промзона): <strong>400 ₽</strong>, к точному часу</div>
                </div>
              )}

              {moreSubSection === 'settings' && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-[#CBB9BF] mb-1.5">Роль сотрудника</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Админ', 'Флорист', 'Курьер'] as StaffRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`h-9 rounded-xl text-xs font-semibold border ${
                            role === r
                              ? 'bg-[#922E3D] border-[#B44253] text-white'
                              : 'bg-[#2C1E23] border-[#3D2B31] text-[#D7C7CD]'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1B1215] border border-[#35242A] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold">Push-уведомления о заказах</div>
                      <div className="text-[11px] text-[#9E8A91]">Уведомления браузера</div>
                    </div>
                    <button
                      onClick={async () => {
                        const next = !pushEnabled;
                        setPushEnabled(next);
                        if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                          await Notification.requestPermission().catch(() => {});
                        }
                      }}
                      className={`w-11 h-6 rounded-lg p-0.5 transition-colors ${
                        pushEnabled ? 'bg-[#922E3D]' : 'bg-[#453238]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg bg-white transition-transform ${
                          pushEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                        new Notification('Sophiya: Новый заказ', { body: 'Проверка push-уведомлений' });
                      } else {
                        showToast('ok', 'Тестовое уведомление отправлено');
                      }
                    }}
                    className="w-full h-9 rounded-xl bg-[#2C1E23] border border-[#3D2B31] text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5" /> Проверить уведомление
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Danger Confirmation Modal (Clear / Reset) */}
        {dangerModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setDangerModal(null)}
          >
            <div className="w-full max-w-sm bg-[#22171B] border border-rose-500/40 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-rose-200">
                  {dangerModal === 'clear' ? 'Очистить весь каталог?' : 'Сбросить каталог по умолчанию?'}
                </h3>
                <button onClick={() => setDangerModal(null)}>
                  <X className="w-5 h-5 text-[#C9B7BD]" />
                </button>
              </div>
              <p className="text-xs text-[#D5C5CA] leading-relaxed">
                {dangerModal === 'clear'
                  ? 'Это удалит все букеты из каталога и облачной базы. Для подтверждения введите слово УДАЛИТЬ.'
                  : 'Каталог вернётся к исходным позициям, а текущие изменения будут перезаписаны.'}
              </p>
              {dangerModal === 'clear' && (
                <input
                  value={dangerConfirmInput}
                  onChange={(e) => setDangerConfirmInput(e.target.value)}
                  placeholder="Введите УДАЛИТЬ"
                  className="w-full h-10 px-3 rounded-xl bg-[#1B1215] border border-rose-500/40 text-sm text-white"
                />
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDangerModal(null)}
                  className="flex-1 h-10 rounded-xl bg-[#2C1E23] border border-[#3D2B31] text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  disabled={dangerModal === 'clear' && dangerConfirmInput.trim().toUpperCase() !== 'УДАЛИТЬ'}
                  onClick={() => {
                    if (dangerModal === 'clear') {
                      clearAllBouquets();
                      showToast('ok', 'Каталог очищен');
                    } else {
                      resetToDefault();
                      showToast('ok', 'Каталог сброшен');
                    }
                    setDangerModal(null);
                  }}
                  className="flex-1 h-10 rounded-xl bg-rose-700 text-white text-xs font-semibold disabled:opacity-40"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
