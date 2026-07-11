# UiGateway

> 13 nodes · cohesion 0.23

## Key Concepts

- **UiGateway** (14 connections) — `apps/api/src/ui-gateway/ui.gateway.ts`
- **.subscribeToSession()** (8 connections) — `apps/api/src/ui-gateway/ui.gateway.ts`
- **.publishSessionEvent()** (4 connections) — `apps/api/src/ui-gateway/ui.gateway.ts`
- **.extractAuthToken()** (4 connections) — `apps/api/src/ui-gateway/ui.gateway.ts`
- **.roomName()** (3 connections) — `apps/api/src/ui-gateway/ui.gateway.ts`
- **.extractAuthTokenFromHandshake()** (3 connections) — `apps/api/src/ui-gateway/ui.gateway.ts`
- **.extractBearerToken()** (3 connections) — `apps/api/src/ui-gateway/ui.gateway.ts`
- **Injectable** (1 connections)
- **WebSocketGateway** (1 connections)
- **WebSocketServer** (1 connections)
- **SubscribeMessage** (1 connections)
- **MessageBody** (1 connections)
- **ConnectedSocket** (1 connections)

## Relationships

- [sessions.service.ts](sessions.service.ts.md) (2 shared connections)
- [sessions.controller.ts](sessions.controller.ts.md) (2 shared connections)
- [AgentEventEnvelope](AgentEventEnvelope.md) (2 shared connections)
- [ConnectedAgentsRegistry](ConnectedAgentsRegistry.md) (1 shared connections)
- [persistence.module.ts](persistence.module.ts.md) (1 shared connections)
- [AuthTokenService](AuthTokenService.md) (1 shared connections)

## Source Files

- `apps/api/src/ui-gateway/ui.gateway.ts`

## Audit Trail

- EXTRACTED: 45 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*