# Pintree 性能优化与功能完善方案（已实施 + 建议）

> 本文档对应本次代码修改，按 **高 / 中 / 低** 优先级分步实施。
> 所有修改均为向后兼容：不改变数据结构、不改变 API 返回字段、不影响既有功能。
> 每项均附「验证方法」，可在开发环境快速验证。

---

## 一、响应速度优化（Performance）

### 1.1 【高】首页/侧边栏 N+1 查询修复 — 已实施

**问题**：`/api/collections` 对每个合集都单独查一次文件夹 + 书签数（N+1）；`/api/collections/[id]/bookmarks` 对每个子文件夹单独查 2 次计数（N+1）。合集/书签多时接口耗时随数据量线性增长。

**修改**：
- `src/app/api/collections/route.ts`：改用 `prisma.bookmark.groupBy` 一次性统计所有合集书签数（1 次查询替代 N 次）。
- `src/app/api/collections/[id]/bookmarks/route.ts`：用 2 次 `groupBy`（按 folderId / parentId）替代逐文件夹计数循环。

**验证方法**：
```bash
# 对比修改前后接口耗时（数据量越大差异越明显）
curl -w "\n耗时: %{time_total}s\n" "http://localhost:3000/api/collections?publicOnly=true" -o /dev/null
# 数据库查询次数：开启 Prisma 日志（DATABASE_URL 配置好后）
# npx prisma studio 或查看控制台 query 日志数量
```

### 1.2 【高】服务端设置查询缓存 — 已实施

**问题**：`src/app/layout.tsx` 每次请求都执行 `information_schema` 原始查询 + 设置表查询，且 `generateMetadata` 与 `RootLayout` 各查一次（重复查询）。

**修改**：
- 新增 `src/lib/settings.ts`：封装 `getSiteSettings()` / `getSiteSetting()`，使用 React `cache()` 在**同一请求渲染周期内去重**，表不存在时自动回退默认值。
- `src/app/layout.tsx`：改为调用 `getSiteSettings()`，删除重复的原始查询逻辑。

**验证方法**：打开任意页面，观察服务端日志中 `SiteSetting` 查询只出现一次；或在 `getSiteSettings` 内临时加 `console.log` 确认只执行一次。

### 1.3 【高】公开接口 Cache-Control（CDN/浏览器缓存）— 已实施

**修改**：
- `/api/collections`（公开模式）：`public, max-age=60, s-maxage=120, stale-while-revalidate=600`
- `/api/collections/[id]/bookmarks`：`public, max-age=30, s-maxage=60, stale-while-revalidate=300`
- 管理端调用（非 `publicOnly`）仍为 `no-store`，保证后台数据实时。

**验证方法**：
```bash
curl -sI "http://localhost:3000/api/collections?publicOnly=true" | grep -i cache-control
# 应看到 Cache-Control: public, max-age=60, ...
```

### 1.4 【高】图片懒加载 — 已实施

**问题**：`BookmarkCard` 使用 `priority={isFeatured}`，精选书签一多会导致首屏请求大量图标；未指定 `sizes`，且所有图标无懒加载语义。

**修改**：`src/components/bookmark/BookmarkCard.tsx` 移除 `priority`，改为 `loading="lazy"` + `decoding="async"` + `sizes="36px"`；列表视图（新增 `BookmarkRow`）同样懒加载。首页骨架屏避免首屏图片堆积。

**验证方法**：Chrome DevTools → Network，过滤 Img，确认页面滚动前只加载视口内图标；快速滚动可见 `Lazy` 加载。

### 1.5 【中】前端设置缓存（TTL + 请求去重）— 已实施

**问题**：`use-settings` 每次组件挂载都重新请求 `/api/settings`；侧边栏、搜索栏等多处重复请求。

**修改**：`src/hooks/use-settings.ts` 增加模块级缓存（60s TTL）、并发请求去重（in-flight promise 共享）、`loadSettings(true)` 强制刷新。

