/**
 * Configuration des caractéristiques des produits d'annonce
 * Cette configuration est utilisée dans la page pricing et le formulaire de création d'annonce
 */

import { formatPriceCurrency } from '@/utils/format-price';

// Limites de prix par devise (équivalent ~30k EUR)
// Mises à jour manuellement, à ajuster si les taux de change bougent significativement.
export const START_LINE_LIMIT_BY_CURRENCY: Record<string, number> = {
  EUR: 30000,
  USD: 32000,
  GBP: 25000,
  CHF: 28000,
  CAD: 44000,
  AUD: 50000,
};

export function getStartLineLimit(currency?: string | null): number {
  return START_LINE_LIMIT_BY_CURRENCY[(currency ?? 'EUR').toUpperCase()] ?? START_LINE_LIMIT_BY_CURRENCY.EUR;
}

export interface ProductFeatures {
  priceLimit: Record<string, number> | null; // Limites de prix par devise (null = pas de limite)
  priceLimitText: string; // Texte à afficher pour la limite de prix (référence EUR)
  maxPhotos: number; // Nombre maximum de photos
  duration: {
    months: number; // Durée en mois
    text: string; // Texte à afficher (ex: "3 months", "+3 months")
  };
  homepageFeatured: boolean; // Placement en vedette sur la page d'accueil
  searchPriority: 'standard' | 'high'; // Priorité dans les résultats de recherche
  editAnytime: boolean; // Possibilité d'éditer l'annonce à tout moment
  emailNotifications: boolean; // Notifications par email
}

export type ProductName = 'start line' | 'mid-course' | 'podium' | 'renewal';

/**
 * Configuration des caractéristiques pour chaque produit
 */
export const PRODUCT_FEATURES: Record<ProductName, ProductFeatures> = {
  'start line': {
    priceLimit: START_LINE_LIMIT_BY_CURRENCY,
    priceLimitText: 'Up to €30,000',
    maxPhotos: 3,
    duration: {
      months: 3,
      text: '3 months'
    },
    homepageFeatured: false,
    searchPriority: 'standard',
    editAnytime: true,
    emailNotifications: true
  },
  'mid-course': {
    priceLimit: null, // Over €30,000 (pas de limite max)
    priceLimitText: 'Over €30,000',
    maxPhotos: 5,
    duration: {
      months: 3,
      text: '3 months'
    },
    homepageFeatured: false,
    searchPriority: 'standard',
    editAnytime: true,
    emailNotifications: true
  },
  podium: {
    priceLimit: null, // All boats (pas de limite)
    priceLimitText: 'All boats',
    maxPhotos: 10,
    duration: {
      months: 4,
      text: '4 months'
    },
    homepageFeatured: true,
    searchPriority: 'high',
    editAnytime: true,
    emailNotifications: true
  },
  renewal: {
    priceLimit: null, // Existing ads
    priceLimitText: 'Existing ads',
    maxPhotos: 0, // Pas de photos pour renewal
    duration: {
      months: 3,
      text: '+3 months'
    },
    homepageFeatured: false,
    searchPriority: 'standard',
    editAnytime: true,
    emailNotifications: true
  }
};

/**
 * Obtient les caractéristiques d'un produit à partir de son nom
 * @param productName - Nom du produit (peut être en minuscules, majuscules, ou avec des espaces/tirets)
 * @returns Les caractéristiques du produit ou celles par défaut (start line)
 */
export function getProductFeatures(
  productName: string | null | undefined
): ProductFeatures {
  if (!productName) {
    return PRODUCT_FEATURES['start line'];
  }

  const name = productName.toLowerCase().trim();

  // Recherche par mots-clés dans le nom
  if (name.includes('start line') || name.includes('startline')) {
    return PRODUCT_FEATURES['start line'];
  }
  if (name.includes('mid-course') || name.includes('midcourse') || name.includes('mid course')) {
    return PRODUCT_FEATURES['mid-course'];
  }
  if (name.includes('podium')) {
    return PRODUCT_FEATURES['podium'];
  }
  if (name.includes('renewal')) {
    return PRODUCT_FEATURES['renewal'];
  }

  // Par défaut, retourner start line
  return PRODUCT_FEATURES['start line'];
}

