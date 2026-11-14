import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

const CANONICAL_BASE = 'https://xn----ctbjn3arftl7c8b.xn--p1ai';

// Catalog items for pre-rendering - matching src/data/bouquets.ts strictly
const BOUQUETS = [
  {
    id: '1',
    title: 'Розы розовые французские',
    price: 12800,
    category: 'Монобукеты',
    color: 'Розовый',
    inStock: true,
    image: '/bouquet-1.jpg',
    hasRealPhoto: true,
    tags: ['розы', 'монобукеты', 'французские розы', 'на-праздник'],
    flowerTypes: ['розы'],
    flowersCount: '25 роз сорта French Pink',
    height: '50-60 см',
    durability: '10–14 дней при правильном уходе',
    description: 'Букет станет великолепным подарком для близкого человека или комплиментом к торжеству. 25 отборных роз сорта French Pink в дизайнерской упаковке.'
  },
  {
    id: '2',
    title: 'Праздничный Red Piano',
    price: 9500,
    category: 'Авторские',
    color: 'Красный',
    inStock: true,
    image: '/bouquet-2.jpg',
    hasRealPhoto: true,
    tags: ['авторские', 'розы', 'пионовидные розы', 'на-праздник'],
    flowerTypes: ['розы'],
    flowersCount: '19 пионовидных роз + декор',
    height: '45 см',
    durability: '12–16 дней при правильном уходе',
    description: 'Авторский сет из пионовидных алых роз Red Piano с декоративной хвоей нобилиса и матовыми стеклянными шарами. Подходит для праздничных поздравлений.'
  },
  {
    id: '3',
    title: 'Пионы Blanche в шелке',
    price: 14200,
    category: 'Монобукеты',
    color: 'Белый',
    inStock: true,
    image: '/bouquet-3.jpg',
    hasRealPhoto: true,
    tags: ['пионы', 'монобукеты', 'сортовые пионы'],
    flowerTypes: ['пионы'],
    flowersCount: '15 королевских пионов',
    height: '50 см',
    durability: '8–10 дней при правильном уходе',
    description: 'Сортовые пионы Blanche с пышным раскрытием. Пудрово-молочный оттенок с мягким тонким ароматом.'
  },
  {
    id: '4',
    title: 'Композиция в шляпной коробке',
    price: 11400,
    category: 'Коробки',
    color: 'Бордовый',
    inStock: true,
    image: '/bouquet-placeholder.svg',
    hasRealPhoto: false,
    tags: ['коробки', 'композиции', 'шляпная коробка'],
    flowerTypes: ['микс'],
    flowersCount: '27 бутонов микс',
    height: '40 см',
    durability: 'до 18 дней при регулярном поливе',
    description: 'Флористическая композиция на оазисе. Не требует вазы — стебли цветов питаются влагой со специальным составом Chrysal.'
  },
  {
    id: '5',
    title: 'Эустома Viola & эвкалипт',
    price: 7800,
    category: 'Авторские',
    color: 'Розовый',
    inStock: true,
    image: '/bouquet-placeholder.svg',
    hasRealPhoto: false,
    tags: ['авторские', 'эустома'],
    flowerTypes: ['эустома'],
    flowersCount: '21 ветка',
    height: '55 см',
    durability: '14–20 дней при правильном уходе',
    description: 'Воздушная композиция из махровой эустомы пудрового и винного оттенков с серебристым эвкалиптом Цинерея.'
  },
  {
    id: '6',
    title: '101 алая роза Гран При',
    price: 26500,
    category: 'Монобукеты',
    color: 'Красный',
    inStock: false,
    image: '/bouquet-placeholder.svg',
    hasRealPhoto: false,
    tags: ['розы', 'монобукеты', '101 роза', 'на-юбилей'],
    flowerTypes: ['розы'],
    flowersCount: '101 роза',
    height: '70 см',
    durability: '10–14 дней при правильном уходе',
    description: 'Большой букет из 101 отборной алой розы длиной 70 см. Бутоны крупной категории с бархатистыми лепестками.'
  }
];

