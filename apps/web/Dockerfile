FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /var/www/web
COPY package.json pnpm-lock.yaml* ./
RUN pnpm config set dangerously-allow-all-builds true --global \
    && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /var/www/web
COPY --from=deps /var/www/web/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm run build

FROM base AS runner
WORKDIR /var/www/web
ENV NODE_ENV=production

COPY --from=builder /var/www/web/public ./public
COPY --from=builder /var/www/web/.next/standalone ./
COPY --from=builder /var/www/web/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
