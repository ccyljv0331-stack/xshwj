export const CATEGORIES = ['通知公告', '红头文件', '活动方案', '会议记录', '表彰公示'];

export function categoryTagType(category) {
  switch (category) {
    case '红头文件':
      return 'danger';
    case '活动方案':
      return 'success';
    case '会议记录':
      return 'info';
    case '表彰公示':
      return 'warning';
    default:
      return 'primary';
  }
}

export function formatDate(value, withTime = true) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const pad = (n) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return withTime ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}

export function formatViews(value) {
  return Number(value || 0).toLocaleString('zh-CN');
}
