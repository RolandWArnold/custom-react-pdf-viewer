import 'pdfjs-dist/web/pdf_viewer.css';

// Export the component
export { CustomPdfViewer } from './pdf/CustomPdfViewer';

// Export Provider, Hook, and the concrete Store implementations
export {
  PdfStoreProvider,
  usePdfStore,
  InMemoryStore,
  LocalStorageStore
} from './store/PdfStore';

// Export Types
export type {
  PdfPersistenceStore,
  PdfViewState,
  PdfViewerFeature
} from './types/PdfState';