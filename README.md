# 微光计划 / WEIGUANG

原生 HTML、CSS、JavaScript 的公益内容网站，使用 GitHub Pages 托管前端，Supabase 提供动态内容和共享星空能力。

## 本地运行

```bash
python3 -m http.server 4176
```

然后打开 `http://localhost:4176/`。浏览器端只需要 `supabase-config.js` 中的 URL 和 publishable/anon key；不要提交 service role key、数据库密码或支付密钥。

## Supabase 配置顺序

1. 保留既有 `supabase/donation_stars.sql`，不要重复修改捐款表。
2. 在 SQL Editor 执行 `supabase/migrations/20260924_dynamic_content.sql`。
3. 将 `.env.example` 中的公开配置对应到 `supabase-config.js`。这两个公开值可以出现在浏览器代码中。

迁移会创建 `projects`、`project_updates`、`site_stats` 和 `ledger_entries`，并为每张表启用 RLS。公开内容仅能读取已发布记录。早期版本若已经创建账号表，可额外执行 `supabase/migrations/20260924_remove_user_system.sql` 清理旧用户表。

## 发布内容

项目详情使用 `/project.html?slug=<项目 slug>`。未发布内容不会出现在公开页面；内容维护通过 Supabase SQL Editor 完成。

## 捐款系统边界

当前捐款仍是独立的测试系统：不会调用真实微信、支付宝或银行卡支付，不会生成用户捐款历史或订单中心。`donation.js`、`donation.css`、`shared-stars.js`、`star-store.js` 和 `donation_stars` 表保持独立。
