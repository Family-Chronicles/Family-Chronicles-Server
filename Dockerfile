FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /usr/src/app/dist ./dist
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
ENV UPLOAD_DIR=/data/uploads
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:8080/api/v1/health || exit 1
CMD [ "node", "dist/server.js" ]
