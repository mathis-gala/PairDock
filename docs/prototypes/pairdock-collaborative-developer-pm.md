# Prototype notes — PairDock collaborative developer/PM

Source prototype copied to: `prototype/`

Original source: `/Users/mathis/Downloads/Plateforme collaborative développeur-PM/`

## Purpose

This prototype is the visual/product reference for the PairDock MVP. It should guide UI implementation and architecture decisions, but it is not production code.

## Screens represented

### Login

- Dark centered landing page.
- Two explicit role cards:
  - Developer space: GitHub entry, local project/tool ownership, repository access expectations.
  - Product/PM space: Slack entry, invitation-only access, no code/terminal access.
- Architecture impact: keep developer identity and PM identity separate behind provider-neutral identity ports.

### Developer dashboard

- Left navigation: projects, active sessions, models, connections.
- Main area: project list with local path alias, base branch, default model, PM presence, and open/configure actions.
- Inline project setup captures project folder, default model, and base branch.
- Right rail: GitHub/Slack connection state and recent activity.
- Architecture impact: project configuration and provider connection summaries are first-class API/read-model concerns; local paths must remain developer-only.

### PM shared-project dashboard

- Left navigation: shared projects, sessions, review requests.
- PM sees only shared projects.
- Project cards show owner, description, model, and owning agent availability.
- Start session is enabled only when the owning agent is online and policy allows it; offline projects show disabled state.
- Architecture impact: project membership must exist before session membership; session start policy must authorize PM-started sessions from shared projects.

### Session workspace

- Top bar shows project, branch, model, participants, owning developer agent, and online state.
- Left pane: PM prompt/composer plus agent progress timeline.
- Right pane: live preview in browser-like frame with preview URL and worktree indicator.
- Bottom preview toolbar supports responsive presets: mobile 375, tablet 768, laptop 1024, desktop 1280, full responsive.
- Bottom action bar shows session status and disables draft review request until the fix/checks are ready.
- Architecture impact: prompt state, agent events, preview URL/status, validation status, and review-request action state are separate public contracts.

### Running/fixed/review states

- Agent progress is visible as steps: worktree creation, component/file localization, fix application, preview rebuild.
- Preview can show a rebuilding overlay while the agent is running.
- Once fixed, status becomes ready and draft review request action is enabled.
- Review-request modal confirms PR creation and exposes the draft review-request URL in the shared session.
- Architecture impact: review request creation goes through `SourceControlPort`; V1 has no notification subsystem.

## Implementation guidance

- Use React for surfaces and Tailwind CSS for styling.
- Use shadcn/ui for reusable primitives: buttons, cards, dialogs/modals, inputs, textareas, badges, tabs/navigation, alerts, and sheets.
- Keep shadcn/ui components app-owned and adaptable to PairDock design tokens.
- Do not copy the inline-style prototype as production component structure.
- Preserve the prototype behavior and role boundaries when translating to production UI.

## Architecture documents reconciled

The MVP architecture package already records the main prototype-derived requirements:

- `docs/architecture/pairdock-mvp/PRD.md`
- `docs/architecture/pairdock-mvp/architecture.md`
- `docs/architecture/pairdock-mvp/tasks.md`
- `docs/architecture/pairdock-mvp/test-plan.md`
- `docs/architecture/pairdock-mvp/diagrams/`

This notes file exists so future implementers can trace product/UI decisions back to the copied prototype assets.
