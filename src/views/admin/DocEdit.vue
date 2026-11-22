<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { api } from '../../api';
import { CATEGORIES, formatDate, formatViews } from '../../utils/format';

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => Boolean(route.params.id));
const formRef = ref();
const loading = ref(false);
const saving = ref(false);
const meta = ref(null);

const form = reactive({
  title: '',
  dept: '',
  category: '通知公告',
  content: '',
  file_url: '',
  is_top: false,
});

const validateFileUrl = (rule, value, callback) => {
  if (!value) return callback();
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol');
    callback();
  } catch {
    callback(new Error('请输入合法的 http/https 文件直链'));
  }
};

const rules = {
  title: [
    { required: true, message: '请填写文件标题', trigger: 'blur' },
    { max: 200, message: '标题不能超过 200 个字符', trigger: 'blur' },
  ],
  dept: [{ required: true, message: '请填写发布部门', trigger: 'blur' }],
  category: [{ required: true, message: '请选择文件分类', trigger: 'change' }],
  file_url: [{ validator: validateFileUrl, trigger: 'blur' }],
};

async function submit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    const payload = {
      title: form.title,
      dept: form.dept,
      category: form.category,
      content: form.content,
      file_url: form.file_url,
      is_top: form.is_top,
    };

    if (isEdit.value) {
      await api.updateDoc({ ...payload, id: Number(route.params.id) });
      ElMessage.success('已保存修改');
    } else {
      await api.createDoc(payload);
      ElMessage.success('文件发布成功');
    }
    router.push('/admin/docs');
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    saving.value = false;
  }
}

function cancel() {
  router.push('/admin/docs');
}

onMounted(async () => {
  if (!isEdit.value) return;
  loading.value = true;
  try {
    const data = await api.getDoc(route.params.id);
    const doc = data.doc;
    meta.value = doc;
    form.title = doc.title;
    form.dept = doc.dept;
    form.category = doc.category;
    form.content = doc.content || '';
    form.file_url = doc.file_url || '';
    form.is_top = Boolean(doc.is_top);
  } catch (error) {
    ElMessage.error(error.message);
    router.replace('/admin/docs');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="edit-page">
    <div class="manage-head">
      <div>
        <h1>{{ isEdit ? '编辑文件' : '发布文件' }}</h1>
        <p v-if="isEdit && meta">
          发布时间：{{ formatDate(meta.created_at) }} · 阅读量：{{ formatViews(meta.view_count) }}
        </p>
        <p v-else>填写文件信息后发布，将展示在首页与文件列表中</p>
      </div>
    </div>

    <div v-loading="loading" class="panel form-panel">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="文件标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="例如：关于召开 2026 学年第一次全体例会的通知"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="发布部门" prop="dept">
            <el-input v-model="form.dept" placeholder="例如：学生会办公室" maxlength="100" />
          </el-form-item>

          <el-form-item label="文件分类" prop="category">
            <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="item in CATEGORIES" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="正文内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="14"
            placeholder="请输入文件正文，支持换行显示"
          />
        </el-form-item>

        <el-form-item label="FileBrowser 文件直链" prop="file_url">
          <el-input
            v-model="form.file_url"
            placeholder="https://file.example.com/api/public/dl/xxxx?token=xxxx"
          />
          <div class="field-hint">
            填写 FileBrowser 的公开分享直链（http/https）。填写后详情页会出现 PDF 预览与下载按钮。
          </div>
        </el-form-item>

        <el-form-item label="置顶显示">
          <div class="switch-row">
            <el-switch v-model="form.is_top" active-text="置顶" inactive-text="普通" />
            <span class="field-hint inline">置顶文件会展示在首页「置顶文件」区域</span>
          </div>
        </el-form-item>

        <div class="form-actions">
          <el-button type="primary" :loading="saving" @click="submit">
            {{ isEdit ? '保存修改' : '发布文件' }}
          </el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.manage-head {
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

.form-panel {
  max-width: 900px;
  padding: 26px 30px 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;
}

.field-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.6;
}

.field-hint.inline {
  margin-top: 0;
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.form-actions {
  display: flex;
  gap: 10px;
  padding-top: 8px;
}

@media (max-width: 768px) {
  .form-panel {
    padding: 18px 16px 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .manage-head h1 {
    font-size: 19px;
  }

  .form-actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
