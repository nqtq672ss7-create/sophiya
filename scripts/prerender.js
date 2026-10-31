import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

const CANONICAL_BASE = 'https://xn----ctbjn3arftl7c8b.xn--p1ai';

// Catalog items for pre-rendering
const BOUQUETS = [
  {
    id: '1',
    title: 'Розы розовые французские',
    price: 12800,
    category: 'Монобукеты',
    color: 'Розовый',
    image: '/bouquet-1.jpg',
    flowersCount: '25 роз сорта French Pink',
    height: '50-60 см',
    durability: '10-14 дней при правильном уходе',
    description: 'Такой букет станет великолепным подарком для близкого человека. 25 отборных французских роз с нежным ароматом и бережной доставкой по Нижнекамску от 30 минут.'
  },
  {
    id: '2',
    title: 'Праздничный Red Piano',
    price: 9500,
    category: 'Авторские',
    color: 'Красный',
    image: '/bouquet-2.jpg',
    flowersCount: '19 пионовидных роз + декор',
    height: '45 см',
    durability: '12-16 дней при правильном уходе',
    description: 'Роскошный авторский сет из пионовидных алых роз Red Piano с хвоей нобилиса и матовыми стеклянными шарами. Идеально для торжественных поздравлений в Нижнекамске.'
  },
  {
    id: '3',
    title: 'Пионы Blanche в шелке',
    price: 14200,
    category: 'Монобукеты',
    color: 'Белый',
    image: '/bouquet-3.jpg',
    flowersCount: '15 королевских пионов',
    height: '50 см',
    durability: '8-10 дней при правильном уходе',
    description: 'Крупные голландские пионы сорта Blanche с раскрытием до 18 см. Нежнейший пудрово-молочный оттенок с тонким ароматом французских садов.'
  },
  {
    id: '4',
    title: 'Композиция в шляпной коробке',
    price: 11400,
    category: 'Коробки',
    color: 'Бордовый',
    image: '/bouquet-1.jpg',
    flowersCount: '27 бутонов микс',
    height: '40 см',
    durability: 'до 18 дней при правильном уходе',
    description: 'Премиальная флористическая композиция на оазисе. Не требует вазы — стебли непрерывно питаются влагой со специальным составом Chrysal.'
  },
  {
    id: '5',
    title: 'Эустома Viola & эвкалипт',
    price: 7800,
    category: 'Авторские',
    color: 'Розовый',
    image: '/bouquet-2.jpg',
    flowersCount: '21 ветка',
    height: '55 см',
    durability: '14-20 дней при правильном уходе',
    description: 'Воздушная и стойкая композиция из махровой эустомы пудрового и винного оттенков с серебристым эвкалиптом Цинерея.'
  },
  {
    id: '6',
    title: '101 алая роза Гран При',
    price: 26500,
    category: 'Монобукеты',
    color: 'Красный',
    image: '/bouquet-3.jpg',
    flowersCount: '101 роза',
    height: '70 см',
    durability: '10-14 дней при правильном уходе',
    description: 'Классический гигантский букет из 101 отборной розы Эквадор 70 см. Бутоны высшей категории качества с бархатистыми лепестками.'
  }
];

