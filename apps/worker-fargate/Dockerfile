FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@11.17.0

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/worker-fargate/ ./apps/worker-fargate/

RUN pnpm --filter @repo/worker-fargate... install --frozen-lockfile
RUN pnpm --filter @repo/worker-fargate build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/worker-fargate/dist ./dist
COPY --from=builder /app/apps/worker-fargate/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/index.js"]
