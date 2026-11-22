-- ============================================================
-- 迁移脚本：把旧版 bcrypt 密码哈希改为 PBKDF2-SHA256
-- 背景：Vercel Edge Function 不支持 bcryptjs（依赖 Node crypto），
--       部署会报 "referencing unsupported modules: - bcryptjs: crypto"。
-- 使用：Neon 控制台 -> SQL Editor，粘贴执行一次（仅当库里已存在 bcrypt 哈希时需要）
-- ============================================================

-- 1) 查看当前哈希类型
SELECT id, username, left(password_hash, 7) AS hash_prefix
FROM admin_users
ORDER BY id;

-- 2) 把 admin 的密码重置为 suadmin123（PBKDF2 格式）
UPDATE admin_users
SET password_hash = 'pbkdf2$100000$jdjN-0hGTt5OOdwkcpFkvA$mFKNCCyVGLVyOE3QngcY8SAVzVauIK1hgt3jJhps8fI'
WHERE username = 'admin';

-- 3) 其余仍是 $2b$ 开头的账号，请为每个账号生成新哈希后逐个执行：
--    node scripts/hash-password.mjs 新密码
--    UPDATE admin_users SET password_hash = '<上一步输出>' WHERE username = '<账号名>';

-- 4) 复查：所有行都应以 pbkdf2$ 开头
SELECT username, left(password_hash, 15) AS hash_prefix FROM admin_users ORDER BY id;
