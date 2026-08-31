# Multi-stage production Dockerfile for ApexFlow Enterprise CRM
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY . .

# Run build script
RUN node js/build.js || true

# Production Web Server
FROM nginx:alpine

WORKDIR /usr/share/nginx/html
COPY --from=builder /app /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
