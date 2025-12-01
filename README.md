<<<<<<< HEAD
# 教辅信息收集工具

一个基于 Node.js + Express + Supabase 的教辅信息收集工具，支持表单提交、图片上传和数据导出功能。

## 功能特性

- ✅ 简洁美观的表单界面
- ✅ 表单验证（必填项、手机号格式校验）
- ✅ 图片上传（封皮、版权页）
- ✅ 上传进度显示
- ✅ 数据存储到 Supabase（支持 5000+ 条数据）
- ✅ 后台管理页面
- ✅ Excel 导出功能（包含图片链接）
- ✅ 支持 Vercel 一键部署

## 技术栈

- **前端**：HTML + CSS + JavaScript
- **后端**：Node.js + Express
- **数据库**：Supabase（PostgreSQL）
- **文件存储**：Supabase Storage
- **部署**：Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```
SUPABASE_URL=您的Supabase项目URL
SUPABASE_KEY=您的Supabase service_role密钥
```

### 3. 配置 Supabase

请按照 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 文档完成 Supabase 配置：
- 创建数据库表
- 创建存储桶
- 配置访问策略

### 4. 启动项目

```bash
npm start
```

访问：
- 表单页面：http://localhost:3000
- 后台管理：http://localhost:3000/admin.html

## 项目结构

```
.
├── server.js              # Express 服务器
├── package.json           # 项目依赖
├── vercel.json           # Vercel 部署配置
├── public/               # 前端静态文件
│   ├── index.html        # 表单页面
│   ├── admin.html        # 后台管理页面
│   ├── style.css         # 表单样式
│   ├── admin.css         # 后台样式
│   ├── script.js         # 表单脚本
│   └── admin.js          # 后台脚本
├── SUPABASE_SETUP.md     # Supabase 配置指南
├── VERCEL_DEPLOY.md      # Vercel 部署指南
└── README.md             # 项目说明
```

## 部署到 Vercel

请按照 [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) 文档完成部署：

1. 将代码推送到 Git 仓库
2. 在 Vercel 导入项目
3. 配置环境变量
4. 一键部署

## 表单字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 设备序列号 | 文本 | 是 | 例如：70303D08511200091 |
| 手机号 | 文本 | 是 | 11位数字，1开头，第二位3-9 |
| ISBN | 文本 | 是 | 支持手动输入或扫描（需集成SDK） |
| 封皮图片 | 图片 | 是 | JPG/PNG，最大10MB |
| 版权页图片 | 图片 | 否 | JPG/PNG，最大10MB |

## API 接口

### POST /api/submit
提交表单数据

**请求：**
- Content-Type: multipart/form-data
- 字段：deviceSerial, phoneNumber, isbn, coverImage, copyrightImage（可选）

**响应：**
```json
{
  "success": true,
  "message": "提交成功！",
  "data": { ... }
}
```

### GET /api/submissions
获取所有提交数据

**响应：**
```json
{
  "success": true,
  "data": [ ... ],
  "count": 100
}
```

### GET /api/export-excel
导出Excel文件

**响应：**
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- 文件下载

## 代码注释说明

代码中包含详细的中文注释，方便修改：

- **样式修改**：编辑 `public/style.css` 和 `public/admin.css`
- **字段修改**：修改 `public/index.html` 表单字段，同步修改 `server.js` 中的验证逻辑
- **验证规则**：在 `public/script.js` 中修改前端验证，在 `server.js` 中修改后端验证

## 注意事项

1. **Supabase 密钥安全**：
   - 使用 `service_role` 密钥（服务器端）
   - 不要在前端代码中暴露密钥
   - 不要将 `.env` 文件提交到 Git

2. **图片存储**：
   - 图片存储在 Supabase Storage
   - 存储桶需设置为 Public 才能通过 URL 访问
   - 免费版限制：1GB 存储空间

3. **数据量限制**：
   - Supabase 免费版：500MB 数据库
   - 本工具支持 5000+ 条数据
   - 如需更多，可升级 Supabase 计划

4. **扫描功能**：
   - 当前为占位按钮
   - 实际使用时需集成扫码 SDK（如微信 JS-SDK、ZXing 等）

## 许可证

MIT

## 支持

如有问题，请查看：
- [Supabase 配置指南](./SUPABASE_SETUP.md)
- [Vercel 部署指南](./VERCEL_DEPLOY.md)

=======
# tool
>>>>>>> 66068baf01f98bb12bf6c610263b9ca7b37beb2a