const ROUTES = [
  {
    path: '/',
    slug: '',
    title: 'Цветы в Нижнекамске — доставка от 30 минут | София',
    description: 'Заказ и доставка свежих цветов в Нижнекамске от 30 минут. Авторские букеты и розы на пр. Шинников, 13В. Фото в WhatsApp перед отправкой! Звоните: +7 (917) 256-32-35',
    h1: 'Салон цветов «София» в Нижнекамске — доставка от 30 минут',
    categoryFilter: 'Все',
    breadcrumbLabel: 'Главная',
    introHeading: 'Свежие цветы и авторские букеты с доставкой в Нижнекамске',
    introText: [
      'Салон цветов «София» расположен в центре Нижнекамска по адресу проспект Шинников, дом 13В. Мы получаем поставки свежих цветов напрямую от проверенных плантаций Голландии и Эквадора каждый день, что гарантирует свежесть каждого бутона.',
      'Каждая композиция собирается опытными флористами непосредственно перед отправкой. Мы бережно упаковываем цветы в аквабоксы с питательным раствором, чтобы букет сохранял безупречный вид в дороге. Перед выездом курьера отправляем реальное фото готового букета в WhatsApp. Доставка по Нижнекамску занимает от 30 минут, к каждому заказу прилагается открытка для пожеланий и средство стойкости Chrysal в подарок.'
    ],
    keywords: 'цветы нижнекамск, доставка цветов нижнекамск, купить букет нижнекамск, салон цветов софия, шинников 13в цветы',
    pageType: 'category'
  },
  {
    path: '/rozy/',
    slug: 'rozy',
    title: 'Розы в Нижнекамске — купить с быстрой доставкой',
    description: 'Купить свежие розы в Нижнекамске с доставкой от 30 минут. Эквадорские и французские розы в салоне «София» на Шинников, 13В. Фото в WhatsApp перед отправкой.',
    h1: 'Купить розы в Нижнекамске с доставкой — Салон «София»',
    categoryFilter: 'Монобукеты',
    breadcrumbLabel: 'Розы',
    introHeading: 'Эквадорские, голландские и французские розы в Нижнекамске',
    introText: [
      'В салоне «София» представлен широкий выбор свежих роз: премиальные эквадорские розы на длинном стебле с крупным бархатным бутоном, нежные французские пионовидные розы и ароматные кустовые сорта. Ежедневные поставки обеспечивают плотный бутон и сочную листву.',
      'Вы можете выбрать классический букет из 15, 25, 51 или 101 розы, либо монокомпозицию в дизайнерской матовой упаковке. Доставляем букеты роз по Нижнекамску в специальных аквабоксах за 30–60 минут с обязательным фотоотчетом в WhatsApp перед выездом курьера.'
    ],
    keywords: 'розы нижнекамск, купить розы нижнекамск, доставка роз нижнекамск, 101 роза нижнекамск, французские розы нижнекамск',
    pageType: 'category'
  },
  {
    path: '/monobukety/',
    slug: 'monobukety',
    title: 'Монобукеты в Нижнекамске — заказать с доставкой',
    description: 'Стильные монобукеты из роз, пионов и тюльпанов в Нижнекамске. Доставка от 30 мин из салона «София». Фото букета перед выездом курьера. Тел: +7 (917) 256-32-35',
    h1: 'Монобукеты в Нижнекамске с быстрой доставкой',
    categoryFilter: 'Монобукеты',
    breadcrumbLabel: 'Монобукеты',
    introHeading: 'Элегантные монобукеты из одного вида цветов',
    introText: [
      'Монобукет — это чистая эстетика и выразительность одного сорта цветов. В салоне «София» мы собираем монобукеты из отборных сортовых роз, пионов, кустовых хризантем и тюльпанов. Вся композиция выдерживается в едином оттенке или гармоничном градиенте.',
      'Для упаковки используются благородные матовые материалы и атласные ленты, подчеркивающие природную форму цветка. Доставка по Нижнекамску осуществляется от 30 минут, букет транспортируется на воде.'
    ],
    keywords: 'монобукеты нижнекамск, заказать монобукет нижнекамск, букет из одного вида цветов нижнекамск, монобукет роз нижнекамск',
    pageType: 'category'
  },
  {
    path: '/avtorskie-bukety/',
    slug: 'avtorskie-bukety',
    title: 'Авторские букеты в Нижнекамске — салон «София»',
    description: 'Авторские букеты от шеф-флористов в Нижнекамске. Неповторимые композиции со свежей срезкой. Доставка от 30 минут. Салон «София», пр. Шинников, 13В.',
    h1: 'Авторские букеты ручной работы в Нижнекамске',
    categoryFilter: 'Авторские',
    breadcrumbLabel: 'Авторские букеты',
    introHeading: 'Уникальные авторские композиции от флористов «София»',
    introText: [
      'Авторский букет — это художественная работа флориста, в которой гармонично сочетаются редкие сорта цветов, фактурная зелень и игра оттенков. Мы подбираем стойкие голландские и эквадорские цветы с учетом ваших пожеланий и повода торжества.',
      'Каждый авторский букет уникален и собирается вручную на пр. Шинников, 13В. Перед отправкой мы обязательно согласуем результат по фото в WhatsApp. В комплекте идет фирменная открытка и подкормка.'
    ],
    keywords: 'авторские букеты нижнекамск, заказать авторский букет нижнекамск, дизайнерские букеты нижнекамск, флористика нижнекамск',
    pageType: 'category'
  },
  {
    path: '/cvety-v-korobke/',
    slug: 'cvety-v-korobke',
    title: 'Цветы в коробке в Нижнекамске с доставкой | София',
    description: 'Элегантные композиции и цветы в шляпных коробках в Нижнекамске. Доставка от 30 мин. Подарочная подкормка и открытка. Салон «София», пр. Шинников, 13В.',
    h1: 'Цветы в шляпных коробках с доставкой в Нижнекамске',
    categoryFilter: 'Коробки',
    breadcrumbLabel: 'Цветы в коробке',
    introHeading: 'Композиции в шляпных коробках — стойкость и удобство',
    introText: [
      'Цветы в шляпной коробке — это стильное и практичное решение. Стебли цветов зафиксированы во флористическом оазисе, пропитанном питательным раствором, поэтому букет не требует вазы и регулярной подрезки стеблей.',
      'Такая композиция прекрасно подходит для офиса, ресторана или праздничного банкета. Мы используем коробки с бархатным покрытием Soft Touch и тиснением. Доставка по Нижнекамску от 30 минут.'
    ],
    keywords: 'цветы в коробке нижнекамск, шляпная коробка с цветами нижнекамск, букет в коробке нижнекамск, купить цветы в коробке нижнекамск',
    pageType: 'category'
  },
  {
    path: '/korziny-cvetov/',
    slug: 'korziny-cvetov',
    title: 'Корзины цветов в Нижнекамске — заказ и доставка',
    description: 'Праздничные корзины с цветами в Нижнекамске. Свежие поставки каждый день, бережная доставка от 30 мин. Фото в WhatsApp. Салон «София»: +7 (917) 256-32-35',
    h1: 'Праздничные корзины цветов в Нижнекамске',
    categoryFilter: 'Корзины',
    breadcrumbLabel: 'Корзины цветов',
    introHeading: 'Роскошные цветочные корзины для торжественных событий',
    introText: [
      'Корзина с живыми цветами — статусный и долговечный подарок на юбилей, свадьбу или официальное торжество. Цветы размещаются в специальной влажной губке, сохраняющей свежесть до 14–18 дней при своевременном поливе.',
      'В ассортименте салона «София» есть как компактные корзины-комплименты, так и масштабные композиции из роз, гортензий и экзотической зелени. Быстрая доставка по всем районам Нижнекамска.'
    ],
    keywords: 'корзины цветов нижнекамск, заказать корзину цветов нижнекамск, букет в корзине нижнекамск, цветы в корзинах нижнекамск',
    pageType: 'category'
  },
  {
    path: '/svadebnye-bukety/',
    slug: 'svadebnye-bukety',
    title: 'Свадебные букеты в Нижнекамске — салон «София»',
    description: 'Свадебные букеты невесты и бутоньерки в Нижнекамске. Индивидуальный подбор цветов под образ. Свежесть и стойкость. Салон «София», пр. Шинников, 13В.',
    h1: 'Свадебные букеты для невесты в Нижнекамске',
    categoryFilter: 'Авторские',
    breadcrumbLabel: 'Свадебные букеты',
    introHeading: 'Идеальный букет невесты и свадебное оформление',
    introText: [
      'Свадебный букет сопровождает невесту на протяжении всего праздничного дня, поэтому мы уделяем особое внимание свежести стеблей, надежности сборки и удобству ножки букета.',
      'Флористы салона «София» помогут подобрать цветовую палитру и сорта под фасон платья и общую концепцию торжества: классические белые розы, пионы, каллы, эустомы и эвкалипт. В подарок изготавливаем бутоньерку для жениха.'
    ],
    keywords: 'свадебный букет нижнекамск, букет невесты нижнекамск, заказать свадебный букет нижнекамск, цветы на свадьбу нижнекамск',
    pageType: 'category'
  },
  {
    path: '/piony/',
    slug: 'piony',
    title: 'Пионы в Нижнекамске — купить букет с доставкой',
    description: 'Купить голландские пионы в Нижнекамске. Крупные бутоны, нежные оттенки, доставка от 30 минут. Фото букета перед вручением. Салон цветов «София».',
    h1: 'Свежие пионы в Нижнекамске с бережной доставкой',
    categoryFilter: 'Монобукеты',
    breadcrumbLabel: 'Пионы',
    introHeading: 'Голландские сортовые пионы с доставкой по городу',
    introText: [
      'Пионы — один из самых желанных и чувственных цветов. Мы привозим отборные голландские пионы сортов Sarah Bernhardt, Blanche, Coral Charm и Red Charm с диаметром раскрытия бутона до 18 см.',
      'Наши флористы бережно собирают монобукеты из пионов и сочетают их в авторских миксах. Доставка в аквабоксах обеспечивает сохранность нежных лепестков при любой температуре на улице.'
    ],
    keywords: 'пионы нижнекамск, купить пионы нижнекамск, доставка пионов нижнекамск, букет пионов нижнекамск',
    pageType: 'category'
  },
  {
    path: '/hrizantemy/',
    slug: 'hrizantemy',
    title: 'Хризантемы в Нижнекамске — свежие букеты с доставкой',
    description: 'Кустовые и одноголовые хризантемы в Нижнекамске. Стойкость до 20 дней, доставка от 30 минут по городу. Салон «София» на Шинников, 13В: +7 (917) 256-32-35',
    h1: 'Букеты из свежих хризантем в Нижнекамске',
    categoryFilter: 'Монобукеты',
    breadcrumbLabel: 'Хризантемы',
    introHeading: 'Стойкие хризантемы: пышность, свежесть и доступность',
    introText: [
      'Хризантемы славятся своей исключительной стойкостью — при регулярной смене воды букет радует свежестью от 14 до 21 дня. В наличии пышные кустовые сорта ромашкового типа и крупные сортовые одноголовые хризантемы.',
      'Букет хризантем станет прекрасным подарком маме, коллеге или учителю. Доставляем заказы по Нижнекамску от 30 минут в фирменной упаковке салона «София».'
    ],
    keywords: 'хризантемы нижнекамск, купить хризантемы нижнекамск, букет хризантем нижнекамск, доставка хризантем нижнекамск',
    pageType: 'category'
  },
  {
    path: '/gorshechnye-rasteniya/',
    slug: 'gorshechnye-rasteniya',
    title: 'Горшечные растения в Нижнекамске — салон «София»',
    description: 'Комнатные и горшечные растения в Нижнекамске. Здоровые ухоженные цветы для дома и офиса. Консультация флориста. Салон «София», пр. Шинников, 13В.',
    h1: 'Горшечные комнатные растения в Нижнекамске',
    categoryFilter: 'Все',
    breadcrumbLabel: 'Горшечные растения',
    introHeading: 'Комнатные растения и цветы в горшках для уюта и подарка',
    introText: [
      'В салоне цветов «София» вы найдете здоровые комнатные растения в кашпо: орхидеи фаленопсис, спатифиллумы, замиокулькасы, фикусы и суккуленты. Все растения проходят строгий фитосанитарный контроль.',
      'Мы подробно консультируем по правилам полива, освещения и пересадки, а также помогаем подобрать стильное кашпо под ваш интерьер. Бережная доставка по городу с защитой от холода.'
    ],
    keywords: 'горшечные растения нижнекамск, комнатные цветы нижнекамск, орхидеи нижнекамск, купить цветок в горшке нижнекамск',
    pageType: 'category'
  },
  {
    path: '/traurnye-venki/',
    slug: 'traurnye-venki',
    title: 'Траурные венки в Нижнекамске — доставка и заказ',
    description: 'Траурная флористика, венки и траурные корзины в Нижнекамске. Сдержанные строгие композиции с лентами. Быстрая доставка к назначенному времени.',
    h1: 'Траурная флористика и венки в Нижнекамске',
    categoryFilter: 'Все',
    breadcrumbLabel: 'Траурная флористика',
    introHeading: 'Траурные венки и траурные корзины со свежими цветами',
    introText: [
      'В моменты прощания цветы выражают глубокое уважение, соболезнование и светлую память. Салон цветов «София» собирает строгие траурные венки, корзины и поминальные букеты из свежих роз, гвоздик и хвойных веток.',
      'Изготавливаем траурные ленты с персональной надписью. Организуем аккуратную и пунктуальную доставку к ритуальным залам и адресам прощания в Нижнекамске точно к назначенному часу.'
    ],
    keywords: 'траурные венки нижнекамск, ритуальные цветы нижнекамск, траурная флористика нижнекамск, венок из живых цветов нижнекамск',
    pageType: 'category'
  },
  {
    path: '/dostavka/',
    slug: 'dostavka',
    title: 'Доставка цветов в Нижнекамске от 30 минут | София',
    description: 'Условия и зоны доставки цветов по Нижнекамску от 30 минут. Доставка в аквабоксах, фото в WhatsApp. Салон «София», пр. Шинников, 13В. Тел: +7 (917) 256-32-35',
    h1: 'Быстрая доставка цветов по Нижнекамску от 30 минут',
    categoryFilter: 'Все',
    breadcrumbLabel: 'Доставка и оплата',
    introHeading: 'Условия, тарифы и зоны курьерской доставки цветов',
    introText: [
      'Салон цветов «София» осуществляет оперативную доставку букетов по всем микрорайонам и улицам Нижнекамска. Курьерская служба работает ежедневно с 08:00 до 21:00. При срочном заказе сборка и выезд курьера занимают от 30 минут.',
      'Все букеты доставляются в защитных аквабоксах с водой и фирменной транспортировочной коробке, что исключает замятие лепестков. Перед отправкой мы присылаем фото букета в WhatsApp для вашего подтверждения.'
    ],
    keywords: 'доставка цветов нижнекамск, цветы с доставкой нижнекамск, курьер цветы нижнекамск, доставка букетов нижнекамск круглосуточно',
    pageType: 'info'
  },
  {
    path: '/o-salone/',
    slug: 'o-salone',
    title: 'О салоне цветов «София» в Нижнекамске — Шинников 13В',
    description: 'Премиальный салон цветов «София» в Нижнекамске на пр. Шинников, 13В. Авторская флористика, поставки свежих цветов каждый день, доставка от 30 минут.',
    h1: 'О салоне цветов «София» в Нижнекамске',
    categoryFilter: 'Все',
    breadcrumbLabel: 'О салоне',
    introHeading: 'Искусство флористики и стандарты заботы о каждом клиенте',
    introText: [
      'Салон цветов «София» основан с одной главной целью — дарить искренние эмоции через безупречную флористику. Наш салон расположен в Нижнекамске на проспекте Шинников, дом 13В.',
      'Мы не работаем со старыми остатками: поставки срезки производятся ежедневно. В салоне поддерживается строгий температурный режим в профессиональной холодильной камере (+4...+6°C). Наши флористы имеют дипломы профильных флористических школ и собирают букеты в современной европейской эстетике.'
    ],
    keywords: 'салон цветов софия нижнекамск, цветочный магазин нижнекамск, магазин цветов шинников 13в, флористический салон нижнекамск',
    pageType: 'info'
  },
  {
    path: '/kontakty/',
    slug: 'kontakty',
    title: 'Контакты салона цветов «София» в Нижнекамске',
    description: 'Адрес и контакты салона цветов «София»: Нижнекамск, пр. Шинников, 13В. Телефон: +7 (917) 256-32-35. Ежедневно 08:00–21:00. Доставка цветов и самовывоз.',
    h1: 'Контакты, адрес и режим работы салона «София»',
    categoryFilter: 'Все',
    breadcrumbLabel: 'Контакты',
    introHeading: 'Как нас найти, связаться с флористом и оформить заказ',
    introText: [
      'Салон цветов «София» всегда рад гостям. Мы находимся по адресу: Республика Татарстан, город Нижнекамск, проспект Шинников, дом 13В. Рядом удобная парковка для автомобилей.',
      'Телефон для консультаций и срочных заказов: +7 (917) 256-32-35. Чат в WhatsApp доступен для согласования фото букетов в режиме реального времени. График работы салона: ежедневно с 08:00 до 21:00 без перерывов и выходных.'
    ],
    keywords: 'контакты салон цветов софия, адрес цветов нижнекамск, шинников 13в телефон, телефон доставка цветов нижнекамск',
    pageType: 'info'
  },
  {
    path: '/otzyvy/',
    slug: 'otzyvy',
    title: 'Отзывы о доставке цветов «София» в Нижнекамске',
    description: 'Реальные отзывы клиентов о салоне цветов «София» в Нижнекамске. Рейтинг 5.0, контроль качества сборки, фотоотчет в WhatsApp и быстрая доставка от 30 мин.',
    h1: 'Отзывы клиентов о салоне цветов «София»',
    categoryFilter: 'Все',
    breadcrumbLabel: 'Отзывы',
    introHeading: 'Истории клиентов и честные оценки нашей работы',
    introText: [
      'Мы искренне дорожим доверием жителей Нижнекамска и гостей города. Каждый отзыв помогает нам становиться лучше, контролировать свежесть цветов и безупречность курьерской доставки.',
      'Все отзывы, представленные на сайте, оставлены реальными покупателями салона «София». Средняя оценка на основе обратной связи составляет 5.0 из 5 звезд. Вы также можете оставить свой отзыв на сайте или в Яндекс Картах.'
    ],
    keywords: 'отзывы салон цветов софия, отзывы доставка цветов нижнекамск, салон софия отзывы клиентов',
    pageType: 'info'
  },
  {
    path: '/faq/',
    slug: 'faq',
    title: 'Вопросы и ответы о доставке цветов в Нижнекамске',
    description: 'Ответы на вопросы о заказе, оплате и доставке цветов по Нижнекамску. Аквабоксы, фото перед выездом, открытка в подарок. Салон цветов «София».',
    h1: 'Частые вопросы о заказе и доставке цветов',
    categoryFilter: 'Все',
    breadcrumbLabel: 'Вопросы и ответы',
    introHeading: 'Все, что нужно знать перед оформлением заказа букета',
    introText: [
      'Как быстро вы доставляете цветы по Нижнекамску? Стандартное время доставки готового букета составляет от 30 до 60 минут с момента подтверждения заказа. При индивидуальной сложной сборке время согласовывается флористом.',
      'Присылаете ли вы фото до отправки? Да, обязательно. Мы отправляем детальные фотографии и видео собранной композиции в WhatsApp перед передачей курьеру, чтобы вы были уверены в качестве.',
      'Что входит в стоимость букета? В каждый заказ бесплатно входит защитная транспортировочная упаковка, аквабокс с водой, дизайнерская открытка для ваших теплых слов и профессиональный порошок Chrysal для продления стойкости цветов.'
    ],
    keywords: 'вопросы доставка цветов нижнекамск, как заказать цветы нижнекамск, доставка в аквабоксе нижнекамск',
    pageType: 'info'
  },
  {
    path: '/blog/',
    slug: 'blog',
    title: 'Блог о цветах и флористике — салон «София»',
    description: 'Полезные статьи о флористике, уходе за срезанными цветами и выборе букетов в Нижнекамске от экспертов салона «София». Советы по продлению стойкости.',
    h1: 'Блог флористов салона цветов «София» в Нижнекамске',
    categoryFilter: 'Все',
    breadcrumbLabel: 'Блог',
    introHeading: 'Советы по уходу за цветами, тренды флористики и гиды',
    introText: [
      'В блоге салона «София» наши ведущие флористы делятся практическими секретами: как продлить жизнь букету роз дома до двух недель, почему важно менять воду каждый день и подрезать стебли под углом 45 градусов.',
      'Читайте экспертные обзоры сезонных цветов, правила этикета вручения букетов и идеи поздравлений для ваших близких в Нижнекамске.'
    ],
    keywords: 'блог о цветах нижнекамск, как ухаживать за розами, флористика статьи, салон цветов софия блог',
    pageType: 'info'
  },
  {
    path: '/na-den-rozhdeniya/',
    slug: 'na-den-rozhdeniya',
    title: 'Букеты на день рождения в Нижнекамске с доставкой',
    description: 'Праздничные букеты на день рождения в Нижнекамске с доставкой от 30 минут. Открытка и подкормка в подарок! Фото в WhatsApp. Салон «София».',
    h1: 'Цветы и букеты на день рождения в Нижнекамске',
    categoryFilter: 'Авторские',
    breadcrumbLabel: 'На день рождения',
    introHeading: 'Яркие и нежные композиции к праздничному дню',
    introText: [
      'День рождения — особенный повод, требующий запоминающегося подарка. В салоне «София» мы создаем праздничные букеты из роз, пионов, гортензий и лилий, способные передать самые искренние чувства.',
      'К букету можно добавить открытку с вашими пожеланиями. Организуем сюрприз-доставку имениннику на дом, в ресторан или на работу в любую точку Нижнекамска.'
    ],
    keywords: 'букет на день рождения нижнекамск, цветы на юбилей нижнекамск, доставка цветов имениннику нижнекамск',
    pageType: 'occasion'
  },
  {
    path: '/na-svadbu/',
    slug: 'na-svadbu',
    title: 'Цветы на свадьбу в Нижнекамске — букет невесты',
    description: 'Цветы на свадьбу и поздравления молодоженов в Нижнекамске. Пышные розы, пионы и композиции с быстрой доставкой. Салон «София», пр. Шинников, 13В.',
    h1: 'Свадебные цветы и поздравления в Нижнекамске',
    categoryFilter: 'Авторские',
    breadcrumbLabel: 'На свадьбу',
    introHeading: 'Изысканные букеты для молодоженов и гостей торжества',
    introText: [
      'Белоснежные и пудровые розы, воздушные гортензии и пионы создают неповторимую атмосферу свадебного праздника. Мы собираем стойкие букеты для поздравления молодоженов, которые прекрасно переносят весь день торжества.',
      'Быстрая доставка цветов к ЗАГСу Нижнекамска или ресторану точно в назначенное время.'
    ],
    keywords: 'цветы на свадьбу нижнекамск, букет молодоженам нижнекамск, свадебная флористика нижнекамск',
    pageType: 'occasion'
  },
  {
    path: '/na-8-marta/',
    slug: 'na-8-marta',
    title: 'Цветы на 8 Марта в Нижнекамске — доставка тюльпанов',
    description: 'Праздничные букеты и тюльпаны на 8 Марта в Нижнекамске. Предзаказ свежих весенних цветов с гарантированной доставкой. Салон «София»: +7 (917) 256-32-35',
    h1: 'Цветы и тюльпаны на 8 Марта в Нижнекамске',
    categoryFilter: 'Монобукеты',
    breadcrumbLabel: 'На 8 Марта',
    introHeading: 'Весенние цветы, сортовые тюльпаны и розы к Международному женскому дню',
    introText: [
      '8 Марта — праздник весны и красоты. Салон «София» заранее открывает предзаказ на свежайшие голландские тюльпаны экстра-класса, пионовидные розы и ароматную мимозу.',
      'Корпоративным клиентам предоставляем особые условия и доставку букетов для сотрудниц в организации Нижнекамска с полным пакетом закрывающих документов.'
    ],
    keywords: 'цветы на 8 марта нижнекамск, тюльпаны нижнекамск, купить тюльпаны на 8 марта нижнекамск, доставка цветов 8 марта',
    pageType: 'occasion'
  },
  {
    path: '/na-14-fevralya/',
    slug: 'na-14-fevralya',
    title: 'Букеты на 14 февраля в Нижнекамске с доставкой',
    description: 'Романтические букеты на 14 февраля в Нижнекамске. Алые розы, признания в любви, доставка от 30 минут. Конфиденциально. Салон цветов «София».',
    h1: 'Цветы и букеты на 14 февраля (День влюбленных)',
    categoryFilter: 'Монобукеты',
    breadcrumbLabel: 'На 14 февраля',
    introHeading: 'Романтические букеты и алые розы для любимых',
    introText: [
      '14 февраля — день признаний и романтики. Классические алые эквадорские розы, чувственные пионы и композиции в форме сердца помогут выразить глубину ваших чувств.',
      'Осуществляем бережную анонимную доставку цветов или вручение с запиской от вашего имени в Нижнекамске.'
    ],
    keywords: 'цветы на 14 февраля нижнекамск, розы на день влюбленных нижнекамск, букет любимой девушке нижнекамск',
    pageType: 'occasion'
  },
  {
    path: '/na-1-sentyabrya/',
    slug: 'na-1-sentyabrya',
    title: 'Цветы на 1 сентября в Нижнекамске — букет учителю',
    description: 'Букеты ко Дню знаний на 1 сентября в Нижнекамске. Стойкие композиции для учителей, быстрая доставка и самовывоз на пр. Шинников, 13В. Салон «София».',
    h1: 'Букеты на 1 сентября для учителей в Нижнекамске',
    categoryFilter: 'Монобукеты',
    breadcrumbLabel: 'На 1 сентября',
    introHeading: 'Стойкие осенние букеты ко Дню знаний',
    introText: [
      'Компактные, легкие и стойкие букеты для школьников из гладиолусов, хризантем, подсолнухов и роз. Букет удобно держать ребенку на торжественной линейке.',
      'Удобный предзаказ с выдачей утром 1 сентября без очередей в салоне на пр. Шинников, 13В или доставкой прямо домой.'
    ],
    keywords: 'цветы на 1 сентября нижнекамск, букет учителю нижнекамск, букет на линейку нижнекамск',
    pageType: 'occasion'
  },
  {
    path: '/na-yubiley/',
    slug: 'na-yubiley',
    title: 'Букеты на юбилей в Нижнекамске — салон «София»',
    description: 'Роскошные букеты и композиции на юбилей в Нижнекамске. 51 и 101 роза, пышные корзины, доставка от 30 минут. Салон «София», пр. Шинников, 13В.',
    h1: 'Роскошные букеты и композиции на юбилей в Нижнекамске',
    categoryFilter: 'Авторские',
    breadcrumbLabel: 'На юбилей',
    introHeading: 'Грандиозные букеты для важных круглых дат',
    introText: [
      'Юбилей — значимое событие, требующее королевского размаха: 51 или 101 эквадорская роза, пышные корзины с гортензиями и сортовыми пионами, авторские композиции премиум-класса.',
      'Служба доставки салона «София» вручит грандиозный букет юбиляру дома или в банкетном зале с поздравлением от вашего имени.'
    ],
    keywords: 'букет на юбилей нижнекамск, 101 роза юбилей нижнекамск, корзина цветов на юбилей нижнекамск',
    pageType: 'occasion'
  }
];

