FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /var/www/web

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "pnpm install --no-frozen-lockfile && pnpm run dev"]