/**
 * Obtient le nombre maximum de photos pour un produit
 */
export function getMaxPhotos(productName: string | null | undefined): number {
  return getProductFeatures(productName).maxPhotos;
}

/**
 * Obtient la limite de prix pour un produit dans une devise donnée
 */
export function getPriceLimit(
  productName: string | null | undefined,
  currency?: string | null
): number | null {
  const limits = getProductFeatures(productName).priceLimit;
  if (!limits) return null;
  const code = (currency ?? 'EUR').toUpperCase();
  return limits[code] ?? limits.EUR ?? null;
}

/**
 * Obtient le texte de la limite de prix pour un produit
 */
export function getPriceLimitText(
  productName: string | null | undefined
): string {
  return getProductFeatures(productName).priceLimitText;
}

/**
 * Obtient le texte formaté de la limite de prix pour le récapitulatif.
 * Le prix est formaté selon la convention locale de la devise (symbole avant
 * pour USD/GBP/CAD, symbole après pour EUR/CHF, etc.).
 */
export function getPriceLimitSummaryText(
  productName: string | null | undefined,
  _currencySymbol?: string,
  currency?: string | null
): string {
  const features = getProductFeatures(productName);
  const limit = getPriceLimit(productName, currency);
  const code = (currency ?? 'EUR').toUpperCase();

  if (limit !== null) {
    return `Boats up to ${formatPriceCurrency(limit, code)}`;
  }

  // Pour les produits sans limite, utiliser le texte de la configuration
  if (features.priceLimitText === 'All boats') {
    return 'All boats';
  }
  if (features.priceLimitText === 'Over €30,000') {
    const startLineLimit = getStartLineLimit(currency);
    return `Boats over ${formatPriceCurrency(startLineLimit, code)}`;
  }
  if (features.priceLimitText === 'Existing ads') {
    return 'Existing ads';
  }

  return features.priceLimitText;
}

/**
 * Obtient la durée d'un produit
 */
export function getDuration(productName: string | null | undefined): {
  months: number;
  text: string;
} {
  return getProductFeatures(productName).duration;
}

/**
 * Obtient le plan supérieur recommandé
 */
export function getUpgradePlan(
  productName: string | null | undefined
): string | null {
  if (!productName) return 'Mid-course';

  const name = productName.toLowerCase();
  if (name.includes('start line') || name.includes('startline')) {
    return 'Mid-course';
  }
  if (name.includes('mid-course') || name.includes('midcourse') || name.includes('mid course')) {
    return 'Podium';
  }
  if (name.includes('podium')) {
    return null; // Déjà le plan le plus élevé
  }
  if (name.includes('renewal')) {
    return 'Start line';
  }

  return 'Mid-course';
}

/**
 * Données pour le tableau comparatif de la page pricing
 */
export const PRICING_COMPARISON_DATA = {
  products: ['start line', 'mid-course', 'podium', 'renewal'] as ProductName[],
  features: {
    priceRange: {
      'start line': 'Up to €30,000',
      'mid-course': 'Over €30,000',
      podium: 'All boats',
      renewal: 'Existing ads'
    },
    photos: {
      'start line': 3,
      'mid-course': 5,
      podium: 10,
      renewal: null // Pas de photos
    },
    duration: {
      'start line': '3 months',
      'mid-course': '3 months',
      podium: '4 months',
      renewal: '+3 months'
    },
    homepageFeatured: {
      'start line': false,
      'mid-course': false,
      podium: true,
      renewal: false
    },
    searchPriority: {
      'start line': 'Standard',
      'mid-course': 'Standard',
      podium: 'High Priority',
      renewal: '—'
    },
    editAnytime: {
      'start line': true,
      'mid-course': true,
      podium: true,
      renewal: true
    },
    emailNotifications: {
      'start line': true,
      'mid-course': true,
      podium: true,
      renewal: true
    }
  }
} as const;