**验证方法**：打开首页，Network 中 `/api/settings` 只出现一次（多个组件共享）；60s 内切页不重复请求。

### 1.6 【低】图片优化器（可选，未改动默认行为）— 建议

`next.config.js` 当前 `unoptimized: true`（原图直出，避免外部图标域名变化导致 500）。若希望启用自动压缩/WebP/响应式裁剪：
1. 将 `unoptimized` 改为 `false`（需确认 `sharp` 已安装——当前依赖中已有）；
2. 保留 `remotePatterns`（`https://**`）以覆盖所有图标域名；
3. 验证各书签图标正常显示、无 500 后上线。

---

## 二、页面体验优化（UX）

### 2.1 【高】首页骨架屏 — 已实施

**问题**：首页加载时只显示转圈 spinner，白屏感明显。

**修改**：`src/app/page.tsx` 新增 `HomeSkeleton`（模拟侧边栏 + 搜索栏 + 卡片网格），首屏数据未返回时展示骨架而非 spinner。

**验证方法**：DevTools → Network 调慢（Slow 3G），刷新首页应看到骨架屏过渡到真实内容，无白屏。

### 2.2 【高】搜索防抖 + 过期响应丢弃 — 已实施

**修改**：
- `src/components/search/SearchBar.tsx`：书签引擎下输入停止 350ms 自动搜索（Enter 仍可立即搜索）；用 ref 保存最新回调避免防抖被反复重置。
- `src/components/bookmark/BookmarkGrid.tsx`：`performBookmarkSearch` 增加请求序号（`searchSeqRef`），丢弃过期响应，防止快速输入时旧结果覆盖新结果。

**验证方法**：搜索框连续快速输入「next js 教程」，Network 中应看到请求节流为 350ms 一次（而非每键一次），最终结果与最后一次输入一致。

### 2.3 【中】视图切换记忆（网格/列表）— 已实施

**修改**：`src/components/bookmark/BookmarkGrid.tsx` 新增网格/列表切换按钮，选择持久化到 `localStorage`（key: `pintree-view-mode`）；新增紧凑列表视图 `BookmarkRow`，搜索结果与书签区均支持两种视图。

**验证方法**：切换到「列表」→ 刷新页面 → 仍为列表；清空 localStorage 后回到默认网格。

### 2.4 【中】暗色模式细节 — 已实施

**修改**：
- `src/app/layout.tsx`：`<head>` 内联脚本在首帧前根据 `localStorage`/系统偏好设置 `dark` class，消除暗色模式闪烁（FOUC）；增加 `color-scheme` meta。
- `src/app/globals.css`：`:root`/`.dark` 分别声明 `color-scheme`；暗色滚动条配色；`::selection` 跟随主题色。

**验证方法**：系统为暗色 + 首次访问（无 localStorage）→ 页面直接以暗色渲染、无白闪；切换主题后刷新无闪烁。

### 2.5 【低】移动端适配细节 — 已实施

**修改**：
- `BookmarkGrid` 容器 `px-8` → `px-4 sm:px-8`（小屏收窄边距），骨架屏同步。
- `src/components/website/header.tsx`：小屏下「新建书签」按钮仅显示图标（`hidden sm:inline`），避免顶栏挤压。

**验证方法**：DevTools 移动端视图（375px 宽）检查首页顶栏不换行、卡片不错位；列表/网格切换按钮在小屏仅显示图标。

---

## 三、后台设置增强（Admin）

### 3.1 【高】批量操作反馈 — 已实施

**问题**：`BookmarkDataTable` 删除失败用 `alert()` 弹窗，无进行中状态；残留大量调试 `console.log`。

**修改**：
- `src/components/bookmark/BookmarkDataTable.tsx`：删除失败改为 `sonner` toast（中文提示），删除按钮增加 loading 态（`Loader2` 旋转图标 + 禁用），成功 toast 提示。
- 清理 `BookmarkDataTable`、`admin/bookmarks/page.tsx`、`admin/settings/basic/page.tsx` 中的调试日志。

