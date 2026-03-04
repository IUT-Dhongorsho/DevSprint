FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# --- CHANGE THESE TWO LINES ---
RUN chmod -R +x node_modules/.bin
RUN ./node_modules/.bin/tsc
# ------------------------------

FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
USER node
EXPOSE 4005
CMD ["node", "dist/src/index.js"]