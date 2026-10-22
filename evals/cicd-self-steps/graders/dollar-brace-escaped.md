---
type: regex
target: { source: file, path: "architecture.html" }
pattern: '`[^`]*(?<!\\)\$\{\{[^`]*`'
match: not_contains
weight: 2
---
No unescaped ${{ … }} inside a JS template literal — it would be evaluated as JavaScript and blank the diagram. (Writing \${{ or using a plain quoted string is fine.)
