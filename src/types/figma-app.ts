export type BouquetCategory = 'Монобукеты' | 'Авторские' | 'Коробки' | 'Корзины' | (string & {});
export type BouquetColor = 'Розовый' | 'Красный' | 'Белый' | 'Бордовый' | 'Персиковый' | (string & {});

export interface Bouquet {
  id: string;
  title: string;
  price: number;
  category: BouquetCategory;
  color: BouquetColor;
  inStock: boolean;
  image: string;
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
