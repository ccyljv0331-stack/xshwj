import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// Vercel Edge Function 运行时声明
export const config = { runtime: 'edge' };

const CATEGORIES = ['通知公告', '红头文件', '活动方案', '会议记录', '表彰公示'];
const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let sqlClient = null;
function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new HttpError(500, '服务端未配置 DATABASE_URL 环境变量');
  }
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function fail(message, status = 400) {
  return json({ error: message }, status);
}

function requirePost(method) {
  if (method !== 'POST') throw new HttpError(405, '该接口仅支持 POST 请求');
}

async function readBody(req) {
  try {
    return (await req.json()) || {};
  } catch {
    return {};
  }
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseId(value) {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, '无效的 ID');
  return id;
}

/* ---------------- 登录令牌（HMAC 签名，无额外依赖） ---------------- */

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function signingKey() {
  const secret = process.env.AUTH_SECRET || `csu-docs::${process.env.DATABASE_URL || ''}`;
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signToken(admin) {
  const payload = {
    uid: admin.id,
    username: admin.username,
    exp: Date.now() + TOKEN_TTL,
  };
  const data = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await signingKey(), encoder.encode(data));
  return `${data}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await signingKey(),
      base64UrlToBytes(signature),
      encoder.encode(data)
    );
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(base64UrlToBytes(data)));
    if (!payload?.uid || !payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function requireAdmin(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  const admin = token ? await verifyToken(token) : null;
  if (!admin) throw new HttpError(401, '登录状态已失效，请重新登录');
  return admin;
}

/* ---------------- 数据校验 ---------------- */

function parseDocInput(body) {
  const title = text(body.title);
  const dept = text(body.dept);
  const category = text(body.category);
  const content = typeof body.content === 'string' ? body.content : '';
  const fileUrl = text(body.file_url);

  if (!title) throw new HttpError(400, '请填写文件标题');
  if (title.length > 200) throw new HttpError(400, '标题不能超过 200 个字符');
  if (!dept) throw new HttpError(400, '请填写发布部门');
  if (dept.length > 100) throw new HttpError(400, '发布部门不能超过 100 个字符');
  if (!CATEGORIES.includes(category)) throw new HttpError(400, '请选择有效的文件分类');

  if (fileUrl) {
    let parsed;
    try {
      parsed = new URL(fileUrl);
    } catch {
      throw new HttpError(400, 'FileBrowser 文件直链格式不正确');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new HttpError(400, '文件直链仅支持 http/https 协议');
    }
  }

  return {
    title,
    dept,
    category,
    content,
    file_url: fileUrl || null,
    is_top: body.is_top === true,
  };
}

/* ---------------- 业务接口 ---------------- */

async function getHome() {
  const sql = getSql();
  const topDocs = await sql`
    SELECT id, title, dept, category, is_top, view_count, created_at
    FROM docs WHERE is_top = TRUE
    ORDER BY created_at DESC LIMIT 6
  `;
  const latestDocs = await sql`
    SELECT id, title, dept, category, is_top, view_count, created_at
    FROM docs
    ORDER BY created_at DESC LIMIT 8
  `;
  return json({ topDocs, latestDocs });
}

async function listDocs(url) {
  const sql = getSql();
  const category = text(url.searchParams.get('category'));

  const page = Math.max(1, Number.parseInt(url.searchParams.get('page'), 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('pageSize'), 10) || 10));
  const offset = (page - 1) * pageSize;

  if (category && !CATEGORIES.includes(category)) {
    throw new HttpError(400, '无效的文件分类');
  }

  const list = category
    ? await sql`
        SELECT id, title, dept, category, is_top, view_count, created_at
        FROM docs WHERE category = ${category}
        ORDER BY is_top DESC, created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `
    : await sql`
        SELECT id, title, dept, category, is_top, view_count, created_at
        FROM docs
        ORDER BY is_top DESC, created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;

  const totalRows = category
    ? await sql`SELECT COUNT(*)::int AS count FROM docs WHERE category = ${category}`
    : await sql`SELECT COUNT(*)::int AS count FROM docs`;

  return json({ list, total: totalRows[0]?.count ?? 0, page, pageSize });
}

async function getDoc(url) {
  const sql = getSql();
  const id = parseId(url.searchParams.get('id'));
  const rows = await sql`SELECT * FROM docs WHERE id = ${id}`;
  if (!rows.length) throw new HttpError(404, '文件不存在或已被删除');
  return json({ doc: rows[0] });
}

async function increaseView(req) {
  const sql = getSql();
  const body = await readBody(req);
  const id = parseId(body.id);
  const rows = await sql`
    UPDATE docs SET view_count = view_count + 1
    WHERE id = ${id}
    RETURNING view_count
  `;
  if (!rows.length) throw new HttpError(404, '文件不存在或已被删除');
  return json({ view_count: rows[0].view_count });
}

async function login(req) {
  const sql = getSql();
  const body = await readBody(req);
  const username = text(body.username);
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) throw new HttpError(400, '请输入用户名和密码');

  const rows = await sql`SELECT * FROM admin_users WHERE username = ${username} LIMIT 1`;
  const admin = rows[0];
  if (!admin) throw new HttpError(401, '用户名或密码错误');

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) throw new HttpError(401, '用户名或密码错误');

  return json({
    token: await signToken(admin),
    user: { id: admin.id, username: admin.username, real_name: admin.real_name },
  });
}

