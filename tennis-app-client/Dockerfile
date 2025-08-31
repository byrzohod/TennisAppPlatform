# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Angular app
RUN npm run build -- --configuration production

# Runtime stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app
COPY --from=build /app/dist/tennis-app-client/ .

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]