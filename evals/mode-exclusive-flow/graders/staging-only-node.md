---
type: regex
target: { source: file, path: "architecture.html" }
pattern: 'class="node[^"]*"[^>]*data-modes="staging"|data-modes="staging"[^>]*class="node'
weight: 2
---
The seed job node is restricted to staging with data-modes.
