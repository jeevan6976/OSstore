# OS Store — Universal Open-Source Discovery + Trust Platform

A platform that aggregates open-source tools, apps, APIs, and libraries from GitHub (and more), helps users discover them with full-text search, and provides **Trust Scores** and **Risk Indicators** to make informed decisions.

![Stack](https://img.shields.io/badge/FastAPI-Python-green) ![Stack](https://img.shields.io/badge/Next.js-TypeScript-blue) ![Stack](https://img.shields.io/badge/PostgreSQL-Database-blue) ![Stack](https://img.shields.io/badge/Meilisearch-Search-purple) ![Stack](https://img.shields.io/badge/Docker-Deploy-blue)

---

## Architecture

```
┌─────────────────┐     ┌──────────────┐
│   Next.js App   │────▶│  FastAPI API  │
│   (Vercel)      │     │  (Docker/VPS) │
└─────────────────┘     └──────┬───────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌──────────┐ ┌───────┐ ┌───────────┐
              │PostgreSQL│ │ Redis │ │Meilisearch│
              └──────────┘ └───────┘ └───────────┘
                    ▲
                    │
              ┌─────┴─────┐
              │   Worker   │──▶ GitHub API
              │  (Docker)  │
              └────────────┘
```

---

## Features

- 🔍 **Full-text search** powered by Meilisearch
- 🛡️ **Trust Scores** — multi-dimensional scoring (activity, community, maintenance, popularity)
- ⚠️ **Risk Flags** — auto-detection of stale repos, missing licenses, low adoption
- 📊 **Rich detail pages** — stats, topics, score breakdowns
- 🐳 **One-command Docker deployment** for the backend stack
- ⚡ **Vercel-ready** Next.js frontend

---

## Project Structure

```
OSstore/
├── backend/            # FastAPI application
│   ├── app/
│   │   ├── main.py     # App entry point
│   │   ├── routes.py   # API endpoints
│   │   ├── models.py   # SQLAlchemy models
│   │   ├── schemas.py  # Pydantic schemas
│   │   ├── search.py   # Meilisearch integration
│   │   ├── config.py   # Settings
│   │   └── database.py # DB connection
│   ├── Dockerfile
│   └── requirements.txt
├── worker/             # Background data fetcher
│   ├── worker/
│   │   ├── main.py           # Worker loop
│   │   ├── github_fetcher.py # GitHub API client
│   │   ├── trust.py          # Trust score computation
│   │   ├── db.py             # Sync DB models
│   │   └── config.py         # Settings
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/           # Next.js application
│   ├── src/
│   │   ├── app/        # App Router pages
│   │   ├── components/ # UI components
│   │   └── lib/        # API client
│   ├── package.json
│   └── next.config.js
├── docker-compose.yml  # Full stack orchestration
├── .env.example        # Environment template
└── README.md
```

---

## Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- A GitHub Personal Access Token (optional, for higher API rate limits)

### 1. Clone & Configure

```bash
git clone <your-repo-url> OSstore
cd OSstore
cp .env.example .env
```

Edit `.env` and set your `GITHUB_TOKEN` (optional but recommended):

```
GITHUB_TOKEN=ghp_your_token_here
```

### 2. Start Backend Services

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **Meilisearch** on port `7700`
- **FastAPI backend** on port `8000`
- **Worker** (fetches repos and indexes them)

Check the backend is running:
```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### 3. Deploy Frontend (Vercel)

The frontend is designed to be deployed on **Vercel**:

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Set **Framework Preset** to `Next.js`
5. Add environment variable: `NEXT_PUBLIC_API_URL=http://localhost:8000` (or your VPS URL)
6. Deploy

**For local dev** (optional, requires Node.js 18+):
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The worker will start fetching GitHub repos immediately. Give it 1-2 minutes, then search!

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/search?q=react&page=1&per_page=20` | Search tools |
| `GET` | `/api/tool/{id}` | Get tool details |

---

## Trust Score Algorithm

Each tool is scored on 4 dimensions (0–100 each):

| Dimension | Weight | Based On |
|-----------|--------|----------|
| **Activity** | 30% | Recency of pushes/commits |
| **Community** | 25% | Forks, watchers (log scale) |
| **Maintenance** | 20% | Issue-to-star ratio, update recency |
| **Popularity** | 25% | Stars (log scale) |

**Overall = weighted average** of all four.

---

## Risk Flags

Automatically detected:
- 🔴 **No License** — usage rights unclear
- 🟡 **Stale** — no activity in 1+ years
- 🟡 **Low Adoption** — very few stars/forks
- 🟡 **High Issue Ratio** — open issues > 50% of stars

---

## Deploy to Production

### Backend (VPS)

1. SSH into your VPS
2. Clone the repo
3. Configure `.env` with production values:
   ```
   POSTGRES_PASSWORD=<strong-password>
   MEILI_MASTER_KEY=<random-key>
   GITHUB_TOKEN=<your-token>
   BACKEND_CORS_ORIGINS=https://your-app.vercel.app
   ```
4. Start:
   ```bash
   docker-compose up -d
   ```
5. (Optional) Set up a reverse proxy (nginx/caddy) with SSL for your API domain

### Frontend (Vercel)

1. Push the `frontend/` directory to a GitHub repo (or use the monorepo root)
2. In Vercel:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
   - **Environment Variable**: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
3. Deploy

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL user | `osstore` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `osstore_secret_2026` |
| `POSTGRES_DB` | Database name | `osstore` |
| `DATABASE_URL` | Full connection string | (auto) |
| `REDIS_URL` | Redis connection | `redis://redis:6379/0` |
| `MEILI_URL` | Meilisearch URL | `http://meilisearch:7700` |
| `MEILI_MASTER_KEY` | Meilisearch auth key | (set in .env) |
| `GITHUB_TOKEN` | GitHub PAT for API | (optional) |
| `BACKEND_CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | API base URL for frontend | `http://localhost:8000` |

---

## License

MIT
