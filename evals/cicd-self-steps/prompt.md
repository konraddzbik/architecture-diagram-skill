---
description: Self-steps and single-mode — internal work on one node, no mode toggle requested; payload contains GitHub Actions ${{ }} expressions.
tags: [core, template-features, pitfall]
runs: 3
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, TodoWrite]
---

Build a click-through diagram of our deploy pipeline for new joiners: a developer pushes to GitHub, GitHub Actions runs lint, tests and the Docker build (all inside Actions), pushes the image to GHCR, then Argo CD picks it up and syncs it to the Kubernetes cluster. One flow, "deploy on merge". There's only one environment, so no mode toggle. For the push-to-GHCR step, show this snippet from our workflow as the payload:

```yaml
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    password: ${{ secrets.GITHUB_TOKEN }}
- run: docker push ghcr.io/acme/web:${{ github.sha }}
```

Just build it, no questions.
