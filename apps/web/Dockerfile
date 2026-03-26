FROM node:20-alpine

RUN npm install -g pnpm@10

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./

# Copy packages (workspace deps)
COPY packages/core/package.json packages/core/

# Copy web
COPY apps/web/package.json apps/web/

# Install deps
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/core/ packages/core/
COPY apps/web/ apps/web/

EXPOSE 3002

ENV NEXT_PUBLIC_API_URL=http://localhost:3001

CMD ["pnpm", "--filter", "@novel-studio/web", "dev"]
