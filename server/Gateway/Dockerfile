# ---------- STAGE 1: BUILDER ----------
    FROM node:22-alpine AS builder

    WORKDIR /usr/src/app
    
    # Copy package files first to leverage Docker layer caching
    COPY package*.json ./
    
    # Install all dependencies (including TypeScript)
    RUN npm install
    
    # Copy source code
    COPY . .
    
    # Ensure binaries are executable and build the project
    # This fixes the "sh: tsc: Permission denied" error
    RUN chmod +x node_modules/.bin/tsc && npm run build
    
    
    # ---------- STAGE 2: RUNTIME ----------
    FROM node:22-alpine
    
    WORKDIR /usr/src/app
    
    # Copy only the files needed to run the app
    COPY package*.json ./
    
    # Install only production dependencies (no devDependencies)
    RUN npm install --omit=dev
    
    # Copy the compiled code from the builder stage
    # (Adjust "dist" path if your build output goes elsewhere)
    COPY --from=builder /usr/src/app/dist ./dist
    
    # Security: Run as a non-root user
    USER node
    
    EXPOSE 4001
    
    # Point to your compiled entry point
    # Based on your previous snippet, it might be dist/index.js or dist/src/index.js
    CMD ["node", "dist/src/index.js"]