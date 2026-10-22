---
type: regex
target: { source: file, path: "architecture.html" }
pattern: '\{\{[A-Z0-9_]+\}\}'
match: not_contains
weight: 2
---
No unfilled {{PLACEHOLDER}} from the template is left in the output.
