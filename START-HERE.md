# 🚀 DÉMARRAGE RAPIDE

## ✅ État Actuel

- ✅ **Production EN LIGNE** sur http://localhost:3000
- ✅ Base de données PostgreSQL fonctionnelle
- ✅ 3 environnements de développement configurés

---

## 🎯 Pour Développer MAINTENANT

### Option 1: Dev Local (RECOMMANDÉ)

```bash
./dev-local.sh
```

**Ce qui se passe:**
- Production reste en ligne sur :3000
- Dev démarre sur :3001
- Hot-reload activé
- Partage la DB de prod

### Option 2: Modification rapide puis redéploiement

```bash
# 1. Modifier vos fichiers
nano app/page.tsx

# 2. Redéployer en prod
./prod.sh
```

---

## 📖 Documentation Complète

- **Guide rapide**: [README-DEV.md](./README-DEV.md)
- **Guide détaillé**: [DEVELOPPEMENT.md](./DEVELOPPEMENT.md)

---

## 🔧 Commandes Essentielles

```bash
# Voir les logs de production
docker-compose logs -f app

# Redémarrer la production
docker-compose restart app

# Vérifier les conteneurs
docker ps

# Arrêter tout
docker-compose down
```

---

## 🆘 SOS - Le site ne répond plus

```bash
docker-compose down && docker-compose up -d
```

---

## 💡 Conseil pour VM KM2

**Utilisez `./dev-local.sh`** pour développer au quotidien:
- Plus rapide
- Moins de ressources
- Production reste accessible
- Hot-reload instantané

---

**Prêt à commencer?** → `./dev-local.sh`

