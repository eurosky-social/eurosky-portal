---
'eurosky-portal': patch
---

Add automated release management

We're now automating our releases with [Changesets](https://github.com/changesets/changesets/blob/main/README.md). The docker image will automatically be built as `dev` for the `main` branch, and changesets will trigger the creating of the git tag for publishing the released versions as the `latest` docker image.
