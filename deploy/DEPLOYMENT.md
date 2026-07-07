# CareerForge AI 云端部署指南

这个项目已经整理成可部署版本，支持两种路线：

1. Render 蓝图部署：适合最快公开上线。
2. 云服务器 Docker Compose 部署：适合正式运营、绑定自己的域名、后续迁移数据库。

## 部署前必须确认

- 不要把 `.env` 或真实 DeepSeek API Key 提交到 GitHub。
- 线上只通过平台环境变量或服务器 `.env.production` 保存密钥。
- 当前数据默认存储在 `/app/data/store.json`，生产环境必须挂载持久化磁盘或 Docker volume。
- 多人正式使用前，建议下一阶段升级为 PostgreSQL、对象存储、正式登录注册和支付系统。

## 方案一：Render

Render 会读取仓库根目录的 `render.yaml`，用 Dockerfile 构建服务，并把数据盘挂载到 `/app/data`。

步骤：

1. 把项目推送到 GitHub 私有或公开仓库。
2. 登录 Render，选择 New Blueprint。
3. 选择这个仓库。
4. 创建服务时填写环境变量 `AI_API_KEY`，不要写进代码。
5. 部署完成后访问 Render 提供的 `onrender.com` 地址。
6. 在 Render 的 Custom Domains 中绑定自己的域名。

关键环境变量：

```env
AI_API_KEY=你的 DeepSeek Key
AI_API_BASE_URL=https://api.deepseek.com
AI_MODEL_FAST=deepseek-v4-flash
AI_MODEL_REASONER=deepseek-v4-pro
DATA_FILE=/app/data/store.json
```

## 方案二：云服务器 Docker Compose

适合阿里云、腾讯云、华为云、AWS、Lightsail 等 Linux 服务器。

服务器要求：

- Ubuntu 22.04 或 24.04
- 至少 1 核 1GB，建议 2GB 内存起步
- 已安装 Docker 和 Docker Compose
- 安全组开放 80、443 端口

部署步骤：

```bash
git clone <你的仓库地址> careerforge-ai
cd careerforge-ai
cp .env.production.example .env.production
```

编辑 `.env.production`：

```env
AI_API_KEY=你的 DeepSeek Key
DOMAIN=你的域名
```

如果使用 Caddy 自动 HTTPS，还需要在同一个目录创建 `.env`，只放域名：

```env
DOMAIN=example.com
```

启动：

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

查看状态：

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

升级：

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

备份数据：

```bash
docker run --rm -v careerforge-ai_careerforge_data:/data -v "$PWD":/backup alpine tar czf /backup/careerforge-data.tar.gz -C /data .
```

## 线上验证

打开：

```text
https://你的域名/api/health
```

如果返回 `status: ok`，服务已正常运行。

再进入网页：

```text
https://你的域名
```

在知识库或简历分析里选择“快速/专家”，生成一次内容，结果里应显示：

```text
ai:快速:deepseek-v4-flash
ai:专家:deepseek-v4-pro
```

## 后续正式运营建议

- 把 `store.json` 升级到 PostgreSQL。
- 把上传文件和导出报告放到对象存储。
- 加正式账号密码登录、手机号/邮箱验证。
- 把 AI 次数、余额、订单、管理员后台拆成独立模块。
- 加访问限流，避免公开后被刷接口。
