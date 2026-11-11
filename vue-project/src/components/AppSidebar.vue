<script setup lang="ts">
import { Clock, House, Image, Info } from '@lucide/vue'
import { watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

const items = [
  { title: 'Home', to: '/', icon: House },
  { title: 'About', to: '/about', icon: Info },
  { title: 'Image viewer', to: '/seadragon', icon: Image },
  { title: 'Clock WebSocket', to: '/clock', icon: Clock },
]

const route = useRoute()
const { setOpenMobile } = useSidebar()

watch(() => route.fullPath, () => setOpenMobile(false))
</script>

<template>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <nav aria-label="Main navigation">
            <SidebarMenu>
              <SidebarMenuItem v-for="item in items" :key="item.to">
                <SidebarMenuButton as-child :is-active="route.path === item.to">
                  <RouterLink :to="item.to" @click="setOpenMobile(false)">
                    <component :is="item.icon" aria-hidden="true" />
                    <span>{{ item.title }}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </nav>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
