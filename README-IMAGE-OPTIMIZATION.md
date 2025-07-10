# 🖼️ Optimisation des Images

Ce projet intègre un système d'optimisation automatique des images pour améliorer les performances et réduire l'utilisation du stockage.

## ✨ Fonctionnalités

### 🎯 Limite de taille réduite

- **Nouvelle limite**: 3 MB (au lieu de 10 MB)
- **Formats supportés**: JPEG, PNG, WebP
- **Validation automatique** lors de l'upload

### 🔄 Conversion WebP automatique

- **Conversion automatique** de toutes les images en WebP
- **Qualité par défaut**: 80% (ajustable)
- **Compression moyenne**: 70-95% de réduction de taille
- **Compatibilité**: Maintien du nom de fichier original dans les métadonnées

## 🚀 Avantages

### 💾 Stockage optimisé

- **Réduction drastique** de l'espace de stockage requis
- **Économies significatives** sur les coûts Cloudflare R2
- **Meilleure utilisation** des ressources

### ⚡ Performances améliorées

- **Chargement plus rapide** des images
- **Bande passante réduite** pour les utilisateurs
- **Expérience utilisateur optimisée**

### 🎨 Qualité préservée

- **Qualité visuelle excellente** avec WebP
- **Compression intelligente** via Sharp
- **Support moderne** des navigateurs

## 🔧 APIs mises à jour

### `/api/upload`

Gère l'upload d'images temporaires et définitives avec conversion WebP automatique.

**Fonctions utilisées**:

- `uploadImageToR2WithWebP()` - Upload direct avec conversion
- `uploadImageToTempR2WithWebP()` - Upload temporaire avec conversion

### `/api/upload/boat-images`

Gère l'upload multiple d'images pour les bateaux.

**Fonctions utilisées**:

- `uploadImagesForBoatWithWebP()` - Upload multiple avec conversion

## 🛠️ Fonctions utilitaires

### `convertImageToWebP()`

```typescript
export async function convertImageToWebP(
  file: File,
  quality: number = 80
): Promise<{ buffer: Buffer; filename: string }>;
```

**Paramètres**:

- `file`: Fichier image à convertir
- `quality`: Qualité WebP (1-100, défaut: 80)

**Retour**:

- `buffer`: Image convertie en WebP
- `filename`: Nom de fichier avec extension .webp

### Fonctions d'upload avec WebP

#### Upload direct

```typescript
uploadImageToR2WithWebP(file: File, boatId: string, quality?: number)
```

#### Upload temporaire

```typescript
uploadImageToTempR2WithWebP(file: File, sessionId: string, quality?: number)
```

#### Upload multiple

```typescript
uploadImagesForBoatWithWebP(files: File[], boatId: string, quality?: number)
```

## 📊 Tests et validation

### Script de test

```bash
npm run r2:test-webp
```

Ce script teste :

- ✅ Validation de la limite 3MB
- ✅ Conversion WebP fonctionnelle
- ✅ Taux de compression
- ✅ Respect des limites

### Résultats typiques

- **Image PNG 2.48 MB** → **WebP 196 KB** (92.1% de réduction)
- **Qualité visuelle** : Excellente à 80%
- **Compatibilité** : Tous navigateurs modernes

## 🔗 Métadonnées enrichies

Chaque image uploadée contient des métadonnées détaillées :

```typescript
{
  boatId: string,
  originalName: string,          // Nom original du fichier
  convertedFilename: string,     // Nom du fichier WebP
  uploadedAt: string,           // Timestamp d'upload
  converted: 'true',            // Indicateur de conversion
  quality: string,              // Qualité WebP utilisée
  temporary?: 'true'            // Pour les images temporaires
}
```

## 📈 Impact sur les performances

### Avant l'optimisation

- Images JPEG/PNG moyennes : 1-5 MB
- Temps de chargement : 2-10 secondes
- Bande passante élevée

### Après l'optimisation

- Images WebP : 100-500 KB (moyenne)
- Temps de chargement : 0.5-2 secondes
- **Réduction de 70-95%** de la bande passante

## 🔄 Migration des images existantes

Les images existantes continuent de fonctionner normalement. Pour convertir les images existantes :

1. **Optionnel** : Script de migration en lot (à développer si nécessaire)
2. **Automatique** : Nouvelles images converties automatiquement
3. **Graduel** : Remplacement naturel lors des mises à jour

## 🎛️ Configuration

### Qualité WebP ajustable

- **Par défaut** : 80% (excellent équilibre qualité/taille)
- **Modifiable** dans chaque appel de fonction
- **Recommandations** :
  - 70% : Compression maximale
  - 80% : Équilibre optimal ✅
  - 90% : Qualité maximale

### Formats d'entrée supportés

- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ WebP (.webp) - recompressé si nécessaire

## 🚨 Gestion d'erreurs

### Validation automatique

- Vérification du type de fichier
- Contrôle de la taille (3MB max)
- Validation de l'intégrité de l'image

### Messages d'erreur clairs

```
"File image.jpg: File size must be less than 3MB"
"Only JPEG, PNG and WebP images are allowed"
"Failed to convert image to WebP"
```

## 📝 Notes techniques

### Dépendances

- **Sharp** : Bibliothèque de traitement d'images haute performance
- **AWS SDK** : Intégration Cloudflare R2
- **Node.js** : Support natif des Buffer

### Compatibilité

- **Navigateurs** : Support WebP >95% (Can I Use)
- **Fallback** : Non nécessaire grâce au support étendu
- **Mobile** : Support natif iOS Safari et Android Chrome

---

💡 **Résultat** : Des images plus légères, un stockage optimisé, et une expérience utilisateur significativement améliorée !
