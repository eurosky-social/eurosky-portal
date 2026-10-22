---
'eurosky-portal': patch
---

Fix oauth callbacks from other browsers

- tie oauth flows to browser sessions and verify them
- only log out when correctly logged in
