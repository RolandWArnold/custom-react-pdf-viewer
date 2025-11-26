// packages/custom-react-pdf-viewer/src/pdf/CustomPdfViewer.tsx
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFViewer, EventBus, PDFLinkService, PDFFindController } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { PdfToolbar } from './PdfToolbar';
import { PdfFindBar } from './PdfFindBar';
import type { ToolbarProps } from './ToolbarInterface';
import PdfManager from './PdfManager';
import styles from '../css/CustomPdfViewer.module.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export interface CustomPdfViewerProps {
  fileName?: string;
  file: Blob | null;
  highlightInfo?: { [key: number]: string } | null;
  jumpToPage?: number | null;
}

export const CustomPdfViewer: FC<CustomPdfViewerProps> = ({
  fileName,
  file,
  highlightInfo,
  jumpToPage,
}) => {
  const [pdfManager] = useState(() => new PdfManager());
  const viewerRef = useRef<HTMLDivElement>(null);

  // FIX 1: Track eventBus in React state to force a render when it becomes available
  const [eventBus, setEventBus] = useState<any>(null);

  const [internalIsLoading, setInternalIsLoading] = useState(true);
  const [internalBlobUrl, setInternalBlobUrl] = useState<string | null>(null);

  // 1. Manage Blob URL and Loading State
  useEffect(() => {
    if (!file) {
      setInternalIsLoading(true);
      return;
    }

    // FIX 2: Unlock the deadlock.
    // We must reveal the DOM (set loading false) BEFORE we try to init the viewer.
    setInternalIsLoading(false);

    const blobUrl = URL.createObjectURL(file);
    setInternalBlobUrl(blobUrl);

    return () => {
      URL.revokeObjectURL(blobUrl);
      setInternalBlobUrl(null);
    };
  }, [file]);

  // 2. Init Viewer
  useEffect(() => {
    // Now that internalIsLoading is false, viewerRef.current will exist.
    if (!viewerRef.current || !internalBlobUrl) {
      return;
    }

    let initialPageNo = 1;
    const queryParams = new URLSearchParams(window.location.search);
    const qPage = Number(queryParams.get('page'));
    if (qPage && !isNaN(qPage)) {
      initialPageNo = qPage;
    }

    pdfManager.initViewer(viewerRef.current, EventBus, PDFLinkService, PDFFindController, PDFViewer, internalBlobUrl, initialPageNo);

    // FIX 3: Sync the eventBus to state immediately after init
    if (pdfManager.eventBus) {
        setEventBus(pdfManager.eventBus);
    }

    return () => {
      pdfManager?.unmount();
      setEventBus(null);
    };
  }, [internalBlobUrl, pdfManager]);

  // 3. Highlight info
  useEffect(() => {
    if (internalIsLoading || !viewerRef.current || !internalBlobUrl) {
      return;
    }
    pdfManager.setActiveHighlight(highlightInfo);
  }, [highlightInfo, pdfManager, internalIsLoading, internalBlobUrl]);

  const toolbarProps: ToolbarProps = { showFileName: false, fileName, pdfManager, jumpToPage };

  return (
    <div className={styles.container}>
      <PdfToolbar {...toolbarProps} />

      {/* FIX 4: Use the state variable 'eventBus' to ensure reliable rendering */}
      {eventBus && <PdfFindBar eventBus={eventBus} />}

      {internalIsLoading ? (
        <div className={styles.loader}>
          <div className={styles.loaderBar} />
        </div>
      ) : (
        <div className={`${styles.viewer} pdfViewer`} ref={viewerRef} />
      )}
    </div>
  );
};