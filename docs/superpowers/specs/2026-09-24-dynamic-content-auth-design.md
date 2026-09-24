# 微光计划动态内容与账号系统设计

## 目标

在 GitHub Pages 的静态前端上增加 Supabase 驱动的项目内容、项目动态、公开账本、账号资料、项目关注和管理员维护能力，同时保持现有模拟捐款系统完全独立、可回退且行为不变。

## 边界

`donation.js`、`donation.css`、`shared-stars.js`、`star-store.js`、`supabase/donation_stars.sql` 以及现有捐款 HTML 和测试订单流程是冻结模块。新代码只通过公共按钮、页面容器和 Supabase 客户端与它们相邻，不向捐款记录加入 `user_id`，不创建捐款历史或订单页面。

## 架构

- 保留原生 HTML/CSS/JavaScript 与 GitHub Pages 子路径部署。
- `supabase-client.js` 只创建一个无持久化管理权限的浏览器客户端；所有新表使用 RLS。
- 首页保留杂志式首屏和捐款弹窗，但项目区、统计区、账本区由动态脚本填充；请求失败时保留静态内容或显示可重试错误，不白屏。
- `project.html?slug=...` 展示项目详情，`account.html` 展示资料和关注项目，`admin.html` 只允许管理员进入。
- `auth.js` 负责会话、注册、登录、重置密码和导航；`projects.js`、`project-detail.js`、`project-follows.js`、`ledger.js`、`profile.js`、`admin.js` 各自负责一个数据/页面边界。

## 数据模型与安全

新增 `profiles`、`projects`、`project_updates`、`project_follows`、`site_stats`、`ledger_entries` 六张表。公开查询仅返回 `published = true` 的内容；个人资料与关注关系按 `auth.uid()` 限制；管理写入通过 `is_admin()` 安全函数和管理员策略强制执行。迁移使用 `create table if not exists`、唯一约束、检查约束和明确的执行顺序，不修改任何捐款表或其策略。

管理员角色只存在于 `profiles.role`，默认 `member`；插入 profile 的触发器只允许为新用户创建普通 profile。管理员需由 Supabase SQL Editor 或受信任迁移显式提升，浏览器永远不接触 service role key。

## 体验与失败处理

- 加载状态使用骨架/短文本，错误显示中文说明和重试按钮。
- 用户未登录可以浏览项目、详情和账本，但关注、个人资料和管理操作会引导登录。
- 所有表单使用原生 label、`aria-live` 错误区和键盘可操作按钮；页面支持 GitHub Pages `/weiguang-plan/` 子路径。
- 详情页支持直接刷新和不存在 slug 的 404 状态；未配置 Supabase 时开发环境仍可用静态回退内容。

## 验收

覆盖动态读取、认证状态、关注 RLS、管理员 RLS、账本筛选、失败回退、响应式布局和捐款冻结回归。README 记录迁移顺序、Auth URL、角色配置和公开/私密 key 边界。
