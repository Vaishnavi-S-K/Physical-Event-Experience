# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Install Backend Dependencies
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --only=production

# Stage 3: Production Image
FROM node:18-alpine
WORKDIR /app

# Copy backend source and its dependencies
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# Copy built frontend assets to the directory serviced by the backend
COPY --from=frontend-builder /app/dist ./public

# Expose the port (Cloud Run sets PORT env var)
EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

# Start the server
CMD ["node", "backend/server.js"]
