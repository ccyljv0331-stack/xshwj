<script setup>
import { categoryTagType } from '../utils/format';

defineProps({
  category: { type: String, default: '' },
});
</script>

<template>
  <el-tag :type="categoryTagType(category)" effect="plain" size="small" round>
    {{ category || '未分类' }}
  </el-tag>
</template>
