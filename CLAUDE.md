# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dragonfly is a Next.js 14 boat marketplace application for trimaran listings. Users can list boats for sale, browse listings, and manage payments through Stripe.

## Tech Stack

- **Framework**: Next.js 14.2.3 with App Router, React 18, TypeScript
- **Database**: PostgreSQL (Neon) with Prisma 6.9 ORM
- **Auth**: Better Auth with Google/GitHub OAuth and email/password
- **Payments**: Stripe (Payment Element, webhooks)
- **Storage**: Cloudflare R2 (S3-compatible) for images, Sharp for WebP conversion
- **UI**: TailwindCSS, HeroUI component library, Framer Motion
- **Email**: Nodemailer, Resend
- **Deployment**: Docker + PM2 on Hostinger VM, GitHub Actions CI/CD

## Common Commands

```bash
# Development
npm run dev              # Start dev server on port 3000 with Turbo
npm run dev-no-turbo     # Start dev on port 3002 without Turbo

# Build & Production
npm run build            # Build for production
npm run deploy           # Build + restart PM2
npm run deploy:full      # Prisma generate + build + restart PM2

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:push          # Push schema changes without migrations

# Linting & Formatting
npm run lint             # Run ESLint
npm run prettier-fix     # Format code with Prettier

# Stripe (local development)
npm run stripe:listen    # Forward webhooks to localhost:3000/api/webhooks
```

## Architecture

### Key Directories

- `app/` - Next.js App Router pages and API routes
- `app/api/` - API endpoints (auth, boats, payment, webhooks, upload, forum, user)
- `components/ui/` - Reusable UI components (AuthForms, BoatListingForm, Account)
- `utils/auth/auth.ts` - Better Auth server configuration
- `lib/auth-client.ts` - Better Auth client configuration
- `utils/prisma/` - Prisma client setup (client.ts for client-side, server.ts for server-side)
- `prisma/schema.prisma` - Database schema
- `docs/` - Project documentation (auth, Stripe, security, dev guides)
- `scripts/` - Utility scripts (deploy, DB checks, seeding, migrations)
- `config/` - Config files not pushed to GitHub (nginx, SQL dumps)
- `external/` - External/legacy code not pushed to GitHub (phpBB API)

### API Routes Pattern

All API routes use `export const dynamic = 'force-dynamic'` to prevent static generation. Session validation uses `auth.api.getSession()`.

### Data Models (Prisma)

- **user** - Users with role (user/admin/superAdmin), billing data
- **boat** - Listings with status (pending/active/inactive/deleted), expiry dates, view counts
- **payment** - Stripe payment tracking
- **customer** - Stripe customer mapping
- **boat_view** - View analytics by IP/session/user
- **product/price** - Stripe product sync

### Auth Flow

- Server auth instance: `utils/auth/auth.ts`
- Client auth: `lib/auth-client.ts`
- Session provider: `lib/session-provider.tsx`
- Better Auth models: account, session, user, verification

### Image Upload Flow

1. Client requests signed URL from `/api/upload`
2. Client uploads directly to R2 using signed URL
3. Images converted to WebP via Sharp
4. URLs stored in boat.photos array

## Environment Variables

Required variables (see `.env` for full list):
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` - Auth configuration
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` - Cloudflare R2

## Development Notes

- Port 3000: Production (PM2 + Nginx proxy)
- Port 3002: Development (alternative port to avoid nginx conflicts)
- `postinstall` script runs `prisma generate` automatically
- Use `db:push` for rapid schema iteration, `db:migrate` for production changes
