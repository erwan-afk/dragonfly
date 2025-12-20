# Système d'Authentification Unifié

## Vue d'ensemble
Le système d'authentification utilise maintenant une approche unifiée avec une interface principale `/signin/auth` qui permet de basculer entre login et signup sans rechargement de page.

## Architecture

### Pages
- **`/signin`** → Redirige vers `/signin/auth`
- **`/signin/auth`** → Interface unifiée avec sélecteur login/signup
- **`/signin/forgot_password`** → Formulaire de récupération de mot de passe
- **`/signin/update_password`** → Mise à jour du mot de passe
- **`/signin/email_signin`** → Connexion par email uniquement

### Composants

#### AuthTabs (`components/ui/AuthForms/AuthTabs.tsx`)
- **Sélecteur visuel** : Boutons toggle élégants entre "Sign In" et "Sign Up"
- **Contenu dynamique** : Header, formulaire et liens adaptés selon le mode
- **OAuth intégré** : Boutons sociaux avec séparateur élégant
- **Transitions fluides** : Animations CSS pour une UX moderne

## Fonctionnalités

### Sélecteur visuel
```
┌─────────┬─────────┐
│ Sign In │ Sign Up │
└─────────┴─────────┘
```

### États dynamiques

#### Mode Login
```
Nice to see you!
Sign in to your account

[OAuth Buttons]
───── Or log in with your Email ─────
[Email + Password fields]
[Sign in button]
Forgot your password? | New to Dragonfly? Create account
```

#### Mode Signup
```
Welcome!
Create your Dragonfly account

[OAuth Buttons]
───── Or continue with Email ─────
[Email + Password + Confirm Password fields]
[Sign up button]
Already have an account? Sign in
```

## Migration

### Anciennes URLs
- `/signin/password_signin` → Redirige vers `/signin/auth`
- `/signin/signup` → Redirige vers `/signin/auth`

### Compatibilité
- Les autres vues (`forgot_password`, `update_password`, `email_signin`) conservent leur fonctionnement
- Redirections automatiques pour éviter les liens brisés

## Avantages
- ✅ **UX unifiée** : Interface cohérente pour toutes les actions d'auth
- ✅ **Navigation fluide** : Basculement instantané sans rechargement
- ✅ **Performance** : Une seule page chargée pour les actions principales
- ✅ **Maintenance** : Code centralisé et plus simple
- ✅ **Responsive** : Design adaptatif maintenu

## Utilisation
```tsx
// Page principale
<AuthTabs defaultMode="login" />

// Avec mode spécifique
<AuthTabs defaultMode="signup" />
```

Le système offre maintenant une expérience d'authentification moderne et cohérente !
