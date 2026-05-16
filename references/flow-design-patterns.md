# Flow Design Patterns

How to plan a system's topology and flows BEFORE writing any code. Read this when designing a new service from scratch (greenfield) or capturing an existing system you don't fully understand yet.

The diagram is a forcing function: if you can't draw a clean flow, the design is probably tangled.

---

## Topology heuristics

### Place nodes by direction of data, not by team or technology

Bad layout (organized by who owns it):

```
[Team A]    [Team B]    [Team C]
 Service1    Service3    Service5
 Service2    Service4    Service6
```

Good layout (organized by data flow):

```
[User] → [Gateway] → [Service A] → [DB]
                  ↘ [Service B] → [Cache]
                  ↘ [Service C] → [Queue] → [Worker]
```

The reader's eye follows the request from left to right. Wires that go "backwards" (right-to-left) should mean **a response**, not another request. If you have a request going right-to-left, something's misplaced.

### The five-zone canvas

Use a left-to-right zoning. Most systems fit:

| Zone | X position | Typical occupants |
|---|---|---|
| **Entry** | 0–10% | User, browser, mobile, external caller, webhook source |
| **Edge** | 20–30% | Gateway, BFF, load balancer, auth proxy |
| **Core** | 40–55% | Orchestrators, business logic, app servers |
| **Backends** | 60–75% | DBs, queues, caches, third-party APIs |
| **Heavy compute** | 80–90% | LLMs, ML services, batch jobs, video transcoders |

Vertical placement is freer. Two heuristics:
- **Mainline center, side concerns above/below.** The happy-path flow runs horizontally through the middle. Optional things (caches, observability, dead-letter queues) sit above or below.
- **Read paths above, write paths below.** Mirrors how people read system diagrams.

### One-shot and rare nodes go in a corner

Things that only run at startup, during deploys, or once a day — seed jobs, migrations, cron — belong in the top-left or top-right corner. Reasoning: they're peripheral, and parking them in a corner keeps the mainline clean.

If the flow you're documenting is **the seed/cron flow itself**, the rare node becomes the protagonist; place it where it makes that flow read well.

### When two nodes have the same role

E.g. you have Postgres for transactional data and Redis for cache. Both are databases (role: `vector`). Don't invent a 7th color. Distinguish via:

- **Icon** (cylinder vs hexagon vs cloud)
- **Label** (`Postgres · users` vs `Redis · session cache`)
- **Vertical position** (Postgres lower = "source of truth"; Redis higher = "ephemeral")

The legend stays 6 colors max.

---

## Identifying flows

The single biggest mistake is conflating **scenarios** with **paths through one scenario**. Each flow should be a complete, named user-meaningful journey, not a fragment.

### Tests for "is this a flow?"

- ✅ Can you name it after a user goal? ("Login", "Place Order", "RAG Query") → **flow**
- ✅ Does it have a start (user-triggered or scheduled) and an end (response or terminal state)? → **flow**
- ❌ Is it a sub-step of a bigger story? ("Validate token") → **step inside a flow**, not its own flow
- ❌ Is it the same shape as another flow with a different parameter? → **same flow**, parameterize via mode or skip

### Canonical flow types

Most systems have some subset of:

1. **The happy path** — main user action (search, ask, buy, post). Almost always exists.
2. **The baseline / fallback** — what happens without the enrichment that makes the system smart. RAG vs Direct, cached vs cold, fast path vs slow path. Useful to show even if the user never picks it; it sets up the "before/after".
3. **Read flows** — list, get, search, get-related. Usually share most of their middle.
4. **Write flows** — create, update, delete. Often involve queues or eventual consistency.
5. **Ingest / bulk load** — CSV upload, document indexing, batch import. Different in shape from interactive flows.
6. **Live event** — single record updates from a stream/webhook. Same shape as ingest, but for one item.
7. **One-shot bootstrap** — seed, migration, first-run setup. Often only exists in one deployment mode.
8. **Auth flows** — login, refresh, logout, OAuth redirect. Typically has 5–8 steps and crosses out to an external IdP.
9. **Async fan-out** — produce to queue → multiple consumers. Show this only if it's central to the system; otherwise it's noise.

