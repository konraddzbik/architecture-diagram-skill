# Component Library

Copy-paste node snippets for common service types. Each entry includes:
- The recommended `data-role` (color)
- A 14×14 SVG icon (Feather-style, single color)
- Typical `tech` and `port` content
- Notes on placement and mode-awareness

Use this when filling out the nodes section in the template.

---

## User-facing

### Browser / Web client

```html
<div class="node" data-role="user" data-id="user" style="left: 2%; top: 38%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  </div>
  <div class="label">User (Browser)</div>
  <div class="tech">HTML/JS · SPA</div>
  <div class="port">https://app.example.com</div>
  <span class="step-badge">·</span>
</div>
```

### Mobile app

```html
<div class="node" data-role="user" data-id="mobile" style="left: 2%; top: 18%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
  </div>
  <div class="label">Mobile App</div>
  <div class="tech">React Native · iOS/Android</div>
  <div class="port">api.example.com</div>
  <span class="step-badge">·</span>
</div>
```

### CLI / scripted client

```html
<div class="node" data-role="user" data-id="cli" style="left: 2%; top: 58%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
  </div>
  <div class="label">CLI</div>
  <div class="tech">curl · bash · CI</div>
  <div class="port">$ ./run.sh</div>
  <span class="step-badge">·</span>
</div>
```

### External webhook source

```html
<div class="node" data-role="user" data-id="webhook" style="left: 2%; top: 28%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  </div>
  <div class="label">Stripe Webhook</div>
  <div class="tech">External · POST + HMAC</div>
  <div class="port">stripe.com</div>
  <span class="step-badge">·</span>
</div>
```

---

## Edge / Gateway

### API Gateway / BFF / Orchestrator

```html
<div class="node" data-role="orch" data-id="orch" style="left: 26%; top: 38%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  </div>
  <div class="label">API Gateway</div>
  <div class="tech">Kong / Nginx / FastAPI</div>
  <div class="port">:443 → :8080</div>
  <span class="step-badge">·</span>
</div>
```

### Auth proxy / Identity Provider

```html
<div class="node" data-role="orch" data-id="auth" style="left: 26%; top: 18%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  </div>
  <div class="label">Auth0 / Keycloak</div>
  <div class="tech">OIDC · JWT</div>
  <div class="port">auth.example.com</div>
  <span class="step-badge">·</span>
</div>
```

### Load balancer

```html
<div class="node" data-role="orch" data-id="lb" style="left: 16%; top: 38%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  </div>
  <div class="label">Load Balancer</div>
  <div class="tech">ALB / Cloud LB</div>
  <div class="port">:443 (TLS)</div>
  <span class="step-badge">·</span>
</div>
```

---

## Compute

### LLM service

```html
<div class="node" data-role="compute" data-id="llm" style="left: 78%; top: 38%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4 18a2.5 2.5 0 0 1-1.55-4.45A2.5 2.5 0 0 1 4 9a2.5 2.5 0 0 1 1.55-4.45A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 20 18a2.5 2.5 0 0 0 1.55-4.45A2.5 2.5 0 0 0 20 9a2.5 2.5 0 0 0-1.55-4.45A2.5 2.5 0 0 0 14.5 2z"/></svg>
  </div>
  <div class="label">LLM</div>
  <div class="tech">Claude Sonnet 4.6 / GPT-4o / Llama</div>
  <div class="port">api.anthropic.com</div>
  <span class="step-badge">·</span>
</div>
```

### ML / inference service

```html
<div class="node" data-role="compute" data-id="ml" style="left: 78%; top: 58%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M12 8V2"/><path d="M12 22v-6"/><path d="M16.24 7.76L20.49 3.51"/><path d="M3.51 20.49l4.25-4.25"/></svg>
  </div>
  <div class="label">Inference Service</div>
  <div class="tech">Triton / TorchServe · GPU</div>
  <div class="port">:8000</div>
  <span class="step-badge">·</span>
</div>
```

### Embedding / preprocessor service

```html
<div class="node" data-role="embed" data-id="embed" style="left: 52%; top: 8%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
  </div>
  <div class="label">Embedding Service</div>
  <div class="tech">text-embedding-3-small · 768-dim</div>
  <div class="port">:11434</div>
  <span class="step-badge">·</span>
</div>
```

### Worker / job runner

```html
<div class="node" data-role="compute" data-id="worker" style="left: 78%; top: 70%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/></svg>
  </div>
  <div class="label">Background Worker</div>
  <div class="tech">Celery / Sidekiq</div>
  <div class="port">N pods</div>
  <span class="step-badge">·</span>
</div>
```

---

## Datastores

### Relational DB (Postgres / MySQL)

```html
<div class="node" data-role="vector" data-id="db" style="left: 60%; top: 70%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
  </div>
  <div class="label">Postgres</div>
  <div class="tech">15.x · users · orders</div>
  <div class="port">:5432</div>
  <span class="step-badge">·</span>
</div>
```

### Cache (Redis / Memcached)

