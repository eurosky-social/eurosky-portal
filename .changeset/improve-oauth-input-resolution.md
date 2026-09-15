---
'eurosky-portal': patch
---

Add better OAuth input resolution

- add support for auth server as input;
- do not crash on unresolvable handle handling;
- refactor to externalize some of the logic in this growing function
