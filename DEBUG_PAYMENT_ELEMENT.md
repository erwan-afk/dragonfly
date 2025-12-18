# Guide de Debug - Payment Element

## Problème : Le Payment Element ne s'affiche pas

### Étapes de diagnostic

1. **Ouvrez la console du navigateur** (F12 ou Ctrl+Shift+I)
   - Vérifiez s'il y a des erreurs JavaScript
   - Recherchez les logs de debug que nous avons ajoutés

2. **Remplissez le formulaire et cliquez sur "Continue to Payment"**
   - Vous devriez voir ces logs dans la console :
     ```
     📤 Uploading X images to temporary storage...
     ✅ X image(s) uploaded to temporary storage
     🚤 Creating boat with pending status...
     ✅ Boat created with ID: xxx
     💳 Creating payment intent...
     ✅ Payment intent created successfully
     📋 Client Secret: pi_xxx_secret_xxx
     🎨 Show payment set to true
     ```

3. **Si vous voyez une bordure verte avec "Payment section is visible!"**
   - Le state `showPayment` est bien activé ✅
   - Vérifiez si vous voyez "Client Secret: Present" et "Stripe Promise: Present"
   - Si l'un des deux est "Missing", c'est le problème

### Problèmes courants et solutions

#### 1. Client Secret = Missing

**Cause** : L'API `/api/create-payment-intent` ne retourne pas le clientSecret

**Solution** :
```bash
# Vérifiez les logs du serveur
# Vous devriez voir : "💳 Creating payment intent..."
# Suivi de : "✅ Payment intent created successfully"

# Si vous voyez une erreur, vérifiez :
# 1. Que STRIPE_SECRET_KEY est défini dans .env.local
# 2. Que l'utilisateur est bien authentifié
```

**Test de l'API** :
Vous pouvez tester l'API directement avec curl :
```bash
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "amount": 2900,
    "currency": "eur",
    "priceId": "price_xxx",
    "metadata": {
      "boat_id": "test",
      "listing_type": "boat",
      "user_id": "test"
    }
  }'
```

#### 2. Stripe Promise = Missing

**Cause** : La clé publique Stripe n'est pas définie ou invalide

**Solution** :
Vérifiez votre fichier `.env.local` :
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
# OU
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_xxxxx
```

**Important** : Les variables commençant par `NEXT_PUBLIC_` doivent être définies AVANT le démarrage du serveur.

**Après avoir modifié .env.local** :
```bash
# Arrêtez le serveur (Ctrl+C)
# Relancez-le
npm run dev
```

#### 3. Le formulaire se soumet mais rien ne se passe

**Cause possible** : Erreur dans l'upload des images ou la création du bateau

**Solution** :
1. Ouvrez l'onglet "Network" dans les DevTools
2. Remplissez et soumettez le formulaire
3. Vérifiez les requêtes suivantes :
   - `POST /api/upload` (si vous avez des images) - devrait retourner 200
   - `POST /api/boats` - devrait retourner 200 avec `{"success":true,"boatId":"xxx"}`
   - `POST /api/create-payment-intent` - devrait retourner 200 avec `{"clientSecret":"pi_xxx","paymentIntentId":"pi_xxx"}`

#### 4. Erreur "Cannot find module @stripe/react-stripe-js"

**Solution** :
```bash
npm install @stripe/stripe-js@^8.0.0 @stripe/react-stripe-js --legacy-peer-deps
```

### Checklist rapide

- [ ] Serveur Next.js lancé avec `npm run dev`
- [ ] Fichier `.env.local` existe avec `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Fichier `.env.local` existe avec `STRIPE_SECRET_KEY`
- [ ] Console du navigateur ouverte (F12)
- [ ] Aucune erreur rouge dans la console
- [ ] Les logs de debug apparaissent quand vous soumettez le formulaire
- [ ] Vous êtes connecté (user authentifié)

### Commandes utiles

```bash
# Vérifier que les variables d'environnement sont chargées
node -e "console.log(process.env.STRIPE_SECRET_KEY ? 'STRIPE_SECRET_KEY: OK' : 'STRIPE_SECRET_KEY: MISSING')"

# Relancer le serveur
npm run dev

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Vérifier les packages Stripe installés
npm list @stripe/stripe-js @stripe/react-stripe-js
```

### Exemple de .env.local complet

```env
# Base de données
DATABASE_URL="postgresql://postgres:password@localhost:5432/dragonfly"

# Better Auth
BETTER_AUTH_SECRET="votre-secret-key-32-caracteres-minimum"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Stripe (REQUIS pour Payment Element)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51xxxxx"
STRIPE_SECRET_KEY="sk_test_51xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"

# Cloudflare R2 (pour les images)
R2_ACCESS_KEY_ID="xxxxx"
R2_SECRET_ACCESS_KEY="xxxxx"
R2_ENDPOINT="https://xxxxx.r2.cloudflarestorage.com"
R2_BUCKET_NAME="dragonfly-images"
R2_PUBLIC_URL="https://dragonfly-trimarans.org"
```

### Si rien ne fonctionne

1. **Supprimez le cache Next.js** :
```bash
rm -rf .next
npm run dev
```

2. **Vérifiez la version de Node.js** :
```bash
node -v  # Devrait être >= 18
```

3. **Contactez-moi avec** :
   - Les logs de la console navigateur (capture d'écran)
   - Les logs du serveur (terminal)
   - Votre fichier .env.local (SANS les clés secrètes bien sûr !)

