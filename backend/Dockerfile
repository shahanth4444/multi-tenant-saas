# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN apk add --no-cache curl \
 && npm install --production

COPY src ./src
COPY submission.json /app/submission.json

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/server.js"]
