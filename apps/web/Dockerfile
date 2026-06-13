FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /var/www/web

# Copy package files first (better layer caching)
COPY package.json ./

RUN pnpm install

# Copy the rest of the app
COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