const ROUTES = [
  {
    path: '/',
    slug: '',
    title: 'Купить цветы в Нижнекамске с доставкой — салон «София»',
    description: 'Купить свежие цветы и букеты в Нижнекамске с быстрой доставкой от 30 минут. Салон «София», пр. Шинников, 13В. Сортовые розы, авторские сеты. Фото букета в WhatsApp перед отправкой.',
    h1: 'Купить цветы в Нижнекамске с доставкой — салон «София»',
    categoryFilter: 'Все',
    breadcrumbLabel: 'Главная',
    introHeading: 'Свежие цветы и авторские букеты с быстрой доставкой по Нижнекамску',
    introText: [
      'Салон цветов «София» расположен в Нижнекамске по адресу проспект Шинников, дом 13В. Мы регулярно получаем свежие поставки сортовых роз из Эквадора, пионов и сезонных цветов. Каждая композиция собирается флористом непосредственно перед отправкой.',
      'Все букеты доставляются по Нижнекамску в вертикальных аквабоксах с водой. Перед передачей заказа курьеру отправляем детальное фото букета в WhatsApp. Доставка по городу от 30 минут.'
    ],
    pageType: 'category'
  },
  {
    path: '/rozy/',
    slug: 'rozy',
    title: 'Розы в Нижнекамске — купить с быстрой доставкой',
    description: 'Купить свежие розы в Нижнекамске с доставкой. Сортовые и французские розы в салоне «София» на Шинников, 13В. Фото в WhatsApp перед отправкой.',
    h1: 'Купить розы в Нижнекамске с доставкой — Салон «София»',
    targetTag: 'розы',
    breadcrumbLabel: 'Розы',
    introHeading: 'Сортовые и французские розы в Нижнекамске',
    introText: [
      'В салоне «София» представлен выбор свежих сортовых роз: бутоны на длинном стебле, французские пионовидные розы и кустовые сорта. Поставки срезки производятся на регулярной основе.',
      'Вы можете выбрать букет роз в авторской упаковке или лаконичную монокомпозицию. Доставка букетов роз по Нижнекамску с обязательным фотоотчетом в WhatsApp перед выездом курьера.'
    ],
    pageType: 'category'
  },
  {
    path: '/monobukety/',
    slug: 'monobukety',
    title: 'Монобукеты в Нижнекамске — заказать с доставкой',
    description: 'Стильные монобукеты из роз и пионов в Нижнекамске. Доставка из салона «София». Фото букета перед выездом курьера. Тел: +7 (917) 256-32-35',
    h1: 'Монобукеты в Нижнекамске с быстрой доставкой',
    targetCategory: 'Монобукеты',
    breadcrumbLabel: 'Монобукеты',
    introHeading: 'Элегантные монобукеты из одного вида цветов',
    introText: [
      'Монобукет — это чистая эстетика и выразительность одного сорта цветов. В салоне «София» мы собираем монобукеты из сортовых роз, пионов и сезонных цветов.',
      'Для упаковки используются благородные матовые материалы и атласные ленты. Доставка по Нижнекамску осуществляется курьерской службой салона.'
    ],
    pageType: 'category'
  },
  {
    path: '/avtorskie-bukety/',
    slug: 'avtorskie-bukety',
    title: 'Авторские букеты в Нижнекамске — салон «София»',
    description: 'Авторские букеты от флористов в Нижнекамске. Неповторимые композиции со свежей срезкой. Доставка от 30 минут. Салон «София», пр. Шинников, 13В.',
    h1: 'Авторские букеты ручной работы в Нижнекамске',
    targetCategory: 'Авторские',
    breadcrumbLabel: 'Авторские букеты',
    introHeading: 'Уникальные авторские композиции от флористов «София»',
    introText: [
      'Авторский букет — это работа флориста, в которой гармонично сочетаются сезонные цветы, фактурная зелень и игра оттенков. Мы подбираем стойкие сорта с учетом повода торжества.',
      'Каждый авторский букет собирается вручную в салоне на пр. Шинников, 13В. Перед отправкой мы согласуем результат по фото в WhatsApp.'
    ],
    pageType: 'category'
  },
  {
    path: '/cvety-v-korobke/',
    slug: 'cvety-v-korobke',
    title: 'Цветы в коробке в Нижнекамске с доставкой — София',
    description: 'Композиции и цветы в шляпных коробках в Нижнекамске. Доставка курьером. Подарочная открытка. Салон «София», пр. Шинников, 13В.',
    h1: 'Цветы в шляпных коробках с доставкой в Нижнекамске',
    targetCategory: 'Коробки',
    breadcrumbLabel: 'Цветы в коробке',
    introHeading: 'Композиции в шляпных коробках — стойкость и удобство',
    introText: [
      'Цветы в шляпной коробке — это практичное решение. Стебли зафиксированы во флористическом оазисе, поэтому композиция не требует вазы.',
      'Такая композиция подходит для дома, офиса или ресторана. Доставка по Нижнекамску курьером салона «София».'
    ],
    pageType: 'category'
  },
  {
    path: '/korziny-cvetov/',
    slug: 'korziny-cvetov',
    title: 'Корзины цветов в Нижнекамске — заказ и доставка',
    description: 'Праздничные корзины с живыми цветами в Нижнекамске под заказ. Фото в WhatsApp перед выездом. Салон «София»: +7 (917) 256-32-35',
    h1: 'Праздничные корзины цветов в Нижнекамске',
    targetCategory: 'Корзины',
    breadcrumbLabel: 'Корзины цветов',
    introHeading: 'Цветочные корзины для торжественных событий',
    introText: [
      'Корзина с живыми цветами — статусный подарок на юбилей, свадьбу или официальное торжество. Цветы размещаются в оазисе, сохраняющем влагу.',
      'В салоне «София» корзины цветов собираются под заказ. Свяжитесь с флористом для уточнения состава и сортов.'
    ],
    pageType: 'category'
  },
  {
    path: '/svadebnye-bukety/',
    slug: 'svadebnye-bukety',
    title: 'Свадебные букеты в Нижнекамске — салон «София»',
    description: 'Свадебные букеты невесты в Нижнекамске. Индивидуальный подбор цветов под образ. Свежесть и стойкость. Салон «София», пр. Шинников, 13В.',
    h1: 'Свадебные букеты для невесты в Нижнекамске',
    targetTag: 'свадебные',
    breadcrumbLabel: 'Свадебные букеты',
    introHeading: 'Букет невесты и свадебное оформление',
    introText: [
      'Свадебный букет сопровождает невесту весь праздничный день, поэтому флористы салона «София» уделяют внимание надежности сборки и стойкости цветов.',
      'Поможем подобрать палитру под фасон платья: классические белые розы, пионы, каллы, эустомы и эвкалипт.'
    ],
    pageType: 'category'
  },
  {
    path: '/piony/',
    slug: 'piony',
    title: 'Пионы в Нижнекамске — купить букет с доставкой',
    description: 'Купить свежие сортовые пионы в Нижнекамске. Крупные бутоны, нежные оттенки, доставка курьером. Фото букета перед вручением. Салон цветов «София».',
    h1: 'Свежие пионы в Нижнекамске с бережной доставкой',
    targetTag: 'пионы',
    breadcrumbLabel: 'Пионы',
    introHeading: 'Сортовые пионы с доставкой по Нижнекамску',
    introText: [
      'Пионы — чувственные и нежные цветы. В салон «София» привозятся пионы сортов Blanche, Sarah Bernhardt и других популярных сортов с крупным раскрытием бутона.',
      'Собираем монобукеты из пионов и добавляем их в авторские миксы. Доставка в транспортировочной упаковке защищает нежные лепестки.'
    ],
    pageType: 'category'
  },
  {
    path: '/hrizantemy/',
    slug: 'hrizantemy',
    title: 'Хризантемы в Нижнекамске — свежие букеты с доставкой',
    description: 'Кустовые и одноголовые хризантемы в Нижнекамске. Стойкие букеты с доставкой по городу. Салон «София» на Шинников, 13В: +7 (917) 256-32-35',
    h1: 'Букеты из свежих хризантем в Нижнекамске',
    targetTag: 'хризантемы',
    breadcrumbLabel: 'Хризантемы',
    introHeading: 'Стойкие хризантемы: пышность и долговечность',
    introText: [
      'Хризантемы ценятся за стойкость и разнообразие оттенков. В наличии кустовые и одноголовые сорта.',
      'Букет хризантем подходит для поздравления мамы, коллеги или учителя. Доставляем заказы по Нижнекамску в фирменной упаковке.'
    ],
    pageType: 'category'
  },
  {
    path: '/gorshechnye-rasteniya/',
    slug: 'gorshechnye-rasteniya',
    title: 'Горшечные растения в Нижнекамске — салон «София»',
    description: 'Комнатные и горшечные растения в Нижнекамске. Растения для дома и офиса. Консультация флориста. Салон «София», пр. Шинников, 13В.',
    h1: 'Горшечные комнатные растения в Нижнекамске',
    targetCategory: 'Горшечные',
    breadcrumbLabel: 'Горшечные растения',
    introHeading: 'Комнатные растения и цветы в горшках',
    introText: [
      'В салоне цветов «София» представлены комнатные растения: орхидеи, фикусы, суккуленты и сезонные зеленые растения.',
      'Консультируем по базовому уходу и поливу. Уточняйте актуальное наличие растений в салоне по телефону.'
    ],
    pageType: 'category'
  },
  {
    path: '/traurnye-venki/',
    slug: 'traurnye-venki',
    title: 'Траурные венки в Нижнекамске — доставка и заказ',
    description: 'Траурная флористика, венки и траурные корзины в Нижнекамске под заказ. Сдержанные композиции. Доставка к назначенному времени.',
    h1: 'Траурная флористика и венки в Нижнекамске',
    targetCategory: 'Траурные',
    breadcrumbLabel: 'Траурная флористика',
    introHeading: 'Траурная флористика и композиции памяти',
    introText: [
      'Салон цветов «София» изготавливает сдержанные траурные композиции, корзины и поминальные букеты под заказ.',
      'Свяжитесь с нами для индивидуального подбора цветов и согласования времени доставки в Нижнекамске.'
    ],
    pageType: 'category'
  },
  {
    path: '/dostavka/',
    slug: 'dostavka',
    title: 'Доставка цветов в Нижнекамске — зоны, тарифы и сроки — салон «София»',
    description: 'Курьерская доставка цветов по Нижнекамску от 30 минут. Зоны доставки: Центр, Микрорайоны, Красный Ключ, Афанасово, Промзона (БСИ, НКНХ). Фото в WhatsApp перед выездом.',
    h1: 'Доставка цветов по Нижнекамску — зоны, сроки и стоимость',
    targetCategory: 'Все',
    breadcrumbLabel: 'Доставка и оплата',
    introHeading: 'Зоны и условия курьерской доставки цветов по Нижнекамску',
    introText: [
      'Салон цветов «София» доставляет букеты по Нижнекамску ежедневно с 08:00 до 21:00. Мы бережно перевозим букеты в специальных аквабоксах на воде, поэтому лепестки не теряют свежесть в дороге. В холодный сезон используем защитную термоупаковку.',
      'Зона 1 (Центральный район и микрорайоны): проспекты Шинников, Мира, Строителей, Сююмбике, Химиков, улицы Баки Урманче, Чулман, Табеева. Доставка за 30–60 минут. Стоимость — 300 ₽, при сумме заказа от 4 500 ₽ — бесплатно.',
      'Зона 2 (Пригородные посёлки): Красный Ключ, Большое Афанасово, Нижнее Афанасово, Дмитриевка, Ильинка. Доставка за 45–75 минут, стоимость — 450 ₽.',
      'Зона 3 (Предприятия и промзона): БСИ, площадки ПАО «Нижнекамскнефтехим», ТАНЕКО, ТАИФ-НК. Доставка к проходным и офисам к назначенному времени, стоимость — 500 ₽.',
      'Перед отправкой флорист отправляет детальное фото букета в WhatsApp на номер заказчика. Самовывоз из салона по адресу пр. Шинников, 13В — бесплатно в часы работы салона (08:00–21:00).'
    ],
    pageType: 'info'
  },
  {
    path: '/o-salone/',
    slug: 'o-salone',
    title: 'О салоне цветов «София» в Нижнекамске — Шинников 13В',
    description: 'Салон цветов «София» в Нижнекамске на пр. Шинников, 13В. Авторская флористика, регулярные поставки свежих цветов. Тел: +7 (917) 256-32-35',
    h1: 'О салоне цветов «София» в Нижнекамске',
    targetCategory: 'Все',
    breadcrumbLabel: 'О салоне',
    introHeading: 'Флористика и стандарты заботы о каждом букете',
    introText: [
      'Салон цветов «София» расположен в Нижнекамске по адресу проспект Шинников, дом 13В.',
      'Мы следим за качеством срезки, соблюдаем температурный режим хранения цветов и собираем современные букеты.'
    ],
    pageType: 'info'
  },
  {
    path: '/kontakty/',
    slug: 'kontakty',
    title: 'Контакты салона цветов «София» в Нижнекамске',
    description: 'Адрес и контакты салона цветов «София»: Нижнекамск, пр. Шинников, 13В. Телефон: +7 (917) 256-32-35. Режим работы: 08:00–21:00.',
    h1: 'Контакты, адрес и режим работы салона «София»',
    targetCategory: 'Все',
    breadcrumbLabel: 'Контакты',
    introHeading: 'Адрес салона и связь с флористами',
    introText: [
      'Салон цветов «София» находится по адресу: Республика Татарстан, г. Нижнекамск, проспект Шинников, дом 13В.',
      'Телефон для заказов: +7 (917) 256-32-35. Чат в WhatsApp доступен для консультаций. Режим работы: ежедневно 08:00–21:00 без выходных.'
    ],
    pageType: 'info'
  },
  {
    path: '/otzyvy/',
    slug: 'otzyvy',
    title: 'Отзывы о салоне цветов «София» в Нижнекамске',
    description: 'Отзывы клиентов о салоне цветов «София» в Нижнекамске. Контроль качества сборки и фотоотчет в WhatsApp. Тел: +7 (917) 256-32-35',
    h1: 'Отзывы клиентов о салоне цветов «София»',
    targetCategory: 'Все',
    breadcrumbLabel: 'Отзывы',
    introHeading: 'Впечатления клиентов и обратная связь',
    introText: [
      'Мы ценим обратную связь каждого покупателя и стремимся поддерживать высокий уровень сервиса при каждом заказе.',
      'Оставить свой отзыв или пожелание вы можете нашему администратору в WhatsApp или при посещении салона.'
    ],
    pageType: 'info'
  },
  {
    path: '/faq/',
    slug: 'faq',
    title: 'Вопросы и ответы о доставке цветов в Нижнекамске',
    description: 'Ответы на частые вопросы о заказе, оплате и доставке цветов по Нижнекамску. Фото перед отправкой. Салон цветов «София».',
    h1: 'Частые вопросы о заказе и доставке цветов',
    targetCategory: 'Все',
    breadcrumbLabel: 'Вопросы и ответы',
    introHeading: 'Популярные вопросы клиентов перед заказом',
    introText: [
      'Как быстро доставляются цветы? Сроки доставки составляют от 30 до 60 минут с момента подтверждения заказа.',
      'Присылаете ли фото до выезда курьера? Да, отправляем детальные снимки готовой работы в WhatsApp.'
    ],
    pageType: 'info'
  },
  {
    path: '/blog/',
    slug: 'blog',
    title: 'Блог о цветах и флористике — салон «София»',
    description: 'Статьи о флористике, уходе за срезанными цветами и выборе букетов в Нижнекамске от салона «София».',
    h1: 'Блог флористов салона цветов «София» в Нижнекамске',
    targetCategory: 'Все',
    breadcrumbLabel: 'Блог',
    introHeading: 'Советы по уходу за букетами и флористические заметки',
    introText: [
      'В блоге салона «София» мы делимся практическими рекомендациями: как продлить жизнь букету роз, почему важна подрезка стеблей и чистая прохладная вода.',
      'Следите за нашими публикациями и флористическими подсказками.'
    ],
    pageType: 'info'
  },
  {
    path: '/na-den-rozhdeniya/',
    slug: 'na-den-rozhdeniya',
    title: 'Букеты на день рождения в Нижнекамске — заказать с доставкой в салоне «София»',
    description: 'Купить букет на день рождения в Нижнекамске с доставкой от 30 минут. Сортовые розы, авторские сеты и коробки. Фото в WhatsApp перед отправкой. Салон «София», пр. Шинников, 13В.',
    h1: 'Цветы и букеты на день рождения в Нижнекамске',
    targetTag: 'на-праздник',
    breadcrumbLabel: 'На день рождения',
    introHeading: 'Яркие авторские букеты и сортовые розы ко дню рождения',
    introText: [
      'День рождения — прекрасный повод подарить живые цветы. Флористы салона «София» собирают букеты со свежей поставки: французские пионовидные розы, пышные гортензии, эустому и альстромерию. Мы поможем подобрать гамму — от нежной пастели до насыщенных ягодных оттенков.',
      'К каждому именинному букету мы бесплатно прилагаем фирменную открытку для тёплых пожеланий и пакетик подкормки Chrysal для продления стойкости. Доставка по Нижнекамску от 30 минут прямо в руки имениннику, домой или в ресторан. Перед отправкой присылаем детальное фото готового букета в WhatsApp.'
    ],
    pageType: 'occasion'
  },
  {
    path: '/na-svadbu/',
    slug: 'na-svadbu',
    title: 'Цветы на свадьбу в Нижнекамске — букеты невесты и поздравления — салон «София»',
    description: 'Свадебная флористика в Нижнекамске: букеты невесты, бутоньерки, композиции для поздравления молодоженов. Свежие поставки. Салон «София», пр. Шинников, 13В. Тел: +7 (917) 256-32-35',
    h1: 'Свадебные цветы и поздравления в Нижнекамске',
    targetTag: 'свадебные',
    breadcrumbLabel: 'На свадьбу',
    introHeading: 'Свадебная флористика и букеты для молодоженов',
    introText: [
      'Свадебный букет должен сохранять безупречную свежесть с утренней фотосессии до завершения банкета. В салоне «София» мы собираем лёгкие и стойкие композиции из белых и кремовых сортовых роз, калл, эустомы, пионов и веточек эвкалипта. Стебли плотно связываются атласными лентами в тон платья невесты.',
      'Гостям свадьбы предлагаем подарочные корзины и шляпные коробки, которые не требуют поиска вазы на банкете и питаются влагой из флористического оазиса. Доставка по Нижнекамску к загсу, банкетному залу или на дом.'
    ],
    pageType: 'occasion'
  },
  {
    path: '/na-8-marta/',
    slug: 'na-8-marta',
    title: 'Цветы на 8 Марта в Нижнекамске — предзаказ тюльпанов и роз с доставкой — салон «София»',
    description: 'Заказ цветов на 8 Марта в Нижнекамске: сортовые тюльпаны, розы, мимоза. Корпоративные заказы и штучные букеты с доставкой. Салон «София»: +7 (917) 256-32-35',
    h1: 'Цветы и тюльпаны на 8 Марта в Нижнекамске',
    targetTag: 'монобукеты',
    breadcrumbLabel: 'На 8 Марта',
    introHeading: 'Весенние сортовые тюльпаны и розы к 8 Марта',
    introText: [
      'Международный женский день — время свежих тюльпанов, мимозы и весенней нежности. Салон цветов «София» открывает предзаказ на свежие поставки голландских и российских тюльпанов с плотными бутонами: пионовидные, бахромчатые и классические гладкие сорта любых оттенков.',
      'Принимаем корпоративные заявки от предприятий и организаций Нижнекамска для поздравления сотрудниц с выставлением счёта и закрывающими документами. Для частных заказов доступна быстрая доставка курьером по городу с контрольным фотоотчётом в WhatsApp перед выездом.'
    ],
    pageType: 'occasion'
  },
  {
    path: '/na-14-fevralya/',
    slug: 'na-14-fevralya',
    title: 'Цветы на 14 февраля в Нижнекамске — розы и букеты для любимых с доставкой',
    description: 'Романтические букеты на 14 февраля (День влюбленных) в Нижнекамске. Алые сортовые розы, композиции с признаниями, доставка курьером. Салон «София», пр. Шинников, 13В.',
    h1: 'Цветы и букеты на 14 февраля (День влюбленных)',
    targetTag: 'розы',
    breadcrumbLabel: 'На 14 февраля',
    introHeading: 'Романтические букеты и алые розы ко Дню святого Валентина',
    introText: [
      '14 Февраля — день признаний и романтики. Главным символом праздника остаются отборные алые розы сортов Explorer и Red Naomi с бархатистыми лепестками и тонким ароматом. Также собираем чувственные композиции из розовых пионовидных роз и белых эустом.',
      'Доставим букет-сюрприз вашей избраннице домой, на учёбу или в офис в любую точку Нижнекамска. К букету приложим открытку с вашим текстом. При необходимости организуем анонимную доставку, сохранив имя отправителя в тайне.'
    ],
    pageType: 'occasion'
  },
  {
    path: '/na-1-sentyabrya/',
    slug: 'na-1-sentyabrya',
    title: 'Цветы на 1 сентября в Нижнекамске — букет учителю ко Дню знаний — салон «София»',
    description: 'Букеты на 1 сентября в Нижнекамске для первоклассников и учителей. Стойкие осенние хризантемы, герберы и розы. Предзаказ и доставка. Салон «София».',
    h1: 'Букеты на 1 сентября для учителей в Нижнекамске',
    targetTag: 'монобукеты',
    breadcrumbLabel: 'На 1 сентября',
    introHeading: 'Компактные и стойкие букеты для школьников и учителей',
    introText: [
      'К 1 Сентября флористы салона «София» готовят композиции, которые удобно держать ребёнку на школьной линейке: компактный размер, лёгкий вес, прочная защитная упаковка стеблей без капель влаги.',
      'Используем стойкие осенние цветы: кустовые хризантемы, герберы, подсолнухи, сортовые розы и сухоцветы. Букет сохраняет свежесть в классе не менее двух недель. Доступен предзаказ на 31 августа и утро 1 сентября с самовывозом или доставкой.'
    ],
    pageType: 'occasion'
  },
  {
    path: '/na-yubiley/',
    slug: 'na-yubiley',
    title: 'Букеты на юбилей в Нижнекамске — заказ статусных композиций — салон «София»',
    description: 'Статусные букеты и корзины цветов на юбилей в Нижнекамске. 51 и 101 роза, сборные композиции. Пунктуальная доставка. Салон «София», пр. Шинников, 13В.',
    h1: 'Букеты и композиции на юбилей в Нижнекамске',
    targetTag: 'на-юбилей',
    breadcrumbLabel: 'На юбилей',
    introHeading: 'Статусные композиции и большие букеты к круглой дате',
    introText: [
      'Юбилей требует особого масштаба и выразительности. В салоне «София» для юбиляров создаются монобукеты из 51 и 101 эквадорской розы на длинном стебле, солидные цветочные корзины и авторские композиции в шляпных коробках с добавлением орхидей и сортовой зелени.',
      'Цветочные корзины особенно удобны для торжества в ресторане: они устойчивы, не переворачиваются и не требуют поиска вазы. Доставка цветов на юбилей осуществляется точно к оговоренному времени.'
    ],
    pageType: 'occasion'
  }
];

