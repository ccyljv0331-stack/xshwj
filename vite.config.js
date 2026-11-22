import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * 本地开发时把 /api/* 请求交给 api/db.js（Vercel Edge Function）执行，
 * 这样 `npm run dev` 即可联调前后端，无需额外安装或启动服务。
 */
function devEdgeApi() {
  return {
    name: 'dev-edge-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();

        try {
          const file = path.resolve(process.cwd(), 'api/db.js');
          // 加时间戳避免修改接口后 Vite 继续使用旧模块
          const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(key, value);
            else if (Array.isArray(value)) headers.set(key, value.join(', '));
          }

          let body;
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            body = Buffer.concat(chunks);
          }

          const request = new Request(
            new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`),
            { method: req.method, headers, body }
          );
          const response = await mod.default(request);

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          console.error('[dev-api]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: err?.message || '本地接口执行失败' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL;
  if (env.AUTH_SECRET) process.env.AUTH_SECRET = env.AUTH_SECRET;

  return {
    plugins: [vue(), devEdgeApi()],
    server: {
      port: 5173,
      host: true,
    },
  };
});
