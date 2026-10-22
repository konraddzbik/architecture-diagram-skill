---
type: llm
focus: { source: file, path: "architecture.md" }
weight: 3
---
The source doc lists exactly five components: Web UI (Next.js :3000), search-api (FastAPI :8080), Meilisearch (:7700, the only datastore — "no cache and no SQL database"), reindex-cron (nightly CronJob), Confluence (external). It defines two flows: Search (UI → search-api → Meilisearch → back) and Reindex (cron → search-api POST /reindex → Confluence → Meilisearch upsert).

PASS if the description contains those five components with their stated tech/ports, both flows in that order, and nothing contradicting the doc.
FAIL if it introduces a component that is not in the doc (e.g. a cache, a SQL database, a message queue, a load balancer, an auth service) presented as part of the system, gets a port or tech wrong, or reorders/omits a flow step.