let activeBouquets = BOUQUETS;

function filterBouquetsForRoute(route) {
  if (route.path === '/') {
    return activeBouquets;
  }

  if (route.targetTag) {
    const tag = route.targetTag.toLowerCase();
    return activeBouquets.filter(b => {
      if (b.flowerTypes && b.flowerTypes.some(ft => ft.toLowerCase().includes(tag))) return true;
      if (b.tags && b.tags.some(t => t.toLowerCase().includes(tag))) return true;
      if (tag === 'розы' && /роз/i.test(b.title)) return true;
      if (tag === 'пионы' && /пион/i.test(b.title)) return true;
      if (tag === 'хризантемы' && /хризантем/i.test(b.title)) return true;
      if (tag === 'свадебные' && /свадебн/i.test(b.title)) return true;
      if (tag === 'на-праздник' && (b.tags && b.tags.includes('на-праздник'))) return true;
      if (tag === 'на-юбилей' && (b.tags && b.tags.includes('на-юбилей'))) return true;
      return false;
    });
  }

  if (route.targetCategory) {
    const cat = route.targetCategory.toLowerCase();
    return activeBouquets.filter(b => {
      if (b.category && b.category.toLowerCase() === cat) return true;
      if (b.tags && b.tags.some(t => t.toLowerCase() === cat)) return true;
      return false;
    });
  }

  return activeBouquets;
}

