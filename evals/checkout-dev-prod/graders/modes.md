---
type: regex
target: { source: file, path: "architecture.html" }
pattern: '<button[^>]*data-mode="(dev|prod)"[\s\S]*<button[^>]*data-mode="(?!\1)(dev|prod)"'
---
Both dev and prod mode buttons exist (either order).
