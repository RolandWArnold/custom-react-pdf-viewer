// packages/custom-react-pdf-viewer/src/nodeCustomPdfViewer.tsx

import type { CustomPdfViewerProps } from './pdf/CustomPdfViewer';

/**
 * Node/SSR-safe stub. It exists so Node environments (RunKit, SSR build steps)
 * can import the module without immediately touching window/document/pdfjs.
 *
 * If someone actually tries to *render* this on the server, we give a clear error.
 */
export function CustomPdfViewer(_props: CustomPdfViewerProps) {
  throw new Error(
    '[custom-react-pdf-viewer] CustomPdfViewer cannot run in a non-browser environment (no window/document). ' +
      'Use it only on the client side (e.g. guard with typeof window !== "undefined").'
  );
}
