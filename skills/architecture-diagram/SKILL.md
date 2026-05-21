---
name: architecture-diagram
version: 1.1.0
description: "Build interactive, click-through architecture diagrams for software systems — single HTML file with animated step-by-step flows, mode toggles (dev/prod, offline/online, v1/v2), dark/light theme switch, and a side panel with payload details. Use whenever the user asks for a system architecture visualization, service map, data flow, RAG/agentic flow, microservices topology, integration diagram, CI/CD pipeline, data pipeline, ETL flow, multi-agent system, onboarding diagram, or wants to design a new service's flows visually. Triggers: 'architecture diagram', 'system flow', 'service map', 'data pipeline', 'CI/CD flow', 'microservices diagram', 'agentic flow', 'RAG flow', 'pipeline visualization', 'workshop diagram', 'onboarding diagram', 'pokaż jak działa system', 'diagram architektury', 'wizualizacja systemu', 'klikany diagram', 'I'm building X, what should the flow look like'. Output is a self-contained single-file HTML plus a markdown description. Do NOT use for static Mermaid/PlantUML diagrams (those go inline). Not intended for slide-deck or printable diagrams — this skill produces interactive HTML for browser consumption."
license: MIT
---

# Interactive Architecture Diagrams

Build single-file, drop-in HTML pages that let workshop attendees, clients, or new team members **click through how a system works** — step by step, with animated data packets flowing between nodes, payload details on the side panel, and toggleable modes (offline/online, dev/prod, v1/v2). Battle-tested on the Eskadra Bielik RAG workshop; reuse the design system everywhere else.

This skill produces diagrams in a dark, didactic-first aesthetic — nodes are bounded, wires are gentle quadratic curves, packets glow only on the active step. No "AI slop" rainbow gradients. The CSS tokens are exposed in `assets/css-tokens.css` if you want to rebrand.

---

## When to reach for this skill

| Situation | Use this skill? |
|---|---|
| "Show me how the auth flow works" (interactive, for a workshop) | **Yes** |
| "Design the RAG pipeline before we build it" (planning new service) | **Yes** |
| "Map our microservices and how they communicate" | **Yes** |
| "Visualize the CI/CD pipeline for onboarding docs" | **Yes** |
| "Show the data flow through our ETL pipeline" | **Yes** |
| "Draw an agentic multi-agent system with tool calls" | **Yes** |
| "Build me an architecture mockup we can iterate on with the team" | **Yes** |
| "Draw a sequence diagram for the PR" (static, goes in markdown) | No — a Mermaid sequence diagram inline is simpler |
| "Add a diagram to a slide deck or PDF" (static, not interactive) | No — this produces interactive HTML, not images or slides |
| "I just need a static boxes-and-arrows topology" (no flows/steps) | No — a Mermaid flowchart is enough |

The differentiator is **interactivity + sequenced data flow**. If the value is "click through it and watch what happens", this skill applies. If the output needs to be a static image, a slide, or inline markdown, this is the wrong tool.

---

## The mental model

Every diagram has four things:

1. **Nodes** — services, datastores, users, queues, external systems. Each has a role (color) and metadata (tech stack, port, deployment target).
2. **Flows** — named scenarios the user can pick (e.g. `RAG Query`, `Direct Query`, `Ingest`, `Auth`). Each flow is an ordered list of **steps**.
3. **Steps** — `{from, to, route, payload, desc, chips}`. Each step lights up one wire and one target node.
4. **Modes** — orthogonal toggle (offline/online, dev/prod, v1/v2). Modes can:
   - hide/show entire nodes (e.g. Seed only exists offline)
   - rename a node (Qdrant → BigQuery)
   - swap payload bodies, ports, auth headers, latency chips

Modes are NOT alternative flows. Flows describe **scenarios** ("user asks a question"); modes describe **deployment shape** ("on Docker" vs "on Cloud Run").

---

## Workflow when invoked

### Step 1 — Capture intent

If the user has uploaded a SOLUTION.md, README, OpenAPI spec, or any architecture description, **read it first** before asking questions. Extract:

- Service names + tech stack + ports
- Deployment modes (if any)
- Named endpoints/operations and what they do (these become flows)
- For each operation, the chain of internal service calls (these become steps)

Then ask ONLY the gaps. Don't ask things already in the doc.

If there's no doc, ask the user briefly:
- "What system are we drawing?"
- "What are the main flows you want to show? (e.g. login, search, checkout)"
- "Any mode toggles? (offline/online, dev/prod, v1/v2)"
- "Who's the audience? Workshop attendees? Engineers? Clients?"

### Step 2 — Plan the topology on paper first

Before writing code, sketch on paper (literally in your head or a scratch file) WHICH services exist, WHERE they sit relative to each other, and WHICH flows connect WHICH nodes. **Avoid wire crossings** — this is the single biggest readability win. See `references/flow-design-patterns.md` for layout heuristics.

