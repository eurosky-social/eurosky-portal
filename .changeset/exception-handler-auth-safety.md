---
'eurosky-portal': patch
---

Fix crash in exception handler w/o `auth` context.
Can happen if errors occur before auth middleware runs.
