import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const ethersV6Path = path.resolve(__dirname, '../node_modules/ethers6')
const ethersV5Path = path.resolve(__dirname, 'node_modules/ethers')
const ethersV5UtilsPath = path.resolve(ethersV5Path, 'lib/utils.js')

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
        ethers6: ethersV6Path,
        ethers: ethersV5Path,
        'ethers/lib/utils.js': ethersV5UtilsPath,
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
