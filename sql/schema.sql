-- ============================================================
-- 长沙新华学生会文件公示平台 · Neon PostgreSQL 初始化脚本
-- 使用方式：Neon 控制台 -> SQL Editor，粘贴本文件全部内容执行一次
-- ============================================================

-- 文件表
CREATE TABLE IF NOT EXISTS docs (
  id          SERIAL PRIMARY KEY,
  title       TEXT        NOT NULL,
  dept        TEXT        NOT NULL,
  category    TEXT        NOT NULL,
  content     TEXT        NOT NULL DEFAULT '',
  file_url    TEXT,
  is_top      BOOLEAN     NOT NULL DEFAULT FALSE,
  view_count  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_category   ON docs (category);
CREATE INDEX IF NOT EXISTS idx_docs_created_at ON docs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_docs_is_top     ON docs (is_top);

-- 管理员表（密码使用 bcrypt 哈希，不存明文）
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  real_name     TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初始管理员：admin / suadmin123
-- 哈希对应明文 suadmin123（bcrypt, cost=10）
INSERT INTO admin_users (username, password_hash, real_name)
SELECT 'admin', '$2b$10$TD8yrZFssQkOEzLty67ITubzO0BIucqjAAnsC3rIhD/tww0C5r9ge', '系统管理员'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin');
