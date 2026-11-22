# 长沙新华学生会 · 文件发布公示平台

面向校内使用的学生会文件发布与公示网站：首页置顶与最新文件、分类筛选、文件详情与阅读统计、PDF 在线预览（网页画布水印）、多管理员账号与文件增删改。

## 技术栈

- 前端：Vue 3 + Vite + Vue Router + Element Plus
- 后端：Vercel Edge Function（`api/db.js`）
- 数据库：Neon PostgreSQL（`@neondatabase/serverless`）
- 文件存储：FileBrowser（后台填写 PDF 公开直链）
- 密码：bcryptjs 哈希存储
- PDF 预览：pdfjs-dist（前端渲染，水印仅叠加在画布上）

## 目录结构

```
.
├── api/
│   └── db.js                 # 唯一后端入口：登录、文件 CRUD、管理员、PDF 代理
├── sql/
│   └── schema.sql            # Neon 建表 + 初始管理员
├── src/
│   ├── api/index.js          # 前端请求封装
│   ├── components/           # DocCard、CategoryTag
│   ├── router/index.js       # 路由与登录守卫
│   ├── styles/main.css       # 全局样式（校园政务风、响应式）
│   ├── utils/                # 登录态、格式化
│   ├── views/
│   │   ├── Home.vue          # 首页
│   │   ├── DocList.vue       # 全部文件
│   │   ├── DocDetail.vue     # 文件详情
│   │   ├── PdfPreview.vue    # PDF 在线预览（含水印）
│   │   ├── Login.vue         # 管理员登录
│   │   └── admin/            # 后台布局、文件管理、发布/编辑、账号管理
│   ├── App.vue
│   └── main.js
├── .env.example
├── index.html
├── package.json
├── vercel.json
└── vite.config.js            # 本地开发时直接运行 api/db.js
```

## 一、准备工作

