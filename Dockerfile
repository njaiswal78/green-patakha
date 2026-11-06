FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY public ./public
COPY src ./src
COPY server ./server
COPY migrations ./migrations
COPY tsconfig.json ./

RUN mkdir -p /app/data && chown -R node:node /app/data
USER node

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
CMD ["node_modules/.bin/tsx", "server/node.ts"]
