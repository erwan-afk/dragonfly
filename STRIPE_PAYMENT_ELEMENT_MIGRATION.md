# Migration de Stripe Checkout vers Stripe Payment Element

## Vue d'ensemble

Cette migration remplace le flux de paiement Stripe Checkout (avec redirection) par Stripe Payment Element, permettant de garder l'utilisateur sur la même page pendant tout le processus.

## Changements effectués

### 1. Nouvelle API Route : `/api/create-payment-intent`

**Fichier** : `app/api/create-payment-intent/route.ts`

Cette route crée un PaymentIntent Stripe au lieu d'une Checkout Session. Elle :
- Vérifie l'authentification de l'utilisateur
- Crée un PaymentIntent avec le montant et les métadonnées du bateau
- Retourne le `clientSecret` nécessaire pour le Payment Element

### 2. Nouveau composant : `StripePaymentForm`

**Fichier** : `components/ui/StripePaymentForm/StripePaymentForm.tsx`

Ce composant React affiche le Payment Element de Stripe et gère :
- L'affichage du formulaire de paiement
- La confirmation du paiement
- Les callbacks de succès et d'erreur
- Les messages d'erreur

### 3. Modifications du `BoatListingForm`

**Fichier** : `components/ui/BoatListingForm/BoatListingForm.tsx`

Le formulaire a été modifié pour :
- Importer les composants Stripe React (`Elements`, `loadStripe`)
- Ajouter des états pour gérer l'affichage du paiement (`showPayment`, `clientSecret`)
- Modifier le flux de soumission pour :
  1. Uploader les images
  2. Créer le bateau avec statut `pending`
  3. Créer le PaymentIntent
  4. Afficher le Payment Element au lieu de rediriger vers Stripe
- Désactiver les champs du formulaire une fois le paiement affiché
- Gérer le succès/échec du paiement avec des callbacks

### 4. Webhook Handler pour Payment Intent

**Fichier** : `app/api/webhooks/route.ts`

Ajout d'un nouveau handler pour l'événement `payment_intent.succeeded` qui :
1. Vérifie que le bateau existe et est en statut `pending`
2. Active le bateau (statut `active`)
3. Enregistre le paiement dans la base de données
4. Déplace les images temporaires vers le dossier final

Également mis à jour le handler `payment_intent.payment_failed` pour gérer les PaymentIntents sans Checkout Session.

## Flux de paiement

### Ancien flux (Stripe Checkout)
```
1. Utilisateur remplit le formulaire
2. Upload des images
3. Création du bateau (pending)
4. Création d'une Checkout Session
5. Redirection vers Stripe Checkout
6. Utilisateur paie sur Stripe
7. Redirection de retour vers le site
8. Webhook active le bateau
```

### Nouveau flux (Payment Element)
```
1. Utilisateur remplit le formulaire
2. Upload des images
3. Création du bateau (pending)
4. Création d'un PaymentIntent
5. Affichage du Payment Element (sur la même page)
6. Utilisateur paie directement
7. Confirmation immédiate (pas de redirection)
8. Webhook active le bateau
```

## Avantages

1. **Meilleure UX** : L'utilisateur reste sur la même page
2. **Moins de redirections** : Pas d'aller-retour vers Stripe
3. **Plus rapide** : Confirmation immédiate
4. **Plus moderne** : Interface de paiement intégrée
5. **Plus de contrôle** : Personnalisation de l'apparence du formulaire

## Installation

Les dépendances suivantes ont été ajoutées :
```bash
npm install @stripe/stripe-js@^8.0.0 @stripe/react-stripe-js --legacy-peer-deps
```

## Configuration

Aucune configuration supplémentaire nécessaire. Les variables d'environnement Stripe existantes sont utilisées :
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (ou `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`)
- `STRIPE_SECRET_KEY` (ou `STRIPE_SECRET_KEY_LIVE`)
- `STRIPE_WEBHOOK_SECRET`

## Sécurité

Le flux reste sécurisé car :
1. Le PaymentIntent est créé côté serveur avec authentification
2. Le `clientSecret` est unique et temporaire
3. Le webhook confirme le paiement côté serveur
4. Le bateau ne devient `active` qu'après confirmation du paiement

## Compatibilité

Le webhook reste compatible avec l'ancien système (Checkout Session) grâce au handler `checkout.session.completed` existant. Les deux méthodes de paiement peuvent coexister.

## Test

Pour tester le nouveau flux :
1. Accédez à `/list-boat`
2. Remplissez le formulaire
3. Cliquez sur "Continue to Payment"
4. Le formulaire de paiement Stripe s'affiche directement sur la page
5. Utilisez une carte de test : `4242 4242 4242 4242`
6. Le bateau devrait être activé après le paiement

## Dépannage

### Le Payment Element ne s'affiche pas
- Vérifiez que `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` est défini
- Vérifiez la console pour les erreurs JavaScript
- Vérifiez que le `clientSecret` est bien retourné par l'API

### Le paiement ne s'active pas
- Vérifiez les logs du webhook (`/api/webhooks`)
- Vérifiez que l'événement `payment_intent.succeeded` est bien reçu
- Vérifiez que le `boat_id` est présent dans les métadonnées

### Erreur de dépendances
Si vous rencontrez des conflits de dépendances, utilisez :
```bash
npm install --legacy-peer-deps
```

