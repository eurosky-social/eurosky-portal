---
'eurosky-portal': patch
---

Use `@atcute/jetstream`

Instead of our own jetstream client, use a maintained and typed one.
This comes with validation, handling of events in order, and fixes a
theoretical bug where watching zero users, would watch everyone
