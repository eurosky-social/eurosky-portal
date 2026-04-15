# eurosky-portal

## 1.4.5

### Patch Changes

- [#103](https://github.com/eurosky-social/eurosky-portal/pull/103) [`c077ff8`](https://github.com/eurosky-social/eurosky-portal/commit/c077ff85f43310197898688f0386222a4203cab6) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Add automated release management

  We're now automating our releases with [Changesets](https://github.com/changesets/changesets/blob/main/README.md). The docker image will automatically be built as `dev` for the `main` branch, and changesets will trigger the creating of the git tag for publishing the released versions as the `latest` docker image.

- [#106](https://github.com/eurosky-social/eurosky-portal/pull/106) [`53ec383`](https://github.com/eurosky-social/eurosky-portal/commit/53ec383e15951caa7fb90ae513b5bf3a97bc2e65) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Add monocle.sh for observerability

  [Monocle](https://monocle.sh) is a adonis.js native observerability service built on Open Telemetry.

- [#108](https://github.com/eurosky-social/eurosky-portal/pull/108) [`b496d6e`](https://github.com/eurosky-social/eurosky-portal/commit/b496d6e864f5eb7ad252b7633f537d4fee8a99c0) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Add health checks

- [#105](https://github.com/eurosky-social/eurosky-portal/pull/105) [`9781b9f`](https://github.com/eurosky-social/eurosky-portal/commit/9781b9f3bb059ff1a5c2dc996cc7621b3cdd4c03) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix allowed hosts for redirects