```html
<div class="node" data-role="vector" data-id="cache" style="left: 52%; top: 50%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  </div>
  <div class="label">Redis</div>
  <div class="tech">session cache · TTL 1h</div>
  <div class="port">:6379</div>
  <span class="step-badge">·</span>
</div>
```

### Vector DB

```html
<div class="node" data-role="vector" data-id="vector" style="left: 52%; top: 70%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
  </div>
  <div class="label" data-label-offline="Qdrant" data-label-online="BigQuery">Qdrant</div>
  <div class="tech" data-tech-offline="v1.12.5 · collection X" data-tech-online="Vector Search · dataset.X">v1.12.5 · collection X</div>
  <div class="port" data-port-offline=":6333 · COSINE" data-port-online="API · COSINE">:6333 · COSINE</div>
  <span class="step-badge">·</span>
</div>
```

### Blob storage

```html
<div class="node" data-role="vector" data-id="s3" style="left: 60%; top: 85%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  </div>
  <div class="label">S3 / GCS</div>
  <div class="tech">bucket: uploads</div>
  <div class="port">s3://...</div>
  <span class="step-badge">·</span>
</div>
```

### Search index (Elasticsearch / OpenSearch)

```html
<div class="node" data-role="vector" data-id="search" style="left: 52%; top: 60%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  </div>
  <div class="label">Elasticsearch</div>
  <div class="tech">index · 5 shards</div>
  <div class="port">:9200</div>
  <span class="step-badge">·</span>
</div>
```

---

## Async / Messaging

### Message queue (Kafka / RabbitMQ / SQS)

```html
<div class="node" data-role="vector" data-id="queue" style="left: 52%; top: 35%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
  </div>
  <div class="label">Kafka</div>
  <div class="tech">topic: orders · 3 partitions</div>
  <div class="port">:9092</div>
  <span class="step-badge">·</span>
</div>
```

### Pub/sub event bus

```html
<div class="node" data-role="vector" data-id="pubsub" style="left: 52%; top: 35%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="2"/></svg>
  </div>
  <div class="label">Pub/Sub</div>
  <div class="tech">topic · push subscription</div>
  <div class="port">cloud.google.com</div>
  <span class="step-badge">·</span>
</div>
```

---

## One-shot / scheduled

### Cron job

```html
<div class="node" data-role="seed" data-id="cron" style="left: 2%; top: 8%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  </div>
  <div class="label">Cron (nightly)</div>
  <div class="tech">k8s CronJob · 0 3 * * *</div>
  <div class="port">batch</div>
  <span class="step-badge">·</span>
</div>
```

### Seed / migration job

```html
<div class="node" data-role="seed" data-id="seed" style="left: 2%; top: 8%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V8"/><path d="M5 12c0-3.5 3-7 7-7"/><path d="M19 12c0-3.5-3-7-7-7"/></svg>
  </div>
  <div class="label">Seed Job</div>
  <div class="tech">curlimages/curl · one-shot</div>
  <div class="port">init.csv</div>
  <span class="step-badge">·</span>
</div>
```

### CI/CD pipeline

```html
<div class="node" data-role="seed" data-id="ci" style="left: 2%; top: 8%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
  </div>
  <div class="label">GitHub Actions</div>
  <div class="tech">CI · self-hosted runner</div>
  <div class="port">arm64 DGX</div>
  <span class="step-badge">·</span>
</div>
```

---

## External services (3rd-party APIs)

### Generic 3rd-party API

```html
<div class="node" data-role="seed" data-id="ext" style="left: 78%; top: 8%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  </div>
  <div class="label">Stripe API</div>
  <div class="tech">External · REST</div>
  <div class="port">api.stripe.com</div>
  <span class="step-badge">·</span>
</div>
```

### Email service

```html
<div class="node" data-role="seed" data-id="email" style="left: 78%; top: 8%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  </div>
  <div class="label">SendGrid</div>
  <div class="tech">SMTP / API · transactional</div>
  <div class="port">api.sendgrid.com</div>
  <span class="step-badge">·</span>
</div>
```

---

## Observability / sidecars

These usually go above the mainline as visual "side concerns" rather than part of the flow itself. Include only if observability is the topic of a flow.

### Logging / tracing

```html
<div class="node" data-role="orch" data-id="otel" style="left: 40%; top: 88%;">
  <div class="icon">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
  </div>
  <div class="label">OpenTelemetry</div>
  <div class="tech">traces · metrics · logs</div>
  <div class="port">:4317 (OTLP)</div>
  <span class="step-badge">·</span>
</div>
```

---

## Icon attribution

All icons are derived from [Feather Icons](https://feathericons.com/) (MIT license) and have been sized to 14×14 with `stroke-width="2"`. To pick a new icon:

1. Browse feathericons.com
2. Copy the SVG markup
3. Strip everything except `<rect>`, `<path>`, `<circle>`, `<line>`, `<polyline>`, `<polygon>`, `<ellipse>` elements
4. Wrap in `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">...</svg>`

The `stroke="currentColor"` is critical — it lets the icon inherit the role color.
