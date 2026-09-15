---
'eurosky-portal': patch
---

Add middleware in development to redirect between IPs (`127.0.0.1:4075`) and
hostnames (`localhost:4075`), based on what’s configured in `.env`.
Needs to be correct for OAuth flow.
