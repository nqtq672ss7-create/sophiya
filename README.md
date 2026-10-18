# ⚜️ SOPHIYA Atelier Floral — Haute Floristry & 3D Botanical Atelier

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.186-black?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **SOPHIYA Atelier Floral** — иммерсивный премиальный веб-сайт и 3D-лаборатория для дома высокой флористики. Проект объединяет эстетику французского haute couture, интерактивное 3D-моделирование ботанических структур на WebGL/Three.js, парфюмерную ольфакторную карту и кастомный конфигуратор букетов в реальном времени.

---

## 🌟 Ключевые возможности & Архитектура

### 1. Процедурный 3D Движок на Three.js
- **Математически смоделированные бутоны**:
  - **Baccara Velvet Rose** (`Rosa Grand Prix Ecuatoriana`) — многослойные лепестки по спирали Фибоначчи, бархатный шейдер со световым отливом (Sheen), микрокапли росы с преломлением и стебель с шипами.
  - **Blanche Royale Peony** (`Paeonia Lactiflora`) — махровый шелковистый пион с сотнями волнистых лепестков и золотым пучком тычинок.
  - **Nocturne Phalaenopsis** (`Phalaenopsis Amabilis`) — графичная орхидея с изгибающимся стеблем и сложным губным лепестком (labellum).
  - **Celestial Lotus** (`Nelumbo Nucifera`) — сакральный лотос с золотой семенной коробочкой и радиальной симметрией.
- **Интерактивное управление**:
  - **Регулятор цветения (Bloom Slider 0%–100%)**: плавный морфинг от закрытого бутона до пышного раскрытия.
  - **Анатомический взрыв (Exploded View)**: послойное парение лепестков в воздухе.
  - **3 световые атмосферы**:
    - `Midnight Atelier` (глубокий нуар, золотой направленный свет, фиолетовые и циан контрсвета)
    - `Golden Hour` (теплый янтарный закат с мягкими тенями)
    - `Dawn Mist` (утренняя прохладная роса и рассеянный свет)
  - **Система пыльцы**: 350 парящих светящихся спор с органической физикой движения.
  - **360° Orbit & Zoom**: плавное инерционное вращение и масштабирование жестами и мышью.

### 2. Процедурный Звуковой Ландшафт (Web Audio API)
- 100% процедурный синтез без внешних тяжелых mp3 файлов:
  - Кристальные аккордовые переливы при взаимодействии с лепестками.
  - Мягкий гармонический свип при регулировке цветения.
  - Беззвучный режим по умолчанию с эстетичным переключателем.

### 3. Интерактивный Конструктор Букетов (Bouquet Studio)
- Выбор количества стеблей (от 9 до 101 шт.).
- Ботанические акценты (серебристый эвкалипт, позолоченный гинкго билоба, пампасная трава, черненый рускус).
- Премиальная подача (необработанный французский шелк, плиссированная бумага Origami, ваза из рифленого дымчатого венецианского стекла, базальтовая урна).
- Шелковая лента с индивидуальным тиснением монограммы / инициалов.
- Динамический расчет стоимости.

### 4. Оформление Заказа & Каллиграфическая Открытка
- Генератор открытки ручной работы на хлопковой бумаге *Amalfi*:
  - Интерактивный предпросмотр рукописного шрифта в реальном времени.
  - Выбор цвета сургучной печати (золото, бордо, изумруд).
- Премиальная доставка с климат-контролем (+14°C) и фотоконтролем перед выездом.
- Праздничный салют из золотого конфетти при подтверждении.

---

## 🛠️ Стек технологий

- **Фреймворк**: React 19 + TypeScript
- **Сборщик**: Vite 6 (WASM-Node Rollup)
- **3D Графика**: Three.js (WebGL, PBR MeshPhysicalMaterial, PCFSoftShadowMap, ACESFilmicToneMapping)
- **Стилизация**: Tailwind CSS (кастомная цветовая палитра: Obsidian, Aged Gold, Velvet Bordeaux, Sage)
- **Шрифты**: Cormorant Garamond, Italiana, Plus Jakarta Sans
- **Иконки**: Lucide React
- **Аудио**: Web Audio API (чистый JS/TS, нулевые сетевые задержки)

---

## 🚀 Запуск и Разработка

```bash
# Клонирование репозитория
git clone https://github.com/nqtq672ss7-create/sophiya.git
cd sophiya

# Установка зависимостей
pnpm install

# Запуск локального сервера разработки
pnpm dev

# Продакшн сборка
pnpm build

# Превью собранного проекта
pnpm preview
```

---

## 🏛️ Структура проекта

```
sophiya/
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── FlowerScene.tsx         # Главный Three.js вьюпорт и контроллеры
│   │   │   └── proceduralFlowers.ts    # Математические 3D-модели (Роза, Пион, Орхидея, Лотос)
│   │   ├── studio/
│   │   │   └── BouquetStudio.tsx       # Интерактивный конфигуратор букетов
│   │   ├── catalog/
│   │   │   └── FloralCatalog.tsx       # Кураторская коллекция с парфюмерной картой
│   │   ├── about/
│   │   │   └── PhilosophySection.tsx   # Манифест высокой флористики и метрики
│   │   ├── order/
│   │   │   └── OrderModal.tsx          # Модальное окно заказа и каллиграфическая открытка
│   │   └── layout/
│   │       ├── Navbar.tsx              # Фиксированная навигация со стеклянным блюром
│   │       └── Footer.tsx              # Контакты бутиков (Москва, Париж, Дубай)
│   ├── types/
│   │   └── index.ts                    # TypeScript контракты и интерфейсы
│   ├── utils/
│   │   ├── audio.ts                    # Процедурный Web Audio синтезатор
│   │   └── constants.ts                # Данные сортов, палитр и коллекций
│   ├── App.tsx                         # Главный компонент страницы
│   ├── index.css                       # Глобальные стили и токены роскоши
│   └── main.tsx                        # Точка входа React
├── tailwind.config.js                  # Кастомная палитра и типографика
├── vite.config.ts                      # Конфигурация Vite
└── package.json
```

---

*Создано с любовью к ботаническому искусству и совершенству веб-дизайна.* ⚜️
