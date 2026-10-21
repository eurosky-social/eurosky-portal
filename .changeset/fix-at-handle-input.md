---
'eurosky-portal': patch
---

Fix logins with `username@eurosky.social`

An `@` before a configured handle domain is now turned into a `.`,
as intended; previously that input was rejected.