function generatePreRenderedHtml(route) {
  const filteredBouquets = BOUQUETS.filter(b => {
    if (route.categoryFilter === 'Все') return true;
    if (route.categoryFilter === 'Монобукеты') return b.category === 'Монобукеты';
    if (route.categoryFilter === 'Авторские') return b.category === 'Авторские';
    if (route.categoryFilter === 'Коробки') return b.category === 'Коробки';
    if (route.categoryFilter === 'Корзины') return b.category === 'Корзины';
    return true;
  });

  const bouquetList = filteredBouquets.length > 0 ? filteredBouquets : BOUQUETS;

  const breadcrumbsHtml = route.path !== '/' ? `
    <nav aria-label="Хлебные крошки" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 text-xs text-zinc-500 font-sans" itemscope itemtype="https://schema.org/BreadcrumbList">
      <ol class="flex items-center gap-2 list-none p-0 m-0">
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" class="flex items-center gap-2">
          <a href="/" itemprop="item" class="hover:text-[#6C1E26] text-zinc-600 transition-colors">
            <span itemprop="name">Главная</span>
          </a>
          <meta itemprop="position" content="1" />
          <span class="text-zinc-400">/</span>
        </li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" class="text-zinc-900 font-semibold">
          <span itemprop="name">${route.breadcrumbLabel}</span>
          <meta itemprop="position" content="2" />
        </li>
      </ol>
    </nav>
  ` : '';

  const bouquetsCardsHtml = bouquetList.map(b => `
    <article class="bg-white rounded-3xl border border-zinc-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between" itemscope itemtype="https://schema.org/Product">
      <div class="relative overflow-hidden aspect-[4/5] bg-zinc-100">
        <img
          src="${b.image}"
          alt="${b.title} в Нижнекамске — салон цветов София"
          width="400"
          height="500"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          itemprop="image"
        />
        <div class="absolute top-3 left-3 bg-[#6C1E26]/90 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
          ${b.category}
        </div>
      </div>
      <div class="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between text-xs text-zinc-400 font-light mb-1">
            <span>${b.flowersCount}</span>
            <span>${b.height}</span>
          </div>
          <h3 class="font-serif text-lg sm:text-xl text-zinc-900 font-medium leading-snug mb-2" itemprop="name">
            ${b.title}
          </h3>
          <p class="text-xs text-zinc-600 font-light line-clamp-2 mb-4" itemprop="description">
            ${b.description}
          </p>
        </div>
        <div>
          <div class="flex items-baseline justify-between pt-3 border-t border-zinc-100 mb-4" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <link itemprop="availability" href="https://schema.org/InStock" />
            <meta itemprop="priceCurrency" content="RUB" />
            <meta itemprop="price" content="${b.price}" />
            <span class="font-serif text-2xl font-bold text-[#6C1E26]">
              ${b.price.toLocaleString('ru-RU')} ₽
            </span>
            <span class="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              В наличии
            </span>
          </div>
          <a
            href="https://wa.me/79172563235?text=${encodeURIComponent(`Здравствуйте! Хочу заказать букет «${b.title}» (${b.price} ₽) с доставкой в Нижнекамске.`)}"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-3 px-4 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-medium text-xs sm:text-sm text-center block transition-all shadow-md active:scale-95"
          >
            Заказать с доставкой
          </a>
        </div>
      </div>
    </article>
  `).join('\n');

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
      class="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 whitespace-nowrap ${route.path === c.href ? 'bg-[#6C1E26] text-white shadow-md' : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'}"
    >
      ${c.label}
    </a>
  `).join('\n');

  return `
    <div class="min-h-screen bg-[#FAF7F5] flex flex-col text-zinc-900 selection:bg-[#6C1E26] selection:text-white font-sans">
      <!-- 1. Top Bar -->
      <div class="bg-[#140506] text-white/90 py-2 px-4 border-b border-white/10 text-xs tracking-wide">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4 font-normal">
          <div class="flex items-center gap-2.5">
            <span class="text-[#C5A880]">✦</span>
            <span class="font-medium text-white">Доставка цветов по Нижнекамску от 30 минут</span>
            <span class="text-white/30 hidden sm:inline">•</span>
            <span class="text-white/70 hidden sm:inline">Поставка свежих цветов каждый день</span>
          </div>
          <div class="hidden sm:flex items-center gap-3.5 text-white/80 text-[11px] sm:text-xs">
            <a href="https://yandex.ru/maps/?text=Нижнекамск+Шинников+13В" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 hover:text-white">
              <span class="text-[#C5A880]">📍</span>
              <span class="font-medium">г. Нижнекамск, пр. Шинников, 13В</span>
            </a>
            <span class="text-white/20">|</span>
            <span class="text-white/60">08:00 – 21:00</span>
          </div>
        </div>
      </div>

      <!-- 2. Header -->
      <header class="w-full bg-[#FAF7F5]/95 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between gap-4">
          <a href="/" class="flex items-center gap-3" title="Салон цветов «София» Нижнекамск">
            <img src="/logo.png" alt="Салон цветов София" width="160" height="60" class="h-14 sm:h-18 w-auto object-contain" />
          </a>
          <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="/" class="hover:text-[#6C1E26] text-zinc-700">Каталог</a>
            <a href="/rozy/" class="hover:text-[#6C1E26] text-zinc-700">Розы</a>
            <a href="/monobukety/" class="hover:text-[#6C1E26] text-zinc-700">Монобукеты</a>
            <a href="/avtorskie-bukety/" class="hover:text-[#6C1E26] text-zinc-700">Авторские</a>
            <a href="/dostavka/" class="hover:text-[#6C1E26] text-zinc-700">Доставка</a>
            <a href="/kontakty/" class="hover:text-[#6C1E26] text-zinc-700">Контакты</a>
          </nav>
          <a href="tel:+79172563235" class="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-[#6C1E26] text-white text-xs font-semibold shadow hover:bg-[#5A121A]">
            <span>📞</span>
            <span>+7 (917) 256-32-35</span>
          </a>
        </div>
      </header>

      ${breadcrumbsHtml}

      <!-- 3. Primary Hero Section with SINGLE Visible H1 on ALL screens -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 w-full">
        <div class="relative overflow-hidden rounded-3xl bg-rose-texture-hero text-white p-6 sm:p-8 lg:p-12 shadow-xl border border-white/10">
          <div class="max-w-3xl space-y-4">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold tracking-wider text-amber-200 border border-white/15">
              <span class="text-[#C5A880]">✦</span>
              <span>Быстрая доставка от 30 мин • Поставка свежих цветов каждый день</span>
            </div>

            <!-- THE SINGLE H1 TAG FOR THE ENTIRE PAGE -->
            <h1 class="font-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">
              ${route.h1}
            </h1>

            <p class="text-sm sm:text-base lg:text-lg text-white/90 font-medium leading-relaxed">
              ${route.description}
            </p>

            <div class="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-light text-white/90">
              <span class="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
                <span>⚡ Доставка от 30 минут</span>
              </span>
              <span class="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
                <span>📍 пр. Шинников, 13В</span>
              </span>
              <span class="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
                <span>🎁 Подкормка и открытка в подарок</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Category Navigation Chips -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-b border-zinc-200">
          ${categoryChipsHtml}
        </div>
      </section>

      <!-- 5. Editorial Category Overview & Intro Text -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-4">
          <h2 class="font-serif text-xl sm:text-2xl text-zinc-900 font-normal leading-snug">
            ${route.introHeading}
          </h2>
          <div class="space-y-3 text-xs sm:text-sm text-zinc-600 font-light leading-relaxed">
            ${route.introText.map(p => `<p>${p}</p>`).join('\n')}
          </div>
        </div>
      </section>

      <!-- 6. Catalog Bouquets Grid -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full">
        <div class="flex items-baseline justify-between mb-6 pb-2 border-b border-zinc-200">
          <h2 class="font-serif text-2xl sm:text-3xl text-zinc-900 font-normal">
            Каталог букетов: ${route.breadcrumbLabel}
          </h2>
          <span class="text-xs text-zinc-500 font-light">
            Показано ${bouquetList.length} букетов
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          ${bouquetsCardsHtml}
        </div>
      </main>

      <!-- 7. Trust & Guarantees (4 Cards) -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-5 rounded-2xl bg-rose-texture-card text-white border border-[#8C1B2F]/70 shadow-md space-y-2">
            <div class="text-amber-300 text-lg">⚡</div>
            <h3 class="font-sans text-base font-bold text-white">Доставка от 30 минут</h3>
            <p class="text-xs text-white/85 font-normal leading-relaxed">
              Оперативная доставка цветов по всем микрорайонам Нижнекамска в аквабоксах с водой.
            </p>
          </div>
          <div class="p-5 rounded-2xl bg-rose-texture-card text-white border border-[#8C1B2F]/70 shadow-md space-y-2">
            <div class="text-amber-300 text-lg">📱</div>
            <h3 class="font-sans text-base font-bold text-white">Фото в WhatsApp перед выездом</h3>
            <p class="text-xs text-white/85 font-normal leading-relaxed">
              Вы всегда точно знаете, как выглядит букет. Флорист присылает детальные фотографии перед отправкой.
            </p>
          </div>
          <div class="p-5 rounded-2xl bg-rose-texture-card text-white border border-[#8C1B2F]/70 shadow-md space-y-2">
            <div class="text-amber-300 text-lg">🎁</div>
            <h3 class="font-sans text-base font-bold text-white">Открытка и подкормка в подарок</h3>
            <p class="text-xs text-white/85 font-normal leading-relaxed">
              К каждому заказу прилагается авторская карточка для пожеланий и профессиональный раствор Chrysal.
            </p>
          </div>
          <div class="p-5 rounded-2xl bg-rose-texture-card text-white border border-[#8C1B2F]/70 shadow-md space-y-2">
            <div class="text-amber-300 text-lg">🌸</div>
            <h3 class="font-sans text-base font-bold text-white">Стойкость от 10 до 14 дней при правильном уходе</h3>
            <p class="text-xs text-white/85 font-normal leading-relaxed">
              Ежедневные прямые поставки роз из Эквадора и пионов из Голландии первой категории свежести.
            </p>
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
                Салон цветов «София» в Нижнекамске. Авторская флористика, свежие поставки каждый день, доставка от 30 минут.
              </p>
            </div>
            <div class="space-y-3">
              <h4 class="font-serif text-lg text-white font-normal">Адрес и режим работы</h4>
              <ul class="space-y-2 text-xs font-light text-white/70 list-none p-0">
                <li>📍 г. Нижнекамск, пр. Шинников, 13В</li>
                <li>⏰ Ежедневно: 08:00 – 21:00</li>
                <li>🚚 Доставка от 30 минут</li>
              </ul>
            </div>
            <div class="space-y-3">
              <h4 class="font-serif text-lg text-white font-normal">Контакты</h4>
              <div class="space-y-2 text-xs font-light">
                <a href="tel:+79172563235" class="block text-white hover:text-[#C5A880]">📞 +7 (917) 256-32-35</a>
                <a href="https://wa.me/79172563235" target="_blank" rel="noopener noreferrer" class="block text-emerald-400 hover:text-emerald-300">💬 WhatsApp: +7 (917) 256-32-35</a>
              </div>
            </div>
            <div class="space-y-3">
              <h4 class="font-serif text-lg text-white font-normal">Популярные разделы</h4>
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
            <p>© 2026 Салон цветов «София». ИП Обручников Дмитрий Владимирович • ИНН 165115143005 • ОГРНИП 324169000033624</p>
            <p>Нижнекамск, Республика Татарстан • пр. Шинников, 13В</p>
          </div>
        </div>
      </footer>
    </div>
  `;
}

function generateJsonLd(route) {
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
    "sameAs": ["https://wa.me/79172563235"],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "bestRating": "5",
      "ratingCount": "48"
    }
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems
  };

  return `
    <script type="application/ld+json">
      ${JSON.stringify(floristSchema, null, 2)}
    </script>
    <script type="application/ld+json">
      ${JSON.stringify(breadcrumbsSchema, null, 2)}
    </script>
  `;
}

async function runPrerender() {
  console.log('🚀 Starting SSG Pre-rendering for 23 landing pages...');
  const templatePath = path.resolve(DIST_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/index.html not found. Please run "vite build" first.');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(templatePath, 'utf8');

  let generatedCount = 0;

  for (const route of ROUTES) {
    const canonicalUrl = `${CANONICAL_BASE}${route.path}`;
    let pageHtml = baseHtml;

    // 1. Title replacement
    pageHtml = pageHtml.replace(/<title>.*?<\/title>/s, `<title>${route.title}</title>`);
    pageHtml = pageHtml.replace(/<meta name="title" content=".*?" \/>/s, `<meta name="title" content="${route.title}" />`);

    // 2. Meta description replacement
    pageHtml = pageHtml.replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${route.description}" />`);

    // 3. Keywords replacement
    pageHtml = pageHtml.replace(/<meta name="keywords" content=".*?" \/>/s, `<meta name="keywords" content="${route.keywords}" />`);

    // 4. Canonical replacement
    pageHtml = pageHtml.replace(/<link rel="canonical" href=".*?" \/>/s, `<link rel="canonical" href="${canonicalUrl}" />`);

    // 5. Open Graph updates
    pageHtml = pageHtml.replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${route.title}" />`);
    pageHtml = pageHtml.replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${route.description}" />`);
    pageHtml = pageHtml.replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${canonicalUrl}" />`);

    // 6. Twitter Card updates
    pageHtml = pageHtml.replace(/<meta name="twitter:title" content=".*?" \/>/s, `<meta name="twitter:title" content="${route.title}" />`);
    pageHtml = pageHtml.replace(/<meta name="twitter:description" content=".*?" \/>/s, `<meta name="twitter:description" content="${route.description}" />`);

    // 7. Inject JSON-LD Schema (cleanly replacing existing generic schema block)
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
    console.log(`✅ [${generatedCount}/${ROUTES.length}] Pre-rendered: ${route.path} -> ${targetFile.replace(ROOT_DIR, '')}`);
  }

  console.log(`\n🎉 Successfully pre-rendered all ${generatedCount} landing pages with raw HTML, single H1, and Schema.org!`);
}

runPrerender().catch(err => {
  console.error('Prerender error:', err);
  process.exit(1);
});
