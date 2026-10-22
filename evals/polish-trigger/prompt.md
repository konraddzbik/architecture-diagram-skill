---
description: Trigger + language — a Polish request should fire the skill and produce a Polish diagram.
tags: [trigger, i18n]
runs: 3
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, TodoWrite]
---

Pokaż jak działa nasz system rezerwacji, na warsztaty dla zespołu: aplikacja mobilna woła API (Spring Boot), API zapisuje rezerwację w PostgreSQL i wrzuca zdarzenie do RabbitMQ, z którego worker wysyła SMS przez Twilio. Jeden przepływ: "nowa rezerwacja". Bez trybów. Zrób to bez dopytywania.
