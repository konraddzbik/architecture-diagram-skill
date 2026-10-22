---
type: regex
target: { source: file, path: "architecture.html" }
pattern: 'data-role="ext"[^>]*>[\s\S]{0,600}?Stripe|Stripe[\s\S]{0,40}?data-role="ext"|data-id="stripe[^"]*"[^>]*data-role="ext"|data-role="ext"[^>]*data-id="stripe'
flags: i
---
Stripe (a third-party SaaS) uses the `ext` (External) role rather than a job/compute role.