Quick rules:
- **Orchestrator/API gateway in the middle**, dependencies fanning out
- **User on the far left** (entry point), **datastores on the right** (exit), services in between
- **Read-only services above**, write-heavy services below (intuitive: data flows down into them)
- **Optional/one-shot services** (seed jobs, cron) tucked in a corner

### Step 3 — Build from the template

Copy `assets/template.html` to the working directory. The template is a fully working drop-in: dark theme, side panel, player controls (play/pause/step), keyboard shortcuts, animated SVG packets, mode toggle. You **only edit two regions**:

1. **The `nodes` block in HTML** — one `.node` div per service with `data-id`, `data-role`, `style="left/top"`, label, tech, port.
2. **The `flows` object in JS** — one entry per scenario, each with an ordered `steps[]` array.

Don't reinvent the CSS, the player, the SVG wire renderer, or the side panel — they all work.

### Step 4 — Validate before showing the user

After generating, do this self-check:

- [ ] Open the file mentally: does every flow's step sequence make narrative sense? (Step 1 sets up, last step delivers a result to the user.)
- [ ] Do wires cross unnecessarily? If yes, reposition nodes (try moving the late-arriving dependency away from the early ones).
- [ ] Are there flows where a single node is the `to` of two consecutive steps? That's fine if it's a loop, but check the description explains why.
- [ ] Mode swap: pick the most different node between modes (usually the database) and verify ALL its mode-dependent fields are filled in (label, tech, port, payload, chips).
- [ ] Did you generate the companion `architecture.md`? (Required — see Step 6.)

If puppeteer is available in the environment, **take a screenshot** to spot-check layout. Code in `references/screenshot.js`.

### Step 5 — Output the files

Always two files:
- `architecture.html` — the interactive diagram
- `architecture.md` — text description (components, flows step-by-step, mode differences, scenarios for the workshop)

Save to the current working directory. Platform-specific overrides:
- **Claude.ai** — use `/mnt/user-data/outputs/` instead
- **Claude Code / Gemini CLI / OpenCode / Copilot CLI** — save to the current working directory (default)

Both should be self-sufficient — someone can read the markdown without opening the HTML, and vice versa.

### Step 6 — Present the output

Tell the user where the files were saved and how to open them (`open architecture.html` on macOS, `xdg-open architecture.html` on Linux, or just open in browser). If `present_files` is available (Claude.ai), call it to display the HTML first, then the markdown.

---

## File reference

| File | When to read |
|---|---|
| `assets/template.html` | **Always.** This is the starting point you copy and modify. |
| `assets/css-tokens.css` | If user asks to restyle (e.g. light theme, different brand colors). Standalone tokens you can splice into existing CSS. |
| `references/flow-design-patterns.md` | When planning a new system from scratch. Heuristics for node placement, naming flows, sequencing steps, choosing modes. |
| `references/component-library.md` | When building the nodes list. Copy-paste node snippets for User/API/DB/Queue/Cache/LLM/Cron/External/etc. with proper roles and icons. |
| `references/screenshot.js` | When you want to spot-check the result before showing the user. Run with `node` if puppeteer-core is installed. |
| `examples/rag-eskadra-bielik.json` | Reference example: a real RAG system with 5 flows and offline/online modes. Read for inspiration on payload formatting and chip choices. |
| `examples/auth-oauth2.json` | Reference example: an OAuth2 + session flow with dev/prod modes. Shows redirect flows and external IdP nodes. |
| `examples/event-driven.json` | Reference example: event-driven microservices with Kafka, showing async fan-out flows. |
| `examples/cicd-pipeline.json` | Reference example: CI/CD pipeline with GitHub Actions, staging/prod modes, rollback flow. |
| `examples/agentic-tool-calling.json` | Reference example: agentic AI system with tool calling, single-agent vs multi-agent modes. |

---

## Quick reference — node roles and colors

Hardcoded in CSS variables in `template.html`. Pick one per node:

| Role | Color | Use for |
|---|---|---|
| `user` | mint `#46f9b8` | Browser, mobile client, end user, CLI user |
| `orch` | sky `#6aa9ff` | API gateway, orchestrator, BFF, controller |
| `compute` | magenta `#ff6b8a` | LLM, ML model, expensive compute |
| `embed` | amber `#ffc14d` | Embedding service, transformer, preprocessor |
| `vector` | violet `#b388ff` | Database (any), vector store, cache, blob storage |
| `seed` | orange `#ff9457` | Cron, one-shot job, migration, seed, scheduled task |

If you need more roles, add CSS variables. Keep the count ≤ 6 — past that, the legend becomes a colorblind nightmare.

If your system has e.g. two distinct datastores (Postgres + Redis), still use `vector` for both but distinguish via the icon and label, not by inventing a 7th color.