**验证方法**：后台删除一个书签 → 弹确认框 → 点删除 → 按钮显示「删除中...」→ 成功后 toast + 列表刷新；断网重试 → toast 报错而非 alert。

### 3.2 【高】设置保存事务化 + 缓存失效 — 已实施

**问题**：`/api/settings` POST 逐条 `findUnique` + `update`（N 次往返）；设置变更后 ISR 缓存不失效。

**修改**：`src/app/api/settings/route.ts` POST 改为 `prisma.$transaction` 批量 `updateMany`（1 个事务），并调用 `revalidatePath('/', 'layout')` 使整站缓存失效；响应返回 `updatedCount`。

**验证方法**：修改网站名称 → 保存 → 返回首页刷新，名称立即生效（无需等缓存过期）；观察 Postgres 日志只产生一个事务。

### 3.3 【高】数据库索引 — 已实施（需执行迁移）

`prisma/schema.prisma` 新增索引（`npm run build` 中的 `prisma db push` 会自动应用；生产建议用迁移）：

| 表 | 索引 | 覆盖场景 |
|---|---|---|
| Collection | `(isPublic, sortOrder)` | 公开合集列表 |
| Folder | `(collectionId, parentId)` / `(collectionId)` / `(parentId)` | 目录树、层级查询 |
| Bookmark | `(collectionId, folderId)` / `(collectionId)` / `(folderId)` / `(updatedAt)` | 书签列表、统计、搜索排序 |
| AccessLog | `(createdAt)` / `(path)` | 日志统计与清理 |

**验证方法**：
```bash
npx prisma db push   # 应用 schema 变更
# 或生产环境：npx prisma migrate dev --name add_performance_indexes
# 用 EXPLAIN 验证：
# EXPLAIN ANALYZE SELECT * FROM "Bookmark" WHERE "collectionId"='xxx' AND "folderId"='yyy';
# 应走 Index Scan 而非 Seq Scan
```

### 3.4 【高】权限安全加固 — 已实施

**问题**：
1. `/api/collections/import`、`import-recover-data/recover-folders`、`recover-bookmarks` **无任何鉴权**，任何人可写入数据；
2. `next-auth` 存在硬编码 `NEXTAUTH_SECRET` 兜底 + 调试日志；
3. `/api/url-info` 可被用作 SSRF 探测内网。

**修改**：
- 三个导入/恢复接口增加 `getServerSession` 校验（未登录返回 401）。
- `src/app/api/auth/[...nextauth]/options.ts`：删除硬编码密钥兜底（缺失直接抛错），密码比较改为常量时间比较，设置 JWT 会话 7 天有效期，删除调试日志。
- `src/app/api/url-info/route.ts`：新增 `isBlockedUrl` —— 仅允许 http/https，拦截 localhost/内网/保留地址（含云元数据 169.254.x.x），防 SSRF。

**验证方法**：
```bash
# 未登录调用导入接口应返回 401
curl -X POST http://localhost:3000/api/collections/import -H "Content-Type: application/json" -d '{"name":"x"}'
# SSRF 防护
curl -X POST http://localhost:3000/api/url-info -H "Content-Type: application/json" -d '{"url":"http://169.254.169.254/latest/meta-data/"}'
# 应返回 400 URL is not allowed
```

---

## 四、优先级与实施顺序总表

