FROM node:lts-trixie-slim AS base

# Set default shell used for running commands
SHELL ["/bin/bash", "-o", "pipefail", "-o", "errexit", "-c"]

# Configure pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
ENV DEBIAN_FRONTEND="noninteractive"

RUN \
  # Remove automatic apt cache Docker cleanup scripts
  rm -f /etc/apt/apt.conf.d/docker-clean; \
  # Sets timezone
  echo "Etc/UTC" > /etc/localtime; \
  # Creates app user/group and sets home directory
  groupadd -g "1002" app; \
  useradd -l -u "1002" -g "1002" -m -d /app app;

RUN \
  # Mount Apt cache and lib directories from Docker buildx caches
  --mount=type=cache,id=apt-cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,id=apt-lib,target=/var/lib/apt,sharing=locked \
  # Apt update & upgrade to check for security updates to the image
  apt-get update; \
  apt-get dist-upgrade -yq; \
  # Install tini:
  apt-get install -y --no-install-recommends tini tzdata curl wget ca-certificates openssl;

FROM base AS goat
WORKDIR /tmp
RUN \
  # Mount Apt cache and lib directories from Docker buildx caches
  --mount=type=cache,id=apt-cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,id=apt-lib,target=/var/lib/apt,sharing=locked \
  # Install go & git:
  apt-get install -y --no-install-recommends git golang-go

RUN git clone https://github.com/bluesky-social/goat.git && cd goat && git checkout v0.2.3 && go build -o /tmp/goat-build .

FROM base AS base-deps
WORKDIR /app
COPY package.json pnpm-*.yaml ./

# Configure Corepack
RUN corepack enable
RUN --mount=type=cache,target=/pnpm/store pnpm fetch

FROM base-deps AS production-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod --offline

# ----------------------------
# Stage 2: Build the application
# ----------------------------
FROM base-deps AS build
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --offline
COPY . .
RUN node ace build

# ----------------------------
# Stage 3: Production runtime
# ----------------------------
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy goat:
COPY --from=goat /tmp/goat-build /usr/local/bin/goat

# Copy the build app:
COPY --from=build /app/build ./
COPY --from=production-deps /app/node_modules ./node_modules/

# Setup temporary directory:
RUN mkdir /app/tmp && chown -R app:app /app/tmp;

# Set the running user for resulting container
USER app

EXPOSE 4075
CMD ["tini", "--", "node", "bin/server.js"]
