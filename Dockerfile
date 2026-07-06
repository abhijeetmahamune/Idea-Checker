# Dockerfile for Idea-Checker (Render deployment)
# ---------------------------------------------------
# Stage 1 - Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies (often needed for native node modules on Alpine)
RUN apk add --no-cache libc6-compat

# Copy package files and install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code and run the build
COPY . .
RUN npm run build

# Stage 2 - Production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment and port
ENV NODE_ENV=production
ENV PORT=3000

# Copy the entire built application and dependencies from the builder
COPY --from=builder /app ./

# Expose the application port
EXPOSE 3000

# Run migrations and start the server
CMD ["sh", "-c", "npm run db:migrate && npm run start"]
