FROM node:18-alpine AS builder

RUN npm install -g pnpm@9.15.0

WORKDIR /app

# 拷贝 workspace 根配置
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/

# 拷贝 server package.json
COPY apps/server/package.json apps/server/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 拷贝源码
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/

# 构建 shared 和 server
RUN pnpm run build --filter=@admin-template/shared
RUN pnpm run build --filter=@admin-template/server

# ---- 运行阶段 ----
FROM node:18-alpine AS runner

RUN npm install -g pnpm@9.15.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared/dist/ packages/shared/dist/
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/apps/server/dist/ apps/server/dist/
COPY --from=builder /app/apps/server/package.json apps/server/
COPY --from=builder /app/apps/server/prisma/ apps/server/prisma/

RUN pnpm install --prod --filter=@admin-template/server

# 拷贝 i18n 资源（构建时已 copyfiles 到 dist，但保险起见）
COPY --from=builder /app/apps/server/dist/i18n/ apps/server/dist/i18n/

EXPOSE 3000

CMD ["node", "apps/server/dist/main.js"]
