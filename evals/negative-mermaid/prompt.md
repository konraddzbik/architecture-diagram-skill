---
description: Negative trigger — a static inline diagram for a README should not use this skill.
tags: [trigger, negative]
runs: 3
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

Give me a Mermaid sequence diagram I can paste into our README showing the login flow: browser → auth service → Postgres, then the auth service returns a JWT to the browser. Just the code block, please.
