import { FlowerVarietyInfo, PetalColorOption, FoliageOption, WrapOption, RibbonOption, CatalogItem } from '../types';

export const FLOWER_VARIETIES: FlowerVarietyInfo[] = [
  {
    id: 'rose',
    name: 'Baccara Velvet Rose',
    nameRu: 'Роза Баккара Вельвет',
    botanicalName: 'Rosa Grand Prix Ecuatoriana',
    origin: 'Эквадор, высокогорные плантации Котопахи (2800м)',
    symbolism: 'Глубокая трансцендентная страсть, величие и тайное признание',
    scentProfile: {
      top: 'Дамасская роза, черная смородина',
      heart: 'Древесный уд, дикий мед',
      base: 'Серая амбра, темный мускус'
    },
    vaseLife: '12-16 дней при температуре +18°C',
    basePrice: 12500,
    description: 'Королевская роза с бархатистыми лепестками глубокого винно-черного оттенка. Плотная многослойная сердцевина раскрывается в пышный архитектурный бутон диаметром до 14 см.'
  },
  {
    id: 'peony',
    name: 'Blanche Royale Peony',
    nameRu: 'Пион Бланш Рояль',
    botanicalName: 'Paeonia Lactiflora Duchesse de Nemours',
    origin: 'Нидерланды, частные селекционные оранжереи Боскопа',
    symbolism: 'Изобилие, аристократическая чистота, счастливая судьба',
    scentProfile: {
      top: 'Весенний нарцисс, зеленый чай',
      heart: 'Белый пион, лепестки флердоранжа',
      base: 'Французская ваниль, кедровый шлейф'
    },
    vaseLife: '9-12 дней',
    basePrice: 14800,
    description: 'Махровый шелковистый пион с сотнями воздушных волнистых лепестков. Аромат утреннего сада во французском замке с нотами росы и белого фарфора.'
  },
  {
    id: 'orchid',
    name: 'Nocturne Phalaenopsis',
    nameRu: 'Орхидея Фаленопсис Ноктюрн',
    botanicalName: 'Phalaenopsis Amabilis Var. Tenebris',
    origin: 'Япония, префектура Киото & тропические террасы Окинавы',
    symbolism: 'Редкая утонченность, медитативное созерцание, вечная грация',
    scentProfile: {
      top: 'Ночной жасмин, капли дождя',
      heart: 'Свежий бамбук, белый ирис',
      base: 'Сандал, кашемировое дерево'
    },
    vaseLife: '20-28 дней в срезе',
    basePrice: 16900,
    description: 'Скульптурная орхидея с изгибающимся графичным стеблем и лепестками, напоминающими крылья ночной экзотической бабочки. Сохраняет свежесть почти месяц.'
  },
  {
    id: 'lotus',
    name: 'Celestial Lotus',
    nameRu: 'Лотос Селестиал',
    botanicalName: 'Nelumbo Nucifera Divina',
    origin: 'Индия, священные высокогорные озера Кашмира',
    symbolism: 'Духовное возрождение, просветление и гармония первозданной природы',
    scentProfile: {
      top: 'Водяная лилия, лайм каффир',
      heart: 'Розовый лотос, кардамон',
      base: 'Ладан, ветивер'
    },
    vaseLife: '8-10 дней',
    basePrice: 18500,
    description: 'Сакральный цветок с золотой мерцающей сердцевиной и безупречной симметрией лепестков. Медленно пробуждается на рассвете и дарит мистический кристальный аромат.'
  }
];

export const PETAL_COLORS: PetalColorOption[] = [
  {
    id: 'baccara',
    name: 'Velvet Noir Crimson',
    nameRu: 'Винный Бархат',
    hex: '#6e1124',
    accentHex: '#9c1d37',
    roughness: 0.65,
    sheen: 0.8
  },
  {
    id: 'alabaster',
    name: 'Royal Alabaster Ivory',
    nameRu: 'Алебастровый Шелк',
    hex: '#f5efe4',
    accentHex: '#e8dcce',
    roughness: 0.45,
    sheen: 0.95
  },
  {
    id: 'obsidian',
    name: 'Midnight Obsidian',
    nameRu: 'Обсидиан Ночи',
    hex: '#16131c',
    accentHex: '#2b1f38',
    roughness: 0.5,
    sheen: 0.7
  },
  {
    id: 'peach',
    name: 'Dawn Champagne Peach',
    nameRu: 'Персиковое Шампанское',
    hex: '#d9816c',
    accentHex: '#f0a38f',
    roughness: 0.4,
    sheen: 0.9
  },
  {
    id: 'emerald',
    name: 'Mystic Botanical Emerald',
    nameRu: 'Ботанический Изумруд',
    hex: '#1f4738',
    accentHex: '#2f6954',
    roughness: 0.55,
    sheen: 0.75
  }
];

export const FOLIAGE_OPTIONS: FoliageOption[] = [
  {
    id: 'eucalyptus',
    name: 'Silver Dollar Eucalyptus',
    nameRu: 'Серебристый Эвкалипт Цинерея',
    price: 1800,
    description: 'Круглые матовые листья с легким восковым налетом и прохладным ментолово-камфорным ароматом'
  },
  {
    id: 'ginkgo',
    name: 'Gold Dipped Ginkgo Leaves',
    nameRu: 'Листья Гинкго с Золотым Напылением',
    price: 3200,
    description: 'Веерные японские листья с деликатной позолотой по кромке для архитектурного блеска'
  },
  {
    id: 'pampas',
    name: 'Bleached Whispering Pampas',
    nameRu: 'Выбеленная Шелковая Пампасная Трава',
    price: 2400,
    description: 'Объемные воздушные перья, создающие мягкий невесомый ореол вокруг букета'
  },
  {
    id: 'ruscus',
    name: 'Black Italian Ruscus',
    nameRu: 'Итальянский Черненый Рускус',
    price: 2100,
    description: 'Глянцевые темные ветви с графичной листвой для контраста со светлыми лепестками'
  }
];

