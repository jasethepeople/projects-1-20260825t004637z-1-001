import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--bg-border-hover)',
          color: 'var(--text-primary)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
        },
      }}
    />
  </BrowserRouter>,
)
