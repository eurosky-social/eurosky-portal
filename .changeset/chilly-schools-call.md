---
'eurosky-portal': patch
---

Update `@adonisjs/queue` to 0.7

The queue tables are upgraded by a migration,
which runs at boot when `DATABASE_AUTOMIGRATE` is on.
The upgrade cannot be undone:
downgrading after deploying this version is not possible.