---

## Visual states — what the viewer sees on each step

This is the most important didactic mechanic in the diagram. Understand it before modifying the JS or CSS, or you'll break the "click a flow tab, see the whole path" intuition.

When a user picks a flow tab and lands on step N, every node and wire is classified into one of these states:

| Element | State | Looks like | When |
|---|---|---|---|
| Node | `active` | Full ring + glow + step-number badge | Target of current step (e.g. LLM when step says "Orch → LLM") |
| Node | `active-from` | Soft ring, no badge | Source of current step |
| Node | `participant` | Near-full opacity, slightly desaturated | Appears anywhere else in this flow, just not in this step |
| Node | `dimmed` | 25% opacity, washed out | Not in this flow at all (e.g. `seed` during a `login` flow) |
| Node | `hidden` | Invisible | Mode-excluded entirely (e.g. seed node in online mode) |
| Wire | `active` | Bright role color, glow, packet animating | The wire of the current step |
| Wire | `preview` | Role color at 50% opacity, dashed | Belongs to this flow but not the active step — **shows the full path ahead** |
| Wire | `muted` | ~8% opacity | Doesn't belong to this flow |

**Why `participant` matters.** Without it, only the currently-active node has full color; every other node (including the "source" of the current step and any nodes used in later steps) looks dead. The viewer can't tell that the LLM is *going* to be used in step 6 just by looking at the canvas — they have to click through all 5 prior steps to discover it.

With `participant`, the very first click on a flow tab shows the viewer: "here are the players, here are the wires connecting them, and here's where the first step happens". They can scan the whole story before pressing play. This is the entire point of the diagram.

**Implementation gotcha.** Both the JS (`applyStep`) and the CSS (`.node.participant`, `.wire.preview`) need to be consistent. If you add new node states, update both. Test by walking through every step of every flow and verifying the source node has the right state — common bug is leaving the source `dimmed` (looks dead) instead of `active-from` or at least `participant`.

---

## Interaction model

The diagram supports five ways to interact, in increasing order of viewer expertise:

| Interaction | What happens | Who uses it |
|---|---|---|
| Click flow tab | Jump to step 1 of that flow, side panel updates | Everyone |
| Click Next/Prev (or →/←, Space) | Advance/rewind one step | Workshop attendees walking through |
| **Click a node** | Jump to the first step where this node appears | Curious viewers exploring |
| **Drag a node** | Reposition the node on the canvas; wires redraw live | Layout tweakers / presenters |
| **Fullscreen (F)** | Expand canvas to fill the screen; Escape to exit | Workshop presenters |

**Node click vs drag.** The template uses a 5px movement threshold to distinguish a click (jump to step) from a drag (reposition). Pointer events handle both mouse and touch. Dragged positions snap to a 32px grid matching the canvas background grid for clean alignment.

**Node click is the easiest to miss when modifying the skill.** Three things must be in place:

1. `cursor: pointer` on `.node` (visual affordance — "this is clickable")
2. `:hover` state that reveals the role color (confirms interactivity)
3. The JS handler that does `findIndex` on the current flow's steps and jumps there

If a node isn't part of the current flow (`.dimmed` state), clicking it shakes the node instead of doing nothing. Silent ignore is bad UX — the viewer thinks the page is broken.

Keyboard accessibility: nodes have `tabIndex=0`, Enter/Space triggers the same action as click.

**Layout persistence.** When a viewer drags nodes, their positions are saved to localStorage (keyed by page title). A "reset layout" button (↻) appears in the control bar after any drag. Press `R` or click the button to restore original positions.

**Progress bar.** A thin progress bar below the player controls shows how far into the current flow the viewer is. Updates on every step change.

**Don't break this when adding features.** It's the only way for a viewer to think "wait, where is the LLM used?" and find out instantly. Without it, they'd have to step through all 8 steps just to discover one node's role.

---

## Quick reference — payload format

Payloads in the side panel are monospace + minimal syntax highlight. Keep them **realistic but trimmed** — show the shape, omit boring fields:

