import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'
import DbConsole from './components/DbConsole'
import { StoreProvider } from './contexts/StoreContext'
import { registerPosStorageMirror } from './services/posPersistService'

registerPosStorageMirror()

function Root() {
  const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''))
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  if (hash.startsWith('#/db-console')) {
    return <DbConsole />
  }
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <Root />
    </StoreProvider>
  </StrictMode>,
)
