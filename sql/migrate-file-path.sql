-- ============================================================
-- 迁移脚本：为 docs 表增加附件上传字段（已上线后升级时执行）
-- 背景：后台改为「直接选择文件上传到 FileBrowser」，
--       文件路径存 file_path，原外部直链仍保留在 file_url。
-- 使用：Neon 控制台 -> SQL Editor，执行一次
-- ============================================================

ALTER TABLE docs ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE docs ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 校验
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'docs'
ORDER BY ordinal_position;
