# Skeleton Components Usage

## Components disponibles

### 1. SpotlightBoats avec skeletons

```tsx
import SpotlightBoats from '@/components/ui/SpotlightBoats/SpotlightBoats';

<SpotlightBoats
  boats={boats}
  isLoading={true} // Affiche les skeletons
  spotlight={false}
  edit={false}
/>;
```

### 2. AccountClient avec skeletons

```tsx
import { AccountClient } from '@/components/ui/Account/AccountClient';

<AccountClient
  userDetails={userDetails}
  boats={boats}
  isLoading={true} // Affiche les skeletons
/>;
```

### 3. LoadingSkeleton générique

```tsx
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

// Pour un formulaire
<LoadingSkeleton type="form" />

// Pour une page avec plusieurs cards
<LoadingSkeleton type="page" count={6} />

// Pour une card simple
<LoadingSkeleton type="card" />

// Pour une liste
<LoadingSkeleton type="list" count={5} />
```

### 4. BoatDetailSkeleton

```tsx
import BoatDetailSkeleton from '@/components/ui/BoatDetailSkeleton';

// Affichage pendant le chargement d'une page de détail de bateau
<BoatDetailSkeleton />;
```

### 5. Navbar avec skeleton pour bouton

```tsx
// Dans Navlinks.tsx, le bouton "Place an ad" affiche automatiquement
// un skeleton quand isPending est true
```

## Pattern d'utilisation

```tsx
'use client';
import { useState, useEffect } from 'react';
import SpotlightBoats from '@/components/ui/SpotlightBoats/SpotlightBoats';

export default function MyPage() {
  const [boats, setBoats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/boats');
        const data = await response.json();
        setBoats(data);
      } catch (error) {
        console.error('Error fetching boats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoats();
  }, []);

  return (
    <div>
      <SpotlightBoats
        boats={boats}
        isLoading={isLoading}
        spotlight={false}
        edit={false}
      />
    </div>
  );
}
```

## Styles personnalisés

Tous les skeletons utilisent HeroUI Skeleton avec des classes Tailwind pour un style cohérent :

- `rounded-lg` pour les coins arrondis
- `space-y-*` pour l'espacement vertical
- Largeurs responsives (`w-1/3`, `w-full`, etc.)
- Hauteurs appropriées selon le contenu (`h-4`, `h-8`, `h-12`, etc.)

## Installation

Le composant Skeleton a été installé avec :

```bash
npm install @heroui/skeleton --legacy-peer-deps
```
