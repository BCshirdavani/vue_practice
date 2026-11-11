<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { useColorMode } from '@vueuse/core'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { Button } from '@/components/ui/button'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

// Apply one light/dark mode to the entire app; default to the system preference.
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <main class="min-w-0 flex-1">
      <header class="flex h-14 items-center border-b px-4">
        <SidebarTrigger />
        <Button
          class="ml-auto"
          type="button"
          variant="ghost"
          size="icon"
          :aria-label="colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          :title="colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleColorMode"
        >
          <Sun v-if="colorMode === 'dark'" aria-hidden="true" />
          <Moon v-else aria-hidden="true" />
        </Button>
      </header>
      <div class="p-4 md:p-6">
        <RouterView />
      </div>
    </main>
  </SidebarProvider>
</template>
