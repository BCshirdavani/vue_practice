<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import OpenSeadragon from 'openseadragon'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'


const viewerElement = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
const error = ref('')
const requestController = new AbortController()

let viewer: OpenSeadragon.Viewer | undefined
let imageUrl: string | undefined

onMounted(async () => {
  if (!viewerElement.value) return

  viewer = OpenSeadragon({
    element: viewerElement.value,
    showNavigator: true,
    // Use the buttons below so no external navigation icon assets are needed.
    showNavigationControl: false,
  })

  viewer.addHandler('open', () => {
    isLoading.value = false
  })

  viewer.addHandler('open-failed', () => {
    isLoading.value = false
    error.value = 'The server response could not be displayed as an image.'
  })

  try {
    const response = await fetch(import.meta.env.VITE_IMAGE_TEST_URL, {
      signal: requestController.signal,
    })

    if (!response.ok) {
      toast.error(`Image request failed (HTTP ${response.status}).`);
      console.error(`Image request failed (HTTP ${response.status}).`);
    }

    const image = await response.blob()
    if (requestController.signal.aborted) return

    imageUrl = URL.createObjectURL(image)
    // A regular image response uses an image tile source, rather than a DZI manifest.
    viewer.open({ tileSource: { type: 'image', url: imageUrl } })
  } catch (cause) {
    if (requestController.signal.aborted) return

    isLoading.value = false
    error.value = cause instanceof Error ? cause.message : 'Unable to load the image.'
  }
})

onBeforeUnmount(() => {
  requestController.abort()
  viewer?.destroy()
  viewer = undefined
  if (imageUrl) URL.revokeObjectURL(imageUrl)
})
</script>

<template>
  <section class="sea-dragon" aria-label="Image viewer">
    <h1>Image viewer</h1>
    <p>Scroll or pinch to zoom. Drag to pan.</p>

    <fieldset class="controls" :disabled="isLoading || Boolean(error)" aria-label="Image controls">
      <Button type="button" variant="outline" :disabled="isLoading || Boolean(error)" @click="viewer?.viewport.zoomBy(1.5)">Zoom in</Button>
      <Button type="button" variant="outline" :disabled="isLoading || Boolean(error)" @click="viewer?.viewport.zoomBy(1 / 1.5)">Zoom out</Button>
      <Button type="button" variant="secondary" :disabled="isLoading || Boolean(error)" @click="viewer?.viewport.goHome()">Reset view</Button>
    </fieldset>

    <p v-if="isLoading" role="status">Loading image…</p>
    <p v-else-if="error" role="alert">{{ error }}</p>

    <div ref="viewerElement" class="viewer" :aria-busy="isLoading"></div>
  </section>
</template>

<style scoped>
.sea-dragon {
  width: 100%;
  min-width: 0;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
  padding: 0;
  border: 0;
}

.viewer {
  width: 100%;
  height: 60vh;
  min-height: 320px;
  background: #111;
}
</style>
