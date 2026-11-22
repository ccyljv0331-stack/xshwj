<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { clearAuth, getUser, isLoggedIn } from './utils/auth';

const route = useRoute();
const router = useRouter();

const loggedIn = computed(() => isLoggedIn());
const user = computed(() => getUser());
const year = new Date().getFullYear();

const isHome = computed(() => route.path === '/');
const isDocs = computed(() => route.path.startsWith('/docs'));
const isAdmin = computed(() => route.path.startsWith('/admin'));

function logout() {
  clearAuth();
  ElMessage.success('已退出登录');
  router.push('/');
}
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="container header-inner">
        <router-link to="/" class="brand">
          <span class="brand-mark">学</span>
          <span class="brand-text">
            <strong>长沙新华学生会</strong>
            <small>文件公示平台</small>
          </span>
        </router-link>

        <nav class="site-nav">
          <router-link to="/" class="nav-link" :class="{ active: isHome }">首页</router-link>
          <router-link to="/docs" class="nav-link" :class="{ active: isDocs }">全部文件</router-link>
          <router-link
            v-if="loggedIn"
            to="/admin/docs"
            class="nav-link"
            :class="{ active: isAdmin }"
          >
            管理后台
          </router-link>
        </nav>

        <div class="header-actions">
          <template v-if="loggedIn">
            <span class="admin-name">{{ user?.real_name || user?.username }}</span>
            <el-button size="small" text @click="logout">退出</el-button>
          </template>
          <el-button v-else size="small" type="primary" plain @click="router.push('/admin/login')">
            管理登录
          </el-button>
        </div>
      </div>
    </header>

    <main class="site-main">
      <router-view />
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-brand">长沙新华学生会 · 文件公示平台</div>
        <div>公开 · 规范 · 高效 | 本平台仅用于校内文件公示</div>
        <div>© {{ year }} 长沙新华学生会</div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.admin-name {
  font-size: 13px;
  color: var(--text-2);
  margin-right: 4px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .admin-name {
    display: none;
  }
}
</style>