Pick 3–6 flows that **collectively** explain how the system works. If you've picked 8 and they overlap a lot, you've subdivided too far.

### Naming a flow

Pattern: `<Verb noun> (METHOD /route)` or `<User-meaningful name>`.

- ✅ "RAG Query (POST /ask)"
- ✅ "Place Order"
- ✅ "OAuth Login"
- ❌ "GET endpoint" (no domain meaning)
- ❌ "Generic flow" (literally meaningless)

For workshops in Polish, mix is fine: `"Pytanie z RAG (POST /ask)"`.

---

## Designing steps

### Steps describe handoffs, not state

Each step is "X sends Y to Z". The verb is implicit (send/call/publish). The interesting content is the **payload** and the **rationale** — what's being communicated and why now.

Bad step description: *"The orchestrator does some work."*
Good step description: *"Orchestrator sends the question + retrieved context to the LLM. This is the 'augmentation' moment — without it, the model would have to answer from its training weights alone."*

### Step count per flow: 3 to 9

Less than 3 = it's not really a flow, just a function call.
More than 9 = you're including implementation details that don't belong in an architecture diagram.

Common 6-step pattern for request/response with backend:

1. User → Gateway (request lands)
2. Gateway → Backend (fetch / compute)
3. Backend → Gateway (data returns)
4. Gateway → Compute (synthesize / decide)
5. Compute → Gateway (result)
6. Gateway → User (response)

Common 4-step pattern for "fire and forget":

1. User → Gateway
2. Gateway → Queue
3. Gateway → User (202 Accepted)
4. (Async) Queue → Worker

### When to merge vs split steps

**Merge** if the two operations are atomic from the caller's perspective. *"Validate token + load user from DB"* is one step if the caller never sees the in-between state.

**Split** if there's an interesting intermediate value to show in a payload, or if a failure between them is meaningfully different from a failure inside them. *"Embed text"* and *"Search vectors"* are separate steps because the embedding is a meaningful intermediate value worth showing.

### Round trips count as two steps

If A asks B for data and gets a response, that's two steps (A→B, B→A), not one. Each has a different payload — request vs response — and each lights up a different wire direction. Keep them separate.

Exception: pure fire-and-forget. A→B with no response = one step.

### Step descriptions: write like a tour guide, not a spec

The diagram is for someone learning the system, not auditing it. Each step description should answer:

1. **What just happened?** (One sentence.)
2. **Why?** (Optional, if non-obvious.)
3. **What's surprising or worth noting?** (Optional, but high-value.)

Avoid: timing details, exhaustive error cases, exact library names beyond what's already in the node tech label. Those belong in the companion .md, not the step description.

---

## Modes (the toggle at the top)

Modes are orthogonal to flows. The same flow can run in any mode; only the payload, ports, auth, or visibility of certain nodes changes.

### Good mode pairs

- **offline / online** — local dev vs cloud (Docker vs Cloud Run, SQLite vs Postgres)
- **dev / staging / prod** — environment variation (often 3 modes)
- **v1 / v2** — protocol or API version migration
- **batch / streaming** — when the same system supports both
- **read replica / primary** — when caller affects routing

### Bad mode candidates (don't make these modes)

- **Different feature flags** — too granular; that's configuration, not topology
- **Authenticated vs anonymous** — different flows, not modes
- **Mobile vs web** — usually shares the entire backend; the difference is one node, not a mode

### Per-step mode fields

For each step that's mode-sensitive, set both:

```js
{
  // ... step common fields
  payloadOffline: `...`,
  payloadOnline:  `...`,
  chipsOffline:   ["timeout 30s", "no auth"],
  chipsOnline:    ["~1s", "Bearer"]
}
```

If a step is identical across modes, use `payload` (no suffix). Don't duplicate.

### Auto-switching modes

If a flow is mode-exclusive (e.g. a "seed" flow only exists offline), set `onlyMode: "offline"` on the flow object. The runtime auto-switches users to the default flow if they pick this flow in the wrong mode. Add an `onlineNote` explaining why.

---

## Wire color logic

Each step has a `color` (a CSS variable). The packet, the wire, and the badge on the target node all glow this color.

**Pick the color of the receiver, not the sender.** When `Orch → Embed`, color is `--c-embed`. When `Embed → Orch`, color is still `--c-embed` (because the embed service is the protagonist of this exchange).