function formatBouquetCount(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} букет`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} букета`;
  }
  return `${count} букетов`;
}

function formatShownCount(count) {
  const word = formatBouquetCount(count);
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `Показан ${word}`;
  }
  return `Показано ${word}`;
}

function generateSeoSectionHtml(route) {
  if (route.slug === 'dostavka') {
    return `
      <!-- Delivery Zones & Terms Section -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 font-sans text-[#1C1215]">
        <div class="space-y-8 bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-8 lg:p-10 shadow-sm">
          <div class="space-y-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#8B1A2B]/10 text-[#8B1A2B] text-xs font-semibold">
              <span>Зоны и тарифы доставки в Нижнекамске</span>
            </div>
            <h2 class="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold leading-tight">
              Курьерская доставка цветов по районам Нижнекамска
            </h2>
            <p class="text-xs sm:text-sm text-[#5C454C] leading-relaxed max-w-3xl">
              Собственная служба доставки салона «София» привозит цветы с 08:00 до 21:00 без выходных. Все композиции транспортируются в вертикальном положении в аквабоксах с водой, сохраняя свежесть срезки. Зимой используется дополнительная термозащита.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div class="p-6 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9] space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#8B1A2B] uppercase tracking-wider">Зона 1: Центр</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">30–60 мин</span>
              </div>
              <h3 class="text-lg font-bold text-[#1C1215]">300 ₽ <span class="text-xs font-normal text-[#7C636B]">(бесплатно от 4 500 ₽)</span></h3>
              <p class="text-xs text-[#5C454C] leading-relaxed">
                Пр. Шинников, пр. Мира, пр. Строителей, пр. Сююмбике, пр. Химиков, ул. Баки Урманче, ул. Чулман, ул. Табеева.
              </p>
            </div>

            <div class="p-6 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9] space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#8B1A2B] uppercase tracking-wider">Зона 2: Пригород</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">45–75 мин</span>
              </div>
              <h3 class="text-lg font-bold text-[#1C1215]">450 ₽</h3>
              <p class="text-xs text-[#5C454C] leading-relaxed">
                Посёлок Красный Ключ, Большое Афанасово, Нижнее Афанасово, Дмитриевка, Ильинка. Вручение букета лично в руки.
              </p>
            </div>

            <div class="p-6 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9] space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#8B1A2B] uppercase tracking-wider">Зона 3: Промзона</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">К точному часу</span>
              </div>
              <h3 class="text-lg font-bold text-[#1C1215]">500 ₽</h3>
              <p class="text-xs text-[#5C454C] leading-relaxed">
                БСИ, проходные заводов ПАО «Нижнекамскнефтехим», ТАНЕКО, ТАИФ-НК точно к окончанию смены или мероприятию.
              </p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  if (route.path !== '/') {
    return `
      <!-- Route Intro Narrative Section -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 font-sans text-[#1C1215]">
        <div class="space-y-6 bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-8 lg:p-10 shadow-sm">
          <div class="space-y-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#8B1A2B]/10 text-[#8B1A2B] text-xs font-semibold">
              <span>${route.breadcrumbLabel}</span>
            </div>
            <h2 class="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold leading-tight">
              ${route.introHeading}
            </h2>
          </div>
          <div class="space-y-3 text-xs sm:text-sm text-[#5C454C] leading-relaxed max-w-4xl">
            ${route.introText.map(p => `<p>${p}</p>`).join('\n')}
          </div>
        </div>
      </section>
    `;
  }

  // Homepage: 350-400 words 3-column SEO text
  return `
    <!-- Homepage 3-Column SEO Text: Delivery, Occasions, Flower Care (~400 words) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 font-sans text-[#1C1215]">
      <div class="space-y-10">
        <div class="max-w-3xl space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#8B1A2B]/10 text-[#8B1A2B] text-xs font-semibold">
            <span>Салон цветов «София» в Нижнекамске</span>
          </div>
          <h2 class="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold leading-tight">
            Купить свежие цветы в Нижнекамске с быстрой доставкой
          </h2>
          <p class="text-xs sm:text-sm text-[#5C454C] leading-relaxed">
            Салон цветов «София» на проспекте Шинников, дом 13В предлагает сортовые розы, авторские флористические композиции и сезонные цветы с курьерской доставкой по Нижнекамску от 30 минут. Каждая композиция собирается непосредственно под ваш заказ из свежей поставки.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          <div class="bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-[#1C1215] leading-snug">
                  Доставка цветов по районам города
                </h3>
                <span class="text-[11px] font-semibold tracking-wider uppercase text-[#8B1A2B] bg-[#8B1A2B]/10 px-3 py-1 rounded-md">
                  08:00 – 21:00
                </span>
              </div>
              <p class="text-xs text-[#5C454C] leading-relaxed">
                Курьеры салона доставляют букеты ежедневно с интервалом от 30 до 60 минут с момента сборки.
              </p>
              <div class="space-y-2.5 pt-1">
                <div class="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start justify-between gap-3">
                  <div class="space-y-0.5">
                    <div class="text-xs font-bold text-[#1C1215]">Центр и жилые микрорайоны</div>
                    <div class="text-[11px] text-[#7C636B] leading-tight">Шинников, Мира, Строителей, Сююмбике, Химиков</div>
                  </div>
                  <span class="text-xs font-bold text-[#8B1A2B] shrink-0">300 ₽</span>
                </div>
                <div class="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start justify-between gap-3">
                  <div class="space-y-0.5">
                    <div class="text-xs font-bold text-[#1C1215]">Пригородные посёлки</div>
                    <div class="text-[11px] text-[#7C636B] leading-tight">Красный Ключ, Большое и Нижнее Афанасово</div>
                  </div>
                  <span class="text-xs font-bold text-[#8B1A2B] shrink-0">450 ₽</span>
                </div>
                <div class="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start justify-between gap-3">
                  <div class="space-y-0.5">
                    <div class="text-xs font-bold text-[#1C1215]">Промзона и предприятия</div>
                    <div class="text-[11px] text-[#7C636B] leading-tight">БСИ, ТАНЕКО, НКНХ, ТАИФ-НК к точному часу</div>
                  </div>
                  <span class="text-xs font-bold text-[#8B1A2B] shrink-0">500 ₽</span>
                </div>
              </div>
            </div>
            <div class="pt-3 border-t border-[#E5DDD9] text-[11px] text-[#7C636B]">
              Бесплатная доставка при заказе от 4 500 ₽
            </div>
          </div>

          <div class="bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-[#1C1215] leading-snug">
                  Букеты под любые поводы и события
                </h3>
                <span class="text-[11px] font-semibold tracking-wider uppercase text-[#8B1A2B] bg-[#8B1A2B]/10 px-3 py-1 rounded-md">
                  Под любой повод
                </span>
              </div>
              <p class="text-xs text-[#5C454C] leading-relaxed">
                Шеф-флористы «Софии» подбирают сортовой состав, гамму и упаковку под атмосферу события:
              </p>
              <div class="space-y-2.5 pt-1">
                <div class="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] space-y-1">
                  <div class="text-xs font-bold text-[#1C1215]">День рождения & Юбилей</div>
                  <p class="text-[11px] text-[#7C636B] leading-tight">
                    Пышные сеты с французскими розами, гортензиями, а также монобукеты из 25, 51 или 101 розы.
                  </p>
                </div>
                <div class="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] space-y-1">
                  <div class="text-xs font-bold text-[#1C1215]">Свадьба & Поздравление</div>
                  <p class="text-[11px] text-[#7C636B] leading-tight">
                    Букеты невесты, бутоньерки жениха и подарочные шляпные коробки в светлой пастельной гамме.
                  </p>
                </div>
                <div class="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] space-y-1">
                  <div class="text-xs font-bold text-[#1C1215]">8 Марта & 14 Февраля</div>
                  <p class="text-[11px] text-[#7C636B] leading-tight">
                    Сортовые тюльпаны, мимоза, алые эквадорские розы Explorer и Red Naomi с фирменной открыткой.
                  </p>
                </div>
              </div>
            </div>
            <div class="pt-3 border-t border-[#E5DDD9] text-[11px] text-[#7C636B]">
              Фото собранной композиции в WhatsApp до выезда
            </div>
          </div>

          <div class="bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-[#1C1215] leading-snug">
                  Памятка по уходу за срезанными цветами
                </h3>
                <span class="text-[11px] font-semibold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md">
                  10–14 дней
                </span>
              </div>
              <p class="text-xs text-[#5C454C] leading-relaxed">
                Соблюдение четырёх простых правил продлит радость от цветов в вазе до двух недель:
              </p>
              <div class="space-y-2.5 pt-1">
                <div class="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start gap-2.5">
                  <span class="w-5 h-5 rounded-md bg-[#8B1A2B] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div class="space-y-0.5">
                    <div class="text-xs font-bold text-[#1C1215]">Косой срез под 45°</div>
                    <p class="text-[11px] text-[#7C636B] leading-tight">Срежьте стебли на 1,5–2 см острым ножом перед постановкой в воду.</p>
                  </div>
                </div>
                <div class="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start gap-2.5">
                  <span class="w-5 h-5 rounded-md bg-[#8B1A2B] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div class="space-y-0.5">
                    <div class="text-xs font-bold text-[#1C1215]">Чистая вода и Chrysal</div>
                    <p class="text-[11px] text-[#7C636B] leading-tight">Используйте прохладную воду и пакетик Chrysal, прилагаемый в подарок.</p>
                  </div>
                </div>
                <div class="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start gap-2.5">
                  <span class="w-5 h-5 rounded-md bg-[#8B1A2B] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div class="space-y-0.5">
                    <div class="text-xs font-bold text-[#1C1215]">Снятие нижних листьев</div>
                    <p class="text-[11px] text-[#7C636B] leading-tight">Удалите листву в воде, чтобы вода не зацветала и оставалась прозрачной.</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="pt-3 border-t border-[#E5DDD9] text-[11px] text-[#7C636B]">
              Подкормка Chrysal бесплатно к каждому букету
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function generatePreRenderedHtml(route) {
  const filteredBouquets = filterBouquetsForRoute(route);

  const breadcrumbsHtml = route.path !== '/' ? `
    <nav aria-label="Хлебные крошки" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 text-xs text-[#7C636B] font-sans" itemscope itemtype="https://schema.org/BreadcrumbList">
      <ol class="flex items-center gap-2 list-none p-0 m-0">
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" class="flex items-center gap-2">
          <a href="/" itemprop="item" class="hover:text-[#8B1A2B] text-[#5C454C] transition-colors">
            <span itemprop="name">Главная</span>
          </a>
          <meta itemprop="position" content="1" />
          <span class="text-[#9C828B]">/</span>
        </li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" class="text-[#1C1215] font-semibold">
          <span itemprop="name">${route.breadcrumbLabel}</span>
          <meta itemprop="position" content="2" />
        </li>
      </ol>
    </nav>
  ` : '';

  let bouquetsCardsHtml = '';
  if (filteredBouquets.length > 0) {
    bouquetsCardsHtml = filteredBouquets.map(b => {
      const flowersCount = b.characteristics?.flowersCount || b.flowersCount || 'Свежие цветы';
      const height = b.characteristics?.height || b.height || '45-55 см';
      const imageSrc = b.image || '/bouquet-placeholder.svg';
      const hasReal = b.hasRealPhoto ?? (imageSrc && !imageSrc.includes('placeholder'));
      return `
      <article class="bg-white rounded-xl border border-[#E5DDD9] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between" itemscope itemtype="https://schema.org/Product" id="product-${b.id}">
        <div class="relative overflow-hidden aspect-square bg-[#FAF7F5]">
          <img
            src="${imageSrc}"
            alt="${b.title} в Нижнекамске — салон цветов София"
            width="400"
            height="400"
            loading="lazy"
            class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            itemprop="image"
          />
          <div class="absolute top-2.5 left-2.5 bg-[#8B1A2B] text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
            ${b.category}
          </div>
        </div>
        <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-[#7C636B] font-light mb-1">
              <span>${flowersCount}</span>
              <span>${height}</span>
            </div>
            <h3 class="font-sans text-base text-[#1C1215] font-semibold leading-snug mb-1.5 line-clamp-1" itemprop="name">
              ${b.title}
            </h3>
            <p class="text-xs text-[#5C454C] font-light line-clamp-2 mb-3" itemprop="description">
              ${b.description || 'Авторский букет из свежих цветов салона «София».'}
            </p>
          </div>
          <div>
            <div class="flex items-baseline justify-between pt-2.5 border-t border-[#E5DDD9] mb-3" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
              <link itemprop="availability" href="${b.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}" />
              <meta itemprop="priceCurrency" content="RUB" />
              <meta itemprop="price" content="${b.price}" />
              <span class="font-sans text-xl font-bold text-[#8B1A2B]">
                ${Number(b.price).toLocaleString('ru-RU')} ₽
              </span>
              <span class="text-[10px] ${b.inStock ? 'text-emerald-700 bg-emerald-50' : 'text-[#5C454C] bg-[#FAF7F5]'} px-2 py-0.5 rounded-md font-medium">
                ${b.inStock ? 'В наличии' : 'Под заказ'}
              </span>
            </div>
            <a
              href="https://wa.me/79172563235?text=${encodeURIComponent(`Здравствуйте! Хочу заказать букет «${b.title}» (${b.price} ₽) с доставкой в Нижнекамске.`)}"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full py-2.5 px-4 rounded-xl bg-[#8B1A2B] hover:bg-[#731221] text-white font-medium text-xs text-center block transition-colors shadow-sm active:scale-95"
            >
              Заказать в WhatsApp
            </a>
          </div>
        </div>
      </article>
      `;
    }).join('\n');
  } else {
    bouquetsCardsHtml = `
      <div class="col-span-full bg-white rounded-xl p-8 sm:p-12 border border-white/10 text-center space-y-4 shadow-sm my-4">
        <div class="text-4xl"></div>
        <h3 class="font-sans font-medium text-xl sm:text-2xl text-[#1C1215] font-medium">Композиции этой категории собираются под индивидуальный заказ</h3>
        <p class="text-xs sm:text-sm text-[#5C454C] max-w-md mx-auto leading-relaxed">
          В данный момент букеты из раздела «${route.breadcrumbLabel}» составляются нашими флористами со свежей срезки под ваши пожелания и бюджет.
        </p>
        <div class="pt-2">
          <a
            href="https://wa.me/79172563235?text=${encodeURIComponent(`Здравствуйте! Хочу уточнить наличие цветов в категории «${route.breadcrumbLabel}» в Нижнекамске.`)}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block py-3 px-6 rounded-xl bg-[#8B1A2B] hover:bg-[#731221] text-white font-medium text-xs sm:text-sm transition-colors shadow-md active:scale-95"
          >
            Написать флористу в WhatsApp
          </a>
        </div>
      </div>
    `;
  }

  const navCategories = [
    { label: 'Все цветы', href: '/' },
    { label: 'Розы', href: '/rozy/' },
    { label: 'Монобукеты', href: '/monobukety/' },
    { label: 'Авторские', href: '/avtorskie-bukety/' },
    { label: 'Коробки', href: '/cvety-v-korobke/' },
    { label: 'Корзины', href: '/korziny-cvetov/' },
    { label: 'Свадебные', href: '/svadebnye-bukety/' },
    { label: 'Пионы', href: '/piony/' },
    { label: 'Хризантемы', href: '/hrizantemy/' },
    { label: 'Доставка', href: '/dostavka/' },
    { label: 'Контакты', href: '/kontakty/' }
  ];

  const categoryChipsHtml = navCategories.map(c => `
    <a
      href="${c.href}"
      class="px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 whitespace-nowrap ${route.path === c.href ? 'bg-[#8B1A2B] text-white shadow-sm font-semibold' : 'bg-white/90 text-[#3D2C31] hover:bg-white border border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'}"
    >
      ${c.label}
    </a>
  `).join('\n');

  const catalogTitle = route.path === '/' ? 'Каталог букетов' : `Каталог: ${route.breadcrumbLabel}`;

  return `
    <div class="min-h-screen bg-[#FAF7F5] flex flex-col text-[#1C1215] selection:bg-[#8B1A2B] selection:text-white font-sans">
      <!-- 2. Header -->
      <header class="w-full bg-[#FAF7F5]/95  border-b border-white/10 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between gap-4">
          <a href="/" class="flex items-center gap-3" title="Салон цветов «София» Нижнекамск">
            <img src="/logo.png" alt="Салон цветов София" width="160" height="60" class="h-14 sm:h-18 w-auto object-contain" />
          </a>
          <nav class="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="/" class="hover:text-[#8B1A2B] text-[#3D2C31]">Каталог</a>
            <a href="/dostavka/" class="hover:text-[#8B1A2B] text-[#3D2C31]">Доставка</a>
            <a href="/cart/" class="hover:text-[#8B1A2B] text-[#3D2C31]">Корзина</a>
            <a href="/profile/" class="hover:text-[#8B1A2B] text-[#3D2C31]">Личный кабинет</a>
          </nav>
          <a href="tel:+79172563235" class="flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-[#8B1A2B] text-white text-xs font-semibold shadow hover:bg-[#731221]">
            <span></span>
            <span>+7 (917) 256-32-35</span>
          </a>
        </div>
      </header>

      ${breadcrumbsHtml}

      <!-- 3. Primary Hero Section with SINGLE Visible H1 on ALL screens -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 w-full">
        <div class="relative overflow-hidden rounded-xl bg-[#380A10] text-white p-6 sm:p-8 lg:p-12 shadow-xl border border-white/10">
          <div class="max-w-3xl space-y-4">
            <!-- THE SINGLE H1 TAG FOR THE ENTIRE PAGE -->
            <h1 class="font-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">
              ${route.h1}
            </h1>

            <div class="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-light text-white/90">
              <span class="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
                <span> Доставка от 30 минут</span>
              </span>
              <span class="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
                <span> пр. Шинников, 13В</span>
              </span>
              <span class="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
                <span> Фото букета в WhatsApp</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Category Navigation Chips (PillNav Style) -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 border-b border-white/10">
          ${categoryChipsHtml}
        </div>
      </section>

      <!-- 6. Catalog Bouquets Grid -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full">
        <div class="flex items-baseline justify-between mb-6 pb-2 border-b border-white/10">
          <h2 class="font-sans font-medium text-2xl sm:text-3xl text-[#1C1215] font-normal">
            ${catalogTitle}
          </h2>
          <span class="text-xs text-[#7C636B] font-light">
            ${formatShownCount(filteredBouquets.length)}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          ${bouquetsCardsHtml}
        </div>
      </main>

      <!-- 7. Trust & Guarantees (4 Clean Cards) -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-5 rounded-xl bg-white text-[#1C1215] border border-[#E5DDD9] shadow-sm space-y-2">
            <h3 class="font-sans text-base font-semibold text-[#1C1215]">Доставка от 30 минут</h3>
            <p class="text-xs text-[#5C454C] font-normal leading-relaxed">
              Оперативная доставка цветов по Нижнекамску курьером прямо в руки получателю.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white text-[#1C1215] border border-[#E5DDD9] shadow-sm space-y-2">
            <h3 class="font-sans text-base font-semibold text-[#1C1215]">Фото в WhatsApp перед выездом</h3>
            <p class="text-xs text-[#5C454C] font-normal leading-relaxed">
              Вы всегда точно знаете, как выглядит букет. Флорист присылает детальные фотографии перед отправкой.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white text-[#1C1215] border border-[#E5DDD9] shadow-sm space-y-2">
            <h3 class="font-sans text-base font-semibold text-[#1C1215]">Дизайнерская упаковка</h3>
            <p class="text-xs text-[#5C454C] font-normal leading-relaxed">
              Каждый букет оформляется в стильную дизайнерскую упаковку с атласными лентами для бережной доставки.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white text-[#1C1215] border border-[#E5DDD9] shadow-sm space-y-2">
            <h3 class="font-sans text-base font-semibold text-[#1C1215]">Стойкость от 10 до 14 дней</h3>
            <p class="text-xs text-[#5C454C] font-normal leading-relaxed">
              Свежие поставки цветов и стойкость при правильном домашнем уходе.
            </p>
          </div>
        </div>
      </section>

      ${generateSeoSectionHtml(route)}

      <!-- 7. Salon Map Section (Yandex Maps) -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-8 font-sans text-[#1C1215]">
        <div class="bg-white rounded-xl border border-white/10 p-6 sm:p-8 lg:p-10 shadow-sm overflow-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div class="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div class="space-y-4">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#8B1A2B]/10 text-[#8B1A2B] text-xs font-semibold">
                  <span> Салон в Нижнекамске</span>
                </div>
                <h2 class="font-sans font-medium text-2xl sm:text-3xl text-[#1C1215] font-normal leading-tight">
                  Ждём вас на проспекте Шинников, 13В
                </h2>
                <p class="text-xs sm:text-sm text-[#5C454C] font-light leading-relaxed">
                  Приходите выбрать букет вживую или оформите заказ с доставкой по городу от 30 минут. Перед выездом курьера отправляем контрольное фото собранной композиции в WhatsApp.
                </p>
                <div class="space-y-3 pt-2 text-xs text-[#3D2C31]">
                  <div>
                    <span class="font-medium text-[#1C1215] block">Адрес:</span>
                    <span class="text-[#5C454C] font-light">г. Нижнекамск, пр. Шинников, д. 13В</span>
                  </div>
                  <div>
                    <span class="font-medium text-[#1C1215] block">Режим работы:</span>
                    <span class="text-[#5C454C] font-light">Ежедневно с 08:00 до 21:00 без выходных</span>
                  </div>
                  <div>
                    <span class="font-medium text-[#1C1215] block">Телефон:</span>
                    <a href="tel:+79172563235" class="text-[#8B1A2B] font-medium">+7 (917) 256-32-35</a>
                  </div>
                </div>
              </div>
              <div class="pt-4 border-t border-white/5 flex flex-wrap gap-3">
                <a href="https://yandex.ru/maps/org/sofiya/105599949171" target="_blank" rel="noopener noreferrer" class="py-3 px-5 rounded-xl bg-[#8B1A2B] text-white font-medium text-xs sm:text-sm text-center inline-block">
                  Построить маршрут
                </a>
                <a href="https://wa.me/79172563235" target="_blank" rel="noopener noreferrer" class="py-3 px-5 rounded-xl bg-emerald-600 text-white font-medium text-xs sm:text-sm text-center inline-block">
                  Чат в WhatsApp
                </a>
              </div>
            </div>
            <div class="lg:col-span-7 relative min-h-[360px] sm:min-h-[420px] rounded-xl sm:rounded-xl overflow-hidden border border-white/10 bg-white/5">
              <iframe
                src="https://yandex.ru/map-widget/v1/org/sofiya/105599949171"
                width="100%"
                height="100%"
                frameborder="0"
                allowfullscreen="true"
                loading="lazy"
                title="Салон цветов «София» на Яндекс Картах"
                class="w-full h-full min-h-[360px] sm:min-h-[420px] border-0 rounded-xl sm:rounded-xl"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      <!-- 8. Footer -->
      <footer class="w-full bg-[#180B0D] text-white/80 font-sans border-t border-white/10 pt-12 pb-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
            <div class="space-y-4">
              <img src="/logo-light.png" alt="Салон цветов София" width="140" height="50" class="h-12 w-auto object-contain" />
              <p class="text-xs text-white/60 leading-relaxed font-light">
                Салон цветов «София» в Нижнекамске. Авторская флористика, поставка свежих цветов каждый день.
              </p>
            </div>
            <div class="space-y-3">
              <h4 class="font-sans font-medium text-lg text-white font-normal">Адрес и режим работы</h4>
              <ul class="space-y-2 text-xs font-light text-white/70 list-none p-0">
                <li> <a href="https://yandex.ru/maps/org/sofiya/105599949171" target="_blank" rel="noopener noreferrer" class="hover:text-white underline decoration-white/30">г. Нижнекамск, пр. Шинников, 13В на Яндекс Картах</a></li>
                <li> Ежедневно: 08:00 – 21:00</li>
                <li> Доставка от 30 минут</li>
              </ul>
            </div>
            <div class="space-y-3">
              <h4 class="font-sans font-medium text-lg text-white font-normal">Контакты</h4>
              <div class="space-y-2 text-xs font-light">
                <a href="tel:+79172563235" class="block text-white hover:text-[#C5A880]"> +7 (917) 256-32-35</a>
                <a href="https://wa.me/79172563235" target="_blank" rel="noopener noreferrer" class="block text-emerald-400 hover:text-emerald-300"> WhatsApp: +7 (917) 256-32-35</a>
              </div>
            </div>
            <div class="space-y-3">
              <h4 class="font-sans font-medium text-lg text-white font-normal">Популярные разделы</h4>
              <ul class="space-y-1.5 text-xs font-light text-white/70 list-none p-0">
                <li><a href="/rozy/" class="hover:text-white">Розы в Нижнекамске</a></li>
                <li><a href="/monobukety/" class="hover:text-white">Монобукеты</a></li>
                <li><a href="/avtorskie-bukety/" class="hover:text-white">Авторские букеты</a></li>
                <li><a href="/cvety-v-korobke/" class="hover:text-white">Цветы в коробке</a></li>
                <li><a href="/dostavka/" class="hover:text-white">Условия доставки</a></li>
                <li><a href="/kontakty/" class="hover:text-white">Контакты и карта</a></li>
              </ul>
            </div>
          </div>
          <div class="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 gap-4">
            <p>© 2026 Салон цветов «София». ИП Обручников Дмитрий Владимирович, ИНН 165115143005, ОГРНИП 324169000033624</p>
            <p>Нижнекамск, Республика Татарстан, пр. Шинников, 13В</p>
          </div>
        </div>
      </footer>
    </div>
  `;
}

function generateJsonLd(route) {
  const filteredBouquets = filterBouquetsForRoute(route);

  // 1. Breadcrumbs Schema
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Главная",
      "item": `${CANONICAL_BASE}/`
    }
  ];

  if (route.path !== '/') {
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": 2,
      "name": route.breadcrumbLabel,
      "item": `${CANONICAL_BASE}${route.path}`
    });
  }

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems
  };

  // 2. Florist / LocalBusiness Schema
  const floristSchema = {
    "@context": "https://schema.org",
    "@type": "Florist",
    "@id": `${CANONICAL_BASE}/#florist`,
    "name": "Салон цветов «София»",
    "alternateName": ["Цветы София", "Цветы Нижнекамск", "Доставка цветов София"],
    "url": `${CANONICAL_BASE}${route.path}`,
    "logo": `${CANONICAL_BASE}/logo.png`,
    "image": `${CANONICAL_BASE}/bouquet-1.jpg`,
    "telephone": "+79172563235",
    "priceRange": "₽₽",
    "currenciesAccepted": "RUB",
    "paymentAccepted": "Cash, Credit Card, Bank Transfer, SberPay, Mir",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "проспект Шинников, д. 13В",
      "addressLocality": "Нижнекамск",
      "addressRegion": "Республика Татарстан",
      "postalCode": "423570",
      "addressCountry": "RU"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 55.6358,
      "longitude": 51.8173
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "08:00",
        "closes": "21:00"
      }
    ],
    "hasMap": "https://yandex.ru/maps/org/sofiya/105599949171",
    "sameAs": [
      "https://yandex.ru/maps/org/sofiya/105599949171",
      "https://wa.me/79172563235"
    ]
  };

  let extraSchemas = '';

  // 3. ItemList with Product + Offer Schema
  if (filteredBouquets.length > 0) {
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": route.h1,
      "numberOfItems": filteredBouquets.length,
      "itemListElement": filteredBouquets.map((b, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Product",
          "name": b.title,
          "image": `${CANONICAL_BASE}${b.image}`,
          "description": b.description,
          "category": b.category,
          "offers": {
            "@type": "Offer",
            "priceCurrency": "RUB",
            "price": b.price,
            "priceValidUntil": "2026-12-31",
            "availability": b.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": `${CANONICAL_BASE}${route.path}#product-${b.id}`,
            "seller": {
              "@type": "Florist",
              "name": "Салон цветов «София»"
            }
          }
        }
      }))
    };

    extraSchemas += `
      <script type="application/ld+json">
        ${JSON.stringify(itemListSchema, null, 2)}
      </script>
    `;
  }

  // 4. FAQPage Schema for /faq/
  if (route.path === '/faq/') {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Как быстро вы доставляете цветы по Нижнекамску?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Стандартное время доставки готового букета по Нижнекамску составляет от 30 до 60 минут с момента подтверждения заказа."
          }
        },
        {
          "@type": "Question",
          "name": "Присылаете ли вы фото букета до отправки?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Да, обязательно. Мы отправляем детальные фотографии собранной композиции в WhatsApp перед передачей курьеру, чтобы вы могли оценить результат."
          }
        },
        {
          "@type": "Question",
          "name": "Что входит в стоимость букета?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "В каждый заказ входит авторская флористическая сборка, защитная транспортировочная упаковка и предварительный фотоотчет в WhatsApp перед выездом курьера."
          }
        }
      ]
    };

    extraSchemas += `
      <script type="application/ld+json">
        ${JSON.stringify(faqSchema, null, 2)}
      </script>
    `;
  }

  return `
    <script type="application/ld+json">
      ${JSON.stringify(floristSchema, null, 2)}
    </script>
    <script type="application/ld+json">
      ${JSON.stringify(breadcrumbsSchema, null, 2)}
    </script>
    ${extraSchemas}
  `;
}

