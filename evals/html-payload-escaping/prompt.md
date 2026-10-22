---
description: Pitfall — a payload containing an HTML document must not break the page's script.
tags: [pitfall]
runs: 3
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, TodoWrite]
---

Make an interactive architecture diagram of our server-side-rendered blog: the browser requests GET /posts/42 from a Node SSR server, which fetches the post from a headless CMS (Strapi) and returns the full HTML page. In the side panel for the last step I want the actual response body shown, including the `<script src="/hydrate.js"></script>` tag at the bottom of the page. One flow, no modes, no questions please.
