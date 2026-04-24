FROM node:lts-trixie-slim AS base
# Set default shell used for running commands
SHELL ["/bin/bash", "-o", "pipefail", "-o", "errexit", "-c"]

# Configure pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

FROM base AS base-deps
WORKDIR /app
COPY package.json pnpm-*.yaml ./

# Configure Corepack
RUN \
  corepack enable; \
  corepack prepare --activate;

FROM base-deps AS production-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod

# ----------------------------
# Stage 2: Build the application
# ----------------------------
FROM base-deps AS build
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN node ace build

# ----------------------------
# Stage 3: Production runtime
# ----------------------------
FROM base AS production
RUN apt-get update -y && apt-get install -y tini

WORKDIR /app
# Copy the build app:
COPY --from=build /app/build ./
COPY --from=production-deps /app/node_modules ./node_modules/
ENV NODE_ENV=production

EXPOSE 4075
CMD ["tini", "--", "node", "bin/server.js"]