async function runPrerender() {
  process.stdout.write('[SSG] Starting SSG Pre-rendering for 23 landing pages...\n');

  // Try to load live catalog from cloud backend
  try {
    const res = await fetch('https://sitesophiya.vercel.app/api/catalog?t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        process.stdout.write(`[Cloud] Fetched ${data.length} live bouquets from cloud for pre-rendering!\n`);
        activeBouquets = data;
      }
    }
  } catch (err) {
    process.stdout.write(`[Warn] Cloud fetch skipped during build, using defaults: ${err.message}\n`);
  }

  const templatePath = path.resolve(DIST_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    process.stderr.write('[Error] dist/index.html not found. Please run "vite build" first.\n');
    process.exit(1);
  }

  let baseHtml = fs.readFileSync(templatePath, 'utf8');

  // Strip obsolete meta tags from base template: keywords, geo.*, ICBM
  baseHtml = baseHtml.replace(/<meta name="keywords".*?>\s*/gi, '');
  baseHtml = baseHtml.replace(/<meta name="geo\..*?>\s*/gi, '');
  baseHtml = baseHtml.replace(/<meta name="ICBM".*?>\s*/gi, '');

  let generatedCount = 0;

  for (const route of ROUTES) {
    const canonicalUrl = `${CANONICAL_BASE}${route.path}`;
    let pageHtml = baseHtml;

    // 1. Title replacement
    pageHtml = pageHtml.replace(/<title>.*?<\/title>/s, `<title>${route.title}</title>`);
    pageHtml = pageHtml.replace(/<meta name="title" content=".*?" \/>/s, `<meta name="title" content="${route.title}" />`);

    // 2. Meta description replacement
    pageHtml = pageHtml.replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${route.description}" />`);

    // 3. Remove keywords if present
    pageHtml = pageHtml.replace(/<meta name="keywords".*?>\s*/gi, '');

    // 4. Canonical replacement
    pageHtml = pageHtml.replace(/<link rel="canonical" href=".*?" \/>/s, `<link rel="canonical" href="${canonicalUrl}" />`);

    // 5. Open Graph updates
    pageHtml = pageHtml.replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${route.title}" />`);
    pageHtml = pageHtml.replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${route.description}" />`);
    pageHtml = pageHtml.replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${canonicalUrl}" />`);

    // 6. Twitter Card updates
    pageHtml = pageHtml.replace(/<meta name="twitter:title" content=".*?" \/>/s, `<meta name="twitter:title" content="${route.title}" />`);
    pageHtml = pageHtml.replace(/<meta name="twitter:description" content=".*?" \/>/s, `<meta name="twitter:description" content="${route.description}" />`);

    // 7. Inject JSON-LD Schema
    const jsonLd = generateJsonLd(route);
    if (pageHtml.includes('<!-- Schema.org Microdata: Florist / LocalBusiness -->')) {
      pageHtml = pageHtml.replace(/<!-- Schema\.org Microdata: Florist \/ LocalBusiness -->[\s\S]*?<\/script>/, jsonLd.trim());
    } else {
      pageHtml = pageHtml.replace('</head>', `${jsonLd}\n</head>`);
    }

    // 8. Inject Pre-rendered Crawlable Body inside <div id="root">
    const preRenderedBody = generatePreRenderedHtml(route);
    pageHtml = pageHtml.replace(/<div id="root"><\/div>/, `<div id="root">${preRenderedBody}</div>`);

    // 9. Write file to dist
    const targetDir = route.path === '/' ? DIST_DIR : path.resolve(DIST_DIR, route.slug);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetFile = path.resolve(targetDir, 'index.html');
    fs.writeFileSync(targetFile, pageHtml, 'utf8');

    generatedCount++;
    process.stdout.write(`[SSG] [${generatedCount}/${ROUTES.length}] Pre-rendered: ${route.path} -> ${targetFile.replace(ROOT_DIR, '')}\n`);
  }

  process.stdout.write(`\n[SSG] Successfully pre-rendered all ${generatedCount} landing pages with raw HTML, strict filtering, and Stage 3 Schema.org!\n`);
}

runPrerender().catch(err => {
  process.stderr.write(`[Error] Prerender error: ${err}\n`);
  process.exit(1);
});
