<script setup lang="ts">
import { ref } from 'vue'
import { useGameRenderer } from '@/composables/useGameRenderer'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const { isReady } = useGameRenderer(canvasRef)
</script>

<template>
  <div class="game-canvas">
    <canvas ref="canvasRef" class="game-canvas__element" />
    <div v-if="!isReady" class="game-canvas__loading">로딩 중...</div>
  </div>
</template>

<style scoped>
.game-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #87ceeb 0%, #b8e0f8 50%, #6ab04c 50%, #4a8f32 100%);
  overflow: hidden;
}

.game-canvas__element {
  display: block;
  width: 100%;
  height: 100%;
}

.game-canvas__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.6);
  color: #fff;
  font-weight: 600;
  z-index: 1;
}
</style>
