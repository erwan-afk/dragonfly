# Configuration Cloudflare R2 pour la gestion des images

Ce document explique comment configurer et utiliser le nouveau système de stockage d'images avec Cloudflare R2.

## 🎯 Fonctionnalités

- **Organisation par annonces** : Chaque bateau a son propre dossier d'images (`boats/{boatId}/`)
- **Upload post-paiement** : Upload uniquement après paiement validé (économique)
- **Migration automatique** : Script pour migrer les images existantes depuis FTP
- **Performance optimisée** : CDN global Cloudflare pour une livraison rapide des images
- **Sécurité** : Validation des types de fichiers et limitations de taille
- **Économique** : Aucun stockage temporaire, optimisé pour les plans basés sur actions

## 📋 Prérequis

1. Un compte Cloudflare avec R2 activé
2. Un bucket R2 créé
3. Des clés d'API R2 configurées

## ⚙️ Configuration

### 1. Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name

# Optionnel : Domaine personnalisé pour R2
R2_PUBLIC_URL=https://your-custom-domain.com
```

### 2. Obtenir les clés Cloudflare R2

1. Connectez-vous à votre dashboard Cloudflare
2. Allez dans **R2 Object Storage**
3. Créez un bucket si ce n'est pas fait
4. Allez dans **Manage R2 API tokens**
5. Créez un nouveau token avec les permissions :
   - `Object:Edit` sur votre bucket
   - `Object:Read` sur votre bucket

### 3. Configuration du domaine personnalisé (optionnel)

Pour des performances optimales, configurez un domaine personnalisé :

1. Dans Cloudflare R2, allez dans votre bucket
2. Cliquez sur **Settings** > **Custom Domain**
3. Ajoutez votre domaine (ex: `cdn.votre-site.com`)
4. Mettez à jour `R2_PUBLIC_URL` dans votre `.env`

## 🚀 Utilisation

### Structure des dossiers

```
bucket-name/
└── boats/
    ├── boat_1704567890123_abc456def/
    │   ├── 1704567890456-image1.jpg
    │   ├── 1704567890789-image2.png
    │   └── 1704567891012-image3.jpg
    └── boat_1704567891456_xyz789ghi/
        └── 1704567891200-image4.jpg
```

### API Endpoints

#### Upload d'images (post-paiement uniquement)

```typescript
// Upload multiple après paiement validé
const formData = new FormData();
formData.append('boatId', 'boat_1704567890123_abc456def');
files.forEach((file, index) => {
  formData.append(`file${index}`, file);
});

const response = await fetch('/api/upload/boat-images', {
  method: 'POST',
  body: formData
});

// Response: { success: true, urls: [...], keys: [...] }
```

```typescript
// Upload simple (un fichier)
const formData = new FormData();
formData.append('file', file);
formData.append('boatId', 'boat_1704567890123_abc456def');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

// Response: { success: true, url: "...", key: "..." }
```

#### Service des images

```typescript
// Récupération d'image par clé complète
const imageUrl = '/api/image/boats/boat_123/1673123456789-image1.jpg';
```

### Exemple d'utilisation frontend

Pour éviter la création de multiples dossiers temporaires, utilisez un `sessionId` unique :

```typescript
// 1. Générer un sessionId au début de la session d'upload
const sessionId = `temp_${Date.now()}`;

// 2. Utiliser le même sessionId pour tous les fichiers
const uploadMultipleFiles = async (files: File[]) => {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId); // ⚠️ Important : même sessionId pour tous

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    return response.json();
  });

  const results = await Promise.all(uploadPromises);
  return results.filter((r) => r.success).map((r) => r.url);
};

// 3. Après paiement, déplacer les images
const moveToBoat = async (boatId: string) => {
  await fetch('/api/upload/move-temp-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, boatId })
  });
};
```

## 🔄 Migration depuis FTP

### Script de migration

Un script de migration automatique est disponible pour transférer vos images existantes :

```bash
# Test de migration (dry run)
npx ts-node scripts/migrate-images-to-r2.ts --dry-run

