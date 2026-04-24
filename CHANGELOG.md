# eurosky-portal

## 1.4.19

### Patch Changes

- [#148](https://github.com/eurosky-social/eurosky-portal/pull/148) [`642d715`](https://github.com/eurosky-social/eurosky-portal/commit/642d715d5d5206e7139e6c61ae0f9a8c6eba6947) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix docker image UID/GID

  Just by chance UID/GID of 991 conflicts on debian with systemd-timesync

## 1.4.18

### Patch Changes

- [#142](https://github.com/eurosky-social/eurosky-portal/pull/142) [`c5116e7`](https://github.com/eurosky-social/eurosky-portal/commit/c5116e770074555c19dd62951ac7fa449e2597bb) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Add goat to the docker image for debugging

- [#141](https://github.com/eurosky-social/eurosky-portal/pull/141) [`710b590`](https://github.com/eurosky-social/eurosky-portal/commit/710b590a1fe9e5d86631a9d762e158e8df6b864b) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Improve error messaging for handle resolution

- [#140](https://github.com/eurosky-social/eurosky-portal/pull/140) [`f925db8`](https://github.com/eurosky-social/eurosky-portal/commit/f925db8b4cd47aee451114c306fbc469f6201967) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Improve dockerfile
  - Drops user permissions
  - Uses pnpm fetch to improve install performance
  - Runs dist-upgrade to catch any security updates to the image
  - Installs tini with --no-install-recommends
  - Uses apt caching

## 1.4.17

### Patch Changes

- [#137](https://github.com/eurosky-social/eurosky-portal/pull/137) [`cfc0f70`](https://github.com/eurosky-social/eurosky-portal/commit/cfc0f706753f93745c15cea952b38acbb5dd1fb4) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix extraneous logging of /icons/\* directory

- [#135](https://github.com/eurosky-social/eurosky-portal/pull/135) [`54f871b`](https://github.com/eurosky-social/eurosky-portal/commit/54f871baf7bcc615772d62649d225b46b2a0ac80) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Prevent double submission of the sign in form

- [#137](https://github.com/eurosky-social/eurosky-portal/pull/137) [`357c441`](https://github.com/eurosky-social/eurosky-portal/commit/357c4417e3018d9f55501722c698df58c891094c) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Upgrade Monocle SDK and fix missing traces for oauth callbacks

- [#134](https://github.com/eurosky-social/eurosky-portal/pull/134) [`3152e97`](https://github.com/eurosky-social/eurosky-portal/commit/3152e977476d7ed145418eab3729a843c14012fa) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix handle backfill to persist handle.invalid values

- [#134](https://github.com/eurosky-social/eurosky-portal/pull/134) [`52b15bc`](https://github.com/eurosky-social/eurosky-portal/commit/52b15bc2084a0f2fdd67fe87e57b1c55066b4284) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Prevent identity resolution for bsky.social and other well-known handle domains

- [#134](https://github.com/eurosky-social/eurosky-portal/pull/134) [`46f4b47`](https://github.com/eurosky-social/eurosky-portal/commit/46f4b4724dbb5a7bcfd33525238456edeb370729) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Improve OAuth error handling

  We now display a flash message above the form an OAuth error occurs after redirecting to the OAuth provider (assuming they redirect back to us). The other error messages have also been improved.

## 1.4.16

### Patch Changes

- [#132](https://github.com/eurosky-social/eurosky-portal/pull/132) [`c9ed441`](https://github.com/eurosky-social/eurosky-portal/commit/c9ed44195f7b34468eeab58beceefb5941376124) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Remove bluesky avatar from navbars

  We can't reliably fetch this without going through bluesky's infrastructure.

- [#132](https://github.com/eurosky-social/eurosky-portal/pull/132) [`1d621c3`](https://github.com/eurosky-social/eurosky-portal/commit/1d621c3d393b0d7e2f7b9ff16ef0efab71711ec7) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Improve caching of data for better resiliency

  During the Bluesky outage on 16th April 2026, we faced significant increases in P95 response times, up to 10 seconds, due to our reliance on fetching the profile data from Bluesky's API on every request.

  This change makes the handle cached on the Account record, and it is refreshed each time the user logs in. We also separate the loading of the Bluesky profile and the fetching the handle, using the adonis.js cache to cache the profile response for 10 minutes, with a fetch timeout of 1 second. If the data fails to load, then we don't show their actual avatar and we omit the stats section.

## 1.4.15

### Patch Changes

- [#130](https://github.com/eurosky-social/eurosky-portal/pull/130) [`1f28073`](https://github.com/eurosky-social/eurosky-portal/commit/1f280731e424ad830703c216ee19019bda9104c1) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Prevent logging of requests to static and assets paths

- [#130](https://github.com/eurosky-social/eurosky-portal/pull/130) [`e73d7a8`](https://github.com/eurosky-social/eurosky-portal/commit/e73d7a8ff0706e9bcd5938f9b123fda7e7d220f3) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Prevent the data assets from being clobbered by the vite assets

- [#129](https://github.com/eurosky-social/eurosky-portal/pull/129) [`f7fc5a7`](https://github.com/eurosky-social/eurosky-portal/commit/f7fc5a792a9c1a5345bae5fce9f3160bb1f51a4e) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix allowed hosts for redirects

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
