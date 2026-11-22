<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Lock, User } from '@element-plus/icons-vue';
import { api } from '../api';
import { setAuth } from '../utils/auth';

const route = useRoute();
const router = useRouter();

const formRef = ref();
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function submit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const data = await api.login(form.username.trim(), form.password);
    setAuth(data.token, data.user);
    ElMessage.success('登录成功');
    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/admin/docs';
    router.replace(redirect);
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <span class="brand-mark">学</span>
        <div>
          <h1>管理员登录</h1>
          <p>长沙新华学生会 · 文件公示平台</p>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="login-form"
        @submit.prevent
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            :prefix-icon="User"
            placeholder="请输入管理员用户名"
            size="large"
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :prefix-icon="Lock"
            placeholder="请输入密码"
            size="large"
            show-password
            autocomplete="current-password"
            @keyup.enter="submit"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="submit"
        >
          登 录
        </el-button>
      </el-form>

      <div class="login-foot">
        <span>仅限学生会工作人员使用</span>
        <router-link to="/">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: calc(100vh - 64px - 150px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  background:
    radial-gradient(circle at 15% 20%, rgba(30, 58, 138, 0.08), transparent 40%),
    radial-gradient(circle at 85% 80%, rgba(30, 58, 138, 0.07), transparent 42%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  padding: 34px 34px 26px;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 13px;
  padding-bottom: 22px;
  margin-bottom: 22px;
  border-bottom: 1px solid var(--border);
}

.brand-mark {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(140deg, #23479f, #14275f);
  color: #fff;
  font-family: 'Songti SC', 'STSong', serif;
  font-size: 26px;
  font-weight: 700;
}

.login-brand h1 {
  font-size: 20px;
  color: var(--brand-dark);
  letter-spacing: 1px;
  margin-bottom: 3px;
}

.login-brand p {
  font-size: 12.5px;
  color: var(--muted);
}

.login-btn {
  width: 100%;
  margin-top: 6px;
  letter-spacing: 4px;
}

.login-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
  font-size: 12.5px;
  color: var(--muted);
}

.login-foot a {
  color: var(--brand);
}

.login-foot a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .login-page {
    padding: 28px 14px;
    min-height: auto;
  }

  .login-card {
    padding: 26px 20px 20px;
  }
}
</style>
