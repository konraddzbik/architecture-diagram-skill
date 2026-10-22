---
description: Modes — a node and a flow that exist in only one mode (data-modes + onlyMode).
tags: [core, template-features]
runs: 3
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, TodoWrite]
---

Diagram our app's deployment so the team can click through it: a React SPA talks to a Go API, which uses Postgres. There are two environments, staging and prod. In staging only, a seed-data job loads fixtures into Postgres before tests — it doesn't exist in prod. Flows: "user login" (both environments) and "seed staging data" (staging only). No questions, just build it.
