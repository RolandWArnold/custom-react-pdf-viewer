import { assertPdfjsInstalled } from './sanity/pdfjsCheck';
// Ensure that pdfjs-dist is installed
assertPdfjsInstalled();

import 'pdfjs-dist/web/pdf_viewer.css';

// Export the component
export { CustomPdfViewer } from './pdf/CustomPdfViewer';
