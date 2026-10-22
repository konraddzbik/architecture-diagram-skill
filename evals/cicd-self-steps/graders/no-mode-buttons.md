---
type: regex
target: { source: file, path: "architecture.html" }
pattern: '<button[^>]*data-mode="(offline|online)"'
match: not_contains
---
The template's sample offline/online mode buttons were removed for a single-environment diagram.
