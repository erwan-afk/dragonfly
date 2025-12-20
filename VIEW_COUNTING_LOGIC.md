# Logique de Comptage des Vues des Annonces

## Vue d'ensemble

Le système de comptage des vues des annonces de bateaux suit une logique similaire à YouTube pour garantir que seules les visites "qualifiées" sont comptées.

## Critères pour compter une vue ✅

### 1. Délai minimum : 5 secondes
- L'utilisateur doit rester au moins 5 secondes sur la page de l'annonce
- Le timer commence dès que le composant `ViewTracker` est monté

### 2. Activité utilisateur détectée
Au moins une des actions suivantes doit être détectée pendant la visite :
- Scroll de la page
- Mouvement de la souris
- Clic (n'importe où sur la page)
- Touch (sur appareils tactiles)
- Appui sur une touche

### 3. Page visible
- La page doit être au premier plan (pas en arrière-plan ou dans un onglet caché)
- Si l'utilisateur change d'onglet, le timer est mis en pause
- Le timer reprend quand l'utilisateur revient sur l'onglet

### 4. Utilisateur réel
- Les vues sont enregistrées côté serveur avec protection contre les bots
- Vérification de l'adresse IP et de la session
- Prévention du spam (maximum 1 vue par utilisateur/IP par jour)

## Ce qui n'est PAS compté ❌

### Rafraîchissements rapides
- Si l'utilisateur rafraîchit la page avant 5 secondes
- Bots ou scripts automatiques

### Visites sans interaction
- Ouverture de l'onglet en arrière-plan
- Navigation rapide sans engagement

### Sessions interrompues
- Fermeture de l'onglet avant 5 secondes
- Perte de connexion réseau

## Implémentation technique

### Composant ViewTracker
- Utilise `useRef` pour éviter les re-renders inutiles
- Event listeners passifs pour la performance
- Cleanup automatique lors du démontage

### API boat-views
- Enregistre la vue dans la table `boat_views`
- Incrémente automatiquement le compteur `view_count` du bateau
- Protection contre les doublons

### Affichage des vues
- Le compteur s'affiche directement depuis la base de données
- Pas d'appel API supplémentaire pour les performances
- Mise à jour en temps réel lors des nouvelles vues

## Avantages de cette approche

1. **Qualité vs Quantité** : Privilégie les visites engagées
2. **Performance** : Compteur stocké en base, pas de calculs coûteux
3. **Anti-bot** : Détection d'activité et vérifications serveur
4. **Respect UX** : Pas de comptage intrusif pour l'utilisateur

## Métriques disponibles

- **Nombre total de vues** : Compteur simple et rapide
- **Vues détaillées** : Via l'API `/api/boat-views?boatId=...`
  - Nombre d'utilisateurs uniques
  - Répartition par jour (30 derniers jours)
  - Statistiques complètes pour les propriétaires d'annonces
