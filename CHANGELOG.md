# Release notes

## 0.1.0-beta.1 · Unreleased

This is a preparation record, not an announcement of npm availability.

- Server-side Node.js client with ESM, CommonJS and TypeScript declarations.
- Uptime web/Minecraft read-write operations and measured analytics.
- Pulse pages, incidents and scheduled maintenance.
- Notifications, current quotas and key-scoped usage history.
- Ultimate bulk monitor operations and signed webhook subscriptions.
- Cancellation, bounded GET retries and typed response metadata.
- No automatic write retries; no idempotency-key guarantee.
- Fixed TypeScript ESM default-import constructor declaration resolution.

### Known boundaries

- Not a browser SDK or a Python SDK; other languages use REST.
- API/service plan and scope restrictions remain server-enforced.
- No samples means null/unknown, not invented availability.
- Webhook events can be duplicated or missed; current Pulse event production covers API mutations only.
- The custom use-only license is included. First npm beta publication is pending.
