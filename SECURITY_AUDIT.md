# Audit de Sécurité - Dragonfly
**Date**: 2026-03-08

## CRITIQUE (action immédiate)

### 1. Montant du paiement contrôlé par le client
**`app/api/create-payment-intent/route.ts`**
Le montant vient directement du client sans vérification serveur. Un attaquant peut modifier le montant via DevTools et payer 0.01€ au lieu du vrai prix.
> **Fix** : Récupérer le prix réel depuis Stripe avec `stripe.prices.retrieve(priceId)` et ignorer le montant client.

### 2. Pas de vérification d'ownership sur update-payment-intent
**`app/api/update-payment-intent/route.ts`**
N'importe quel utilisateur authentifié peut mettre à jour les metadata de n'importe quel PaymentIntent. Un attaquant pourrait rediriger un paiement vers un autre bateau.
> **Fix** : Vérifier que le PaymentIntent appartient bien à l'utilisateur connecté.

### 3. Secret auth en fallback hardcodé
**`utils/auth/auth.ts` ligne 65**
```ts
secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-development'
```
Si la variable d'env est absente, toutes les sessions utilisent un secret connu.
> **Fix** : Supprimer le fallback, crasher au démarrage si le secret manque.

### 4. Middleware désactivé
**`middleware.ts`**
Le middleware est un pass-through (`return NextResponse.next()`). Aucune protection de route côté serveur.
> **Fix** : Réactiver la protection des routes authentifiées.

---

## HAUT (cette semaine)

### 5. Replay attack sur confirm-boat-payment
**`app/api/confirm-boat-payment/route.ts`**
Un même PaymentIntent pourrait activer plusieurs bateaux différents. Le endpoint ne vérifie pas que `paymentIntent.metadata.boat_id === boatId`.
> **Fix** : Ajouter `if (paymentIntent.metadata?.boat_id !== boatId) return 400`.

### 6. Renouvellement sans vérification de paiement
**`app/api/boats/renew/route.ts`**
Prolonge l'annonce de 3 mois sans vérifier qu'un paiement a été effectué. Un utilisateur pourrait appeler cet endpoint directement.
> **Fix** : Vérifier qu'un paiement `completed` existe avant de renouveler.

### 7. Upgrade sans vérification de paiement
**`app/api/boats/upgrade/route.ts`**
Change le plan du bateau sans vérifier le paiement. On peut passer en "Podium" gratuitement.
> **Fix** : Même protection que pour le renouvellement.

### 8. Vérification email désactivée
**`utils/auth/auth.ts` ligne 54**
`requireEmailVerification: false` - permet l'inscription avec des emails faux.
> **Fix** : Activer `requireEmailVerification: true` en production.

---

## MOYEN (ce mois)

### 9. Pas de rate limiting sur les endpoints critiques
Seul le formulaire de contact a du rate limiting. Manquant sur :
- `/api/create-payment-intent` (pourrait DOS Stripe)
- `/api/auth/*` (brute force possible)
- `/api/boats` POST (spam d'annonces)

### 10. CSRF incomplet
Le token CSRF est en mémoire (perdu au redémarrage, pas partagé entre instances). Appliqué uniquement au formulaire de contact, pas aux autres mutations.

### 11. Headers de sécurité manquants
Aucun header de sécurité configuré dans `next.config.js` :
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`

### 12. Upload sans vérification d'ownership
**`app/api/upload/boat-images/route.ts`**
Ne vérifie pas que l'utilisateur est propriétaire du bateau auquel il ajoute des images.

### 13. Captcha en fail-open
**`app/api/auth/validate-captcha/route.ts`**
Si `RECAPTCHA_SECRET_KEY` n'est pas configuré, retourne `true` au lieu de `false`.

---

## BAS (bon à faire)

- Pas de pagination sur `/api/user/boats` et `/api/boats/my-active`
- Logging excessif de données sensibles en production
- Pas de CORS explicite configuré
- Pas d'audit log pour les opérations critiques
