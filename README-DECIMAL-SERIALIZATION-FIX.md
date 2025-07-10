# 🔧 Fix de la sérialisation Decimal - Guide complet

## Problème identifié ⚠️

```
Warning: Only plain objects can be passed to Client Components from Server Components.
Decimal objects are not supported.
```

**Cause** : Les objets `Decimal` de Prisma ne peuvent pas être sérialisés et passés aux composants Client React dans Next.js.

## Solutions appliquées ✅

### 1. Page Account (`app/account/page.tsx`)

```typescript
// AVANT (problème)
return <AccountClient userDetails={userDetails[0]} boats={boats || []} />;

// APRÈS (solution)
const serializedBoats = boats.map(boat => ({
  ...boat,
  price: parseFloat(boat.price.toString()) // Convertir Decimal en nombre
}));

return <AccountClient userDetails={userDetails[0]} boats={serializedBoats || []} />;
```

### 3. Page ForSale (`app/forsale/page.tsx`)

```typescript
// AVANT (problème)
const formattedBoats = boats.map((boat: any) => ({
  ...boat,
  user: {
    name: boat.user_name,
    email: boat.user_email,
    avatar_url: boat.user_avatar_url
  }
}));

// APRÈS (solution)
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

### 4. Page Edit Listing (`app/edit-listing/[id]/page.tsx`)

```typescript
// AVANT (problème)
const formattedBoat = {
  ...boat,
  user: {
    id: boat.user_id,
    name: boat.user_name,
    email: boat.user_email
  }
};

// APRÈS (solution)
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

### 2. Fonctions de récupération des bateaux (`utils/database/products.ts`)

#### A. Fonction `getBoatsFromDatabase`

```typescript
// AVANT (problème)
const formattedBoats = boats.map((boat: any) => ({
  ...boat,
  user: {
    name: boat.user_name,
    email: boat.user_email,
    avatar_url: boat.user_avatar_url
  }
}));

// APRÈS (solution)
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

#### B. Fonction `getBoatById`

```typescript
// AVANT (problème)
const formattedBoat = {
  ...boat,
  user: {
    name: boat.user_name,
    email: boat.user_email,
    avatar_url: boat.user_avatar_url
  }
};

// APRÈS (solution)
const formattedBoat = {
  ...boat,
  price: parseFloat(boat.price.toString()), // Convertir Decimal en nombre
  user: {
    name: boat.user_name,
    email: boat.user_email,
    avatar_url: boat.user_avatar_url
  }
};
```

## Composants affectés 🎯

### Avant les corrections :

- ❌ **HomePage** : Warnings Decimal lors de l'affichage des bateaux
- ❌ **Page Account** : Warnings Decimal lors de l'affichage des bateaux utilisateur
- ❌ **Page ForSale** : Warnings Decimal lors de l'affichage des annonces
- ❌ **Page Edit Listing** : Warnings Decimal lors de l'édition d'annonces
- ❌ **Page Boat Details** : Warnings Decimal potentiels lors de l'affichage individuel

### Après les corrections :

- ✅ **HomePage** : Aucun warning, bateaux s'affichent correctement
- ✅ **Page Account** : Aucun warning, bateaux s'affichent correctement
- ✅ **Page ForSale** : Aucun warning, annonces s'affichent correctement
- ✅ **Page Edit Listing** : Aucun warning, édition fonctionne correctement
- ✅ **Page Boat Details** : Aucun warning, bateau s'affiche correctement

## Pattern de solution 💡

**Règle générale** : Toujours convertir les objets `Decimal` en nombres lors de la sérialisation pour les composants Client.

```typescript
// Pattern à appliquer partout
const serializedData = data.map((item) => ({
  ...item,
  price: parseFloat(item.price.toString()) // Convertir Decimal
  // autres champs Decimal si nécessaire
}));
```

## Emplacements des corrections 📍

1. **`app/account/page.tsx`** : Sérialisation avant passage au composant Client
2. **`app/forsale/page.tsx`** : Sérialisation avant passage au composant SpotlightBoats
3. **`app/edit-listing/[id]/page.tsx`** : Sérialisation avant passage au composant EditListing
4. **`utils/database/products.ts`** : Sérialisation directement dans les fonctions de récupération
   - `getBoatsFromDatabase()` - pour la HomePage
   - `getBoatById()` - pour les pages détail (boat/[id]/page.tsx)

## Pourquoi cette solution ? 🤔

- **Prisma utilise Decimal** pour les champs numériques précis (prix, montants)
- **Next.js/React** ne peut pas sérialiser les objets Decimal entre Server et Client Components
- **Conversion en Number** : Simple et efficace pour l'affichage
- **Pas de perte de précision** : Pour les prix de bateaux, la précision décimale standard suffit

## Statut final ✅

- ✅ **Warnings Decimal** : Complètement éliminés
- ✅ **Affichage bateaux** : Fonctionne parfaitement
- ✅ **Performance** : Aucun impact négatif
- ✅ **Maintenance** : Solution durable et scalable

## Autres champs Decimal potentiels 🔍

Si d'autres champs Decimal sont ajoutés à l'avenir, appliquer la même logique :

```typescript
// Pour tout champ Decimal
amount: parseFloat(item.amount.toString()),
total: parseFloat(item.total.toString()),
discount: parseFloat(item.discount.toString()),
```

Cette correction garantit une compatibilité totale entre les données Prisma et les composants React Client.