| 优先级 | 项目 | 状态 | 影响面 |
|---|---|---|---|
| 高 | N+1 查询修复（合集/书签/文件夹） | ✅ 已实施 | 全站接口提速 |
| 高 | 图片懒加载 | ✅ 已实施 | 首屏请求数下降 |
| 高 | 数据库索引 | ✅ 已实施（待 push） | 查询性能 |
| 高 | 导入/恢复接口鉴权 | ✅ 已实施 | 安全 |
| 高 | NextAuth 密钥/时序攻击加固 | ✅ 已实施 | 安全 |
| 高 | SSRF 防护（url-info） | ✅ 已实施 | 安全 |
| 高 | 搜索防抖 + 过期响应丢弃 | ✅ 已实施 | 搜索体验 |
| 高 | 首页骨架屏 | ✅ 已实施 | 首屏体验 |
| 中 | 服务端设置查询缓存（React cache） | ✅ 已实施 | 服务端开销 |
| 中 | 公开接口 Cache-Control | ✅ 已实施 | CDN/浏览器缓存 |
| 中 | 前端设置缓存（TTL+去重） | ✅ 已实施 | 重复请求 |
| 中 | 视图切换记忆 | ✅ 已实施 | 体验 |
| 中 | 暗色模式细节（FOUC/滚动条/选区） | ✅ 已实施 | 体验 |
| 中 | 设置保存事务化 + 缓存失效 | ✅ 已实施 | 后台体验 |
| 中 | 批量操作反馈（toast + loading） | ✅ 已实施 | 后台体验 |
| 低 | 移动端边距/顶栏适配 | ✅ 已实施 | 移动端体验 |
| 低 | 启用 Next 图片优化器 | 📋 建议 | 需回归验证 |
| 低 | 全文搜索（pg_trgm GIN 索引） | 📋 建议 | 大库搜索加速 |

---

## 五、未改动项与后续建议（低优先级/需额外决策）

1. **首页 SSR/SSG 化**：当前首页为客户端渲染（`page.tsx` 全部 `fetch`）。收益最大但改动面大（需将数据获取迁到 Server Component / Server Action，并处理登录态）。建议作为独立迭代：
   - 将 `page.tsx` 拆为服务端布局 + 客户端交互层；
   - 对公开数据使用 `fetch(..., { next: { revalidate: 300 } })` 实现 ISR。
2. **全文搜索**：`contains + mode: insensitive` 在大数据量下走全表扫描。可启用 `pg_trgm` 扩展 + GIN 索引：
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE INDEX "Bookmark_title_trgm" ON "Bookmark" USING gin (title gin_trgm_ops);
   CREATE INDEX "Bookmark_url_trgm" ON "Bookmark" USING gin (url gin_trgm_ops);
   ```
3. **侧边栏文件夹树接口合并**：当前每个合集单独请求 `/api/collections/:id/folders?all=true`（合集多时请求数多），可合并为单接口一次返回全部文件夹树。
4. **主题切换库**：如需更丰富的主题能力（如跟随系统切换），可引入 `next-themes`（当前实现已满足防闪烁与持久化）。
5. **上传接口增强**：`/api/upload` 建议限制文件类型/大小（当前未校验扩展名），并改用数据库 Image 模型存储（与设置图片一致）。

---

## 六、通用测试验证方法（回归）

1. **构建验证**（确保不破坏现有功能）：
   ```bash
   cp .env.example .env.local   # 配置 DATABASE_URL / NEXTAUTH_SECRET / ADMIN_EMAIL / ADMIN_PASSWORD
   npm run build                # 包含 prisma generate + db push + next build
   npm run lint
   ```
2. **功能回归清单**：
   - 首页：骨架屏 → 合集列表 → 书签网格/列表切换 → 文件夹导航 → 面包屑 → 搜索（防抖）→ 分页；
   - 暗色模式：手动切换、刷新无闪烁、系统偏好跟随；
   - 后台：登录 → 合集增删改 → 书签增删改（含删除 loading/toast）→ 设置保存（立即生效）→ 导入/导出；
   - 移动端（375px/768px）：顶栏、侧边栏（抽屉）、卡片网格。
3. **接口级验证**：
   ```bash
   curl -s http://localhost:3000/api/collections?publicOnly=true | jq '.[0].totalBookmarks'   # 字段不变
   curl -s "http://localhost:3000/api/collections/<id>/bookmarks" | jq '.subfolders[0].bookmarkCount'  # 统计正确
   ```
4. **性能对比**（可选）：Lighthouse / `curl -w %{time_total}` 修改前后对比；`EXPLAIN ANALYZE` 验证索引生效。
