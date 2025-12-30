import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Import the store provider
import { PdfStoreProvider } from 'custom-react-pdf-viewer'
import 'custom-react-pdf-viewer/style.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Wrap App to enable persistence */}
    <PdfStoreProvider>
      <App />
    </PdfStoreProvider>
  </StrictMode>,
)