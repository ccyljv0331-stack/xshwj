import { createRouter, createWebHistory } from 'vue-router';
import { isLoggedIn } from '../utils/auth';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/docs',
    name: 'docs',
    component: () => import('../views/DocList.vue'),
    meta: { title: '全部文件' },
  },
  {
    path: '/docs/:id',
    name: 'doc-detail',
    component: () => import('../views/DocDetail.vue'),
    meta: { title: '文件详情' },
  },
  {
    path: '/preview/:id',
    name: 'pdf-preview',
    component: () => import('../views/PdfPreview.vue'),
    meta: { title: 'PDF 在线预览' },
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/Login.vue'),
    meta: { title: '管理员登录' },
  },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/docs' },
      {
        path: 'docs',
        name: 'admin-docs',
        component: () => import('../views/admin/DocManage.vue'),
        meta: { title: '文件管理', requiresAuth: true },
      },
      {
        path: 'docs/new',
        name: 'admin-doc-new',
        component: () => import('../views/admin/DocEdit.vue'),
        meta: { title: '发布文件', requiresAuth: true },
      },
      {
        path: 'docs/:id/edit',
        name: 'admin-doc-edit',
        component: () => import('../views/admin/DocEdit.vue'),
        meta: { title: '编辑文件', requiresAuth: true },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../views/admin/AdminUsers.vue'),
        meta: { title: '账号管理', requiresAuth: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isLoggedIn()) {
    return { name: 'admin-login', query: { redirect: to.fullPath } };
  }
  if (to.name === 'admin-login' && isLoggedIn()) {
    return { name: 'admin-docs' };
  }
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} · 长沙新华学生会`
    : '长沙新华学生会 · 文件公示平台';
});

export default router;
