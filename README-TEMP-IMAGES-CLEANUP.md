# 🧹 Nettoyage des Images Temporaires R2

## 🎯 Problème résolu

**Symptôme** : Images temporaires orphelines sur R2 qui ne sont pas supprimées après traitement

**Exemple** : `temp_session_1752012940017_x380upwyt/1752012940417-original-b7c7f800fe4980bfa86d21558963713a.webp`

**Causes** :

1. Échec du webhook lors du déplacement des images
2. Utilisateur abandonne le processus avant paiement
3. Erreur lors de la suppression des images temporaires
4. Pas de nettoyage automatique des images anciennes

## ✅ Solution complète implémentée

### 1. Fonctions de nettoyage ajoutées

**Fichier** : `utils/cloudflare/r2.ts`

```typescript
// Liste toutes les images temporaires
export async function listTempImages(): Promise<string[]>;

// Supprime les images temporaires d'une session spécifique
export async function deleteTempSessionImages(
  sessionId: string
): Promise<boolean>;

// Supprime les images temporaires anciennes (plus de X heures)
export async function cleanupOldTempImages(hoursOld: number = 2): Promise<{
  deleted: number;
  failed: number;
  totalFound: number;
}>;

// Supprime TOUTES les images temporaires (dangereux)
export async function deleteAllTempImages(): Promise<{
  deleted: number;
  failed: number;
}>;
```

### 2. API de nettoyage

**Fichier** : `app/api/cleanup/temp-images/route.ts`

```typescript
// GET /api/cleanup/temp-images - Lister les images temporaires
// POST /api/cleanup/temp-images - Actions de nettoyage

Actions disponibles :
- cleanup-old: Nettoie les images anciennes
- delete-session: Supprime les images d'une session spécifique
- delete-all: Supprime toutes les images temporaires
- list: Liste toutes les images temporaires
```

### 3. Nettoyage automatique dans le webhook

**Fichier** : `utils/prisma/admin.ts`

```typescript
// Après déplacement réussi des images
if (moveResult.success) {
  // ... mise à jour du bateau ...

  // Nettoyer les images temporaires de cette session
  const sessionId = extractSessionId(tempKeys[0]);
  const cleanupResult = await deleteTempSessionImages(sessionId);

  if (cleanupResult) {
    console.log(
      `✅ Images temporaires nettoyées pour la session: ${sessionId}`
    );
  }
}
```

### 4. Script de nettoyage périodique

**Fichier** : `scripts/cleanup-temp-images.ts`

```typescript
// Exécution manuelle
npm run cleanup-temp-images

// Ou via node
node scripts/cleanup-temp-images.ts
```

## 🔄 Processus de nettoyage

### Nettoyage automatique :

1. **Upload temporaire** → Images stockées dans `temp_session_xxx/`
2. **Paiement réussi** → Images déplacées vers `boats/boatId/`
3. **Webhook** → Nettoyage automatique de la session temporaire
4. **Résultat** → Plus d'images temporaires pour cette session

### Nettoyage des anciennes images :

1. **Images abandonnées** → Restent sur R2 après échec/abandon
2. **Script périodique** → Supprime les images > 2 heures
3. **Nettoyage sélectif** → Basé sur le timestamp du nom de fichier

## 📊 Utilisation

### 1. Nettoyage via API

```bash
# Lister les images temporaires
curl -X GET http://localhost:3000/api/cleanup/temp-images

# Nettoyer les images anciennes (2h par défaut)
curl -X POST http://localhost:3000/api/cleanup/temp-images \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup-old"}'

# Nettoyer une session spécifique
curl -X POST http://localhost:3000/api/cleanup/temp-images \
  -H "Content-Type: application/json" \
  -d '{"action": "delete-session", "sessionId": "session_1752012940017_x380upwyt"}'
```

### 2. Nettoyage via script

```bash
# Exécution directe
npx ts-node scripts/cleanup-temp-images.ts

# Ou via package.json script
npm run cleanup-temp-images
```

### 3. Nettoyage en production

```bash
# Cron job quotidien à 2h du matin
0 2 * * * cd /path/to/app && npm run cleanup-temp-images

# Ou via Vercel Cron (vercel.json)
{
  "crons": [
    {
      "path": "/api/cleanup/temp-images",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## 🛡️ Sécurité et précautions

### Authentification :

- L'API nécessite une authentification utilisateur
- Pour un cron job, retirer la vérification d'auth

### Sécurité :

- `delete-all` est dangereux → À utiliser avec précaution
- Logs détaillés pour traçabilité
- Gestion d'erreurs robuste

### Performance :

- Suppression en parallèle pour optimiser les performances
- Timeout approprié pour éviter les blocages

## 📝 Logs attendus

### Nettoyage réussi :

```
🧹 Nettoyage des images temporaires pour la session: session_1752012940017_x380upwyt
✅ Deleted 3 temp images for session: session_1752012940017_x380upwyt
✅ Images temporaires nettoyées pour la session: session_1752012940017_x380upwyt
```

### Nettoyage automatique :

```
🧹 Starting cleanup of temp images older than 2 hours...
🗑️ Deleted old temp image: temp_session_1752012940017_x380upwyt/1752012940417-original.webp
✅ Cleanup completed: 5 deleted, 0 failed, 12 total found
```

## 🎯 Résultats

### ✅ Nettoyage automatique

- Images temporaires supprimées après traitement réussi
- Pas d'accumulation d'images orphelines

### ✅ Nettoyage périodique

- Script automatique pour les images anciennes
- Optimisation du stockage R2

### ✅ Contrôle manuel

- API pour nettoyage sur demande
- Outils de debugging et maintenance

### ✅ Monitoring

- Logs détaillés des opérations
- Statistiques de nettoyage

**Stockage R2 optimisé et maintenu automatiquement !** 🚀

## 🔧 Configuration recommandée

### package.json

```json
{
  "scripts": {
    "cleanup-temp-images": "ts-node scripts/cleanup-temp-images.ts"
  }
}
```

### Cron job système

```bash
# Ajoutez à votre crontab
0 2 * * * cd /path/to/your/app && npm run cleanup-temp-images >> /var/log/temp-cleanup.log 2>&1
```

**Plus d'images temporaires orphelines ! Le système se nettoie automatiquement.** 🎉
