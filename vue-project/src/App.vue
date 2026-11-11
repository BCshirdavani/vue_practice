<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <main class="min-w-0 flex-1">
      <header class="flex h-14 items-center border-b px-4">
        <SidebarTrigger />
      </header>
      <div class="p-4 md:p-6">
        <RouterView />
      </div>
    </main>
  </SidebarProvider>
</template>
