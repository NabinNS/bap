# Stage 1 — dependencies
FROM node:20-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

# Copy only package.json first — layer cache reused if deps don't change
COPY package.json ./
RUN pnpm install

# Stage 2 — Final runtime image
FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /var/www/web

# Copy node_modules from deps stage (cached unless package.json changed)
COPY --from=deps /app/node_modules ./node_modules

# Copy app code last
COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
