---
'eurosky-portal': patch
---

Improve dockerfile

- Drops user permissions
- Uses pnpm fetch to improve install performance
- Runs dist-upgrade to catch any security updates to the image
- Installs tini with --no-install-recommends
- Uses apt caching