```js
{
  // good
  payloadOffline:
`POST /ask
{
  "query": "Ile kosztuje parking?",
  "limit": 3,
  "temperature": 0.7
}`,

  // bad — too verbose
  payloadOffline:
`POST /ask HTTP/1.1
Host: localhost:3000
Content-Type: application/json
User-Agent: Mozilla/5.0...
Accept: */*
Connection: keep-alive

{ ...full 50-line body... }`
}
```

Use 4-space indent, no tabs. Use `// comments` for inline annotations.

If a step is the same in both modes, use `payload` (single key). If they differ, use `payloadOffline` + `payloadOnline` (or whatever the mode names are).

---

## Quick reference — chips (metadata badges)

Chips below the payload are short metadata labels. Two semantic types auto-style themselves:

- **Latency** (matches `/ms|s$|min/`) — gets a stopwatch icon, e.g. `"~150ms"`, `"5-30s"`, `"timeout 120s"`
- **Size/count** (matches `/dim|×|loaded|rules|count/`) — gets a database icon, e.g. `"768 dim"`, `"38 loaded"`, `"×N"`
- **Other** — neutral, e.g. `"COSINE"`, `"baseline"`, `"idempotent"`, `"UUID5"`

Maximum 3 chips per step. They're hints, not specifications.

---

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Flow key in JS | snake_case | `ask`, `ask_direct`, `ingest_text` |
| Flow display name | "Title Case (METHOD /route)" | `"RAG Query (POST /ask)"` |
| Node `data-id` | snake_case, short | `orch`, `vector`, `embed` |
| Mode key | snake_case, descriptive | `offline`/`online`, `dev`/`prod`, `v1`/`v2` |
| Step title | Polish or English, depending on workshop language. Consistent within one file. | `"Pytanie z UI"` or `"Question from UI"` |

---

## Common pitfalls

**`</script>` in payloads breaks everything.** If a payload template literal contains the string `</script>` (e.g. showing an HTML snippet), the browser's HTML parser treats it as the closing tag for the main `<script>` block — killing all JS. Escape it as `<\/script>` or `&lt;/script&gt;` inside template literals. This also applies to any `</style>` or similar closing tags in payload strings.

**Source node looks dead.** If after refactoring the source node of the current step appears `dimmed` instead of `active-from`, you regressed the participant logic. See the "Visual states" section. Test by clicking each flow tab in turn and verifying every node that EVER appears in the flow stays visible at near-full opacity.

**Wire crossings.** Caused by bad node placement, not bad code. If two steps cross, swap node positions. The template auto-curves wires in alternating directions per step index, which helps but doesn't fix bad layout.

**Too many flows.** More than 6 flows clutters the tab bar. If you have 8+, group them: one diagram per group (e.g. "read flows" vs "write flows" as two separate HTML files).

**Modes that aren't really modes.** If the toggle changes the entire topology (different services, different protocols), it's not a mode — it's a second system. Build two HTML files.

**Static screenshots beat live diagrams sometimes.** If the diagram will end up in a PDF report, a slide deck, or a printed handout, this skill is the wrong choice — produce a static diagram instead. This skill is for **interactive** consumption in a browser.

**Forgetting the .md.** The HTML is the showpiece, but the .md is what people read on GitHub, paste into Slack, and grep for endpoint names. Always generate both.

**Polish vs English.** Match the workshop language. Bilingual settings typically use Polish for internal workshops and English for client deliverables. Ask if unsure.

---

## Extending the template

If a user asks for something the template doesn't support, here's the difficulty ranking:

| Request | Difficulty | Where to edit |
|---|---|---|
| New node | trivial | Add `.node` div, position via `left/top` % |
| New flow | trivial | Add entry to `flows` object |
| New mode (3rd one) | small | Add button to `.modepick`, extend `state.mode` switch, add `payloadX` fields to steps |
| Different brand colors | small | Edit CSS variables in `:root` (see `assets/css-tokens.css`) |
| Light theme | built-in | Click the moon/sun button or press `T`. To make light the default, add `class="light"` to `<body>`. |
| Drag-and-drop nodes | built-in | Already supported — drag any node; positions snap to 32px grid and persist in localStorage. |
| Fullscreen mode | built-in | Press `F` or click the expand icon. Press `Escape` to exit. |
| Layout reset | built-in | Press `R` or click the ↻ button (appears after any drag). |
| Progress bar | built-in | Thin bar below player shows step position in current flow. |
| Parallel steps (two simultaneous wires) | medium | Group steps as `{parallel: [step, step]}`; player advances both |
| Branching flows (if-then-else) | hard | Currently linear. Either fork into separate flows or add a `branch` field with UI for picking the branch. |
| Saving state in URL | small | Hash-based: `#mode=online&flow=ask&step=3` — parse in boot, update on changes |

Don't promise features the template doesn't support without flagging the work involved.

---

## Iteration tips

When the user gives feedback like "the diagram is too cramped" or "step 5 is confusing":

- **"Too cramped"** → spread nodes wider; you have 100% width to work with. Don't go below 12% horizontal gap between adjacent nodes.
- **"Confusing step"** → the step description is doing too much. Split into two steps OR rewrite to focus on ONE handoff (X sends Y to Z, that's it).
- **"It doesn't match how it really works"** → ask for the actual code path. Don't guess; the diagram has zero value if it lies about reality.
- **"Make it pop more"** → resist. Didactic clarity > visual punch. Maybe one accent element (a glow on the result node when flow completes) but stop there.
- **"Add a legend"** → already there. If they want it bigger, increase the `.legend` font-size and gap.
