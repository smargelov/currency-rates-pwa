# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# postinstall renders icons and copies flags, so scripts and the catalog must
# be present before npm ci.
COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY src/entities/currency/model/catalog-fiat.ts ./src/entities/currency/model/catalog-fiat.ts
RUN npm ci

COPY . .
RUN npm run build

# Serve stage
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
