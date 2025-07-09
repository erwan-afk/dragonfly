# Top Loading Bar

Une barre de chargement qui s'affiche en haut de la page pendant les navigations et les actions asynchrones.

## Fonctionnalités

- ✨ Barre de chargement animée avec progression fluide
- 🎯 Déclenchement automatique lors des changements de route
- 🛠 Contrôle manuel pour les appels API et actions spécifiques
- 🎨 Personnalisable (hauteur, couleur, vitesse)
- 🚀 Intégration avec Framer Motion pour des animations fluides

## Utilisation automatique

La barre de chargement se déclenche automatiquement lors des navigations entre les pages. Aucune configuration supplémentaire n'est nécessaire.

## Contrôle manuel

### Hook `useLoadingBar`

```tsx
import { useLoadingBar } from '@/components/ui/LoadingProvider';

function MyComponent() {
  const { startLoading, stopLoading, withLoading } = useLoadingBar();

  // Contrôle manuel
  const handleAction = () => {
    startLoading();
    // ... action
    stopLoading();
  };

  // Avec fonction wrapper (recommandé)
  const handleAsyncAction = async () => {
    await withLoading(async () => {
      // Appel API ou action asynchrone
      const response = await fetch('/api/data');
      return response.json();
    });
  };

  return <button onClick={handleAsyncAction}>Effectuer une action</button>;
}
```

## Personnalisation

```tsx
<TopLoadingBar
  height={4} // Hauteur en pixels (défaut: 3)
  color="#10b981" // Couleur de la barre (défaut: #3b82f6)
  speed={200} // Vitesse d'animation en ms (défaut: 300)
/>
```

## Structure des composants

- `TopLoadingBar` - Composant visuel de la barre
- `LoadingProvider` - Contexte global pour l'état de chargement
- `useLoading` - Hook basique pour l'état
- `useLoadingBar` - Hook avancé avec utilitaires

## Installation

Le système est déjà intégré dans le layout principal. Aucune installation supplémentaire n'est nécessaire.
