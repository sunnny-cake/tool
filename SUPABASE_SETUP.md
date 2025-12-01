# Supabase 配置指南

本指南将帮助您完成 Supabase 账号注册、项目创建和 API 密钥配置。

## 第一步：注册 Supabase 账号

1. 访问 Supabase 官网：https://supabase.com
2. 点击右上角的 **"Start your project"** 或 **"Sign Up"** 按钮
3. 选择注册方式：
   - 使用 GitHub 账号登录（推荐）
   - 使用邮箱注册
4. 完成账号注册和邮箱验证

## 第二步：创建新项目

1. 登录后，点击 **"New Project"** 按钮
2. 填写项目信息：
   - **Organization（组织）**：选择或创建一个组织
   - **Name（项目名称）**：输入项目名称，例如：`teaching-material-collector`
   - **Database Password（数据库密码）**：设置一个强密码（**请务必记住此密码**）
   - **Region（区域）**：选择离您最近的区域（例如：East Asia (Tokyo)）
3. 点击 **"Create new project"** 按钮
4. 等待项目创建完成（通常需要 1-2 分钟）

## 第三步：创建数据库表

1. 在项目控制台中，点击左侧菜单的 **"Table Editor"**
2. 点击 **"Create a new table"** 按钮
3. 填写表信息：
   - **Name（表名）**：输入 `submissions`
   - **Description（描述）**：`教辅信息提交表`（可选）
4. 添加以下字段（点击 **"Add Column"**）：

   | 列名 | 类型 | 是否必填 | 默认值 | 说明 |
   |------|------|---------|--------|------|
   | id | int8 | 是 | 自动递增 | 主键（自动创建） |
   | device_serial | text | 是 | - | 设备序列号 |
   | phone_number | text | 是 | - | 手机号 |
   | isbn | text | 是 | - | ISBN |
   | cover_image_url | text | 否 | - | 封皮图片URL |
   | copyright_image_url | text | 否 | - | 版权页图片URL |
   | created_at | timestamptz | 是 | now() | 创建时间 |

5. 点击 **"Save"** 保存表结构

## 第四步：创建存储桶（用于存储图片）

1. 在项目控制台中，点击左侧菜单的 **"Storage"**
2. 点击 **"Create a new bucket"** 按钮
3. 填写存储桶信息：
   - **Name（名称）**：输入 `images`
   - **Public bucket（公开存储桶）**：**勾选此项**（这样图片才能通过URL访问）
4. 点击 **"Create bucket"** 创建存储桶
5. 创建存储桶后，点击存储桶名称进入详情页
6. 点击 **"Policies"** 标签页，然后点击 **"New Policy"**
7. 选择 **"For full customization"**，然后使用以下策略（允许公开读取）：

```sql
-- 允许所有人读取图片
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );
```

8. 点击 **"Review"** 然后 **"Save policy"**

## 第五步：获取 API 密钥

1. 在项目控制台中，点击左侧菜单的 **"Settings"**（设置图标）
2. 点击 **"API"** 子菜单
3. 在 **"Project API keys"** 部分，您会看到两个密钥：
   - **anon public**：用于客户端（前端）访问
   - **service_role secret**：用于服务器端（后端）访问（**请保密，不要泄露**）
4. 复制以下信息：
   - **Project URL**：例如 `https://xxxxx.supabase.co`
   - **service_role key**：以 `eyJ...` 开头的长字符串

## 第六步：配置环境变量

### 本地开发环境

1. 在项目根目录创建 `.env` 文件（如果不存在）
2. 在 `.env` 文件中添加以下内容：

```
SUPABASE_URL=您的Project URL
SUPABASE_KEY=您的service_role key
```

**示例：**
```
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. **重要**：确保 `.env` 文件已添加到 `.gitignore` 中（不要提交到代码仓库）

### Vercel 部署环境

在 Vercel 部署时，需要在项目设置中添加环境变量（详见 VERCEL_DEPLOY.md）

## 验证配置

配置完成后，您可以：

1. 运行项目：`npm install` 然后 `npm start`
2. 访问 `http://localhost:3000` 打开表单页面
3. 填写并提交一条测试数据
4. 在 Supabase 控制台的 **"Table Editor"** 中查看是否成功保存数据
5. 在 **"Storage"** 中查看是否成功上传图片

## 常见问题

### Q: 图片上传后无法访问？
A: 请确保：
- 存储桶设置为 **Public bucket**
- 已创建允许公开读取的策略（Policy）
- 使用 `getPublicUrl` 方法获取图片URL

### Q: 数据库插入失败？
A: 请检查：
- 表名是否为 `submissions`
- 字段名是否与代码中的一致（使用下划线命名：`device_serial` 而不是 `deviceSerial`）
- API 密钥是否正确（使用 `service_role` 密钥，不是 `anon` 密钥）

### Q: 如何查看已存储的数据？
A: 在 Supabase 控制台：
- **Table Editor**：查看数据库记录
- **Storage**：查看上传的图片文件

## 免费版限制

Supabase 免费版限制：
- 数据库大小：500 MB
- 存储空间：1 GB
- API 请求：每月 50,000 次
- 文件上传：每个文件最大 50 MB

对于本工具（5000条数据），免费版完全够用。

## 需要帮助？

- Supabase 官方文档：https://supabase.com/docs
- Supabase 社区：https://github.com/supabase/supabase/discussions

