<div align="center">
  <img src="client/public/logo-v2.png" alt="Gethub Logo" width="120" height="120" />
  <h1>Gethub</h1>
  <p>🚀 基于 AI 的 GitHub 项目发现与分析平台</p>

  [![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
  [![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=Prisma&logoColor=white)](https://www.prisma.io/)
</div>

## 效果图
![alt text](image.png)
![alt text](image-1.png)

---

## 📅 v2.0 更新日志 (2026-01-22)

Gethub 2.0 正式发布！本次大版本更新带来了全新的 UI 风格、更完善的移动端体验以及企业级的部署支持。

### ✨ 核心更新
- **🎨 UI 风格全面统一**：
  - 移除了浅色模式，全站强制采用沉浸式暗色主题。
  - 登录页与确认弹窗升级为 Glassmorphism（暗色玻璃拟态）风格，视觉体验高度一致。
  - 新增统一的 `ConfirmModal` 组件，替换了原生的系统确认框，交互更加优雅。
- **📱 移动端深度优化**：
  - 顶部搜索框在移动端优化为折叠式图标，释放宝贵的屏幕空间。
  - 详情页 "AI深度分析" 按钮图标化，布局更加紧凑。
- **⚙️ 功能增强**：
      - 搜索框新增一键清空功能。
      - **搜索能力大幅升级**：支持对项目名称、描述及 AI 摘要的全文检索，并引入索引优化，响应速度飞快。
      - 优化了无效项目清理逻辑：现在会保留无描述但拥有 README 的项目，防止误删。
- **🚀 部署与运维**：
  - **CI/CD 集成**：新增 GitHub Actions 工作流，支持自动构建 Docker 镜像并发布到 GHCR 和 Docker Hub。
  - **灵活部署**：支持连接远程数据库部署模式，满足多样化架构需求。
  - **数据库保障**：新增启动时自动迁移与初始化脚本，防止因数据库未初始化导致的服务不可用。

---

## 📅 v1.0 更新日志 (2026-01-22)

我们很高兴地发布 Gethub v1.0 版本！本次更新主要集中在移动端体验优化、后台功能增强以及系统架构的完善。

### ✨ 新增功能
- **后台管理增强**：
  - 新增修改密码功能，管理员可随时更新登录凭证。
  - 登录页支持回车键（Enter）直接登录，提升操作便捷性。
- **UI/UX 升级**：
  - 启用了全新的品牌 Logo 和 Favicon。
  - 优化了项目详情页展示，AI 分析报告与原始 README 分屏展示更直观。
  - 全新的 Glassmorphism（毛玻璃）设计风格，界面更加现代。

### ⚡ 性能优化
- **移动端流畅度大幅提升**：
  - 对核心组件（RepoCard, Navbar）进行了深度 Memoization 优化，减少不必要的重渲染。
  - 优化了触摸滑动事件处理，禁用了移动端高开销的阴影动效。
  - 引入 `will-change: transform` 属性，利用 GPU 加速提升列表滚动性能。
- **资源加载优化**：
  - 图片全面启用 Lazy Loading（懒加载）。
  - 静态资源配置了强缓存策略，并配合版本号机制解决更新延迟问题。

### 🛠️ 架构与部署
- **Docker 化部署**：
  - 完善了 Dockerfile 和 docker-compose 配置，支持一键构建与部署。
  - 前后端分离部署（Nginx + Node.js），生产环境更加稳定。
- **安全性升级**：
  - 敏感配置（数据库连接、JWT 密钥）完全抽离至 `.env` 文件，防止代码库泄露。

---

## 📖 项目介绍

**Gethub** 是一个智能化的 GitHub 项目探索平台。它不仅仅是一个简单的 GitHub 客户端，更利用先进的大语言模型（LLM）技术，自动对 GitHub 上的热门项目进行深度分析和摘要。

通过 Gethub，你可以：
- **快速发现**：浏览精选的热门 GitHub 项目。
- **AI 解读**：阅读由 AI 生成的项目核心摘要、功能特性和应用场景，无需啃生涩的 README。
- **高效管理**：管理员后台支持定时任务抓取、手动添加项目以及配置 AI 模型参数。

## ✨ 核心特性

- **🤖 AI 智能分析**：集成 Google Gemini、DeepSeek、SiliconCloud 等多种 AI 模型，自动生成项目摘要。
- **📱 响应式设计**：完美适配桌面端与移动端，随时随地探索开源世界。
- **🔍 强大的后台管理**：
  - 可视化配置系统参数。
  - 管理已收录的项目库。
  - 实时查看后台任务状态。
- **🎨 现代化交互**：流畅的动画效果，沉浸式的深色模式体验。

## 🛠️ 技术栈

- **前端**：React, Vite, TypeScript, TailwindCSS, Framer Motion
- **后端**：Node.js, Express, TypeScript
- **数据库**：PostgreSQL, Prisma ORM
- **部署**：Docker, Docker Compose, Nginx

## 🚀 部署指南

我们提供了多种部署方式，你可以根据实际需求选择最适合的一种。

### 方式一：Docker Compose 一键部署（推荐）

最简单的部署方式，内置 PostgreSQL 数据库，开箱即用。

1. **下载配置文件**
   下载项目中的 `docker-compose.yml` 文件。

2. **配置环境变量**
   创建一个 `.env` 文件（可参考 `.env.example`），配置必要的参数：
   ```env
   # 项目配置
   GITHUB_REPOSITORY_OWNER=dick86114  # 镜像拉取源
   
   # 数据库配置（内置数据库会自动使用这些凭据）
   DB_USER=gethub
   DB_PASSWORD=gethub_pass
   DB_NAME=gethub
   
   # 安全配置
   JWT_SECRET=please_change_this_to_a_random_secret_string
   
   # 端口配置
   SERVER_PORT=3000
   CLIENT_PORT=8080
   ```

3. **启动服务**
   ```bash
   docker compose up -d
   ```

### 方式二：连接远程数据库部署

如果你已经有现成的 PostgreSQL 数据库服务（如云数据库或独立的数据库服务器），可以使用此方式。

1. **下载配置文件**
   下载项目中的 `docker-compose-remote.yml` 文件。

2. **配置环境变量**
   配置 `.env` 文件，重点是 `DATABASE_URL`：
   ```env
   # 远程数据库连接字符串
   # 格式: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public
   DATABASE_URL=postgresql://admin:password@192.168.1.100:5432/gethub?schema=public
   
   # 其他配置
   GITHUB_REPOSITORY_OWNER=dick86114
   JWT_SECRET=your_secure_secret
   SERVER_PORT=3000
   CLIENT_PORT=8080
   ```

3. **启动服务**
   使用 `-f` 参数指定配置文件启动：
   ```bash
   docker compose -f docker-compose-remote.yml up -d
   ```

### 验证部署

部署完成后，访问以下地址：
- **前端页面**：`http://localhost:8080` (或你配置的 `CLIENT_PORT`)
- **后台管理**：点击页面右上角的设置图标，默认账户 `admin` / `admin123`

---

## ⚙️ 本地开发指南

如果你想在本地运行源码进行开发：

1. **安装依赖**
   ```bash
   # 安装根目录依赖
   pnpm install

   # 安装前端依赖
   cd client && pnpm install

   # 安装后端依赖
   cd ../server && npm install
   ```

2. **启动开发服务器**
   ```bash
   # 根目录下运行
   npm run dev
   ```

## 📄 许可证

[MIT License](LICENSE)
