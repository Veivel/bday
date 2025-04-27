# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package*.json .
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package*.json ./

CMD ["node", "dist/main.js"]