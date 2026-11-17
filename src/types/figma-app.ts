export type BouquetCategory = 'Монобукеты'|'Авторские'|'Цветы поштучно'|'Коробки'|'Корзины'|'Шары'|'Топперы'|'Мягкие игрушки'|'Сладости'|'Комнатные растения'|(string & {});

export const ALL_BOUQUET_CATEGORIES: string[] = [
  'Все',
  'Монобукеты',
  'Авторские',
  'Цветы поштучно',
  'Коробки',
  'Корзины',
  'Шары',
  'Топперы',
  'Мягкие игрушки',
  'Сладости',
  'Комнатные растения',
];

export const EDITABLE_CATEGORIES: string[] = [
  'Монобукеты',
  'Авторские',
  'Цветы поштучно',
  'Коробки',
  'Корзины',
  'Шары',
  'Топперы',
  'Мягкие игрушки',
  'Сладости',
  'Комнатные растения',
];
export type BouquetColor = 'Розовый'|'Красный'|'Белый'|'Бордовый'|'Персиковый'|(string & {});

export interface Bouquet {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  category: BouquetCategory;
  color: BouquetColor;
  inStock: boolean;
  image: string;
  images?: string[];
  hasRealPhoto?: boolean;
  tags?: string[];
  flowerTypes?: string[];
  description: string;
  characteristics: {
    height: string;
    flowersCount: string;
    durability: string;
    packaging: string;
  };
}

export interface CartItem {
  bouquet: Bouquet;
  quantity: number;
}

export interface FilterOptions {
  minPrice: number;
  maxPrice: number;
  category: string;
  color: string;
}
