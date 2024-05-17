# 1. For build React app
FROM node:18 AS builder

# Set working directory
WORKDIR /app

COPY . /app
RUN chmod +x scripts/run.sh

# Install PM2 globally
# RUN npm install --global yarn

# Same as npm install
RUN yarn install
RUN npm run build
# Check after build
RUN ls build

# 2. For Nginx setup
FROM node:18 AS runner

RUN useradd -s /bin/bash -m vscode
RUN groupadd docker
RUN usermod -aG docker vscode

RUN npm install --global pm2
WORKDIR /app


# Copy static assets from builder stage
COPY --from=builder /app/build .
COPY --from=builder /app/config .
COPY --from=builder /app/ssl .
COPY --from=builder /app/scripts/run.sh .
COPY --from=builder /app/package.json .

RUN apt-get update
RUN apt-get install tree
RUN tree


