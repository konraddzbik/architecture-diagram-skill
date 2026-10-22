---
type: llm
focus: { source: file, path: "architecture.md" }
weight: 2
---
PASS if the description is written in Polish and covers the mobile app, the Spring Boot API, PostgreSQL, RabbitMQ, the worker and Twilio, with the "nowa rezerwacja" flow described step by step in a sensible order (app → API → PostgreSQL, API → RabbitMQ → worker → Twilio).
FAIL if it is mostly in English, if a component is missing, or if the flow order is wrong.
