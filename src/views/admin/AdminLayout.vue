<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { clearAuth, getUser } from '../../utils/auth';

const router = useRouter();
const user = computed(() => getUser() || {});

function logout() {
  clearAuth();
  ElMessage.success('已退出登录');
  router.replace('/');
}
</script>

<template>
  <div class="admin-shell">
    <div class="admin-bar">
      <div class="container admin-bar-inner">
        <span class="admin-title">管理后台</span>

        <nav class="admin-nav">
          <router-link to="/admin/docs" class="admin-link">文件管理</router-link>
          <router-link to="/admin/docs/new" class="admin-link">发布文件</router-link>
          <router-link to="/admin/users" class="admin-link">账号管理</router-link>
        </nav>

        <div class="admin-user">
          <span class="admin-user-name">{{ user.real_name || user.username }}</span>
          <el-button link type="primary" @click="logout">退出登录</el-button>
        </div>
      </div>
    </div>

    <div class="container admin-content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  padding-bottom: 48px;
}

.admin-bar {
  background: #fff;
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.admin-bar-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 56px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.admin-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--brand);
  padding: 4px 12px;
  border-radius: 6px;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.admin-nav {
  display: flex;
  gap: 4px;
  flex: 1;
}

.admin-link {
  padding: 6px 14px;
  border-radius: 7px;
  font-size: 13.5px;
  color: var(--text-2);
  transition: all 0.2s;
}

.admin-link:hover {
  background: var(--brand-soft);
  color: var(--brand);
}

.admin-link.router-link-active {
  background: var(--brand-soft);
  color: var(--brand);
  font-weight: 600;
}

/* 精确匹配：发布页激活时不同时高亮“文件管理” */
.admin-link.router-link-exact-active {
  background: var(--brand);
  color: #fff;
}

.admin-user {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
  flex-shrink: 0;
}

.admin-user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-content {
  padding-top: 24px;
}

@media (max-width: 768px) {
  .admin-bar-inner {
    gap: 8px;
  }

  .admin-nav {
    order: 3;
    width: 100%;
    overflow-x: auto;
  }

  .admin-link {
    padding: 6px 10px;
    white-space: nowrap;
    font-size: 13px;
  }

  .admin-user {
    margin-left: auto;
  }

  .admin-user-name {
    display: none;
  }

  .admin-content {
    padding-top: 16px;
  }
}
</style>
