# Vercel 部署指南

本指南将帮助您将教辅信息收集工具部署到 Vercel 平台。

## 前置要求

1. 已完成 Supabase 配置（详见 SUPABASE_SETUP.md）
2. 已获取 Supabase 的 Project URL 和 service_role key
3. 拥有 GitHub 账号（用于登录 Vercel）

## 第一步：准备代码

1. 确保项目代码已提交到 Git 仓库（GitHub、GitLab 或 Bitbucket）
   - 如果没有 Git 仓库，可以在 GitHub 上创建一个新仓库并推送代码

2. 确保以下文件存在：
   - `package.json`
   - `vercel.json`
   - `server.js`
   - `public/` 目录及所有前端文件

## 第二步：登录 Vercel

1. 访问 Vercel 官网：https://vercel.com
2. 点击右上角的 **"Sign Up"** 或 **"Log In"**
3. 选择使用 **GitHub** 账号登录（推荐，最简单）
4. 授权 Vercel 访问您的 GitHub 账号

## 第三步：导入项目

1. 登录后，点击 **"Add New..."** → **"Project"**
2. 在 **"Import Git Repository"** 页面，选择您的代码仓库
   - 如果看不到仓库，点击 **"Adjust GitHub App Permissions"** 调整权限
3. 选择仓库后，点击 **"Import"**

## 第四步：配置项目

### 4.1 项目设置

Vercel 会自动检测项目配置，通常无需修改：

- **Framework Preset**：Other（或自动检测）
- **Root Directory**：`./`（项目根目录）
- **Build Command**：留空（Node.js 项目不需要构建）
- **Output Directory**：留空
- **Install Command**：`npm install`（默认）

### 4.2 环境变量配置（重要！）

1. 在项目配置页面，找到 **"Environment Variables"** 部分
2. 点击展开，添加以下环境变量：

   **变量 1：**
   - **Name（名称）**：`SUPABASE_URL`
   - **Value（值）**：您的 Supabase Project URL
     - 例如：`https://abcdefghijklmnop.supabase.co`
   - **Environment（环境）**：选择所有环境（Production、Preview、Development）

   **变量 2：**
   - **Name（名称）**：`SUPABASE_KEY`
   - **Value（值）**：您的 Supabase service_role key
     - 例如：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Environment（环境）**：选择所有环境（Production、Preview、Development）

3. 点击 **"Add"** 添加每个变量

**⚠️ 重要提示：**
- `SUPABASE_KEY` 必须使用 **service_role** 密钥（不是 anon 密钥）
- 环境变量添加后，需要重新部署才能生效

### 4.3 部署设置

1. 检查 **"Deploy Settings"**：
   - **Build Command**：留空或删除
   - **Output Directory**：留空或删除
   - **Install Command**：`npm install`

2. 点击 **"Deploy"** 按钮开始部署

## 第五步：等待部署完成

1. 部署过程通常需要 1-3 分钟
2. 您可以在部署日志中查看进度
3. 部署成功后，Vercel 会显示：
   - ✅ 部署成功
   - 🔗 项目访问链接（例如：`https://your-project.vercel.app`）

## 第六步：验证部署

1. 访问 Vercel 提供的项目链接
2. 测试表单提交功能：
   - 填写测试数据
   - 上传测试图片
   - 提交表单
3. 访问后台管理页面：
   - 在项目链接后添加 `/admin.html`
   - 例如：`https://your-project.vercel.app/admin.html`
4. 验证数据：
   - 在 Supabase 控制台查看数据是否成功保存
   - 在后台管理页面查看数据列表
   - 测试 Excel 导出功能

## 第七步：自定义域名（可选）

如果需要使用自定义域名：

1. 在 Vercel 项目页面，点击 **"Settings"** → **"Domains"**
2. 输入您的域名（例如：`collector.example.com`）
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟到几小时）

## 自动部署

配置完成后，Vercel 会自动：

- **自动部署**：每次推送到 Git 仓库的主分支时，自动触发部署
- **预览部署**：每次创建 Pull Request 时，自动创建预览环境
- **部署通知**：可以通过邮件或 Slack 接收部署通知

## 环境变量管理

### 更新环境变量

1. 在 Vercel 项目页面，点击 **"Settings"** → **"Environment Variables"**
2. 编辑或删除现有变量
3. 修改后，需要重新部署才能生效：
   - 点击 **"Deployments"** 标签
   - 找到最新的部署，点击 **"..."** → **"Redeploy"**

### 不同环境使用不同变量

可以为不同环境设置不同的环境变量：
- **Production**：生产环境（主域名）
- **Preview**：预览环境（PR 和分支部署）
- **Development**：开发环境（本地开发）

## 查看日志和监控

1. **部署日志**：
   - 在 **"Deployments"** 页面点击部署记录查看日志
2. **函数日志**：
   - 在 **"Functions"** 页面查看 API 函数执行日志
3. **分析数据**：
   - 在 **"Analytics"** 页面查看访问统计

## 常见问题

### Q: 部署失败，提示找不到模块？
A: 检查：
- `package.json` 中是否包含所有依赖
- 是否在 Vercel 配置中设置了正确的 **Install Command**

### Q: 环境变量不生效？
A: 确保：
- 环境变量名称正确（区分大小写）
- 已选择正确的环境（Production/Preview/Development）
- 部署时已包含环境变量（重新部署）

### Q: API 请求返回 500 错误？
A: 检查：
- Supabase 环境变量是否正确配置
- Supabase 项目是否正常运行
- 查看 Vercel 函数日志中的错误信息

### Q: 图片上传失败？
A: 检查：
- Supabase Storage 存储桶是否已创建
- 存储桶是否设置为 Public
- Storage 策略是否正确配置

### Q: 如何回滚到之前的版本？
A: 在 **"Deployments"** 页面：
1. 找到要回滚的部署记录
2. 点击 **"..."** → **"Promote to Production"**

## 免费版限制

Vercel 免费版（Hobby 计划）限制：
- 带宽：100 GB/月
- 函数执行时间：10 秒（Serverless Functions）
- 构建时间：45 分钟/月
- 无限项目数量

对于本工具，免费版完全够用。

## 需要帮助？

- Vercel 官方文档：https://vercel.com/docs
- Vercel 社区：https://github.com/vercel/vercel/discussions
- Vercel 支持：https://vercel.com/support

## 部署检查清单

部署前请确认：

- [ ] Supabase 项目已创建并配置完成
- [ ] 数据库表 `submissions` 已创建
- [ ] Storage 存储桶 `images` 已创建并设置为 Public
- [ ] 已获取 Supabase URL 和 service_role key
- [ ] 代码已推送到 Git 仓库
- [ ] Vercel 账号已登录
- [ ] 项目已导入到 Vercel
- [ ] 环境变量 `SUPABASE_URL` 和 `SUPABASE_KEY` 已配置
- [ ] 部署成功并可以访问
- [ ] 表单提交功能正常
- [ ] 图片上传功能正常
- [ ] 后台管理页面可以访问
- [ ] Excel 导出功能正常

