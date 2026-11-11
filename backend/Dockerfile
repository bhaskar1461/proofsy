FROM node:22-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN apt-get update -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN npm ci --omit=dev

COPY . .

# Create directories for uploads, storage, and logs
RUN mkdir -p uploads storage/pdfs storage/templates storage/fonts logs \
    && chown -R node:node /usr/src/app

USER node

EXPOSE 5000

# Default: start the API server. Docker Compose overrides this for the worker.
CMD ["node", "src/server.js"]
