import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import reportWebVitals from './reportWebVitals'
import { AlertProvider } from './context/AlertContext'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './Home'
import Verify from './Verify'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config, chains } from './lib/wagmi'
import { GAME_TITLE } from './constants/strings'

const queryClient = new QueryClient()
const container = document.getElementById('root')

if (!container) {
  throw new Error('Failed to find root element')
}

document.title = GAME_TITLE ?? 'Worboo'

const root = ReactDOM.createRoot(container)

root.render(
  <React.StrictMode>
    <WagmiConfig client={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains} theme={darkTheme()} modalSize="compact">
          <AlertProvider>
            <Router>
              <Routes>
                <Route path="/verify/:ipfsHash" element={<Verify />} />
                <Route path="/" element={<Home />} />
              </Routes>
            </Router>
          </AlertProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>
)

reportWebVitals()
reportWebVitals()
