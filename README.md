<div align="center">
  <img src="client/public/logo-v2.png" alt="Gethub Logo" width="120" height="120" />
  <h1>Gethub</h1>
  <p>🚀 基于 AI 的 GitHub 项目发现与分析平台</p>

  [![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
  [![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=Prisma&logoColor=white)](https://www.prisma.io/)
</div>

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

## 🚀 快速开始

### 前置要求
- [Docker](https://www.docker.com/) & Docker Compose
- Node.js (仅用于本地开发)

### 部署步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/dick86114/Gethub.git
   cd Gethub
   ```

2. **配置环境变量**
   复制示例配置文件并填入你的实际配置：
   ```bash
   cp .env.example .env
   ```
   编辑 `.env` 文件，设置数据库连接和 JWT 密钥：
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/gethub
   JWT_SECRET=your-secure-secret-key
   ```

3. **启动服务**
   使用 Docker Compose 一键启动：
   ```bash
   docker compose up -d --build
   ```

4. **访问应用**
   - 前端页面：`http://localhost:8080`
   - 后端 API：`http://localhost:3000`

## ⚙️ 开发指南

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
