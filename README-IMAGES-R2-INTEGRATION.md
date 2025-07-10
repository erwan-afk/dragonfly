# 🖼️ Intégration Images R2 dans les Pages Bateaux

## 🎯 Vue d'ensemble

Ce document explique comment les images Cloudflare R2 sont **parfaitement intégrées** dans les pages de bateaux et affichées dans le carrousel.

## 🔄 Flux complet de l'image

```mermaid
graph TD
    A[Upload post-paiement] --> B[Stockage R2 boats/boat_ID/]
    B --> C[URL complète en base de données]
    C --> D[Page bateau /boat/[id]]
    D --> E[Normalisation URLs]
    E --> F[BoatImageGallery]
    F --> G[BoatImage + Carrousel]
    G --> H[Affichage utilisateur]
```

## 📁 Structure de stockage R2

### Structure finale

```
bucket-name/
└── boats/
    ├── boat_1704567890123_abc456def/
    │   ├── 1704567890456-catamaran1.jpg  ← Image principale
    │   ├── 1704567890789-catamaran2.png  ← Images galerie
    │   └── 1704567891012-catamaran3.jpg
    └── boat_1704567891456_xyz789ghi/
        └── 1704567891200-yacht.jpg
```

### URLs générées

```typescript
// URL R2 standard
'https://bucket.account.r2.cloudflarestorage.com/boats/boat_123/1704567890456-image.jpg';

// URL avec domaine custom (si configuré)
'https://cdn.votresite.com/boats/boat_123/1704567890456-image.jpg';
```

## 🔧 Code d'intégration

### 1. Page bateau (`app/boat/[id]/page.tsx`)

```typescript
// Fonction de normalisation des URLs
function normalizeImageUrls(photos: string[] | null | undefined): string[] {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return [];
  }

  return photos
    .filter(url => url && typeof url === 'string' && url.trim() !== '')
    .map(url => {
      const trimmedUrl = url.trim();

      // URL complète → retourner telle quelle
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
      }

      // URL locale → garder telle quelle
      if (trimmedUrl.startsWith('/')) {
        return trimmedUrl;
      }

      // Clé R2 relative → construire URL complète
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
      const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
      const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

      if (R2_PUBLIC_URL) {
        return `${R2_PUBLIC_URL}/${trimmedUrl}`;
      } else if (R2_ACCOUNT_ID && R2_BUCKET_NAME) {
        return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${trimmedUrl}`;
      }

      return trimmedUrl;
    });
}

// Utilisation dans la page
const normalizedPhotos = normalizeImageUrls(boat.photos);
const allImages = normalizedPhotos.length > 0 ? normalizedPhotos : [defaultImage];

return (
  <BoatImageGallery images={allImages} boatModel={boat.model} />
);
```

### 2. Composant galerie (`BoatImageGallery.tsx`)

```typescript
// Le composant reçoit les URLs normalisées
interface BoatImageGalleryProps {
  images: string[];  // URLs R2 complètes
  boatModel: string;
}

// Structure galerie : 1 image principale + 4 miniatures
const mainImage = originalImages[0];           // Image principale (R2)
const galleryImages = carouselImages.slice(1, 5); // 4 miniatures (R2)

// Chaque image utilise BoatImage
<BoatImage
  src={mainImage}  // URL R2 complète
  alt={`${boatModel} main view`}
  onClick={() => openCarousel(0)}  // Ouvre carrousel
/>
```

### 3. Composant image (`BoatImage.tsx`)

```typescript
// Gestion des erreurs et fallback
const handleImageError = (e: any) => {
  e.currentTarget.src = defaultImage;  // Image par défaut si R2 échoue
};

