<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { api } from '../../api';
import CategoryTag from '../../components/CategoryTag.vue';
import { formatDate, formatViews } from '../../utils/format';

const router = useRouter();

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const data = await api.listDocs({ page: page.value, pageSize });
    list.value = data.list || [];
    total.value = data.total || 0;
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    loading.value = false;
  }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除《${row.title}》吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    );
  } catch {
    return;
  }

  try {
    await api.deleteDoc(row.id);
    ElMessage.success('文件已删除');
    if (list.value.length === 1 && page.value > 1) page.value -= 1;
    else load();
  } catch (error) {
    ElMessage.error(error.message);
  }
}

watch(page, load);
onMounted(load);
</script>

<template>
  <div>
    <div class="manage-head">
      <div>
        <h1>文件管理</h1>
        <p>共 {{ total }} 份文件 · 支持发布、编辑与删除</p>
      </div>
      <el-button type="primary" @click="router.push('/admin/docs/new')">
        <el-icon><Plus /></el-icon>
        发布新文件
      </el-button>
    </div>

    <div class="panel table-wrap">
      <el-table
        v-loading="loading"
        :data="list"
        style="width: 100%; min-width: 840px"
        empty-text="暂无文件，点击右上角发布新文件"
      >
        <el-table-column label="标题" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <router-link :to="`/docs/${row.id}`" class="title-link">{{ row.title }}</router-link>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="110">
          <template #default="{ row }">
            <CategoryTag :category="row.category" />
          </template>
        </el-table-column>

        <el-table-column prop="dept" label="发布部门" width="140" show-overflow-tooltip />

        <el-table-column label="置顶" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_top" type="danger" effect="plain" size="small">置顶</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>

        <el-table-column label="阅读量" width="90" align="center">
          <template #default="{ row }">{{ formatViews(row.view_count) }}</template>
        </el-table-column>

        <el-table-column label="发布时间" width="150">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push(`/admin/docs/${row.id}/edit`)">
              编辑
            </el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
            <el-button link @click="router.push(`/docs/${row.id}`)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="total > pageSize" class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
      />
    </div>
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

.title-link {
  color: var(--text);
  font-weight: 500;
}

.title-link:hover {
  color: var(--brand);
}

.muted {
  color: #c0c4cc;
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
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

  .pager {
    justify-content: center;
  }
}
</style>
