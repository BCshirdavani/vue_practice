/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IMAGE_TEST_URL: string
  readonly VITE_CLOCK_SOCKET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
