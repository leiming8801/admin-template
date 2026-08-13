FROM node:18-alpine AS builder

RUN npm install -g pnpm@9.15.0

WORKDIR /app

# 拷贝 workspace 根配置
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/

# 拷贝 web package.json
COPY apps/web/package.json apps/web/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 拷贝源码
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

# 构建 shared 和 web
RUN pnpm run build --filter=@admin-template/shared
RUN pnpm run build --filter=@admin-template/web

# ---- 运行阶段 ----
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist/ /usr/share/nginx/html/

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
