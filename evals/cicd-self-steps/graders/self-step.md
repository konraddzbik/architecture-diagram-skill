---
type: regex
target: { source: file, path: "architecture.html" }
pattern: 'from\s*:\s*["'']([a-z0-9_]+)["'']\s*,\s*to\s*:\s*["'']\1["'']'
---
Internal work (lint/test/build inside Actions) is modelled as a self-step (from === to).
