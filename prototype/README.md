# PairDock collaborative developer/PM prototype

Source: `/Users/mathis/Downloads/Plateforme collaborative développeur-PM/`

This folder keeps the visual/reference prototype used to align PairDock MVP architecture and implementation tasks.

## Contents

- `PairDock.dc.html`: interactive prototype entrypoint.
- `support.js`: local runtime required by the prototype HTML.
- `screenshots/`: exported prototype states for login, developer dashboard, PM shared-project dashboard, session, running/fixed/PR states, and cleanup states.

## How to view

Open `PairDock.dc.html` in a browser. The floating demo navigation switches between:

- `Connexion`: two-column Developer/GitHub and PM/Slack login.
- `Dev`: developer project dashboard with project setup, connected providers, PM presence, and activity rail.
- `Produit`: PM shared-project dashboard with agent availability and session start availability.
- `Session`: two-pane prompt/worktree/preview workspace with responsive presets and draft PR action.

## Architectural interpretation

Treat this prototype as product evidence, not production implementation code. Architecture docs should preserve its behavior and visual intent while implementing it with the project stack: React, Tailwind CSS, shadcn/ui components, NestJS, Prisma/PostgreSQL, local agent, Docker, Cloudflare Tunnel, GitHub, and Slack adapters.
