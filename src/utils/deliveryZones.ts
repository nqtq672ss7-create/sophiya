export type DeliveryZone = 'city'|'suburb';

export interface AddressSuggestion {
  label: string;
  value: string;
  zone: DeliveryZone;
  note: string;
}

export const SUBURB_FEE_RUB = 400;

export const ADDRESS_SUGGESTIONS: AddressSuggestion[] = [
  { label: 'г. Нижнекамск, пр. Шинников, ', value: 'г. Нижнекамск, пр. Шинников, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, пр. Мира, ', value: 'г. Нижнекамск, пр. Мира, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, пр. Строителей, ', value: 'г. Нижнекамск, пр. Строителей, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, пр. Химиков, ', value: 'г. Нижнекамск, пр. Химиков, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, ул. Сююмбике, ', value: 'г. Нижнекамск, ул. Сююмбике, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, ул. Баки Урманче, ', value: 'г. Нижнекамск, ул. Баки Урманче, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, ул. Чулман, ', value: 'г. Нижнекамск, ул. Чулман, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, ул. Табеева, ', value: 'г. Нижнекамск, ул. Табеева, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, ул. Студенческая, ', value: 'г. Нижнекамск, ул. Студенческая, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, ул. Гагарина, ', value: 'г. Нижнекамск, ул. Гагарина, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, ул. Менделеева, ', value: 'г. Нижнекамск, ул. Менделеева, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, ул. Корабельная, ', value: 'г. Нижнекамск, ул. Корабельная, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'г. Нижнекамск, ул. 50 лет Октября, ', value: 'г. Нижнекамск, ул. 50 лет Октября, ', zone: 'city', note: 'В черте города: 0 ₽' },
  { label: 'пос. Красный Ключ, ', value: 'пос. Красный Ключ, ', zone: 'suburb', note: 'Пригород: 400 ₽' },
  { label: 'с. Большое Афанасово, ', value: 'с. Большое Афанасово, ', zone: 'suburb', note: 'Пригород: 400 ₽' },
  { label: 'с. Нижнее Афанасово, ', value: 'с. Нижнее Афанасово, ', zone: 'suburb', note: 'Пригород: 400 ₽' },
  { label: 'д. Дмитриевка, ', value: 'д. Дмитриевка, ', zone: 'suburb', note: 'Пригород: 400 ₽' },
  { label: 'с. Ильинка, ', value: 'с. Ильинка, ', zone: 'suburb', note: 'Пригород: 400 ₽' },
  { label: 'с. Прости, ', value: 'с. Прости, ', zone: 'suburb', note: 'Пригород: 400 ₽' },
  { label: 'с. Сухарево, ', value: 'с. Сухарево, ', zone: 'suburb', note: 'Пригород: 400 ₽' },
  { label: 'с. Балчиклы, ', value: 'с. Балчиклы, ', zone: 'suburb', note: 'Пригород: 400 ₽' },
  { label: 'пгт. Камские Поляны, ', value: 'пгт. Камские Поляны, ', zone: 'suburb', note: 'Пригород: 400 ₽' },
  { label: 'Промзона БСИ, ', value: 'Промзона БСИ, ', zone: 'suburb', note: 'Промзона: 400 ₽' },
  { label: 'Промзона, ПАО «Нижнекамскнефтехим» (НКНХ), ', value: 'Промзона, ПАО «Нижнекамскнефтехим» (НКНХ), ', zone: 'suburb', note: 'Промзона: 400 ₽' },
  { label: 'Промзона, АО «ТАНЕКО», ', value: 'Промзона, АО «ТАНЕКО», ', zone: 'suburb', note: 'Промзона: 400 ₽' },
  { label: 'Промзона, ТАИФ-НК, ', value: 'Промзона, ТАИФ-НК, ', zone: 'suburb', note: 'Промзона: 400 ₽' },
];

const SUBURB_PATTERNS = [
  /красн[а-яё]*\s+ключ/i,
  /афанасов/i,
  /дмитриевк/i,
  /ильинк/i,
  /прости/i,
  /балчикл/i,
  /камск[а-яё]*\s+полян/i,
  /сухарев/i,
  /ереклин/i,
  /шингальч/i,
  /смысловк/i,
  /борок/i,
  /(?:^|[\s,])бси(?:$|[\s.,])/i,
  /тан[еэ]ко/i,
  /нкнх/i,
  /нижнекамскнефтехим/i,
  /таиф/i,
  /промзон/i,
  /(?:^|[\s,])снт(?:$|[\s.,])/i,
  /(?:^|[\s,])днт(?:$|[\s.,])/i,
  /(?:^|[\s,])пос\.?(?:$|[\s.,])/i,
  /(?:^|[\s,])пгт\.?(?:$|[\s.,])/i,
  /(?:^|[\s,])с\.\s*[а-яё]/i,
  /(?:^|[\s,])д\.\s*[а-яё]/i,
  /за\s*город/i,
];

export function detectDeliveryZone(address: string, manualOverride?: DeliveryZone|null): DeliveryZone {
  const clean = String(address || '').trim();
  if (SUBURB_PATTERNS.some((re) => re.test(clean))) {
    return 'suburb';
  }
  if (manualOverride === 'suburb') return 'suburb';
  return 'city';
}

export function buildYandexMapSearchUrl(address: string): string {
  const trimmed = String(address || '').trim();
  const query =
    trimmed && trimmed !== 'г. Нижнекамск,' && trimmed !== 'г. Нижнекамск'
      ? (trimmed.toLowerCase().includes('нижнекамск') || trimmed.toLowerCase().includes('татарстан')
          ? trimmed
          : `Нижнекамск, ${trimmed}`)
      : 'Нижнекамск';
  return `https://yandex.ru/map-widget/v1/?ll=51.8245%2C55.6366&z=12&l=map&text=${encodeURIComponent(query)}`;
}
