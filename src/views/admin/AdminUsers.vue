<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { api } from '../../api';
import { getUser } from '../../utils/auth';
import { formatDate } from '../../utils/format';

const users = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref();

const currentUser = computed(() => getUser() || {});

const form = reactive({
  username: '',
  real_name: '',
  password: '',
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]{3,30}$/,
      message: '用户名需为 3-30 位字母、数字或下划线',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 72, message: '密码长度需为 6-72 位', trigger: 'blur' },
  ],
  real_name: [{ max: 50, message: '姓名不能超过 50 个字符', trigger: 'blur' }],
};

async function load() {
  loading.value = true;
  try {
    const data = await api.listAdmins();
    users.value = data.users || [];
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    loading.value = false;
  }
}

function openDialog() {
  form.username = '';
  form.real_name = '';
  form.password = '';
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

async function submit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    await api.createAdmin({
      username: form.username.trim(),
      real_name: form.real_name.trim(),
      password: form.password,
    });
    ElMessage.success('管理员已添加');
    dialogVisible.value = false;
    load();
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    submitting.value = false;
  }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除管理员「${row.real_name || row.username}」吗？删除后该账号将无法登录。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    );
  } catch {
    return;
  }

  try {
    await api.deleteAdmin(row.id);
    ElMessage.success('管理员已删除');
    load();
  } catch (error) {
    ElMessage.error(error.message);
  }
}

onMounted(load);
</script>

<template>
  <div>
    <div class="manage-head">
      <div>
        <h1>账号管理</h1>
        <p>共 {{ users.length }} 个管理员账号 · 密码使用 bcrypt 哈希存储</p>
      </div>
      <el-button type="primary" @click="openDialog">
        <el-icon><Plus /></el-icon>
        新增管理员
      </el-button>
    </div>

    <div class="panel table-wrap">
      <el-table v-loading="loading" :data="users" style="width: 100%; min-width: 680px">
        <el-table-column prop="username" label="用户名" min-width="150">
          <template #default="{ row }">
            <span class="username">{{ row.username }}</span>
            <el-tag v-if="row.id === currentUser.id" size="small" type="success" effect="plain">
              当前账号
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="real_name" label="姓名 / 备注" min-width="150">
          <template #default="{ row }">{{ row.real_name || '—' }}</template>
        </el-table-column>

        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button
              link
              type="danger"
              :disabled="row.id === currentUser.id"
              @click="remove(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <p class="page-tip">为避免失去后台访问权限，当前登录账号不可删除，且系统至少保留一个管理员。</p>

    <el-dialog
      v-model="dialogVisible"
      title="新增管理员"
      width="min(440px, 92vw)"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="3-30 位字母、数字或下划线" />
        </el-form-item>

        <el-form-item label="姓名 / 备注" prop="real_name">
          <el-input v-model="form.real_name" placeholder="例如：办公室 · 张老师" maxlength="50" />
        </el-form-item>

        <el-form-item label="初始密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="至少 6 位"
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.manage-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.manage-head h1 {
  font-size: 22px;
  color: var(--brand-dark);
  margin-bottom: 5px;
}

.manage-head p {
  font-size: 13px;
  color: var(--muted);
}

.table-wrap {
  padding: 6px 10px;
  overflow-x: auto;
}

.username {
  font-weight: 500;
  margin-right: 8px;
}

.page-tip {
  margin-top: 14px;
  font-size: 12.5px;
  color: #9ca3af;
}

@media (max-width: 768px) {
  .manage-head {
    align-items: center;
  }

  .manage-head h1 {
    font-size: 19px;
  }

  .manage-head p {
    display: none;
  }

  .manage-head :deep(.el-button) {
    flex-shrink: 0;
  }
}
</style>
