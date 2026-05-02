export const dragonflyModels = [
  { key: 'df25', label: 'Dragonfly 25' },
  { key: 'df28', label: 'Dragonfly 28' },
  { key: 'df32', label: 'Dragonfly 32' },
  { key: 'df35', label: 'Dragonfly 35' },
  { key: 'df40', label: 'Dragonfly 40' },
  { key: 'df800', label: 'Dragonfly 800' },
  { key: 'df920', label: 'Dragonfly 920' },
  { key: 'df1000', label: 'Dragonfly 1000' },
  { key: 'df1200', label: 'Dragonfly 1200' }
] as const;

export const currencies = [
  { key: 'USD', label: 'USD', symbol: '$' },
  { key: 'EUR', label: 'EUR', symbol: '€' },
  { key: 'GBP', label: 'GBP', symbol: '£' },
  { key: 'JPY', label: 'JPY', symbol: '¥' },
  { key: 'AUD', label: 'AUD', symbol: 'A$' },
  { key: 'CAD', label: 'CAD', symbol: 'C$' },
  { key: 'CHF', label: 'CHF', symbol: 'CHF' },
  { key: 'CNY', label: 'CNY', symbol: '¥' },
  { key: 'INR', label: 'INR', symbol: '₹' },
  { key: 'MXN', label: 'MXN', symbol: 'MX$' }
] as const;

export const countries = [
  { key: 'argentina', label: 'Argentina', flag: 'https://flagcdn.com/ar.svg' },
  { key: 'brazil', label: 'Brazil', flag: 'https://flagcdn.com/br.svg' },
  { key: 'france', label: 'France', flag: 'https://flagcdn.com/fr.svg' },
  { key: 'germany', label: 'Germany', flag: 'https://flagcdn.com/de.svg' },
  { key: 'italy', label: 'Italy', flag: 'https://flagcdn.com/it.svg' },
  { key: 'mexico', label: 'Mexico', flag: 'https://flagcdn.com/mx.svg' },
  { key: 'spain', label: 'Spain', flag: 'https://flagcdn.com/es.svg' },
  { key: 'switzerland', label: 'Switzerland', flag: 'https://flagcdn.com/ch.svg' },
  { key: 'venezuela', label: 'Venezuela', flag: 'https://flagcdn.com/ve.svg' }
] as const;

export const boatConditions = [
  { key: 'excellent', label: 'Excellent' },
  { key: 'good', label: 'Good' },
  { key: 'fair', label: 'Fair' },
  { key: 'needs_work', label: 'Needs Work' }
] as const;

// Fonction utilitaire pour obtenir le nom complet du modèle
export const getModelLabel = (modelKey: string): string => {
  const model = dragonflyModels.find(m => m.key === modelKey);
  return model ? model.label : modelKey; // Retourne la clé si pas trouvée
};

// Fonction utilitaire pour obtenir le nom du produit/plan
export const getProductLabel = (productId: string | null | undefined, products: any[] = []): string => {
  if (!productId) return 'Free Plan';
  const product = products.find(p => p.id === productId);
  return product?.name || 'Unknown Plan'; // Retourne l'ID si pas trouvé
}; 