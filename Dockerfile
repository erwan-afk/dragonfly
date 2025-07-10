# Utilisation d'une image Node.js basée sur Alpine pour la légèreté
FROM node:20-alpine AS base

# Installer les dépendances requises pour certains packages npm
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Installer les dépendances uniquement quand nécessaire
FROM base AS deps
# Copier les fichiers de package
COPY package.json package-lock.json* ./
# Installer les dépendances
RUN npm ci --only=production --legacy-peer-deps

# Étape de build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Installer toutes les dépendances (dev incluses) pour le build
RUN npm ci --legacy-peer-deps

# Générer les clients Prisma
RUN npx prisma generate

# Construire l'application Next.js
RUN npm run build

# Image de production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Désactiver la télémétrie Next.js lors du runtime
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers publics
COPY --from=builder /app/public ./public

# Créer le dossier .next avec les bonnes permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copier les fichiers de build Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copier les fichiers Prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 