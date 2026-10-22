---
type: regex
target: { source: file, path: "architecture.html" }
pattern: 'class="node[^"]*"[^>]*>[\s\S]{0,400}?(Redis|Postgres|PostgreSQL|MySQL|Memcached|Kafka|RabbitMQ)'
flags: i
match: not_contains
weight: 2
---
No node for infrastructure the doc explicitly says does not exist (cache, SQL DB, broker).
