---
type: regex
target: { source: file, path: "architecture.html" }
pattern: '</script>'
flags: i
match: count:1
weight: 3
---
Exactly one literal </script> in the file — the payload's closing script tag was escaped, so the main script block is not cut short.
