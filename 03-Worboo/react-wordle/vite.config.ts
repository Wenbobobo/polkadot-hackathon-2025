import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const exposeClientEnv = (mode: string) => {
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
  const publicEnv = exposeClientEnv(mode)

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
    server: {
      port: Number(process.env.PORT ?? 3000),
      host: process.env.HOST ?? '127.0.0.1',
    },
    worker: {
      format: 'es',
    },
  }
})
