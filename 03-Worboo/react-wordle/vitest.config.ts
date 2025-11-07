import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const collectClientEnv = (mode: string) => {
  const env = loadEnv(mode, process.cwd(), '')
  return Object.fromEntries(
    Object.entries(env).filter(([key]) =>
      key.startsWith('REACT_APP_') || key.startsWith('VITE_')
        ? true
        : false
    )
  )
}

export default defineConfig(({ mode }) => {
  const publicEnv = collectClientEnv(mode)

  return {
    plugins: [react()],
    envPrefix: ['REACT_APP_', 'VITE_'],
    define: {
      'process.env': publicEnv,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      globals: true,
      css: true,
    },
  }
})
