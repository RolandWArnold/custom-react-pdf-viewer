import 'pdfjs-dist/web/pdf_viewer.css';

// Export the component
export { CustomPdfViewer } from './pdf/CustomPdfViewer';

// Export the State Adapter Helper
export { createLocalStorageAdapter } from './adapters/createLocalStorageAdapter';

// Export the Context Adapter Helper
export { createContextAdapter } from './adapters/createContextAdapter';

// Export the Store Provider and Hook
export { PdfStoreProvider, usePdfStore } from './store/PdfStore';

// Export Types
export type {
  PdfPersistenceStore,
  PdfViewState,
  PdfViewerFeature
} from './types/PdfState';