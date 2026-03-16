# AccountIQ — B2B Account Intelligence Platform

AccountIQ turns anonymous website visitors into identified, enriched account profiles. It combines real-time visitor tracking, multi-source company enrichment, and AI-powered sales intelligence into a single platform built for B2B revenue teams.

---

## Features

- **Visitor Identification** — Resolve anonymous visitor IPs to company names using ip-api.com
- **AI Enrichment** — LLM-generated summaries, recommended actions, and company profiles via OpenRouter (Llama 3.3 70B)
- **Tech Stack Detection** — Scrapes BuiltWith.com + JavaScript-based detection for installed technologies
- **Leadership Discovery** — Scrapes `/about`, `/team`, `/leadership` pages + Wikipedia to find executives
- **Intent Scoring** — Deterministic formula (0–10) based on pages visited, dwell time, visit frequency, and referral source
- **Persona Inference** — Classifies visitors as Developer, IT/Ops, Exec/Finance, or General based on page visit patterns
- **Business Signals** — SerpAPI news search for recent company events (funding, hiring, product launches)
- **Embeddable Tracker** — One-line JS snippet, works on any website including WordPress
- **Batch Enrichment** — Enrich multiple companies at once from the dashboard
- **API Key Management** — Generate and manage API keys for the tracking script

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | OpenRouter → Llama 3.3 70B Instruct (free tier) |
| Web Scraping | Cheerio, native fetch |
| Styling | Tailwind CSS |
| Icons | Lucide React |

---

## APIs Used

| API | Purpose | Cost |
|-----|---------|------|
| [ip-api.com](https://ip-api.com) | IP → Company resolution | Free (45 req/min) |
| [OpenRouter](https://openrouter.ai) | AI enrichment via Llama 3.3 70B | Free tier available |
| [BuiltWith.com](https://builtwith.com) | Tech stack detection (scraped) | Free (scraping) |
| [Wikipedia API](https://en.wikipedia.org/api/) | Company info + leadership | Free |
| [Clearbit Logo API](https://clearbit.com/logo) | Company logos | Free (no auth) |
| [SerpAPI](https://serpapi.com) | News / business signals | Paid ($50+/mo) |

> **Note:** SerpAPI is the only paid API. The platform degrades gracefully without it — business signals will be empty but all other enrichment continues to work.

---

## Environment Variables

Create a `.env.local` file with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter (AI enrichment)
OPENROUTER_API_KEY=sk-or-v1-...

# SerpAPI (business signals / news) — optional but recommended
SERPAPI_KEY=your-64-char-serpapi-key
```

---

## Database Setup

Run the schema in your Supabase SQL editor (`supabase/schema.sql`):

```sql
-- Creates tables: accounts, enrichments, visitors, api_keys
-- Creates RLS policies for all tables
-- Creates validate_api_key() SECURITY DEFINER function
```

Key tables:
- **`accounts`** — Enriched company profiles
- **`enrichments`** — Full AI enrichment results per account
- **`visitors`** — Raw visitor event log
- **`api_keys`** — User-owned API keys for the tracking script

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Embedding the Tracking Script

After setting up your account, go to **Setup** (`/setup`) to get your embed snippet:

```html
<script
  src="https://your-domain.com/tracker.js"
  data-api-key="aiq_your_api_key_here"
  async
></script>
```

The tracker:
- Identifies the visitor's company by IP
- Tracks pages visited, dwell time, and referral source
- Fires enrichment automatically on first visit
- Works on any website (vanilla HTML, WordPress, Webflow, etc.)
- Uses `navigator.sendBeacon` — non-blocking, won't slow your site

### WordPress Installation
Add the snippet to **Appearance → Theme Editor → header.php** just before `</head>`.

### Google Tag Manager
Create a **Custom HTML** tag with the snippet, trigger: **All Pages**.

---

## API Reference

### `POST /api/enrich`
Enrich a company by name or domain.

**Auth:** Bearer token (Supabase JWT) or `x-internal-user-id` header for internal calls.

**Request body:**
```json
{
  "companyName": "Stripe",
  "domain": "stripe.com",
  "visitorData": { "pagesVisited": ["/pricing"], "dwellTime": 180 }
}
```

**Response:** Full enrichment object with AI summary, intent score, persona, tech stack, leadership, and recommended actions.

---

### `POST /api/track`
Receive visitor events from the embeddable tracker. Public endpoint.

**Auth:** API key via request body `apiKey` field.

**Request body:**
```json
{
  "apiKey": "aiq_...",
  "url": "https://yoursite.com/pricing",
  "referrer": "https://google.com",
  "ip": "auto-detected",
  "sessionDuration": 120,
  "visitCount": 3
}
```

**Response:** `{ "ok": true }` — always returns 200 immediately. Enrichment fires async.

---

### `GET /api/keys`
List the authenticated user's API keys.

### `POST /api/keys`
Create a new API key. Returns `{ id, key, created_at }`.

### `DELETE /api/keys`
Delete an API key. Body: `{ "id": "key-uuid" }`.

---

## Project Structure

```
app/
  accounts/[id]/    # Account detail page
  api/
    enrich/         # Main enrichment pipeline
    track/          # Public visitor tracking endpoint
    keys/           # API key management
  enrich/           # Manual enrichment UI (single + batch)
  setup/            # Integration setup + API key management
  dashboard/        # Accounts list / CRM view
components/
  AccountCard.tsx   # Account summary card with intent signals
  Navigation.tsx    # App navigation
lib/
  enrichment/
    ai.ts           # AI orchestration (OpenRouter / Llama 3.3)
    techstack.ts    # Tech stack detection + BuiltWith scraping
    webscraper.ts   # Homepage + leadership page scraping
  supabase/         # Supabase client, middleware, server helpers
public/
  tracker.js        # Embeddable tracking script
supabase/
  schema.sql        # Full database schema
```

---

## Intent Scoring

Intent scores are computed **deterministically** — no AI guesswork:

| Signal | Weight |
|--------|--------|
| High-intent page visited (`/pricing`, `/demo`, `/contact`) | +3.0 |
| Medium-intent page (`/features`, `/solutions`, `/case-studies`) | +1.5 |
| Dwell time > 3 min | +1.5 |
| Dwell time > 1 min | +0.75 |
| Multiple visits (3+) | +1.5 |
| Multiple visits (2) | +0.75 |
| Direct traffic | +1.0 |
| Paid/organic search | +0.5 |

Score → Stage mapping: `0–3` = Awareness, `3–6` = Evaluation, `6–10` = Decision

---

## Persona Inference

Visitors are classified based on the pages they viewed:

| Persona | Trigger Pages |
|---------|--------------|
| Developer / Technical | `/docs`, `/api`, `/developer`, `/sdk`, `/github` |
| IT / Operations | `/security`, `/compliance`, `/enterprise`, `/sso` |
| Executive / Finance | `/pricing`, `/roi`, `/case-studies`, `/about` |
| General Prospect | All other pages |

---

## Deployment

Deploy to Vercel with one click:

1. Push to GitHub
2. Connect repo in Vercel dashboard
3. Add all environment variables from `.env.local`
4. Deploy

The tracker script URL will be `https://your-vercel-domain.com/tracker.js`.
