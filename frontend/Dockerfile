# ---- build stage ----
# bun is the project's package manager (bun.lock + bunfig.toml).
FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

# VITE_API_URL is baked into the client bundle at build time. "/api" is
# relative to the page origin — nginx proxies it to the backend.
ARG VITE_API_URL=/api
# The Lovable vite config defaults nitro to a Cloudflare Workers build;
# NITRO_PRESET overrides it so we get a plain Node server in .output/.
ENV VITE_API_URL=$VITE_API_URL \
    NITRO_PRESET=node-server
RUN bun run build

# ---- runtime stage ----
FROM node:22-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

WORKDIR /app
COPY --from=build /app/.output ./.output

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
