# Evals

Behavioral evals for the skill, run with [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals).
Each case is a realistic user request plus graders: deterministic `regex` / `file_exists` /
`tool_used` checks on the generated `architecture.html` / `architecture.md`, and an `llm` rubric
for accuracy (no invented components, flows in the right order).

```bash
# from the repo root — the cases write files, so grant Write/Edit
claude plugin eval . --allow-tools Write Edit

# one case, one run, no baseline arm (cheap while iterating)
claude plugin eval . --case grounded-from-doc --runs 1 --ablation none --allow-tools Write Edit
```

| Case | Checks |
|---|---|
| `checkout-dev-prod` | core path: 2 flows, dev/prod modes, Stripe as `ext`, no leftover placeholders, accurate `.md` |
| `grounded-from-doc` | builds only what a SOLUTION.md describes — no invented cache/DB/broker |
| `polish-trigger` | Polish request fires the skill; `lang="pl"`, Polish companion doc |
| `cicd-self-steps` | self-steps for internal work, mode toggle removed, `${{ }}` escaped in payloads |
| `mode-exclusive-flow` | staging-only node (`data-modes`) and flow (`onlyMode`) |
| `html-payload-escaping` | a payload containing `</script>` doesn't cut the page's script short |
| `negative-mermaid`, `negative-slide-png` | static-diagram requests do **not** trigger the skill |

Browser-level regressions (layout, a11y, sanitizer) live in `tests/` instead — see `tests/README.md`.
