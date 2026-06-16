import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrivyProvider
      appId="cmqfk2zma002f0clajcnopn2g"
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#10b981',
          showWalletLoginFirst: true,
        },
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>,
)
