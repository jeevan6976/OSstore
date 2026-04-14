<div align="center">
  <img src="frontend/public/logo.ico" alt="OS Store" width="80" />
  <h1>OS Store</h1>
  <p><strong>Open-source apps, tools, APIs & libraries — all in one place.</strong></p>
  <p>Discover projects from F-Droid & GitHub with trust scores, security scanning, and AI-powered search.</p>

  <p>
    <a href="https://github.com/jeevan6976/OSstore/stargazers"><img src="https://img.shields.io/github/stars/jeevan6976/OSstore?style=flat-square&color=f59e0b" alt="Stars" /></a>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind-3-06b6d4?style=flat-square&logo=tailwindcss" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Vercel-deployed-black?style=flat-square&logo=vercel" alt="Vercel" />
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT" />
  </p>
</div>

---

## What is OS Store?

OS Store is a discovery platform for open-source software. No sign-up, no backend to run — just a Next.js app that talks directly to public APIs.

- Browse **F-Droid** apps (Android) and **GitHub** projects side by side
- Every project gets a **Trust Score** based on activity, community, maintenance & popularity
- **Security scanning** via OpenSSF Scorecard + GitHub Advisory Database
- **AI Search** — describe what you need in plain English, get ranked recommendations
- **Direct downloads** — APKs and release binaries, proxied through the app

---

## Features

| Feature | Details |
|---|---|
| 🔍 **Search** | Keyword search across GitHub & F-Droid with source filtering |
| ✨ **AI Search** | Natural language → ranked results with explanations (GitHub Models / GPT-4o-mini) |
| 📦 **F-Droid** | Browse & search the full F-Droid index (~4,000+ apps) |
| 🛡️ **Trust Score** | Multi-dimensional scoring: activity, community, maintenance, popularity |
| ⚠️ **Risk Flags** | Auto-detect stale repos, missing licenses, low adoption |
| 🔒 **Security Scan** | OpenSSF Scorecard checks + known CVEs from GitHub Advisory DB |
| ⬇️ **Direct Download** | Proxy endpoint forces browser save dialog for APKs & binaries |
| 📄 **README viewer** | Rendered markdown with dark theme |
| ⚡ **No backend** | Everything runs server-side in Next.js — deploy to Vercel in one click |

---

## Tech Stack

```
┌──────────────────────────────────────────────┐
│              Next.js 15 (App Router)          │
│              Deployed on Vercel               │
├──────────────┬───────────────┬───────────────┤
│  GitHub API  │  F-Droid API  │ GitHub Models │
│  (repos,     │  (index-v1    │  (GPT-4o-mini │
│   releases,  │   ~15MB JSON, │   AI search)  │
│   advisories)│   6h cache)   │               │
├──────────────┴───────────────┴───────────────┤
│        OpenSSF Scorecard API                  │
│        (supply chain security)                │
└──────────────────────────────────────────────┘
```

**No database. No backend server. No Docker required.**

---

## Quick Start

### Prerequisites

- Node.js 18+
- A [GitHub Personal Access Token](https://github.com/settings/tokens) (free — needed for GitHub API & AI search)

### 1. Clone

```bash
git clone https://github.com/jeevan6976/OSstore.git
cd OSstore/frontend
npm install
```

### 2. Configure

Create `frontend/.env.local`:

```env
GITHUB_TOKEN=ghp_your_token_here
```

That's it. The token is used for:
- GitHub REST API (higher rate limits)
- GitHub Models API (free GPT-4o-mini for AI search)

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jeevan6976/OSstore&root=frontend)

1. Import the repo in [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `GITHUB_TOKEN=your_token`
4. Deploy

---

## Project Structure

```
OSstore/
├── frontend/                  # Next.js app (the whole product)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Home — hero, categories, trending
│   │   │   ├── apps/page.tsx      # Explore — F-Droid + GitHub browser
│   │   │   ├── search/page.tsx    # Keyword search with source filter
│   │   │   ├── ai-search/page.tsx # AI-powered natural language search
│   │   │   ├── tool/[...id]/      # Tool detail — downloads, README, security
│   │   │   └── api/
│   │   │       ├── ai-search/     # AI ranking endpoint (GitHub Models)
│   │   │       └── download/      # Download proxy (forces save dialog)
│   │   ├── components/
│   │   │   ├── NavBar.tsx
│   │   │   ├── ToolCard.tsx
│   │   │   ├── AISearchBar.tsx
│   │   │   ├── TrustScoreChart.tsx
│   │   │   └── SecurityPanel.tsx
│   │   └── lib/
│   │       ├── api.ts             # Public API layer
│   │       ├── github.ts          # GitHub REST API client
│   │       ├── fdroid.ts          # F-Droid index client (6h cache)
│   │       ├── trust.ts           # Trust score computation
│   │       └── security.ts        # OpenSSF Scorecard + Advisory DB
│   └── public/
│       └── logo.ico
└── README.md
```

---

## Trust Score

Each GitHub project is scored 0–100 across four dimensions:

| Dimension | Weight | Signal |
|---|---|---|
| **Activity** | 30% | Recency of pushes & commits |
| **Community** | 25% | Forks & watchers (log scale) |
| **Maintenance** | 20% | Issue-to-star ratio, update recency |
| **Popularity** | 25% | Stars (log scale) |

> F-Droid apps skip trust scoring — they're verified by the F-Droid team instead.

---

## AI Search

Uses **GitHub Models API** (free with any GitHub token) — no separate AI API key needed:

1. AI parses natural language → optimized GitHub search query
2. Fetches top matching repos
3. AI ranks and explains why each result fits

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | ✅ | GitHub PAT — GitHub API calls & AI search |

---

## License

MIT

---

<div align="center">
  <sub>Built with Next.js · Powered by GitHub API & F-Droid · AI by GitHub Models</sub>
</div>
