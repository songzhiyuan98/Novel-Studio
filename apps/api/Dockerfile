FROM node:20-alpine

RUN npm install -g pnpm@10 tsx

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./

# Copy package.jsons for install
COPY packages/core/package.json packages/core/
COPY packages/orchestrator/package.json packages/orchestrator/
COPY packages/prompts/package.json packages/prompts/
COPY packages/llm-adapter/package.json packages/llm-adapter/
COPY apps/api/package.json apps/api/

# Install deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ packages/
COPY apps/api/ apps/api/

EXPOSE 3001

CMD ["tsx", "apps/api/src/index.ts"]
