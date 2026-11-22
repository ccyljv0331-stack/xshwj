<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Download } from '@element-plus/icons-vue';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { api } from '../api';

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

const route = useRoute();
const router = useRouter();

const doc = ref(null);
const pages = ref([]);
const renderedPages = ref(0);
const loading = ref(true);
const error = ref('');
const viewerEl = ref(null);
const pageRefs = [];

let loadingTask = null;

const watermarkStamp = new Date().toLocaleString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function setPageRef(el, index) {
  if (el) pageRefs[index] = el;
}

function drawWatermark(ctx, width, height) {
  const line1 = '长沙新华学生会内部文件';
  const line2 = watermarkStamp;
  const fontSize = Math.max(13, Math.round(width / 40));

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#1e3a8a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);

  const diagonal = Math.sqrt(width * width + height * height);
  const stepX = fontSize * 15;
  const stepY = fontSize * 8;

  for (let y = -diagonal / 2; y <= diagonal / 2; y += stepY) {
    for (let x = -diagonal / 2; x <= diagonal / 2; x += stepX) {
      ctx.font = `600 ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(line1, x, y);
      ctx.font = `400 ${Math.round(fontSize * 0.78)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(line2, x, y + fontSize * 1.25);
    }
  }

  ctx.restore();
}

async function renderPdf() {
  if (!doc.value) return;
  if (!doc.value.file_path && !doc.value.file_url) {
    error.value = '该文件未配置附件，暂不支持在线预览';
    loading.value = false;
    return;
  }

  try {
    loadingTask = pdfjsLib.getDocument({
      url: `/api/db?action=pdf&id=${doc.value.id}`,
    });
    const pdf = await loadingTask.promise;

    pages.value = Array.from({ length: pdf.numPages }, (_, index) => ({ num: index + 1 }));
    await nextTick();

    const containerWidth = viewerEl.value?.clientWidth || 820;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    for (let num = 1; num <= pdf.numPages; num += 1) {
      const page = await pdf.getPage(num);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.max(0.5, ((containerWidth - 2) / baseViewport.width) * dpr);
      const viewport = page.getViewport({ scale });

      const canvas = pageRefs[num - 1];
      if (!canvas) continue;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      drawWatermark(ctx, canvas.width, canvas.height);

      renderedPages.value = num;
    }
  } catch (err) {
    console.error('[pdf]', err);
    error.value =
      'PDF 加载失败，请确认 FileBrowser 文件直链可访问，或稍后重试。也可以直接下载文件查看。';
  } finally {
    loading.value = false;
  }
}

function goBack() {
  if (doc.value) router.push(`/docs/${doc.value.id}`);
  else router.push('/docs');
}

onMounted(async () => {
  try {
    const data = await api.getDoc(route.params.id);
    doc.value = data.doc;
    await renderPdf();
  } catch (err) {
    if (err.status === 404) {
      error.value = '文件不存在或已被删除';
      loading.value = false;
    } else {
      ElMessage.error(err.message);
      error.value = err.message;
      loading.value = false;
    }
  }
});

onBeforeUnmount(() => {
  loadingTask?.destroy?.();
});
</script>

<template>
  <div class="preview-page">
    <div class="preview-toolbar">
      <div class="container toolbar-inner">
        <el-button text class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回详情
        </el-button>

        <div class="toolbar-title">
          <span class="toolbar-label">PDF 在线预览</span>
          <span class="toolbar-doc">{{ doc?.title || '加载中…' }}</span>
        </div>

        <div class="toolbar-actions">
          <span v-if="pages.length" class="page-count">{{ pages.length }} 页</span>
          <el-button
            v-if="doc?.file_path || doc?.file_url"
            tag="a"
            :href="`/api/db?action=download&id=${doc.id}`"
            target="_blank"
            rel="noopener"
            size="small"
          >
            <el-icon><Download /></el-icon>
            下载原件
          </el-button>
        </div>
      </div>
    </div>

    <div class="container preview-body">
      <div class="watermark-tip">
        预览页面叠加「长沙新华学生会内部文件」水印，仅用于网页展示，原始 PDF 不会被修改。
      </div>

      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
        class="preview-alert"
      />

      <div v-if="loading" class="preview-status">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>
          正在加载 PDF
          <template v-if="pages.length">（{{ renderedPages }} / {{ pages.length }} 页）</template>
        </span>
      </div>

      <div ref="viewerEl" class="pdf-viewer">
        <div v-for="page in pages" :key="page.num" class="pdf-page">
          <canvas :ref="(el) => setPageRef(el, page.num - 1)"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-page {
  padding-bottom: 48px;
}

.preview-toolbar {
  position: sticky;
  top: 64px;
  z-index: 30;
  background: rgba(255, 255, 255, 0.97);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(8px);
}

.toolbar-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 60px;
  padding: 8px 0;
}

.back-btn {
  flex-shrink: 0;
}

.toolbar-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.toolbar-label {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 2px;
}

.toolbar-doc {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.page-count {
  font-size: 12.5px;
  color: var(--muted);
}

.preview-body {
  padding-top: 18px;
}

.watermark-tip {
  margin-bottom: 14px;
  padding: 10px 14px;
  border: 1px solid #f1dfb8;
  background: #fffaf0;
  color: #8a6d3b;
  border-radius: 8px;
  font-size: 12.5px;
}

.preview-alert {
  margin-bottom: 16px;
}

.preview-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 18px;
  color: var(--muted);
  font-size: 13.5px;
}

.pdf-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  margin-top: 6px;
}

.pdf-page {
  width: 100%;
  max-width: 900px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 4px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  line-height: 0;
}

.pdf-page canvas {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 768px) {
  .preview-toolbar {
    top: 0;
    position: relative;
  }

  .toolbar-inner {
    flex-wrap: wrap;
    gap: 6px 10px;
    padding: 10px 0;
  }

  .toolbar-title {
    order: 3;
    width: 100%;
    flex-basis: 100%;
  }

  .toolbar-actions {
    margin-left: auto;
  }

  .page-count {
    display: none;
  }

  .watermark-tip {
    font-size: 12px;
  }
}
</style>