async function createDoc(req) {
  await requireAdmin(req);
  const sql = getSql();
  const input = parseDocInput(await readBody(req));

  const rows = await sql`
    INSERT INTO docs (title, dept, category, content, file_url, is_top)
    VALUES (${input.title}, ${input.dept}, ${input.category}, ${input.content}, ${input.file_url}, ${input.is_top})
    RETURNING *
  `;
  return json({ doc: rows[0] }, 201);
}

async function updateDoc(req) {
  await requireAdmin(req);
  const sql = getSql();
  const body = await readBody(req);
  const id = parseId(body.id);
  const input = parseDocInput(body);

  const rows = await sql`
    UPDATE docs SET
      title = ${input.title},
      dept = ${input.dept},
      category = ${input.category},
      content = ${input.content},
      file_url = ${input.file_url},
      is_top = ${input.is_top}
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows.length) throw new HttpError(404, '文件不存在或已被删除');
  return json({ doc: rows[0] });
}

async function deleteDoc(req) {
  await requireAdmin(req);
  const sql = getSql();
  const body = await readBody(req);
  const id = parseId(body.id);
  const rows = await sql`DELETE FROM docs WHERE id = ${id} RETURNING id`;
  if (!rows.length) throw new HttpError(404, '文件不存在或已被删除');
  return json({ ok: true });
}

async function listAdmins(req) {
  await requireAdmin(req);
  const sql = getSql();
  const users = await sql`
    SELECT id, username, real_name, created_at
    FROM admin_users ORDER BY id ASC
  `;
  return json({ users });
}

async function createAdmin(req) {
  await requireAdmin(req);
  const sql = getSql();
  const body = await readBody(req);

  const username = text(body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  const realName = text(body.real_name);

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    throw new HttpError(400, '用户名需为 3-30 位字母、数字或下划线');
  }
  if (password.length < 6 || password.length > 72) {
    throw new HttpError(400, '密码长度需为 6-72 位');
  }
  if (realName.length > 50) {
    throw new HttpError(400, '姓名不能超过 50 个字符');
  }

  const exists = await sql`SELECT id FROM admin_users WHERE username = ${username} LIMIT 1`;
  if (exists.length) throw new HttpError(409, '该用户名已存在');

  const passwordHash = await bcrypt.hash(password, 10);
  const rows = await sql`
    INSERT INTO admin_users (username, password_hash, real_name)
    VALUES (${username}, ${passwordHash}, ${realName || username})
    RETURNING id, username, real_name, created_at
  `;
  return json({ user: rows[0] }, 201);
}

async function deleteAdmin(req) {
  const current = await requireAdmin(req);
  const sql = getSql();
  const body = await readBody(req);
  const id = parseId(body.id);

  if (id === current.uid) throw new HttpError(400, '不能删除当前登录的账号');

  const totalRows = await sql`SELECT COUNT(*)::int AS count FROM admin_users`;
  if ((totalRows[0]?.count ?? 0) <= 1) {
    throw new HttpError(400, '至少需要保留一个管理员账号');
  }

  const rows = await sql`DELETE FROM admin_users WHERE id = ${id} RETURNING id`;
  if (!rows.length) throw new HttpError(404, '管理员不存在');
  return json({ ok: true });
}

/**
 * PDF 代理：后端转发 FileBrowser 直链，避免浏览器跨域限制。
 * 仅按文档 id 取库中已登记的 file_url，不接收任意 URL。
 */
async function proxyPdf(url) {
  const sql = getSql();
  const id = parseId(url.searchParams.get('id'));
  const rows = await sql`SELECT file_url FROM docs WHERE id = ${id}`;
  const fileUrl = rows[0]?.file_url;
  if (!fileUrl) throw new HttpError(404, '该文件未配置文件直链');

  let target;
  try {
    target = new URL(fileUrl);
  } catch {
    throw new HttpError(400, '文件直链格式不正确');
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new HttpError(400, '文件直链仅支持 http/https 协议');
  }

  let upstream;
  try {
    upstream = await fetch(target.toString(), {
      headers: { Accept: 'application/pdf,application/octet-stream,*/*' },
      redirect: 'follow',
    });
  } catch {
    throw new HttpError(502, '无法连接到 FileBrowser 文件服务');
  }
  if (!upstream.ok || !upstream.body) {
    throw new HttpError(502, `文件获取失败（HTTP ${upstream.status}）`);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/* ---------------- 入口 ---------------- */

export default async function handler(req) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || '';
  const method = (req.method || 'GET').toUpperCase();

  try {
    switch (action) {
      case 'home':
        return await getHome();
      case 'docs':
        return await listDocs(url);
      case 'doc':
        return await getDoc(url);
      case 'pdf':
        return await proxyPdf(url);

      case 'login':
        requirePost(method);
        return await login(req);
      case 'view':
        requirePost(method);
        return await increaseView(req);
      case 'create':
        requirePost(method);
        return await createDoc(req);
      case 'update':
        requirePost(method);
        return await updateDoc(req);
      case 'delete':
        requirePost(method);
        return await deleteDoc(req);

      case 'admins':
        return await listAdmins(req);
      case 'admin-create':
        requirePost(method);
        return await createAdmin(req);
      case 'admin-delete':
        requirePost(method);
        return await deleteAdmin(req);

      default:
        return fail('未知接口，请检查 action 参数', 404);
    }
  } catch (err) {
    if (err instanceof HttpError) return fail(err.message, err.status);
    console.error('[api/db]', err);
    return fail('服务器内部错误，请稍后重试', 500);
  }
}
