# TokenFaucet

<div align="center">

**AI Text-to-Speech SaaS Platform**

Powered by [MiniMax](https://www.minimaxi.com/) & [MiMo](https://xiaoai.mi.com/) TTS Engines

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MiniMax](https://img.shields.io/badge/MiniMax-TTS-orange)](https://www.minimaxi.com/)
[![MiMo](https://img.shields.io/badge/MiMo-TTS-red)](https://xiaoai.mi.com/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

[Live Demo](https://tokenfaucet.fun) · [Documentation](https://tokenfaucet.fun/docs) · [Report Bug](issues) · [Request Feature](issues)

</div>

## About

TokenFaucet is a production-ready AI Text-to-Speech SaaS platform powered by **MiniMax** and **Xiaomi MiMo** TTS engines. It delivers high-quality voice synthesis with voice cloning, emotion control, and multilingual support.

> **Built by a solo developer with zero coding background using AI.** This project demonstrates how AI tools can empower anyone to build and ship production-grade SaaS products.

### Key Features

- **Multi-Engine TTS** — MiniMax & MiMo voices, emotion tags, speed control, 40+ languages
- **Voice Cloning** — Upload audio sample to clone any voice
- **Voice Design** — Custom voice via text description
- **Membership System** — Free / Lite / Pro plans with daily + monthly points
- **Payment** — Creem checkout with prorated upgrades
- **Admin Panel** — User management, analytics, plan configuration
- **i18n** — Chinese and English

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Better Auth |
| API | tRPC |
| Payment | Creem (MoR) |
| Styling | Tailwind CSS + Radix UI |
| i18n | next-intl (zh/en) |
| **TTS Engines** | **MiniMax API + Xiaomi MiMo API** |
| Deployment | VPS + PM2 |

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database
- Creem account (for payments)
- MiniMax or MiMo API key (for TTS)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zhsj0089944/tokenfaucet.git
   cd tokenfaucet
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and fill in your values. See [Environment Variables](#environment-variables) for details.

4. **Set up the database**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   
   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── [locale]/              # i18n routes
│   │   ├── (front)/           # Public pages (pricing, dashboard, etc.)
│   │   ├── admin/             # Admin panel
│   │   └── auth/              # Login/register
│   ├── api/                   # API routes
│   │   ├── payments/creem/    # Creem webhook
│   │   └── trpc/              # tRPC endpoint
│   └── checkout/              # Creem checkout route handler
├── components/
│   ├── front/payment/         # PricingPlans, CreemCheckoutButton
│   └── ui/                    # shadcn/ui components
├── drizzle/
│   ├── schemas/               # DB schemas (users, payments, tts, etc.)
│   └── migrations/            # SQL migrations
├── lib/
│   ├── creem.ts               # Creem SDK wrapper
│   └── db.ts                  # Database connection
├── server/
│   ├── routers/               # tRPC routers (payments, tts, admin, etc.)
│   └── services/              # Business logic (membership, payment, usage)
├── translate/messages/         # i18n JSON (en.json, zh.json)
└── env.ts                     # Environment variable validation
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 characters) |
| `NEXT_PUBLIC_SITE_URL` | Your site URL |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `CREEM_API_KEY` | Creem payment API key |
| `CREEM_WEBHOOK_SECRET` | Creem webhook secret |
| `UPSTASH_REDIS_REST_URL` | Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Redis token |
| `RESEND_API_KEY` | Email service API key |

See `.env.example` for the complete list with descriptions.

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Start production server

# Code Quality
pnpm type-check       # TypeScript check
pnpm lint             # Lint with Biome
pnpm format           # Format with Biome

# Database
pnpm db:push          # Push schema to database
pnpm db:generate      # Generate migration
pnpm db:studio        # Open Drizzle Studio

# Testing
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage

# Documentation
pnpm docs:dev         # Start docs dev server
pnpm docs:build       # Build docs
```

### Code Quality

This project uses:
- **Biome** for linting and formatting
- **TypeScript** for type safety
- **Vitest** for testing
- **Husky** for git hooks

Run the quality check:
```bash
pnpm quality:check
```

## Payment Architecture

### Creem Integration

- **Checkout**: Official `@creem_io/nextjs` adapter → `/checkout` route handler → Creem hosted checkout
- **Webhook**: `/api/payments/creem/webhook` handles subscription lifecycle events
- **Upgrade**: `creem.subscriptions.upgrade` API with `proration-charge-immediately`

### Button States (Pricing Page)

| State | Button | Action |
|-------|--------|--------|
| Free plan | "Free to use" | Disabled |
| Current plan (active) | "Current plan (X days left)" | Disabled |
| Upgrade (active sub) | "Upgrade to Pro · $16.89/mo" | Creem upgrade API (prorated) |
| Renew (expired) | "Renew · $4.99/mo" | New checkout |
| New subscription | "Subscribe · $4.99/mo" | New checkout |

### Webhook Events

| Event | Handler |
|-------|---------|
| `checkout.completed` | Create payment record + activate membership |
| `subscription.active` | Sync only (log) |
| `subscription.paid` | Renewal — re-activate membership |
| `subscription.canceled` | Set `autoRenew = false` (keep access until period end) |
| `subscription.scheduled_cancel` | Set `autoRenew = false` |
| `subscription.past_due` | Mark as past due |
| `subscription.expired` | Cancel membership |
| `refund.created` | Update payment record + cancel membership |

## Deployment

### VPS Deployment

1. **Build the project**
   ```bash
   pnpm build
   ```

2. **Upload to server**
   ```bash
   rsync -avz --delete --exclude='cache' -e "ssh -i ~/.ssh/your_key" .next/ root@your-server-ip:/var/www/ai-saas/.next/
   ```

3. **Restart the service**
   ```bash
   ssh -i ~/.ssh/your_key root@your-server-ip "pm2 restart ai-saas"
   ```

### Docker Deployment

```bash
# Build Docker image
docker build -t tokenfaucet .

# Run container
docker run -p 3000:3000 --env-file .env.local tokenfaucet
```

### Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zhsj0089944/tokenfaucet)

## Database

### Schema Management

```bash
# Push schema changes
pnpm db:push

# Generate migration
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### Backup

The project includes a database backup script:

```bash
# Run backup
npx tsx scripts/backup-db.ts
```

Set up automated backups via cron job or Vercel Cron.

## Documentation

Comprehensive documentation is available in the `src/content/docs/ directory:

- [Quick Start](src/content/docs/quickstart.mdx)
- [Architecture](src/content/docs/architecture.mdx)
- [Deployment Guides](src/content/docs/deployment/)
- [Development Guides](src/content/docs/development/)
- [Feature Documentation](src/content/docs/features/)

Visit [tokenfaucet.fun/docs](https://tokenfaucet.fun/docs) for the online documentation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [MiniMax](https://www.minimaxi.com/) — High-quality TTS engine with voice cloning
- [Xiaomi MiMo](https://xiaoai.mi.com/) — Multilingual TTS engine
- [Next.js](https://nextjs.org/) — The React Framework
- [Tailwind CSS](https://tailwindcss.com/) — A utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) — Unstyled, accessible components
- [Drizzle ORM](https://orm.drizzle.team/) — TypeScript ORM
- [tRPC](https://trpc.io/) — End-to-end typesafe APIs
- [Better Auth](https://better-auth.com/) — Authentication library
- [Creem](https://creem.io/) — Payment processing

## Contact

- Website: [tokenfaucet.fun](https://tokenfaucet.fun)
- X (Twitter): [@FaucetCgei](https://x.com/FaucetCgei)
- Email: [support@tokenfaucet.fun](mailto:support@tokenfaucet.fun)

---

<div align="center">

**Built with AI by a solo developer with zero coding background**

If this project helps you, please give it a ⭐

</div>
