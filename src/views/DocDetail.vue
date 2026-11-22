<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Calendar,
  Delete,
  Download,
  Edit,
  OfficeBuilding,
  View,
} from '@element-plus/icons-vue';
import { api } from '../api';
import CategoryTag from '../components/CategoryTag.vue';
import { isLoggedIn } from '../utils/auth';
import { formatDate, formatViews } from '../utils/format';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const notFound = ref(false);
const deleting = ref(false);
const doc = ref(null);
const loggedIn = computed(() => isLoggedIn());

async function load() {
  loading.value = true;
  notFound.value = false;
  try {
    const data = await api.getDoc(route.params.id);
    doc.value = data.doc;
    // 打开详情页自动阅读量 +1
    try {
      const result = await api.increaseView(data.doc.id);
      doc.value.view_count = result.view_count;
    } catch {
      // 阅读计数失败不影响正文展示
    }
  } catch (error) {
    if (error.status === 404) notFound.value = true;
    else ElMessage.error(error.message);
  } finally {
    loading.value = false;
  }
}

function goPreview() {
  router.push(`/preview/${doc.value.id}`);
}

function goEdit() {
  router.push(`/admin/docs/${doc.value.id}/edit`);
}

async function remove() {
  try {
    await ElMessageBox.confirm(
      `确定删除《${doc.value.title}》吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    );
  } catch {
    return;
  }

  deleting.value = true;
  try {
    await api.deleteDoc(doc.value.id);
    ElMessage.success('文件已删除');
    router.push('/docs');
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    deleting.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="container detail-wrap">
    <el-breadcrumb separator="/" class="page-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/docs' }">全部文件</el-breadcrumb-item>
      <el-breadcrumb-item>文件详情</el-breadcrumb-item>
    </el-breadcrumb>

    <div v-if="loading" class="panel loading-block">
      <el-skeleton :rows="8" animated />
    </div>

    <el-result
      v-else-if="notFound"
      icon="warning"
      title="文件不存在"
      sub-title="该文件可能已被删除或链接有误"
    >
      <template #extra>
        <el-button type="primary" @click="router.push('/docs')">返回文件列表</el-button>
      </template>
    </el-result>

    <article v-else-if="doc" class="doc-article panel">
      <header class="article-head">
        <div class="article-tags">
          <CategoryTag :category="doc.category" />
          <el-tag v-if="doc.is_top" type="danger" effect="dark" size="small" round>置顶</el-tag>
        </div>

        <h1 class="article-title">{{ doc.title }}</h1>

        <div class="article-meta">
          <span class="meta-item">
            <el-icon><OfficeBuilding /></el-icon>
            {{ doc.dept }}
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            发布时间：{{ formatDate(doc.created_at) }}
          </span>
          <span class="meta-item">
            <el-icon><View /></el-icon>
            {{ formatViews(doc.view_count) }} 次阅读
          </span>
        </div>
      </header>

      <el-divider class="article-divider" />

      <div v-if="doc.content" class="article-content">{{ doc.content }}</div>
      <el-empty v-else description="暂无正文内容" :image-size="76" />

      <div class="article-actions">
        <el-button v-if="doc.file_url" type="primary" @click="goPreview">
          <el-icon><View /></el-icon>
          PDF 在线预览
        </el-button>
        <el-button v-else type="primary" disabled>暂无 PDF 文件</el-button>

        <el-button
          v-if="doc.file_url"
          tag="a"
          :href="doc.file_url"
          target="_blank"
          rel="noopener"
        >
          <el-icon><Download /></el-icon>
          下载文件
        </el-button>

        <template v-if="loggedIn">
          <el-button class="admin-btn" @click="goEdit">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" plain :loading="deleting" @click="remove">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </div>

      <p class="article-note">
        提示：PDF 在线预览的水印仅叠加在网页画布上，原始文件不会被修改。
      </p>
    </article>
  </div>
</template>

<style scoped>
.detail-wrap {
  max-width: 960px;
}

.page-breadcrumb {
  margin: 22px 0 16px;
}

.doc-article {
  padding: 34px 42px 28px;
}

.article-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.article-title {
  font-size: 28px;
  line-height: 1.5;
  letter-spacing: 0.5px;
  color: #111827;
  font-weight: 700;
  word-break: break-word;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin-top: 16px;
  color: var(--muted);
  font-size: 13px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.article-divider {
  margin: 22px 0;
}

.article-content {
  min-height: 160px;
  font-size: 15.5px;
  line-height: 2.05;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
}

.article-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 34px;
  padding-top: 22px;
  border-top: 1px solid var(--border);
}

.article-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.admin-btn {
  margin-left: auto;
}

.article-note {
  margin-top: 16px;
  color: #9ca3af;
  font-size: 12.5px;
}

@media (max-width: 768px) {
  .doc-article {
    padding: 22px 18px 20px;
  }

  .article-title {
    font-size: 21px;
  }

  .article-meta {
    gap: 6px 14px;
    font-size: 12.5px;
  }

  .article-content {
    font-size: 15px;
    line-height: 1.95;
  }

  .article-actions :deep(.el-button) {
    flex: 1 1 44%;
  }

  .admin-btn {
    margin-left: 0;
  }
}
</style>