# Migration réelle
npx ts-node scripts/migrate-images-to-r2.ts

# Migration avec nettoyage des fichiers temporaires
npx ts-node scripts/migrate-images-to-r2.ts --cleanup
```

### Processus de migration

1. Le script récupère tous les bateaux avec des photos FTP
2. Pour chaque bateau :
   - Télécharge les images depuis FTP
   - Les upload vers R2 dans le bon dossier
   - Met à jour la base de données avec les nouvelles URLs
3. Affiche un rapport de migration détaillé

## 🛠️ Modifications du code existant

### Système de paiement

Le nouveau processus économique :

1. **Formulaire** : Images stockées localement en mémoire (0 upload)
2. **Paiement** : Validation Stripe avec métadonnées des images
3. **Post-paiement** : Upload direct vers `boats/{boatId}/` depuis page de succès

### Composants frontend

Les composants existants continuent de fonctionner sans modification car ils utilisent les URLs stockées en base de données.

## 📊 Avantages du nouveau système

### Performance

- **CDN global** : Livraison rapide depuis le serveur le plus proche
- **Cache optimisé** : Mise en cache aggressive des images
- **Bande passante illimitée** : Pas de limite de bande passante

### Coût

- **Stockage économique** : ~$0.015/GB/mois
- **Pas de frais de bande passante** entre R2 et Cloudflare
- **Pas de frais d'API** pour les opérations de lecture

### Sécurité

- **Validation des fichiers** : Types de fichiers autorisés (JPEG, PNG, WebP)
- **Limitation de taille** : Maximum 10MB par image
- **Isolation** : Chaque bateau a son propre dossier

### Maintenance

- **Sauvegarde automatique** : R2 gère automatiquement la redondance
- **Organisation claire** : Structure de dossiers logique
- **Nettoyage facile** : Suppression automatique des images temporaires

## 🔧 Dépannage

### Problèmes courants

#### 1. Erreur de configuration R2

```
Error: Missing R2 configuration: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID
```

**Solution** : Vérifiez que toutes les variables d'environnement sont définies dans `.env`

#### 2. Erreur d'upload

```
Error: Only JPEG, PNG and WebP images are allowed
```

**Solution** : Vérifiez que le fichier est bien une image dans un format supporté

#### 3. Images ne s'affichent pas

**Solution** :

1. Vérifiez la configuration Next.js dans `next.config.js`
2. Assurez-vous que le domaine R2 est autorisé
3. Vérifiez que l'URL de l'image est correcte

### Logs de débogage

Pour activer les logs détaillés, ajoutez dans votre `.env` :

```env
DEBUG=cloudflare-r2:*
```

## 🔄 Retour en arrière (rollback)

Si vous devez revenir au système FTP :

1. Gardez vos anciennes variables d'environnement FTP
2. Remplacez le contenu des fichiers API upload et image par les anciennes versions
3. Les URLs des images migrées resteront dans la base de données

## 📈 Monitoring

### Métriques Cloudflare

Surveillez ces métriques dans le dashboard Cloudflare :

- **Requêtes** : Nombre d'images servies
- **Bande passante** : Trafic généré
- **Erreurs** : Taux d'erreur 4xx/5xx
- **Cache ratio** : Efficacité du cache

### Logs applicatifs

Les APIs logguent automatiquement :

- Uploads réussis/échoués
- Temps de traitement
- Erreurs de validation

## 🚀 Prochaines étapes

1. **Optimisation d'images** : Ajouter la compression automatique
2. **Variantes de taille** : Générer des thumbnails automatiquement
3. **Upload direct** : Permettre l'upload direct vers R2 depuis le frontend
4. **Nettoyage automatique** : Supprimer les images temporaires anciennes

## 📞 Support

Pour toute question ou problème :

1. Vérifiez cette documentation
2. Consultez les logs d'application
3. Vérifiez la configuration Cloudflare R2
