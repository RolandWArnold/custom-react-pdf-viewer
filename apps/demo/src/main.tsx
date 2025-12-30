import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Import the store provider
import { PdfStoreProvider } from 'custom-react-pdf-viewer'
// import { PdfStoreProvider, LocalStorageStore } from 'custom-react-pdf-viewer' // Use if you want to persist state in localStorage
import 'custom-react-pdf-viewer/style.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PdfStoreProvider>
      {/* <PdfStoreProvider store={new LocalStorageStore()}> Use if you want to persist state in localStorage */}
      <App />
    </PdfStoreProvider>
  </StrictMode>,
)
