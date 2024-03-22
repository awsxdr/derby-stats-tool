import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { HotkeysProvider } from '@blueprintjs/core'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HotkeysProvider>
      <App />
    </HotkeysProvider>
  </React.StrictMode>,
)