export const WRAP_OPTIONS: WrapOption[] = [
  {
    id: 'silk',
    name: 'Raw French Mulberry Silk Wrap',
    nameRu: 'Обертка из Необработанного Французского Шелка',
    price: 2900,
    material: 'Матовый драпированный шелк ручного окрашивания с бахромой'
  },
  {
    id: 'pleated',
    name: 'Architectural Pleated Noir Paper',
    nameRu: 'Плиссированная Графитная Бумага Origami',
    price: 1900,
    material: 'Плотная японская бумага с геометрическими складками'
  },
  {
    id: 'glass_vase',
    name: 'Fluted Smoked Glass Vase',
    nameRu: 'Ваза из Рифленого Дымчатого Стекла',
    price: 6500,
    material: 'Венецианское выдувное стекло с легким градиентом в антрацит'
  },
  {
    id: 'ceramic_urn',
    name: 'Minimalist Basalt Ceramic Urn',
    nameRu: 'Керамическая Урна из Базальтовой Глины',
    price: 7800,
    material: 'Шероховатая текстурированная глина ручной формовки'
  }
];

export const RIBBON_OPTIONS: RibbonOption[] = [
  {
    id: 'gold_metallic',
    name: 'Embossed Antique Gold Thread',
    nameRu: 'Лента с Тиснением Золотой Нитью',
    colorHex: '#d4af37'
  },
  {
    id: 'bordeaux_velvet',
    name: 'Heavy Silk Velvet Bordeaux',
    nameRu: 'Тяжелый Бархат Бордо',
    colorHex: '#6b1426'
  },
  {
    id: 'emerald_satin',
    name: 'Forest Emerald Double-Faced Satin',
    nameRu: 'Двусторонний Изумрудный Атлас',
    colorHex: '#1e4839'
  }
];

export const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'elixir-noir',
    title: 'L’Élixir Noir',
    subtitle: 'Моно-композиция черных эквадорских роз',
    collection: 'nocturne',
    price: 34500,
    flowerType: 'rose',
    defaultColor: 'baccara',
    scentNotes: ['Дамасская роза', 'Черный трюфель', 'Удовое дерево'],
    stems: 25,
    featured: true,
    description: 'Манифест драматической элегантности. 25 отборных роз сорта Grand Prix Baccara в плиссированной бумаге с золотой нитью.'
  },
  {
    id: 'versailles-serenade',
    title: 'Sérénade de Versailles',
    subtitle: 'Ароматный ансамбль королевских белых пионов',
    collection: 'haute',
    price: 42000,
    flowerType: 'peony',
    defaultColor: 'alabaster',
    scentNotes: ['Весенний пион', 'Цитрусовый цвет', 'Белый мускус'],
    stems: 19,
    featured: true,
    description: 'Скульптурная композиция из пышных пионов Blanche Royale с веточками серебристого эвкалипта в драпированном шелке.'
  },
  {
    id: 'nocturne-kyoto',
    title: 'Nocturne de Kyoto',
    subtitle: 'Каскадная ветвь редкой темной орхидеи',
    collection: 'architectural',
    price: 38900,
    flowerType: 'orchid',
    defaultColor: 'obsidian',
    scentNotes: ['Ночной жасмин', 'Зеленый мох', 'Кипарис Хиноки'],
    stems: 7,
    featured: false,
    description: 'Японская каллиграфическая композиция. 7 ниспадающих ветвей орхидеи в вазе из рифленого дымчатого стекла.'
  },
  {
    id: 'himalayan-lotus',
    title: 'Aura Céleste du Lotus',
    subtitle: 'Медитативная скульптура из священных лотосов',
    collection: 'solarium',
    price: 46000,
    flowerType: 'lotus',
    defaultColor: 'peach',
    scentNotes: ['Лотос', 'Кардамон', 'Белый ладан'],
    stems: 11,
    featured: true,
    description: 'Цветы, излучающие умиротворение. Тончайшая градация оттенка персикового заката с листьями гинкго в базальтовой урне.'
  },
  {
    id: 'opera-sauvage',
    title: 'Opéra Sauvage',
    subtitle: 'Гранд-букет для торжественных премьер и приемов',
    collection: 'haute',
    price: 68000,
    flowerType: 'rose',
    defaultColor: 'baccara',
    scentNotes: ['Бурбонская роза', 'Кожа', 'Красный перец'],
    stems: 51,
    featured: false,
    description: 'Ошеломляющий объем из 51 розы с каскадом пампасной травы и черненого рускуса. Доставляется в фирменном кожаном коробе.'
  },
  {
    id: 'jardin-suspendu',
    title: 'Jardin Suspendu',
    subtitle: 'Флористический авангард в изумрудных полутонах',
    collection: 'architectural',
    price: 29500,
    flowerType: 'peony',
    defaultColor: 'emerald',
    scentNotes: ['Лист инжира', 'Влажная земля', 'Шалфей'],
    stems: 15,
    featured: false,
    description: 'Для ценителей авангардной эстетики. Изумрудные и алебастровые бутоны с серебристой цинереей в шелковой вуали.'
  }
];
