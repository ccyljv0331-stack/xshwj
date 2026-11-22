<script setup>
import { Calendar, OfficeBuilding, View } from '@element-plus/icons-vue';
import CategoryTag from './CategoryTag.vue';
import { formatDate, formatViews } from '../utils/format';

defineProps({
  doc: { type: Object, required: true },
});
</script>

<template>
  <router-link :to="`/docs/${doc.id}`" class="doc-card">
    <div class="card-head">
      <CategoryTag :category="doc.category" />
      <span v-if="doc.is_top" class="top-flag">置顶</span>
    </div>

    <h3 class="card-title">{{ doc.title }}</h3>

    <div class="card-meta">
      <span class="meta-item">
        <el-icon><OfficeBuilding /></el-icon>
        {{ doc.dept }}
      </span>
      <span class="meta-item">
        <el-icon><Calendar /></el-icon>
        {{ formatDate(doc.created_at, false) }}
      </span>
    </div>

    <div class="card-foot">
      <span class="views">
        <el-icon><View /></el-icon>
        {{ formatViews(doc.view_count) }} 次阅读
      </span>
      <span class="read-more">查看详情 →</span>
    </div>
  </router-link>
</template>

<style scoped>
.doc-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 18px 18px 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.doc-card:hover {
  transform: translateY(-3px);
  border-color: #c7d3ee;
  box-shadow: var(--shadow);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.top-flag {
  flex-shrink: 0;
  padding: 1px 8px;
  border-radius: 999px;
  background: #fdecec;
  color: var(--accent);
  font-size: 12px;
  border: 1px solid #f6c9c9;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.55;
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 49px;
  margin-bottom: 12px;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--muted);
  font-size: 12.5px;
  margin-bottom: 14px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-foot {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--muted);
}

.views {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.read-more {
  color: var(--brand);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
}

.doc-card:hover .read-more {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 768px) {
  .read-more {
    opacity: 1;
    transform: none;
  }
}
</style>
