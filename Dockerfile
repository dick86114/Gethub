# Build Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package.json client/pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install
COPY client/ .
RUN pnpm run build

# Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .
RUN npx prisma generate
RUN npm run build
# Compile seed script
RUN npx tsc prisma/seed.ts --outDir dist --skipLibCheck --module commonjs --target es2016 --esModuleInterop

# Final Image
FROM node:20-alpine
WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy prisma schema first (for generate)
COPY --from=server-builder /app/server/prisma ./prisma

# Copy Server production deps
COPY server/package*.json ./
COPY server/tsconfig.json ./
RUN npm install --production
# Generate prisma client
RUN npx prisma generate

# Copy built server
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/start.sh ./

# Copy built client to public folder
COPY --from=client-builder /app/client/dist ./public

# Make start script executable
RUN chmod +x start.sh

EXPOSE 8080

CMD ["./start.sh"]
