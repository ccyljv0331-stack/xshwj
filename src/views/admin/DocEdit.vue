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
const uploading = ref(false);
const meta = ref(null);
const fileInput = ref(null);

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ACCEPT_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

const form = reactive({
  title: '',
  dept: '',
  category: '通知公告',
  content: '',
  file_url: '',
  file_path: '',
  file_name: '',
  is_top: false,
});

// 有点击上传的文件时，预览与下载都走服务端代理
const hasUploaded = computed(() => Boolean(form.file_path));

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

function pickFile() {
  fileInput.value?.click();
}

async function onFileChange(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ACCEPT_EXT.includes(ext)) {
    ElMessage.error(`仅支持 ${ACCEPT_EXT.join(' / ')} 格式`);
    return;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    ElMessage.error('文件超过 4MB，请先在 FileBrowser 网页上传，再把直链粘贴到「外部直链」');
    return;
  }

  uploading.value = true;
  try {
    const res = await api.uploadFile(file);
    form.file_path = res.file_path;
    form.file_name = res.file_name;
    ElMessage.success(`已上传：${res.file_name}`);
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    uploading.value = false;
  }
}

function clearFile() {
  form.file_path = '';
  form.file_name = '';
}

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
      file_path: form.file_path,
      file_name: form.file_name,
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
    form.file_path = doc.file_path || '';
    form.file_name = doc.file_name || '';
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

        <el-form-item label="文件附件（可选）">
          <div class="upload-box">
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              hidden
              @change="onFileChange"
            />
            <div class="upload-row">
              <el-button :loading="uploading" @click="pickFile">
                {{ uploading ? '上传中…' : '选择文件上传' }}
              </el-button>
              <span class="field-hint inline">PDF / Word / Excel / PPT，单个不超过 4MB</span>
            </div>

            <div v-if="form.file_name" class="uploaded-file">
              <span class="uploaded-name">{{ form.file_name }}</span>
              <el-button link type="danger" @click="clearFile">移除</el-button>
            </div>

            <div class="field-hint">
              文件直接上传到学生会 FileBrowser，发布后详情页自动出现预览/下载按钮。
              超过 4MB 的文件请先在 FileBrowser 网页上传，再把直链填到下方「外部直链」。
            </div>
          </div>
        </el-form-item>

        <el-form-item label="外部直链（可选，替代上传）" prop="file_url">
          <el-input
            v-model="form.file_url"
            :disabled="hasUploaded"
            placeholder="https://file.example.com/api/public/dl/xxxx?token=xxxx"
          />
          <div class="field-hint">
            {{ hasUploaded ? '已上传文件，外部直链不生效；如需改用直链请先移除已上传文件。' : 'FileBrowser 公开分享直链（http/https）。' }}
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

.upload-box {
  width: 100%;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 12px;
  border: 1px dashed #c7d2fe;
  border-radius: 8px;
  background: #f5f7ff;
  max-width: 100%;
}

.uploaded-name {
  font-size: 13px;
  color: var(--brand-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
