# eurosky-portal

## 1.4.14

### Patch Changes

- [#127](https://github.com/eurosky-social/eurosky-portal/pull/127) [`cd5d157`](https://github.com/eurosky-social/eurosky-portal/commit/cd5d1573743040b12c06bb7b61597839e2164e55) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix tagging of published docker images for tags

## 1.4.13

### Patch Changes

- [#125](https://github.com/eurosky-social/eurosky-portal/pull/125) [`d4dae85`](https://github.com/eurosky-social/eurosky-portal/commit/d4dae85cae0fcc6aa7ef7e1a578895afce1de528) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix publishing again

## 1.4.12

### Patch Changes

- [#123](https://github.com/eurosky-social/eurosky-portal/pull/123) [`3c305e3`](https://github.com/eurosky-social/eurosky-portal/commit/3c305e3d9b7b180c77449d98cc1f47f5f154e7ce) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix publishing of docker images

## 1.4.11

### Patch Changes

- [#121](https://github.com/eurosky-social/eurosky-portal/pull/121) [`c892e45`](https://github.com/eurosky-social/eurosky-portal/commit/c892e45699ee608ee8e3aa4cb1c8cee85bc6da43) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix publish workflow failing to checkout the right tag

## 1.4.10

### Patch Changes

- [#119](https://github.com/eurosky-social/eurosky-portal/pull/119) [`5d6181d`](https://github.com/eurosky-social/eurosky-portal/commit/5d6181d3a0dece52e6c68977e38736b003a0c2b2) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Still trying to fix the release workflow

## 1.4.9

### Patch Changes

- [#117](https://github.com/eurosky-social/eurosky-portal/pull/117) [`eb9f670`](https://github.com/eurosky-social/eurosky-portal/commit/eb9f670d142d1ffb0db8454ec1077d30f355ae12) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix the release (again)

## 1.4.8

### Patch Changes

- [#115](https://github.com/eurosky-social/eurosky-portal/pull/115) [`74130c6`](https://github.com/eurosky-social/eurosky-portal/commit/74130c62b957efd92b8634709393104c34dd4e6c) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix release

## 1.4.7

### Patch Changes

- [#112](https://github.com/eurosky-social/eurosky-portal/pull/112) [`3d79923`](https://github.com/eurosky-social/eurosky-portal/commit/3d79923c9dff252b415ba2e3f744ddd8d397fb8e) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix release via workflow call

## 1.4.6

### Patch Changes

- [#110](https://github.com/eurosky-social/eurosky-portal/pull/110) [`468db72`](https://github.com/eurosky-social/eurosky-portal/commit/468db72dc43ad76c324c07c83cdb668acb22d4e0) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix release not publishing

## 1.4.5

### Patch Changes

- [#103](https://github.com/eurosky-social/eurosky-portal/pull/103) [`c077ff8`](https://github.com/eurosky-social/eurosky-portal/commit/c077ff85f43310197898688f0386222a4203cab6) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Add automated release management

  We're now automating our releases with [Changesets](https://github.com/changesets/changesets/blob/main/README.md). The docker image will automatically be built as `dev` for the `main` branch, and changesets will trigger the creating of the git tag for publishing the released versions as the `latest` docker image.

- [#106](https://github.com/eurosky-social/eurosky-portal/pull/106) [`53ec383`](https://github.com/eurosky-social/eurosky-portal/commit/53ec383e15951caa7fb90ae513b5bf3a97bc2e65) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Add monocle.sh for observerability

  [Monocle](https://monocle.sh) is a adonis.js native observerability service built on Open Telemetry.

- [#108](https://github.com/eurosky-social/eurosky-portal/pull/108) [`b496d6e`](https://github.com/eurosky-social/eurosky-portal/commit/b496d6e864f5eb7ad252b7633f537d4fee8a99c0) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Add health checks

- [#105](https://github.com/eurosky-social/eurosky-portal/pull/105) [`9781b9f`](https://github.com/eurosky-social/eurosky-portal/commit/9781b9f3bb059ff1a5c2dc996cc7621b3cdd4c03) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix allowed hosts for redirects