Exception: the very final step (back to user) is colored `--c-user` — the user is the destination and that's the moment the flow completes.

This makes it visually obvious *what kind of system the data is touching at each step*: gold = preprocessing, violet = storage, magenta = compute.

---

## Common architecture motifs

When designing, look for these motifs in your system and you'll know how to draw them:

### Sidecar / decorator

A small service intercepts calls to a bigger one (auth, logging, rate limit). On the diagram: place the sidecar *between* caller and main service, on the same horizontal row.

### Cache-aside

Read tries cache first, falls back to DB. Two steps to express:
1. Orch → Cache (`GET key`) — chip "cache miss" or "cache hit"
2. (Only on miss) Orch → DB (`SELECT ...`)

Don't try to express both branches in a single flow; pick one (usually cold path = miss) for the demo and mention the cached path in the step description.

### Event-driven fan-out

Producer pushes to a topic, multiple consumers subscribe. On the diagram:
- Producer is a node.
- Queue/topic is a node (role: `vector`, icon: queue).
- Each consumer is a node.

Steps:
1. Producer → Queue (publish)
2. Queue → Consumer A (deliver) — `parallel` indication via description
3. Queue → Consumer B (deliver) — separate step

If you have ≥4 consumers, group them into one node labeled "Consumer Group" and explain in the description.

### Saga / orchestrated multi-step

Orchestrator calls services in sequence, with compensation on failure. Treat as a single flow with one step per service call. If compensation is critical to the system, build a separate `flow_rollback` flow.

### Retry / backoff

Don't show retries as separate steps unless retries are the protagonist (e.g. a flow explicitly about resilience). Mention in description: *"on 5xx, orchestrator retries up to 3× with exponential backoff."*

### Streaming response

LLM tokens streaming back to user, or SSE events. Express as one step with a chip like "stream" or "SSE", description explains the chunked nature.

---

## Audience adjustments

The same system can be drawn for different audiences. Pick one and commit:

| Audience | Emphasize | De-emphasize |
|---|---|---|
| **Workshop attendees** (newcomers) | Why each step exists, the surprising/clever bits | Implementation details, library versions |
| **Engineers joining the team** | All flows, mode toggles, exact endpoint names | Marketing-friendly tagline |
| **Client / stakeholder** | The happy path, security/compliance touchpoints | Internal optimizations, fallback flows |
| **Operations / on-call** | Where things break, retry/timeout chips, observability touchpoints | Business logic explanations |

For a workshop, default to "newcomers" mode: 3–5 flows, friendly descriptions, every step explains itself.

---

## Greenfield design checklist

If you're designing a new service and using the diagram as a planning tool:

1. **List the actors** that talk to your system. User, scheduler, other services. These become entry nodes.
2. **List the operations** these actors trigger. Each becomes a candidate flow.
3. **For each operation, list the dependencies** the system calls. These become non-entry nodes.
4. **Group dependencies by role** (db, cache, llm, queue, etc.) — assign colors.
5. **Lay out left-to-right** following the zoning rules.
6. **Sketch the first flow** (the happy path) and walk through it. Does the sequence make sense? Are there missing intermediate steps?
7. **Find wire crossings.** Reposition until clean.
8. **Now add the second flow.** Does it reuse most of the same nodes? Good. Does it need new ones? Add them.
9. **Pick modes.** What changes between dev and prod? Between v1 and v2? If nothing meaningfully changes, skip modes.
10. **Annotate payloads.** Even if the code doesn't exist yet, write the API contract you *want*. That's now your spec.

The diagram you end up with is both documentation and a target. Implementation should match.

---

## When to ditch this skill mid-task

If during design you discover:

- The system has 15+ nodes — break into sub-diagrams per bounded context.
- A flow is essentially a state machine with branches — use a separate state diagram tool (Mermaid `stateDiagram`).
- You're really designing a UML class diagram, not a flow — wrong tool entirely.
- The system is simple enough that a 5-line Mermaid `sequenceDiagram` would cover it — use that instead.

This template is for **interactive, sequenced, multi-flow data movement**. If that's not what you're drawing, save everyone time and pick a different tool.
