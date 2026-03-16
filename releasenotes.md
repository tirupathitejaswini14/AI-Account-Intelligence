# Release Notes — AI Account Intelligence

---

## [Unreleased] — 2026-03-16

### Bug Fixes

#### Critical (Security)
- **`app/accounts/[id]/page.tsx`** — Added `user_id` filter to account fetch query. Previously any authenticated user could read any other user's account by knowing its ID.
- **`app/accounts/[id]/page.tsx`** — Added `user_id` filter to account delete query. Previously any authenticated user could delete any account. Both operations now also redirect to `/login` if the user is unauthenticated.

#### High
- **`lib/enrichment/ai.ts`** — Removed `require('fs').writeFileSync()` from the AI error handler. The `fs` call was crashing the error handler itself whenever OpenRouter failed, producing an unhelpful 500. Replaced with `console.error`.
- **`lib/enrichment/ai.ts`** — Wrapped `JSON.parse()` in its own `try/catch`. Malformed JSON from the LLM now falls through to the graceful fallback instead of throwing an unhandled exception.

#### Medium
- **`lib/enrichment/ai.ts`** — Replaced `as any` type assertion on `intentStage` with the correct union type cast `as 'Awareness' | 'Evaluation' | 'Decision'`.
- **`app/api/enrich/route.ts`** — Added input validation for visitor type: returns 400 if `input` is not an object or `ip_address` is missing/invalid, preventing undefined values from being passed to `getIpInfo`.
- **`app/api/enrich/route.ts`** — All parallel enrichment calls (`Wikipedia`, `News`, `TechStack`, `WebScraper`) now log a warning with the error message on failure instead of silently swallowing errors.
- **`app/api/enrich/route.ts`** — Enrichment DB insert now captures and logs `enrichmentError` on failure instead of silently ignoring it.
