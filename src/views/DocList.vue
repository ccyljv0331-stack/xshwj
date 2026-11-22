<script setup>
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '../api';
import DocCard from '../components/DocCard.vue';
import { CATEGORIES } from '../utils/format';

const category = ref('');
const page = ref(1);
const pageSize = 9;
const total = ref(0);
const list = ref([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const data = await api.listDocs({
      category: category.value,
      page: page.value,
      pageSize,
    });
    list.value = data.list || [];
    total.value = data.total || 0;
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    loading.value = false;
  }
}

function handleCategoryChange(value) {
  category.value = value;
  page.value = 1;
  load();
}

function handlePageChange(value) {
  page.value = value;
  load();
}

onMounted(load);
</script>

<template>
  <div class="container">
    <el-breadcrumb separator="/" class="page-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>全部文件</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-head">
      <div>
        <h1>全部文件</h1>
        <p>共 {{ total }} 份文件，按发布时间与置顶状态排序</p>
      </div>
    </div>

    <div class="filter-bar panel">
      <el-radio-group v-model="category" @change="handleCategoryChange">
        <el-radio-button value="">全部分类</el-radio-button>
        <el-radio-button v-for="item in CATEGORIES" :key="item" :value="item">
          {{ item }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div v-loading="loading" class="list-area">
      <div v-if="list.length" class="doc-grid">
        <DocCard v-for="doc in list" :key="doc.id" :doc="doc" />
      </div>

      <el-empty
        v-else-if="!loading"
        :description="category ? `「${category}」分类下暂无文件` : '暂无文件，敬请关注'"
      />

      <div v-if="total > pageSize" class="pager">
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          hide-on-single-page
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-breadcrumb {
  margin: 22px 0 16px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}

.page-head h1 {
  font-size: 26px;
  letter-spacing: 1px;
  color: var(--brand-dark);
  margin-bottom: 6px;
}

.page-head p {
  color: var(--muted);
  font-size: 13px;
}

.filter-bar {
  padding: 14px 16px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.filter-bar :deep(.el-radio-group) {
  flex-wrap: nowrap;
}

.list-area {
  min-height: 260px;
}

.doc-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.pager {
  display: flex;
  justify-content: center;
  padding: 28px 0 4px;
}

@media (max-width: 992px) {
  .doc-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-head h1 {
    font-size: 22px;
  }

  .filter-bar {
    padding: 10px 12px;
  }

  .doc-grid {
    grid-template-columns: 1fr;
  }
}
</style>
