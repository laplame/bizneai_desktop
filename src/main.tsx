import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './contexts/StoreContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
    <App />
    </StoreProvider>
  </StrictMode>,
)
