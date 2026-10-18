export type FlowerVariety = 'rose' | 'peony' | 'orchid' | 'lotus';

export type LightingAtmosphere = 'midnight' | 'golden' | 'dawn';

export type PetalColorId = 'baccara' | 'alabaster' | 'obsidian' | 'peach' | 'emerald';

export interface PetalColorOption {
  id: PetalColorId;
  name: string;
  nameRu: string;
  hex: string;
  accentHex: string;
  roughness: number;
  sheen: number;
}

export interface FlowerVarietyInfo {
  id: FlowerVariety;
  name: string;
  nameRu: string;
  botanicalName: string;
  origin: string;
  symbolism: string;
  scentProfile: {
    top: string;
    heart: string;
    base: string;
  };
  vaseLife: string;
  basePrice: number;
  description: string;
}

export interface FoliageOption {
  id: string;
  name: string;
  nameRu: string;
  price: number;
  description: string;
}

export interface WrapOption {
  id: string;
  name: string;
  nameRu: string;
  price: number;
  material: string;
}

export interface RibbonOption {
  id: string;
  name: string;
  nameRu: string;
  colorHex: string;
}

export interface CustomBouquetConfig {
  flower: FlowerVariety;
  color: PetalColorId;
  stemCount: number;
  bloomStage: number; // 0 to 1
  isExploded: boolean;
  foliage: string[];
  wrap: string;
  ribbon: string;
  monogram: string;
  atmosphere: LightingAtmosphere;
}

export interface CatalogItem {
  id: string;
  title: string;
  subtitle: string;
  collection: 'haute' | 'nocturne' | 'architectural' | 'solarium';
  price: number;
  flowerType: FlowerVariety;
  defaultColor: PetalColorId;
  scentNotes: string[];
  stems: number;
  featured: boolean;
  image?: string;
  description: string;
}

export interface OrderDetails {
  bouquetTitle: string;
  stemCount: number;
  price: number;
  customConfig?: CustomBouquetConfig;
  recipientName: string;
  recipientPhone: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: string;
  cardMessage: string;
  deliveryMethod: 'courier' | 'pickup';
  waxSealColor: 'gold' | 'bordeaux' | 'emerald';
}
