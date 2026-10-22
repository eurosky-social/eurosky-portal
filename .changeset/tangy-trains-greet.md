---
'eurosky-portal': patch
---

Update Node.js to 26

Currently Docker pulls LTS Node.
In a week or so, that will be 26.
That no longer has corepack, which will break.

This switches to Node 26 already.
The one without the CVEs, of course.

Node 26 introduces two deprecations,
one fixed by upgrading `@adonisjs/application`,
another by hiding it if unneeded,
through lazy loading `@adonisjs/otel`.
