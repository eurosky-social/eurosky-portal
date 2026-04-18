---
'eurosky-portal': patch
---

Improve caching of data for better resiliency

During the Bluesky outage on 16th April 2026, we faced significant increases in P95 response times, up to 10 seconds, due to our reliance on fetching the profile data from Bluesky's API on every request.

This change makes the handle cached on the Account record, and it is refreshed each time the user logs in. We also separate the loading of the Bluesky profile and the fetching the handle, using the adonis.js cache to cache the profile response for 10 minutes, with a fetch timeout of 1 second. If the data fails to load, then we don't show their actual avatar and we omit the stats section.
