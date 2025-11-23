# Build stage
FROM node:22-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Create .env.production file with build-time variables
RUN echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" > .env.production

# Build the application
RUN npm run build-only

# Production stage
FROM nginx:alpine

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK CMD wget -qO- http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
