<script setup>
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { View } from '@element-plus/icons-vue';
import { api } from '../api';
import DocCard from '../components/DocCard.vue';
import { formatDate, formatViews } from '../utils/format';

const loading = ref(true);
const topDocs = ref([]);
const latestDocs = ref([]);

async function load() {
  loading.value = true;
  try {
    const data = await api.getHome();
    topDocs.value = data.topDocs || [];
    latestDocs.value = data.latestDocs || [];
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-kicker">长沙新华学生会 · 文件公示</div>
        <h1>学生会文件发布公示平台</h1>
        <p class="hero-desc">
          公开、规范、高效。通知公告、红头文件、活动方案、会议记录与表彰公示，一站式查阅。
        </p>
        <div class="hero-actions">
          <el-button class="hero-btn" size="large" @click="$router.push('/docs')">
            浏览全部文件
          </el-button>
        </div>
      </div>
    </section>

    <section v-if="topDocs.length" class="container section">
      <div class="section-head">
        <h2>置顶文件</h2>
        <router-link to="/docs" class="more-link">查看全部 →</router-link>
      </div>

      <div class="pinned-list panel">
        <router-link
          v-for="(doc, index) in topDocs"
          :key="doc.id"
          :to="`/docs/${doc.id}`"
          class="pinned-item"
        >
          <span class="rank">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="pinned-body">
            <span class="pinned-title">{{ doc.title }}</span>
            <span class="pinned-meta">
              {{ doc.dept }} · {{ formatDate(doc.created_at) }} ·
              {{ formatViews(doc.view_count) }} 次阅读
            </span>
          </span>
          <span class="pinned-right">
            <span class="pin-badge">置顶</span>
          </span>
        </router-link>
      </div>
    </section>

    <section class="container section">
      <div class="section-head">
        <h2>最新文件</h2>
        <router-link to="/docs" class="more-link">查看全部 →</router-link>
      </div>

      <div v-if="loading" class="panel loading-block">
        <el-skeleton :rows="6" animated />
      </div>

      <div v-else-if="latestDocs.length" class="doc-grid">
        <DocCard v-for="doc in latestDocs" :key="doc.id" :doc="doc" />
      </div>

      <el-empty v-else description="暂无文件，敬请关注" />
    </section>

    <section class="container section">
      <div class="notice-strip">
        <el-icon class="notice-icon"><View /></el-icon>
        <span>
          平台数据实时更新，文件内容以学生会正式发布为准；PDF 在线预览水印仅用于网页展示，不影响原始文件。
        </span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(135deg, #14275f 0%, #1e3a8a 55%, #2b4da8 100%);
  padding: 52px 0 48px;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at 80% 20%, #000, transparent 72%);
  pointer-events: none;
}

.hero-inner {
  position: relative;
  z-index: 1;
}

.hero-kicker {
  display: inline-block;
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  font-size: 12.5px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 18px;
}

.hero h1 {
  font-size: 38px;
  letter-spacing: 2px;
  font-weight: 700;
  margin-bottom: 14px;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
}

.hero-desc {
  max-width: 640px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 15px;
  line-height: 1.9;
}

.hero-actions {
  margin-top: 26px;
}

.hero-btn {
  background: #fff;
  border-color: #fff;
  color: var(--brand-dark);
  font-weight: 600;
  padding: 0 26px;
}

.hero-btn:hover {
  background: #eef3ff;
  border-color: #eef3ff;
  color: var(--brand);
}

.pinned-list {
  overflow: hidden;
}

.pinned-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 15px 20px;
  transition: background 0.2s;
}

.pinned-item + .pinned-item {
  border-top: 1px solid var(--border);
}

.pinned-item:hover {
  background: #f8faff;
}

.rank {
  flex-shrink: 0;
  width: 34px;
  font-family: 'Times New Roman', serif;
  font-size: 19px;
  font-weight: 700;
  color: #b7c2da;
}

.pinned-item:nth-child(-n + 3) .rank {
  color: var(--accent);
}

.pinned-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pinned-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.pinned-item:hover .pinned-title {
  color: var(--brand);
}

.pinned-meta {
  font-size: 12.5px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pinned-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pin-badge {
  padding: 1px 9px;
  border-radius: 999px;
  background: #fdecec;
  border: 1px solid #f6c9c9;
  color: var(--accent);
  font-size: 12px;
}

.doc-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.notice-strip {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 14px 18px;
  border: 1px solid #dbe4f5;
  background: #f2f6ff;
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.7;
}

.notice-icon {
  color: var(--brand);
  margin-top: 3px;
  flex-shrink: 0;
}

@media (max-width: 992px) {
  .doc-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 36px 0 34px;
  }

  .hero h1 {
    font-size: 26px;
    letter-spacing: 1px;
  }

  .hero-desc {
    font-size: 13.5px;
  }

  .hero-actions {
    margin-top: 20px;
  }

  .hero-btn {
    width: 100%;
  }

  .pinned-item {
    padding: 13px 14px;
    gap: 10px;
  }

  .pinned-right {
    display: none;
  }

  .rank {
    width: 28px;
    font-size: 16px;
  }

  .doc-grid {
    grid-template-columns: 1fr;
  }

  .notice-strip {
    font-size: 12.5px;
  }
}
</style>
