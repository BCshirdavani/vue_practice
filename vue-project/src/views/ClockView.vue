<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const currentTime = ref("--:--:--");
const connected = ref(false);

let socket = null;

onMounted(() => {
  socket = new WebSocket(import.meta.env.VITE_CLOCK_SOCKET_URL);

  socket.onopen = () => {
    console.log("WebSocket connected!");
    connected.value = true;
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    currentTime.value = data.time;
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
    connected.value = false;
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
});

onUnmounted(() => {
  if (socket) {
    socket.close();
  }
});
</script>

<template>
  <div>
    <h1>Live Server Clock</h1>

    <h2>{{ currentTime }}</h2>

    <p>
      {{ connected ? "Connected" : "Disconnected" }}
    </p>
  </div>
</template>
