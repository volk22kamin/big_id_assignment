FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:18-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./*.json ./
COPY ./index.js ./index.js
COPY ./models ./models
COPY ./routes ./routes
USER node
EXPOSE 3000
CMD ["node", "index.js"]
