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

  // Track eventBus in state to ensure child components render when it's ready
  const [eventBus, setEventBus] = useState<any>(null);

  const [internalIsLoading, setInternalIsLoading] = useState(true);
  const [internalBlobUrl, setInternalBlobUrl] = useState<string | null>(null);

  // 1. Manage Blob URL
  useEffect(() => {
    if (!file) {
      setInternalIsLoading(true);
      return;
    }

    // Create the Blob URL
    const blobUrl = URL.createObjectURL(file);
    setInternalBlobUrl(blobUrl);

    // NOTE: We do NOT set internalIsLoading(false) here anymore.
    // We wait for the PDF to actually load content.

    return () => {
      URL.revokeObjectURL(blobUrl);
      setInternalBlobUrl(null);
    };
  }, [file]);

  // 2. Init Viewer
  useEffect(() => {
    // The viewerRef will now always exist because we changed the JSX return below.
    if (!viewerRef.current || !internalBlobUrl) {
      return;
    }

    let initialPageNo = 1;
    const queryParams = new URLSearchParams(window.location.search);
    const qPage = Number(queryParams.get('page'));
    if (qPage && !isNaN(qPage)) {
      initialPageNo = qPage;
    }

    // Initialize the manager
    pdfManager.initViewer(viewerRef.current, EventBus, PDFLinkService, PDFFindController, PDFViewer, internalBlobUrl, initialPageNo);

    // Sync the eventBus to state and setup loading listeners
    if (pdfManager.eventBus) {
        setEventBus(pdfManager.eventBus);

        // Listen for the 'pagesloaded' event to turn off the loading bar
        const onPagesLoaded = () => {
          setInternalIsLoading(false);
        };

        pdfManager.eventBus.on('pagesloaded', onPagesLoaded);

        // Cleanup listener on unmount/re-run
        return () => {
           pdfManager.eventBus?.off('pagesloaded', onPagesLoaded);
           pdfManager.unmount();
           setEventBus(null);
        };
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

      {eventBus && <PdfFindBar eventBus={eventBus} />}

      {/* Render Loader Overlay */}
      {internalIsLoading && (
        <div className={styles.loader}>
          <div className={styles.loaderBar} />
        </div>
      )}

      {/* Always render the viewer div so the 'viewerRef' is populated
        and accessible to the initViewer effect immediately.
      */}
      <div className={`${styles.viewer} pdfViewer`} ref={viewerRef} />
    </div>
  );
};