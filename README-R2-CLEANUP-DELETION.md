# R2 Image Cleanup lors de la suppression des bateaux

## 🎯 Problème résolu

Avant cette amélioration, lorsqu'un utilisateur supprimait un bateau, seules les entrées de la base de données étaient supprimées, mais les images restaient stockées sur R2, créant des **"images orphelines"** qui occupaient de l'espace de stockage inutilement.

## ✅ Solution implémentée

### 1. Modification de l'API de suppression

**Fichier** : `app/api/boats/[id]/route.ts`

```typescript
// Ajout de l'import
import { deleteAllBoatImages } from '@/utils/cloudflare/r2';

// Nouvelle logique de suppression dans l'ordre correct :
export async function DELETE(request, { params }) {
  // 1. Vérification des permissions (déjà existant)

  // 2. Supprimer les images R2 EN PREMIER
  console.log(`🗑️ Deleting images for boat: ${boatId}`);
  const imagesDeleted = await deleteAllBoatImages(boatId);

  if (imagesDeleted) {
    console.log(`✅ All images deleted for boat: ${boatId}`);
  } else {
    console.log(`⚠️ Some images may not have been deleted for boat: ${boatId}`);
    // Continue même si la suppression d'images échoue
  }

  // 3. Supprimer les paiements liés (contrainte de clé étrangère)
  await prisma.$executeRaw`DELETE FROM payments WHERE boat_id = ${boatId}`;

  // 4. Supprimer le bateau de la base de données
  await prisma.$executeRaw`DELETE FROM boats WHERE id = ${boatId}`;
}
```

### 2. Fonction R2 utilisée

**Fichier** : `utils/cloudflare/r2.ts`

```typescript
// Fonction existante qui :
// 1. Liste toutes les images du bateau (préfixe: boats/{boatId}/)
// 2. Supprime chaque image en parallèle
// 3. Retourne true si toutes les suppressions ont réussi

export async function deleteAllBoatImages(boatId: string): Promise<boolean> {
  try {
    const imageKeys = await listBoatImages(boatId);

    if (imageKeys.length === 0) {
      return true; // Pas d'images à supprimer
    }

    // Supprimer toutes les images en parallèle
    const deletePromises = imageKeys.map((key) => deleteImageFromR2(key));
    const results = await Promise.all(deletePromises);

    // Vérifier que toutes les suppressions ont réussi
    return results.every((result) => result === true);
  } catch (error) {
    console.error('Error deleting all boat images:', error);
    return false;
  }
}
```

## 🔄 Processus de suppression

### Ordre des opérations :

1. **Vérification des permissions** ✅
2. **Suppression des images R2** 🗑️ (NOUVEAU)
3. **Suppression des paiements liés** 💳
4. **Suppression du bateau en BDD** 🗄️

### Gestion des erreurs :

- Si la suppression R2 échoue, le processus continue quand même
- Un log d'avertissement est affiché
- L'utilisateur reçoit toujours une confirmation de succès

## 📊 Avantages

### ✅ Évite les images orphelines

- Plus d'accumulation d'images inutiles sur R2
- Économies de stockage à long terme

### ✅ Nettoyage automatique

- Processus transparent pour l'utilisateur
- Pas d'intervention manuelle nécessaire

### ✅ Resilience

- Continue même si la suppression R2 échoue
- Logs détaillés pour debugging

## 🧪 Test de la fonctionnalité

### Scénario de test :

1. Créer un bateau avec des images
2. Vérifier que les images sont sur R2 (`boats/{boatId}/...`)
3. Supprimer le bateau via l'interface
4. Vérifier que les images ont été supprimées de R2
5. Vérifier que le bateau a été supprimé de la BDD

### Commandes de vérification :

```bash
# Vérifier les images avant suppression
curl -s "https://dragonfly-trimarans.org/boats/{boatId}/image.jpg"

# Après suppression, cette URL devrait retourner 404
curl -s "https://dragonfly-trimarans.org/boats/{boatId}/image.jpg"
```

## 📝 Logs attendus

```
🗑️ Deleting images for boat: cmcv123abc
✅ All images deleted for boat: cmcv123abc
✅ Boat and images deleted: cmcv123abc by user: userId123
```

## 🎯 Résultat final

Désormais, quand un utilisateur supprime un bateau :

- ✅ Les images R2 sont automatiquement supprimées
- ✅ Les paiements liés sont supprimés
- ✅ Le bateau est supprimé de la base de données
- ✅ Plus d'images orphelines sur R2
- ✅ Processus transparent pour l'utilisateur

**Stockage R2 optimisé et nettoyage automatique !** 🚀
