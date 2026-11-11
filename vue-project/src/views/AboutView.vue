
<script setup lang="ts">
import {toast} from "vue-sonner";

</script>

<template>
  <div class="about" @click="toast.warning('This view currently does not do anything 🤷🏻‍♂️')">
    <h1>This is an about page</h1>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
