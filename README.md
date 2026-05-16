# Interactive Architecture Diagrams — a Claude Skill

> Build click-through, animated system architecture diagrams as a single HTML file. Drop it into a workshop, design review, or onboarding doc and let people **watch the data flow** instead of reading static boxes-and-arrows.

This is a [Claude Skill](https://github.com/anthropics/skills) — a folder of instructions Claude loads on demand. When you ask Claude to draw an architecture diagram, this skill takes over and produces a self-contained `architecture.html` plus a companion `architecture.md` description.

---

## What you get

Each generated diagram includes:

- **Named flows** — pick a scenario tab (`RAG Query`, `Login`, `Ingest`, …) and watch it play out step by step
- **Animated data packets** glowing along quadratic-curve wires between services
- **Side panel** showing the current step's payload, description, and metadata chips (latency, auth headers, ports)
- **Mode toggles** — switch between `offline/online`, `dev/prod`, or `v1/v2` to swap node labels, ports, and payloads in place
- **Player controls** — play/pause/step, keyboard shortcuts
- **Dark/light theme toggle** — switch with one click or press `T` (preference saved in localStorage)

No build step. No dependencies. One HTML file you can email, host, or open locally.

Battle-tested on a public RAG workshop (Eskadra Bielik) and several internal design reviews.

---

## When to use this skill

| Situation | Use this? |
|---|---|
| "Show me how the auth flow works" (interactive, for a workshop) | **Yes** |
| "Design the RAG pipeline before we build it" (planning a new service) | **Yes** |
| "Build an architecture mockup we can iterate on with the team" | **Yes** |
| "Visualize our microservices and how they communicate" | **Yes** |
| "Map out the CI/CD pipeline for onboarding docs" | **Yes** |
| "Show the data flow through our ETL pipeline" | **Yes** |
| "Draw a sequence diagram for this PR" (static, lives in markdown) | No — a Mermaid sequence diagram inline is simpler |
| "I just need a static boxes-and-arrows topology" (no flows/steps) | No — a Mermaid flowchart is enough |

The differentiator is **interactivity + sequenced data flow**. If the value is "click through it and watch what happens," this skill applies.

### Use cases

- **System architecture** — map services, databases, queues, and external APIs; watch requests flow between them step by step
- **Data pipelines & ETL** — show how data moves from ingestion through transformation to storage, with payload previews at each stage
- **Agentic / RAG flows** — visualize LLM chains, tool calls, retrieval-augmented generation, and multi-agent orchestration
- **Microservices communication** — trace requests through API gateways, service mesh, event buses, and worker queues
- **CI/CD pipelines** — walk through build, test, deploy, and rollback stages with environment toggles (staging/prod)
- **Auth & security flows** — OAuth2, SAML, mTLS handshakes, token refresh cycles with the full redirect dance
- **Onboarding diagrams** — give new team members a clickable walkthrough of "how does X actually work here"
- **Design reviews** — present a proposed architecture before building it; iterate on the diagram with stakeholders
- **Workshop materials** — let attendees click through a system at their own pace instead of watching static slides

---

## Install

### Claude Code — Plugin Marketplace (recommended)

```bash
/plugin marketplace add konraddzbik/architecture-diagram-skill
/plugin install architecture-diagram
```

That's it. The skill activates automatically whenever you ask for an architecture diagram, system flow, RAG pipeline, etc.

### Claude Code — manual clone

Personal install (available in all your projects):

```bash
git clone https://github.com/konraddzbik/architecture-diagram-skill \
  ~/.claude/skills/architecture-diagram
```

Project install (committed to a repo, shared with your team):

```bash
git clone https://github.com/konraddzbik/architecture-diagram-skill \
  .claude/skills/architecture-diagram
```

### Claude.ai (web / desktop / mobile)

1. Download this repo as a ZIP: **Code → Download ZIP** (or `git clone` and zip the folder)
2. In Claude, go to **Settings → Capabilities → Skills → Upload skill**
3. Upload the ZIP
4. Toggle the skill **on** in your skills list

---

## Try it

Once installed, just describe what you want. The skill triggers on phrases like *architecture diagram*, *system flow*, *RAG flow*, *agentic flow*, *service map*, or the Polish equivalents (*diagram architektury*, *klikany diagram*).

### Example prompts

**OAuth2 login flow**
> Build an interactive architecture diagram for an OAuth2 login flow with PKCE. Show the redirect dance between client, authorization server, and resource API step by step. Include a dev/prod mode toggle.

**RAG pipeline design**
> I'm designing a RAG pipeline with embedding retrieval, a reranker, and an LLM. Show me a click-through diagram I can use in a design review. Toggle between offline (Docker, local Qdrant) and online (Cloud Run, BigQuery) modes.

**Event-driven microservices**
> Visualize an event-driven order system: API gateway → Kafka → three consumers (inventory, billing, notifications). Toggle between synchronous (REST fallback) and asynchronous (Kafka) modes.

**CI/CD pipeline**
> Show our CI/CD pipeline: GitHub push → GitHub Actions → build → test → deploy to staging → approval gate → deploy to prod. Toggle between staging and production environments.

**Data ingestion pipeline**
> Visualize a data pipeline: webhook events → SQS → Lambda → transform → write to Postgres + push to Elasticsearch. Show the happy path and the dead-letter-queue retry flow.

**Multi-agent system**
> Draw an agentic AI system: user query → orchestrator agent → tool-calling agent (search, calculator, code exec) → synthesis agent → response. Show how context flows between agents.

**Microservices with service mesh**
> Map our microservices: mobile app → API gateway → user service, product service, order service. Each talks to its own DB. Show the checkout flow and the search flow with an Istio service mesh.

If you upload an existing `SOLUTION.md`, OpenAPI spec, or README first, the skill will extract services, ports, and operations from it before asking clarifying questions — so the more architecture context you give it, the less it asks.

---

## What's inside

```
architecture-diagram-skill/
├── .claude-plugin/
│   ├── marketplace.json              # Plugin marketplace manifest
│   └── plugin.json                   # Plugin metadata
├── skills/
│   └── architecture-diagram/
│       ├── SKILL.md                  # Instructions Claude reads when activated
│       ├── assets/
│       │   ├── template.html         # The drop-in diagram template (CSS + JS + SVG)
│       │   └── css-tokens.css        # Standalone color/typography tokens for restyling
│       ├── examples/
│       │   ├── rag-eskadra-bielik.json   # Real RAG system, 5 flows, offline/online modes
│       │   ├── auth-oauth2.json          # OAuth2 + session flow, dev/prod modes
│       │   ├── event-driven.json         # Kafka fan-out, sync vs async modes
│       │   ├── cicd-pipeline.json        # GitHub Actions deploy, staging/prod modes
│       │   └── agentic-tool-calling.json # Multi-agent AI with tool calls
│       └── references/
│           ├── flow-design-patterns.md   # Layout heuristics, naming, sequencing
│           ├── component-library.md      # Copy-paste node snippets
│           └── screenshot.js             # Optional puppeteer-based layout spot-check
├── README.md
├── LICENSE
└── .gitignore
```

The HTML template is the heart of the skill — Claude copies it and edits only **two regions**: the `nodes` block (HTML) and the `flows` object (JS). Everything else (player, side panel, animations, wire renderer) just works.

---

## Customizing

- **Light or dark theme:** every diagram ships with a built-in toggle (moon/sun icon, or press `T`). The preference is saved in localStorage. To make light the default, ask Claude to add `class="light"` to the `<body>` tag.
- **Restyle to your brand:** point Claude at `assets/css-tokens.css` and ask it to swap the palette. The tokens are standalone — splice them into the template and you're done.
- **Add a new node role:** there are six color-coded roles built in (`user`, `orch`, `compute`, `embed`, `vector`, `seed`). Add a CSS variable for a seventh if you must, but keep the count ≤ 6 or the legend becomes hard to read.
- **Different output language:** the skill works in English and Polish. Ask in your preferred language and the labels, descriptions, and companion markdown will match.

---

## Known limits

- The diagram is a **single HTML file** — no live data, no real backend. It's a didactic tool, not a monitoring dashboard.
- Designed for **≤ 12 nodes per diagram**. Beyond that, wire crossings get hard to avoid even with careful layout.
- The skill produces **two artifacts** by default (`.html` and `.md`). If you only want the HTML, say so explicitly.

---

## Contributing

Found a bug, a layout pattern that doesn't work, or have an example system you'd like added? PRs welcome — especially new entries in `examples/` showing real-world topologies.

When proposing changes to `SKILL.md` itself, please test that the description still triggers on the original phrases (`architecture diagram`, `RAG flow`, etc.) and doesn't over-trigger on static-diagram requests.

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Credits

Built by [@konraddzbik](https://github.com/konraddzbik). Inspired by the design constraints of running real workshops where attendees need to *see* a system, not just read about it.

If you publish a diagram built with this skill, a link back is appreciated but not required.
