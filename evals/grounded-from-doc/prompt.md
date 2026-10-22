---
description: Grounding — the diagram must reflect the provided design doc only, no invented infrastructure.
tags: [core, grounding]
runs: 3
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, TodoWrite]
---

Here's the SOLUTION.md for our internal search service. Turn it into a clickable architecture diagram for the onboarding session next week. Don't ask questions, go with what's in the doc.

```markdown
# Docs Search — SOLUTION.md

## Components
- **Web UI** (Next.js, port 3000) — the search box.
- **search-api** (FastAPI, port 8080) — the only backend. Endpoints: `GET /search?q=` and `POST /reindex`.
- **Meilisearch** (v1.8, port 7700) — full-text index. The ONLY datastore. There is no cache and no SQL database.
- **reindex-cron** (Kubernetes CronJob, nightly 02:00) — calls `POST /reindex`.
- **Confluence** (external SaaS, REST API) — source of documents, read during reindex.

## Flows
1. Search: Web UI → search-api `GET /search` → Meilisearch `/indexes/docs/search` → results back to UI.
2. Reindex: reindex-cron → search-api `POST /reindex` → Confluence (pull pages changed since last run) → Meilisearch `/indexes/docs/documents` (upsert).
```
