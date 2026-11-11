<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import OpenSeadragon from 'openseadragon'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

const viewerElement = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
const error = ref('')
const imageList = ref<unknown>(null)
const isListLoading = ref(true)
const imageListError = ref('')
const requestController = new AbortController()

let viewer: OpenSeadragon.Viewer | undefined
let imageUrl: string | undefined

async function loadImage() {
  try {
    const response = await fetch(import.meta.env.VITE_IMAGE_TEST_URL, {
      signal: requestController.signal,
    })

    if (!response.ok) {
      isLoading.value = false
      error.value = `Image request failed (HTTP ${response.status}).`
      toast.error(error.value)
      console.error(error.value)
      return
    }

    const image = await response.blob()
    if (requestController.signal.aborted || !viewer) return

    imageUrl = URL.createObjectURL(image)
    // The viewer's open/open-failed events finish the image loading state.
    viewer.open({ tileSource: { type: 'image', url: imageUrl } })
  } catch (cause) {
    if (requestController.signal.aborted) return

    isLoading.value = false
    error.value = cause instanceof Error ? cause.message : 'Unable to load the image.'
    toast.error(error.value)
    console.error(error.value, cause)
  }
}

async function loadImageList() {
  try {
    const response = await fetch(import.meta.env.VITE_IMAGE_LIST_URL, {
      signal: requestController.signal,
    })

    if (!response.ok) {
      imageListError.value = `Image list request failed (HTTP ${response.status}).`
      toast.error(imageListError.value)
      console.error(imageListError.value)
      return
    }

    // Keep the response untyped until the API's JSON structure is defined.
    const data: unknown = await response.json()
    if (requestController.signal.aborted) return

    imageList.value = data
  } catch (cause) {
    if (requestController.signal.aborted) return

    imageListError.value = cause instanceof Error ? cause.message : 'Unable to load the image list.'
    toast.error(imageListError.value)
    console.error(imageListError.value, cause)
  } finally {
    if (!requestController.signal.aborted) isListLoading.value = false
  }
}

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
    toast.error(error.value)
    console.error(error.value)
  })

  await Promise.allSettled([loadImage(), loadImageList()])
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

    <p v-if="isListLoading" role="status">Loading image list…</p>
    <p v-else-if="imageListError" role="alert">{{ imageListError }}</p>

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
