# Binder — Project Context

Binder is a news digest app that runs a pipeline three times per day, fetches RSS feeds across 11 editorial channels, uses Claude to extract a single high-signal insight per article, scores each card, and surfaces them in a mobile-first card UI. The goal is one swipeable feed of genuinely interesting facts — no summaries, no opinions, just repeatable insights with a stat or named fact. Cards are always pre-generated and waiting — users never trigger generation manually.

## Architecture

**Pipeline (`binder.js`)** — Node.js script, runs on a schedule (midnight, 8am, 4pm):
1. Fetches up to 10 articles per RSS feed per channel, filtered to articles published since the last run
2. Sends each article through Claude (Haiku for insight extraction, Sonnet for context + bio)
3. Scores the insight (0–5) based on presence of numbers, contrast words, dollar/percent amounts, superlatives, and quotes
4. Upserts to Supabase and writes `cards.json` + `review.txt`

**Frontend (`index.html`)** — Single-file vanilla JS app:
- Loads cards from Supabase (today's `pipeline_run` date) or falls back to `cards.json`
- Feed, Liked collection, Journalists, Archive views
- Swipe left = dismiss permanently. Tap = expand. Like button = add to liked collection.
- Per-channel filter + personal scoring boosts (followed journalists +3, liked sources +2)
- Journalist panel shows bio and all their cards in feed, plus archived articles from followed journalists
- Served via `npx serve .` for local dev; deployed to Vercel at https://binder-chi.vercel.app

## Pipeline Schedule

Three runs per day: **midnight, 8am, 4pm**. Each run is incremental — only processes articles published since the previous run. Cards accumulate through the day with newest first. The daily archive resets at midnight.

Why three runs: keeps content fresh for morning readers, afternoon check-ins, and night owls without requiring real-time generation.

## Card Lifecycle — Three States

1. **Dismissed** (swipe left) — gone permanently. Does not appear in archive. The dismissal was intentional and stands.
2. **Neutral** (scrolled past without dismissing) — stays in that day's archive. User didn't engage but didn't reject it.
3. **Liked** — goes to the Liked collection. A permanent personal reading history across all time.

## The Archive

Accessible via a **date indicator at the top of the feed** — not buried in a separate tab.

- Default state: today's date shown subtly at the top of the feed.
- **Single tap** — date becomes a horizontal scroll. Swipe left/right to move through days. Fast and gestural.
- **Double tap** — full calendar opens. Navigate by month, tap any date to jump. Should feel like the Apple Clock alarm date picker — satisfying, precise, tactile.

When viewing a past day: every card from that day that wasn't dismissed (neutral and liked both). Fully interactive — articles still link out, journalists still followable, likes still signal the algorithm. The archive is a library, not a museum.

## The Liked Collection

A dedicated space separate from the archive. Contains every card the user has ever liked across all time. Organised by date, fully interactive. This is the user's personal reading history — the passive record of everything Binder surfaced that they found worth keeping.

## Channels

Architecture, Design, Technology, Energy & Climate, Urban Development, Business & Startups, Science, Arts & Culture, Film, Fashion, Politics & World.

Each channel has 3–4 RSS feeds. Design uses a separate, stricter prompt (`DESIGN_INSIGHT_PROMPT`) focused on formal/material/conceptual decisions.

## Scoring

`scoreInsight()` in `binder.js` returns 0–5:
- +1 for any digit
- +1 for `%`, `$`, `billion`, `million`
- +1 for contrast words (`despite`, `but`, `yet`, `while`, `never`, `only`, etc.)
- +1 for `first` or `record`
- +1 for a quoted string

Cards are sorted by score descending before save. Personal boosts applied in-browser (not persisted to Supabase).

## Supabase

- Project ref: `nbiwbvqbtyqvuzaklvcx`
- Table: `cards`
- Upsert key: `(url, channel)` — same article can appear in multiple channels. Requires unique constraint: `ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_url_key; ALTER TABLE cards ADD CONSTRAINT cards_url_channel_key UNIQUE (url, channel);`
- `pipeline_run` column (date string `YYYY-MM-DD`) lets the UI filter to today's cards
- Credentials are hardcoded in `binder.js` (API keys, not DB password) and `index.html` (anon key)
- Service role key used in pipeline; anon key used in frontend

### Schema

| Column | Type | Notes |
|---|---|---|
| `url` | text | Primary dedup key |
| `channel` | text | |
| `insight` | text | Empty string for archive-only cards |
| `context` | text | |
| `score` | int | 0–5 |
| `title` | text | |
| `source` | text | Publication name |
| `author` | text | |
| `author_bio` | text | |
| `pub_date` | text | ISO date string |
| `pipeline_run` | date | YYYY-MM-DD, used to filter today's cards |
| `source_type` | text | `'rss'` \| `'newsletter'` \| `'manual'`. Default `'rss'`. Added 2026-04-25. |
| `archive_only` | boolean | `true` for followed-journalist articles that failed quality filter. Default `false`. Added 2026-04-25. |

To run DDL: Supabase SQL editor at https://supabase.com/dashboard/project/nbiwbvqbtyqvuzaklvcx/sql

### Other tables

**`followed_journalists`** — persists follow state across sessions and devices.
- `name text NOT NULL`, `publication text NOT NULL`, `created_at timestamptz`
- Primary key: `(name, publication)`

## Key Decisions

- **Claude Haiku for insight extraction** — fast, cheap, runs on every article. Sonnet only for context and bio (post-filter, fewer calls).
- **Follows and likes persisted to Supabase** — follows write to `followed_journalists` table; likes currently in JS memory (planned: persist to Supabase).
- **Per-channel scoring cap at 10** — all-channels view shows full ranked pool; per-channel caps to avoid showing 40 marginal cards.
- **Design has its own prompt** — general insight prompt fails on design content (too vague). Separate prompt enforces formal/material/conceptual specificity.
- **Bio prompt deliberately excludes article content** — early version generated bios that described the article. Prompt now passes only author + publication, forcing inference from journalist identity not piece content.
- **Archive-only cards stored in `cards` table** — followed-journalist articles that fail quality filter get saved with `archive_only = true`, empty insight, score 0. Filtered out of main feed client-side, shown in journalist panel under "Also captured".
- **Dismissed cards are permanent** — no undo after swipe-left. Neutral cards (scrolled past) remain in archive. This distinction is intentional.

## V2 Planned: Newsletter Inbox

The next major source type is email newsletters. Plan:
- Inbound email parsing (likely via Mailgun or Postmark) routes newsletter HTML to a handler
- Handler extracts articles the same way as RSS, sets `source_type = 'newsletter'`
- `source_type` field was added to `cards` table early to avoid a schema change later

## Running Locally

```bash
node binder.js      # run the pipeline (~5–10 min depending on rate limits)
npx serve .         # serve the UI at http://localhost:3000
```

## Update This File

Update CLAUDE.md whenever: a new channel is added, a prompt changes meaningfully, a new source type ships, a Supabase schema change is made, or a significant product or architectural decision is locked in.
