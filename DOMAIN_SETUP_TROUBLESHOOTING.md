# Vercel 域名配置问题排查指南

## 问题现象

Vercel 显示 "Invalid Configuration"，但阿里云 DNS 记录已正确配置。

## 常见原因和解决方案

### 原因一：DNS 服务器未指向阿里云（最常见！）

**问题：** 域名注册商的 DNS 服务器没有指向阿里云，导致 Vercel 无法验证 DNS 记录。

**解决方法：**

1. **检查当前 DNS 服务器：**
   - 登录你的域名注册商（如阿里云域名控制台）
   - 找到域名 `tool-prod.xyz`
   - 查看 "DNS 服务器" 或 "Name Servers" 设置

2. **修改 DNS 服务器：**
   - 如果当前 DNS 服务器不是阿里云的，需要修改为：
     ```
     dns9.hichina.com
     dns10.hichina.com
     ```
   - 在域名注册商处修改 DNS 服务器设置
   - 等待 24-48 小时生效（通常几小时内生效）

3. **验证 DNS 服务器：**
   - 使用在线工具检查：https://whois.net/ 或 https://www.whatsmydns.net/
   - 输入域名，查看 DNS 服务器是否正确

### 原因二：DNS 记录还未生效

**问题：** DNS 记录配置后需要时间传播到全球 DNS 服务器。

**解决方法：**

1. **等待 DNS 生效：**
   - 通常需要 10 分钟到 48 小时
   - 可以设置较短的 TTL（如 600 秒）加快生效

2. **验证 DNS 记录：**
   - 使用命令行工具检查：
     ```bash
     # Windows PowerShell
     nslookup tool-prod.xyz
     
     # 或使用在线工具
     https://www.whatsmydns.net/#A/tool-prod.xyz
     ```
   - 确认返回的 IP 是 `216.198.79.1`

3. **在 Vercel 中刷新：**
   - 点击 "Refresh" 按钮
   - 等待几分钟后再次检查

### 原因三：域名状态问题

**问题：** 域名可能处于异常状态（未实名、未备案、被锁定等）。

**解决方法：**

1. **检查域名状态：**
   - 登录阿里云域名控制台
   - 查看域名状态，确保：
     - ✅ 已实名认证
     - ✅ 域名未被锁定
     - ✅ 域名状态正常

2. **国内域名备案：**
   - 如果使用 `.cn` 等国内域名，可能需要备案
   - `.xyz` 等国际域名通常不需要备案

### 原因四：DNS 记录配置错误

**问题：** DNS 记录虽然配置了，但可能有细微错误。

**解决方法：**

1. **检查记录详情：**
   - 主机记录：必须是 `@`（不是 `www` 或其他）
   - 记录类型：必须是 `A`
   - 记录值：必须是 `216.198.79.1`（完全一致，不能有空格）
   - TTL：建议设置为 `600`（10分钟）或更短

2. **删除并重新添加：**
   - 删除现有的 A 记录
   - 等待几分钟
   - 重新添加 A 记录：
     - 主机记录：`@`
     - 记录类型：`A`
     - 记录值：`216.198.79.1`
     - TTL：`600`

### 原因五：Vercel 域名配置问题

**问题：** Vercel 中的域名配置可能有误。

**解决方法：**

1. **检查 Vercel 域名配置：**
   - 进入 Vercel 项目 → Settings → Domains
   - 确认域名 `tool-prod.xyz` 已添加
   - 如果显示错误，点击 "Remove" 删除
   - 重新添加域名

2. **等待验证：**
   - Vercel 会自动验证 DNS 记录
   - 验证可能需要几分钟到几小时

## 完整排查步骤

### 第一步：检查 DNS 服务器

1. 登录域名注册商控制台
2. 找到域名 `tool-prod.xyz`
3. 查看 DNS 服务器设置
4. 如果不是阿里云的 DNS 服务器，修改为：
   ```
   dns9.hichina.com
   dns10.hichina.com
   ```
5. 等待 24-48 小时生效

### 第二步：验证 DNS 记录

使用命令行或在线工具验证：

```bash
# Windows PowerShell
nslookup tool-prod.xyz

# 应该返回：
# Name:    tool-prod.xyz
# Address:  216.198.79.1
```

或访问：https://www.whatsmydns.net/#A/tool-prod.xyz

### 第三步：检查阿里云 DNS 配置

1. 登录阿里云控制台 → 云解析 DNS
2. 确认 A 记录存在：
   - 主机记录：`@`
   - 记录类型：`A`
   - 记录值：`216.198.79.1`
   - 状态：已启用
   - TTL：建议 600 秒

### 第四步：在 Vercel 中验证

1. 进入 Vercel 项目 → Settings → Domains
2. 找到域名 `tool-prod.xyz`
3. 点击 "Refresh" 按钮
4. 等待几分钟
5. 如果还是显示 "Invalid Configuration"，检查错误详情

### 第五步：等待 DNS 传播

- DNS 更改需要时间传播到全球
- 通常 10 分钟到 48 小时
- 可以设置较短的 TTL 加快生效

## 快速检查清单

- [ ] DNS 服务器已指向阿里云（`dns9.hichina.com` 和 `dns10.hichina.com`）
- [ ] 阿里云中已配置 A 记录（`@` → `216.198.79.1`）
- [ ] DNS 记录状态为"已启用"
- [ ] 使用 `nslookup` 或在线工具验证 DNS 解析正确
- [ ] 域名状态正常（已实名、未锁定）
- [ ] 在 Vercel 中点击 "Refresh" 重新验证
- [ ] 等待足够的时间让 DNS 生效（至少 10 分钟）

## 常见错误信息

### "Invalid Configuration"
- **原因：** DNS 记录未生效或 DNS 服务器未指向正确位置
- **解决：** 检查 DNS 服务器设置，等待 DNS 传播

### "DNS server configuration is abnormal"
- **原因：** 域名注册商的 DNS 服务器未指向阿里云
- **解决：** 在域名注册商处修改 DNS 服务器为阿里云的 DNS

### "Domain not found"
- **原因：** 域名未正确添加到 Vercel
- **解决：** 在 Vercel 中重新添加域名

## 需要帮助？

如果按照以上步骤仍无法解决，请提供：
1. 域名注册商的 DNS 服务器设置截图
2. `nslookup tool-prod.xyz` 的命令行输出
3. Vercel 中显示的具体错误信息
4. 阿里云 DNS 记录的完整截图

