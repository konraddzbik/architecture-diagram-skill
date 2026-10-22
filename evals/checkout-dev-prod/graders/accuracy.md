---
type: llm
focus: { source: file, path: "architecture.md" }
weight: 3
---
The user asked for: web client → API gateway → Orders service (Postgres) and Payments service (Stripe); Orders publishes OrderPlaced to Kafka, consumed by an Email worker; flows "place order" and "refund"; dev (Stripe mock, local Postgres) vs prod (Stripe live, RDS) modes.

PASS if the description covers every one of those components, describes both flows step by step in an order that makes sense (the refund goes through Payments → Stripe; the order event goes Orders → Kafka → Email worker), and explains what changes between dev and prod.
FAIL if a requested component or flow is missing, if the dev/prod differences are missing or wrong, or if it adds major components the user never mentioned and does not label them as assumptions.
