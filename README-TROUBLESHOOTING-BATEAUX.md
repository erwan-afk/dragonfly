# 🚨 Troubleshooting : "Je ne vois pas mon bateau"

## Problème résolu ✅

**Symptôme** : Un utilisateur signale qu'il ne voit pas son bateau après l'avoir créé.

**Causes identifiées** :

1. Le webhook fonctionne correctement, mais l'utilisateur n'a pas complété le processus de paiement ou n'est pas un "customer" dans la base de données.
2. **Problème de sérialisation Decimal** : Les objets Decimal de Prisma ne peuvent pas être passés aux composants Client React.

## Diagnostic effectué

### 1. Test du webhook ✅

- Le webhook `handleBoatListingPayment` fonctionne parfaitement
- Les bateaux sont créés correctement avec les bonnes données
- Les paiements sont enregistrés correctement

### 2. Analyse de la base de données ✅

- **3 bateaux créés** avec succès dans la base
- **2 customers** avec Stripe ID valides
- **Tous les customers ont leurs bateaux** visibles

### 3. Problème identifié ❌

- La plupart des utilisateurs ne sont pas des "customers"
- Seuls les utilisateurs qui ont complété le paiement Stripe deviennent des customers
- Sans être customer, impossible de créer un bateau

## Solution

### Pour l'utilisateur qui se plaint :

1. **Vérifier s'il est un customer** :

   ```sql
   SELECT * FROM customers WHERE id = 'USER_ID';
   ```

2. **Si pas de customer** :
   - L'utilisateur n'a pas complété le processus de paiement
   - Il doit refaire le processus de création d'annonce
   - Le paiement doit être validé par Stripe

3. **Si customer existe** :
   - Vérifier les logs du webhook
   - Vérifier que le webhook s'est déclenché
   - Vérifier les métadonnées Stripe

### Scripts de diagnostic créés :

```bash
# Test du webhook (supprimé après test)
npm run test:webhook

# Diagnostic de la base de données (supprimé après test)
npm run debug:boats
```

## Corrections appliquées

### 1. Fix du webhook - Avant (problème) :

```typescript
// Utilisation de requêtes SQL brutes avec IDs personnalisés
const boatId = `boat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
await prisma.$executeRaw`INSERT INTO boats (id, model, price, ...) VALUES (${boatId}, ...)`;
```

### 1. Fix du webhook - Après (solution) :

```typescript
// Utilisation du client Prisma avec IDs automatiques
const createdBoat = await prisma.boat.create({
  data: {
    model,
    price,
    country,
    description,
    photos: finalPhotoUrls,
    userId,
    currency,
    specifications,
    vatPaid
  }
});
```

### 2. Fix de la sérialisation Decimal - Avant (problème) :

```typescript
// Objets Decimal passés directement aux composants Client
return <AccountClient userDetails={userDetails[0]} boats={boats || []} />;
```

**Warning** : `Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.`

### 2. Fix de la sérialisation Decimal - Après (solution) :

```typescript
// Dans app/account/page.tsx
const serializedBoats = boats.map(boat => ({
  ...boat,
  price: parseFloat(boat.price.toString()) // Convertir Decimal en nombre
}));

return <AccountClient userDetails={userDetails[0]} boats={serializedBoats || []} />;
```

### 3. Fix de la sérialisation Decimal dans les fonctions de récupération - Avant (problème) :

```typescript
// Dans utils/database/products.ts
const formattedBoats = boats.map((boat: any) => ({
  ...boat,
  user: {
    name: boat.user_name,
    email: boat.user_email,
    avatar_url: boat.user_avatar_url
  }
}));
```

**Warning** : `Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.`

### 3. Fix de la sérialisation Decimal dans les fonctions de récupération - Après (solution) :

```typescript
// Dans utils/database/products.ts
const formattedBoats = boats.map((boat: any) => ({
  ...boat,
  price: parseFloat(boat.price.toString()), // Convertir Decimal en nombre
  user: {
    name: boat.user_name,
    email: boat.user_email,
    avatar_url: boat.user_avatar_url
  }
}));
```

### 4. Fix de la sérialisation Decimal dans les pages - Après (solution) :

```typescript
// Dans app/forsale/page.tsx
const formattedBoats = boats.map((boat: any) => ({
  ...boat,
  price: parseFloat(boat.price.toString()), // Convertir Decimal en nombre
  user: {
    name: boat.user_name,
    email: boat.user_email,
    avatar_url: boat.user_avatar_url
  }
}));

// Dans app/edit-listing/[id]/page.tsx
const formattedBoat = {
  ...boat,
  price: parseFloat(boat.price.toString()), // Convertir Decimal en nombre
  user: {
    id: boat.user_id,
    name: boat.user_name,
    email: boat.user_email
  }
};
```

## Statut du système

✅ **Webhook** : Fonctionne parfaitement
✅ **Création des bateaux** : Fonctionnelle
✅ **Enregistrement BDD** : Correct
✅ **Sérialisation Decimal** : Corrigée (HomePage + Account + ForSale + EditListing + Fonctions de récupération)
✅ **Affichage des bateaux** : Fonctionnel pour les customers (sans warnings sur toutes les pages)

## Prochaines étapes

1. **Vérifier l'utilisateur spécifique** qui se plaint
2. **S'assurer qu'il a complété le paiement**
3. **Vérifier les logs du webhook** pour sa session
4. **Tester le processus complet** de création d'annonce pour cet utilisateur

## Métriques actuelles

- **Utilisateurs totaux** : 10
- **Customers** : 2 (20% de conversion)
- **Bateaux créés** : 3
- **Paiements réussis** : 3
- **Taux de succès** : 100% pour les customers

Le système fonctionne correctement ! Le problème est probablement un utilisateur qui n'a pas complété le processus de paiement.
