# 🚀 Guide Rapide de Développement

## ⚡ 3 Modes Disponibles

### 1. **DEV LOCAL (RECOMMANDÉ pour VM KM2)** 🏆

Le plus simple et le plus rapide. Parfait pour développer quotidiennement.

```bash
./dev-local.sh
```

**Avantages:**
- ✅ **Ultra rapide** - Pas de Docker
- ✅ **Hot-reload instantané**
- ✅ **Production reste en ligne** (port 3000)
- ✅ **Dev sur port 3001**
- ✅ **Utilise la base de données de prod**

**Utilisation:**
```bash
# Démarrer
./dev-local.sh

# Accéder: http://localhost:3001
# Arrêter: Ctrl+C
```

---

### 2. **PRODUCTION**

Pour déployer en production avec optimisations.

```bash
./prod.sh
```

**Quand l'utiliser:**
- Déploiement final
- Tests de performance
- Build optimisé

---

### 3. **DEV DOCKER** (Avancé)

Environnement de dev isolé avec Docker.

```bash
./dev.sh
```

**⚠️ ATTENTION:** Arrête la production pendant le développement!

**Après le premier démarrage:**
```bash
# Initialiser la base de données dev
./init-dev-db.sh
```

---

## 🎯 Workflow Recommandé

### Pour le développement quotidien:

```bash
# 1. Garder la prod en ligne sur :3000
# 2. Développer en local sur :3001
./dev-local.sh

# 3. Modifier vos fichiers
# Les changements sont automatiques!

# 4. Quand c'est prêt, redéployer en prod
./prod.sh
```

### Pour des modifications rapides:

```bash
# 1. Modifier vos fichiers directement
nano app/page.tsx

# 2. Tester en local
./dev-local.sh

# 3. Si OK, redéployer
./prod.sh
```

---

## 📊 Comparaison Rapide

| Mode | Vitesse | Hot-reload | Prod reste UP | Base de données |
|------|---------|------------|---------------|-----------------|
| **dev-local.sh** | ⚡⚡⚡ | ✅ | ✅ | Prod (partagée) |
| **prod.sh** | 🐢 | ❌ | ✅ (après build) | Prod |
| **dev.sh** | ⚡⚡ | ✅ | ❌ | Dev (isolée) |

---

## 🔧 Commandes Utiles

```bash
# Voir les logs de prod
docker-compose logs -f app

# Redémarrer la prod
docker-compose restart app

# Voir tous les conteneurs
docker ps

# Nettoyer Docker (si manque d'espace)
docker system prune -a
```

---

## 🐛 Problèmes Courants

### Le site ne répond plus
```bash
docker-compose down && docker-compose up -d
```

### Port 3001 déjà utilisé
```bash
# Trouver le processus
lsof -i :3001

# Ou changer le port
PORT=3002 npm run dev
```

### Base de données inaccessible
```bash
# Vérifier PostgreSQL
docker ps | grep postgres

# Voir les logs
docker logs dragonfly_postgres
```

---

## 💡 Conseils pour VM KM2

1. **Utilisez `dev-local.sh`** pour le développement quotidien
2. **Ne lancez pas `dev.sh`** si la prod doit rester en ligne
3. **Nettoyez régulièrement** : `docker system prune -a`
4. **Surveillez les ressources** : `docker stats`

---

## 📝 Workflow Complet Exemple

```bash
# Matin - Démarrer le dev
./dev-local.sh
# Dev accessible sur http://localhost:3001
# Prod reste sur http://localhost:3000

# Développer toute la journée
# Modifier app/page.tsx, components/*, etc.
# Les changements sont visibles immédiatement sur :3001

# Fin de journée - Déployer en prod
Ctrl+C  # Arrêter le dev local
./prod.sh  # Rebuilder et déployer
# Prod mise à jour sur http://localhost:3000
```

---

Pour plus de détails, voir [DEVELOPPEMENT.md](./DEVELOPPEMENT.md)

