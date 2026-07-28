---
'eurosky-portal': patch
---

Fix activity syncing

Some improvements to activity syncing:

- lower concurrency (number of users at the same time)
- longer SQLite busy_timeout (5s -> 30s)
- don’t swallow problems when syncing collections
- honor `Retry-After` headers up to a point (1m)
