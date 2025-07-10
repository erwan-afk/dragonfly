# Configuration Google OAuth pour Better Auth

## Variables d'environnement déjà configurées ✅

```
GOOGLE_CLIENT_ID='38090347783-pmaq8q3610r1ed5h5bk3pfaj8p9r6ido.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET='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'
```

## Configuration Google Cloud Console

### 1. Origines JavaScript autorisées

Ajoutez ces URLs dans votre projet Google Cloud Console :

- **Développement** : `http://localhost:3000`
- **Production** : `https://votredomaine.com`

### 2. URI de redirection autorisés

Ajoutez ces URLs de callback :

- **Développement** : `http://localhost:3000/api/auth/callback/google`
- **Production** : `https://votredomaine.com/api/auth/callback/google`

## Fonctionnalités activées ✅

1. **Sign In avec Google** : Disponible sur `/signin/email_signin` et `/signin/password_signin`
2. **Sign Up avec Google** : Disponible sur `/signin/signup`
3. **Création automatique d'utilisateur** : Better Auth crée automatiquement les nouveaux utilisateurs OAuth
4. **Navbar réactive** : Se met à jour automatiquement après connexion/déconnexion

## Test

1. Démarrez le serveur : `npm run dev-no-turbo`
2. Allez sur `http://localhost:3000/signin/signup`
3. Cliquez sur "Sign up with Google"
4. Allez sur `http://localhost:3000/signin/email_signin`
5. Cliquez sur "Continue with Google"

Les deux devraient fonctionner et rediriger vers `/account` après authentification.