1. Node.js ≥ 18。
2. 一个 [Neon](https://neon.tech) 项目（免费版即可）。
3. 一个可公网访问的 [FileBrowser](https://filebrowser.org/)（用于存放 PDF）。

## 二、初始化数据库（Neon）

1. 打开 Neon 控制台 → 你的项目 → **SQL Editor**。
2. 粘贴并执行 [sql/schema.sql](sql/schema.sql) 的全部内容。
3. 执行后会自动创建 `docs`、`admin_users` 两张表，并写入初始管理员：

   | 用户名 | 密码 |
   | --- | --- |
   | admin | suadmin123 |

4. 在 **Dashboard → Connection Details** 复制连接串（建议使用带 `-pooler` 的地址），形如：

   ```
   postgresql://user:password@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

## 三、本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，把 DATABASE_URL 换成上一步的 Neon 连接串

# 3. 启动（前端 + 接口一起）
npm run dev
```

打开 http://localhost:5173 。

说明：`vite.config.js` 内置了一个开发中间件，会把 `/api/*` 请求直接交给 `api/db.js` 执行，因此本地 `npm run dev` 即可完整联调，无需额外启动后端。

也可以使用 Vercel CLI 完整模拟线上环境：

```bash
npm i -g vercel
vercel dev
```

## 四、部署到 Vercel

### 方式 A：Git 仓库（推荐）

1. 将项目推送到 GitHub / GitLab / Gitee。
2. Vercel 控制台 → **Add New → Project** → 导入该仓库。
3. 框架会自动识别为 **Vite**（构建命令 `npm run build`，输出目录 `dist`）。
4. 在 **Environment Variables** 添加：
   - `DATABASE_URL` = Neon 连接串（Production / Preview / Development 都建议勾选）
5. 点击 **Deploy**。

### 方式 B：Vercel CLI

```bash
npm i -g vercel
vercel          # 首次会引导关联项目
# 在 Vercel 项目 Settings → Environment Variables 添加 DATABASE_URL
vercel --prod
```

`api/db.js` 已通过 `export const config = { runtime: 'edge' }` 声明为 Edge Function；`vercel.json` 只对前端路由做 SPA 回退，不会影响 `/api/*`。

部署完成后访问 `https://你的域名/admin/login`，使用 `admin / suadmin123` 登录。

## 五、FileBrowser 文件配置

1. 将 PDF 上传到 FileBrowser。
2. 对该文件创建**公开分享链接**（Share），或在允许公开下载的前提下复制文件直链。
3. 复制形如 `https://file.example.com/api/public/dl/xxxx?token=xxxx` 的直链，填入后台「FileBrowser 文件直链」。
4. 直链必须能被服务器直接访问；PDF 预览由 `/api/db?action=pdf&id=xxx` 服务端转发，因此**不需要给 FileBrowser 配置 CORS**。下载按钮则直接打开该直链。

## 六、接口说明（统一 `/api/db.js`）

| 方法 | 地址 | 说明 | 权限 |
| --- | --- | --- | --- |
| GET | `/api/db?action=home` | 首页置顶 + 最新文件 | 公开 |
| GET | `/api/db?action=docs&category=&page=&pageSize=` | 文件列表/分类筛选/分页 | 公开 |
| GET | `/api/db?action=doc&id=` | 文件详情 | 公开 |
| GET | `/api/db?action=pdf&id=` | PDF 转发（供 pdf.js 使用） | 公开 |
| POST | `/api/db?action=view` | 阅读量 +1 | 公开 |
| POST | `/api/db?action=login` | 管理员登录，返回令牌 | 公开 |
| POST | `/api/db?action=create` | 新增文件 | 管理员 |
| POST | `/api/db?action=update` | 编辑文件 | 管理员 |
| POST | `/api/db?action=delete` | 删除文件 | 管理员 |
| GET | `/api/db?action=admins` | 管理员列表 | 管理员 |
| POST | `/api/db?action=admin-create` | 新增管理员 | 管理员 |
| POST | `/api/db?action=admin-delete` | 删除管理员 | 管理员 |

管理员接口需在请求头携带 `Authorization: Bearer <token>`，前端已自动处理。

## 七、数据表

**docs**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | SERIAL | 主键 |
| title | TEXT | 标题 |
| dept | TEXT | 发布部门 |
| category | TEXT | 分类 |
| content | TEXT | 正文 |
| file_url | TEXT | FileBrowser PDF 直链 |
| is_top | BOOLEAN | 是否置顶 |
| view_count | INTEGER | 阅读量 |
| created_at | TIMESTAMPTZ | 发布时间 |

**admin_users**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | SERIAL | 主键 |
| username | TEXT | 用户名（唯一） |
| password_hash | TEXT | bcrypt 哈希 |
| real_name | TEXT | 姓名/备注 |
| created_at | TIMESTAMPTZ | 创建时间 |

## 八、安全与维护

- 登录状态按需求保存在浏览器 `localStorage`，适合校内小范围使用；令牌由服务端 HMAC 签名，有效期 7 天。
- 正式使用前请修改初始密码。生成新哈希：

  ```bash
  node -e "import('bcryptjs').then(async m => console.log(await m.default.hash('你的新密码', 10)))"
  ```

  然后在 Neon SQL Editor 执行：

  ```sql
  UPDATE admin_users SET password_hash = '上一步输出的哈希' WHERE username = 'admin';
  ```

- 可选环境变量 `AUTH_SECRET`：用于令牌签名。不配置时自动由 `DATABASE_URL` 派生；配置后安全性更高（修改该值会使所有已登录用户重新登录）。
- 删除文件不可恢复；页面已有二次确认。
- 当前登录账号不可删除，且系统至少保留一个管理员。

## 九、常见问题

1. **登录提示「用户名或密码错误」**：确认已执行 `sql/schema.sql`，且 `DATABASE_URL` 指向同一数据库。
2. **PDF 预览失败**：确认 FileBrowser 直链可在浏览器无痕窗口直接打开（分享链接未过期），并检查服务器能否访问该地址。
3. **刷新子页面 404**：确认项目根目录的 `vercel.json` 已随代码部署（已配置 `/docs`、`/preview`、`/admin` 的 SPA 回退）。
4. **部署后接口 500**：在 Vercel 项目 Settings → Environment Variables 检查 `DATABASE_URL`，修改环境变量后需重新部署。
