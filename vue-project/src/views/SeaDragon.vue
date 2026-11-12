<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import OpenSeadragon from 'openseadragon'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const viewerElement = ref<HTMLDivElement | null>(null)
const isLoading = ref(false)
const error = ref('')
const imageList = ref<unknown>(null)
const isListLoading = ref(true)
const imageListError = ref('')
const requestController = new AbortController()
const selectedImage = ref<AvailableImage>()
interface AvailableImage {
  id: number
  label: string
}
const availableImages = ref<AvailableImage[]>([])

function isAvailableImage(value: unknown): value is AvailableImage {
  return typeof value === 'object' && value !== null
    && 'id' in value && typeof value.id === 'number'
    && 'label' in value && typeof value.label === 'string'
}

const onImageChange = async () => {
  const id = selectedImage.value?.id
  if (id == null) return

  const imagePath = import.meta.env.VITE_IMAGE_GET_ID_URL.replace('{:id}', encodeURIComponent(String(id)))
  const url = new URL(imagePath, window.location.origin)

  await loadImage(url)
}

let viewer: OpenSeadragon.Viewer | undefined
let imageUrl: string | undefined
let imageRequestId = 0

async function loadImage(url: URL /*| URL = import.meta.env.VITE_IMAGE_TEST_URL*/) {
  const requestId = ++imageRequestId
  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch(url, {
      signal: requestController.signal,
    })

    if (requestController.signal.aborted || requestId !== imageRequestId) return

    if (!response.ok) {
      isLoading.value = false
      error.value = `Image request failed (HTTP ${response.status}).`
      toast.error(error.value)
      console.error(error.value)
      return
    }

    const image = await response.blob()
    if (requestController.signal.aborted || requestId !== imageRequestId || !viewer) return

    const previousImageUrl = imageUrl
    imageUrl = URL.createObjectURL(image)
    // The viewer's open/open-failed events finish the image loading state.
    viewer.open({ tileSource: { type: 'image', url: imageUrl } })
    if (previousImageUrl) URL.revokeObjectURL(previousImageUrl)
  } catch (cause) {
    if (requestController.signal.aborted || requestId !== imageRequestId) return

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

    // Validate the API response before using it as component state.
    const data: unknown = await response.json()
    if (requestController.signal.aborted) return

    if (typeof data !== 'object' || data === null
      || !('images' in data) || !Array.isArray(data.images)
      || !data.images.every(isAvailableImage)) {
      imageListError.value = 'The image list response has an invalid format.'
      toast.error(imageListError.value)
      console.error(imageListError.value, data)
      return
    }

    imageList.value = data
    availableImages.value = data.images.map(({ id, label }) => ({ id, label }))
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

  await Promise.allSettled([/*loadImage(),*/ loadImageList()])
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

    <div>
      <p v-if="isListLoading" role="status">Loading image list…</p>
      <p v-else-if="imageListError" role="alert">{{ imageListError }}</p>
        <Select v-model="selectedImage" @update:model-value="onImageChange">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Select an image" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Image Selection</SelectLabel>
              <SelectItem v-for="image in availableImages" :key="image.id" :value="image">
                {{ image.label }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
    </div>

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