return (
  <img
    src={src}        // URL R2 complète
    alt={alt}
    onError={handleImageError}  // Fallback automatique
    onClick={onClick}           // Interaction carrousel
  />
);
```

## 📊 Types d'URLs gérées

### 1. **URLs R2 complètes** ✅

```typescript
'https://bucket.account.r2.cloudflarestorage.com/boats/boat_123/image.jpg';
'https://cdn.votresite.com/boats/boat_123/image.jpg';
```

**Action** : Utilisées directement

### 2. **Clés R2 relatives** ✅

```typescript
'boats/boat_123/1704567890456-image.jpg';
```

**Action** : Converties en URLs complètes

### 3. **URLs locales** ✅

```typescript
'/images/ocean.png';
'/images/default-boat.jpg';
```

**Action** : Gardées telles quelles (images statiques)

### 4. **URLs FTP anciennes** ✅

```typescript
'https://ftp.ancien-serveur.com/images/boat_123.jpg';
```

**Action** : Conservées (rétrocompatibilité)

## 🔄 Fonctionnalités du carrousel

### Structure galerie

```
┌─────────────────┐  ┌─────┐ ┌─────┐
│                 │  │  2  │ │  3  │
│    Image 1      │  │     │ │     │
│  (Principale)   │  └─────┘ └─────┘
│                 │  ┌─────┐ ┌─────┐
│     (Clique)    │  │  4  │ │  5  │
└─────────────────┘  └─────┘ └─────┘
```

### Interactions

- **Clic image principale** → Ouvre carrousel à l'index 0
- **Clic miniature** → Ouvre carrousel à l'index correspondant
- **Navigation carrousel** → Flèches gauche/droite
- **Fermeture** → Clic overlay ou bouton fermer

## 🧪 Tests et validation

### 1. Script de test d'affichage

```bash
# Teste l'accessibilité des images R2
npx ts-node scripts/test-r2-images-display.ts
```

### 2. Script de mise à jour URLs

```bash
# Dry run - voir les changements
npx ts-node scripts/update-r2-image-urls.ts

# Exécution réelle
npx ts-node scripts/update-r2-image-urls.ts --execute
```

### 3. Test manuel

```bash
# 1. Aller sur une page bateau
http://localhost:3000/boat/boat_123

# 2. Vérifier que les images s'affichent
# 3. Tester le carrousel (clic + navigation)
# 4. Vérifier le fallback (image par défaut)
```

## 🚀 Performance et optimisations

### Cache optimal

```typescript
// Headers automatiques pour les images R2
"Cache-Control": "public, max-age=31536000, immutable"  // 1 an
"ETag": "filename"                                      // Validation cache
```

### CDN Cloudflare

- **Cache global** : Images servies depuis le serveur le plus proche
- **Compression automatique** : WebP/AVIF selon le navigateur
- **Resize on-the-fly** : Différentes tailles selon l'appareil

### Lazy loading

```typescript
// Le navigateur charge les images à la demande
<img loading="lazy" src={r2Url} />
```

## 🔧 Configuration requise

### Variables d'environnement

```env
# Obligatoires
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket

# Optionnel mais recommandé
R2_PUBLIC_URL=https://cdn.votresite.com
```

### Next.js config

```javascript
// next.config.js
const nextConfig = {
  images: {
    domains: [
      'your-bucket.your-account.r2.cloudflarestorage.com',
      'cdn.votresite.com' // Si domaine custom configuré
    ]
  }
};
```

## 🎯 Résultat final

### ✅ Ce qui fonctionne parfaitement

1. **📤 Upload post-paiement** → Images directement dans R2
2. **🗄️ Stockage organisé** → Structure `boats/{boatId}/`
3. **🔗 URLs normalisées** → Conversion automatique vers format complet
4. **🖼️ Affichage galerie** → Image principale + 4 miniatures
5. **🎠 Carrousel interactif** → Navigation fluide entre images
6. **🔄 Gestion d'erreurs** → Fallback automatique vers image par défaut
7. **⚡ Performance** → Cache CDN + lazy loading

### 🔄 Flux utilisateur final

1. **User ajoute images** → Stockées en mémoire (0 upload)
2. **User paie annonce** → Paiement Stripe validé
3. **Images uploadées** → Upload automatique vers R2
4. **URLs sauvées** → Base de données avec URLs complètes
5. **Page bateau** → Récupération + normalisation URLs
6. **Galerie affichée** → Images R2 dans carrousel interactif
7. **Navigation fluide** → Expérience utilisateur optimale

**Perfect integration** des images R2 avec le carrousel ! 🎉🖼️
