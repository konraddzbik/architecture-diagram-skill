---
description: Core path — a typical request with two flows and two modes, no spec document.
tags: [core, smoke]
runs: 3
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, TodoWrite]
---

Can you make me an interactive, click-through diagram of our checkout system? A web client calls an API gateway, which calls an Orders service (Postgres) and a Payments service that talks to Stripe. Orders publish an OrderPlaced event to Kafka, which an Email worker consumes. I want two scenarios: "place order" and "refund". And a dev vs prod toggle: dev uses a Stripe mock and a local Postgres, prod uses Stripe live and RDS. Don't ask me anything, just build it with sensible assumptions.
