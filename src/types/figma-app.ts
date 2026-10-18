export interface Bouquet {
  id: string;
  title: string;
  price: number;
  category: 'Монобукеты' | 'Авторские' | 'Коробки' | 'Корзины';
  color: 'Розовый' | 'Красный' | 'Белый' | 'Бордовый';
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
