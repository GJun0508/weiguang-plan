# 微光计划动态内容与账号系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不触碰冻结捐款模块的前提下，为微光计划增加 Supabase 动态内容、账号、关注和管理员维护能力。

**Architecture:** 原生多页面 HTML/CSS/JS，新增共享 Supabase 客户端与按职责拆分的浏览器模块；静态托管只负责页面，RLS 负责所有数据边界。首页动态化保留静态回退，详情、账号和管理页独立加载。

**Tech Stack:** 原生 HTML/CSS/JavaScript、Supabase JS v2、Supabase SQL/RLS、GitHub Pages。

**Spec:** `docs/superpowers/specs/2026-09-24-dynamic-content-auth-design.md`

## Global Constraints

- 不修改 `donation.js`、`donation.css`、`shared-stars.js`、`star-store.js`、`donation_stars` 表和现有测试支付流程。
- 不添加 `user_id` 到捐款数据，不添加“我的捐款/订单/支付记录”。
- 浏览器只使用 Supabase URL 与 publishable/anon key；不得提交 service role key、数据库密码或支付密钥。
- GitHub Pages 使用 `/weiguang-plan/` 子路径；动态失败必须可回退且不白屏。

## Review Focus

- Supabase 未配置或请求失败时：首页、详情、账本仍显示可理解的状态；Task 3 tests request failure fallback.
- 未登录用户直接打开 account/admin、刷新或返回时：会话状态和中文错误正确；Task 4 tests auth guards.
- 普通用户直接调用 REST 修改内容：RLS 拒绝；Task 2 SQL policy checks and Task 5 policy verification.
- 旧捐款 HTML/JS/CSS/schema 发生漂移：部署前 hash/byte comparison fails; Task 6 regression test.
- `/weiguang-plan/` 子路径和不存在 slug：资源地址与 404 行为正确；Task 3 page smoke tests.

### Task 1: Baseline isolation and dynamic schema

**Files:**
- Create: `supabase/migrations/20260924_dynamic_content.sql`
- Create: `work/test_dynamic_schema.py`
- Modify: `README.md`
- Create: `.env.example`

**Interfaces:** Migration creates `profiles`, `projects`, `project_updates`, `project_follows`, `site_stats`, `ledger_entries`, `is_admin()`, seed-free RLS and auth trigger. It does not mention or alter `donation_stars`.

- [ ] Write failing contract tests for table names, columns, constraints, RLS, admin function and absence of donation-table mutations.
- [ ] Run `python3 -m unittest work/test_dynamic_schema.py -v` and observe expected missing migration failure.
- [ ] Write migration with idempotent-safe creation, profile trigger, public select policies, owner profile/follow policies and admin policies.
- [ ] Add `.env.example` and README sections for Auth Site URL, Redirect URL, migration order, public key and admin promotion.
- [ ] Run schema contract tests and commit `feat: add dynamic content schema`.

### Task 2: Shared client and authentication

**Files:**
- Create: `supabase-client.js`
- Create: `auth.js`
- Create: `auth.html`
- Create: `account.html`
- Create: `work/test_auth_modules.mjs`

**Interfaces:** `window.weiguangSupabase`, `window.weiguangAuth.getSession()`, `requireUser()`, `signOut()`, `showAuthDialog(mode)`, and `window.weiguangProfile` helpers. Auth uses email/password and Supabase recovery links.

- [ ] Write failing Node behavior tests for configured/unconfigured client, session restoration, sign-in error copy and protected-page redirect.
- [ ] Implement browser-safe client and auth module without touching donation scripts.
- [ ] Add branded login/register/reset UI and account profile/follows placeholders with accessible labels.
- [ ] Run Node tests and commit `feat: add branded auth and account shell`.

### Task 3: Dynamic home and project detail

**Files:**
- Create: `projects.js`
- Create: `project-detail.js`
- Create: `project.html`
- Create: `work/test_dynamic_pages.mjs`
- Modify: `index.html`, `script.js`, `theme.css`, `scripts/build-static.mjs`

**Interfaces:** `weiguangProjects.listPublished()`, `getBySlug(slug)`, `renderHomeProjects(container, options)`, `renderProjectDetail(root, project)`. Existing donation markup and scripts remain byte-identical in the preserved section.

- [ ] Write tests for published filtering, loading/error/empty states, safe text rendering and `/weiguang-plan/project.html?slug=` URLs.
- [ ] Implement dynamic project cards and detail rendering with static fallback cards, lazy images, timeline and support button that dispatches the existing `.js-support` click.
- [ ] Add page asset copying and ensure scripts load after existing `script.js` while before no donation dependency is altered.
- [ ] Run page tests and commit `feat: render projects from supabase`.

### Task 4: Follows and profile center

**Files:**
- Create: `project-follows.js`
- Create: `profile.js`
- Modify: `account.html`, `project.html`, `theme.css`
- Modify: `work/test_auth_modules.mjs`

**Interfaces:** `weiguangFollows.isFollowing(projectId)`, `toggle(projectId)`, `listMine()`, `weiguangProfile.load()`, `saveProfile(input)`.

- [ ] Add failing tests for owner-scoped follow toggles and profile validation.
- [ ] Implement optimistic follow button with login prompt, rollback on failure, and account list rendering.
- [ ] Implement nickname/bio/public-name/password controls without any donation/order UI.
- [ ] Run auth/follow tests and commit `feat: add project follows and profile center`.

### Task 5: Dynamic ledger, stats and admin

**Files:**
- Create: `ledger.js`
- Create: `admin.js`
- Create: `admin.html`
- Create: `work/test_admin_ledger.mjs`
- Modify: `index.html`, `theme.css`, `scripts/build-static.mjs`

**Interfaces:** `weiguangLedger.list(filters)`, `renderLedger(container)`, `weiguangAdmin.requireAdmin()`, CRUD methods for projects, updates, stats and ledger entries.

- [ ] Write tests for ledger filters, admin guard, validation and non-admin rejection handling.
- [ ] Implement dynamic public ledger and stats with filter controls, loading/error/empty states and source note.
- [ ] Implement minimal admin CRUD forms with disabled saving state, success/error live region, publish toggles and project/update/ledger sections.
- [ ] Run admin/ledger tests and commit `feat: add dynamic ledger and admin console`.

### Task 6: Regression, responsive verification and deployment docs

**Files:**
- Create: `work/test_donation_freeze.py`
- Modify: `README.md`, `scripts/build-static.mjs`, `dist/*`

**Interfaces:** build includes all new pages/modules; frozen donation files and schema checksums remain unchanged from baseline.

- [ ] Add regression tests for frozen donation file hashes, script ordering, test-mode copy and shared-star interfaces.
- [ ] Run Python and Node suites, static build, `git diff --check`, and a local HTTP smoke test at desktop/mobile viewport sizes.
- [ ] Update README with deployment, Auth URLs, migration order, admin promotion and payment limitations.
- [ ] Commit `test: protect donation module during dynamic upgrade`.
- [ ] Merge to `main`, push source and `gh-pages`, verify Pages status and report any CDN propagation delay.
