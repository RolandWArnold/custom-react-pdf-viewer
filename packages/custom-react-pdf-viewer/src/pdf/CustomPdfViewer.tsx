// packages/custom-react-pdf-viewer/src/pdf/CustomPdfViewer.tsx

import type { FC } from 'react';
import { useEffect, useRef, useState, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFViewer, EventBus, PDFLinkService, PDFFindController } from 'pdfjs-dist/web/pdf_viewer.mjs';

import { PdfToolbar } from './PdfToolbar';
import { PdfFindBar } from './PdfFindBar';
import PdfManager, { ViewerConfig } from './PdfManager';
import styles from '../css/CustomPdfViewer.module.css';

// New Imports
import type { PdfPersistenceStore, PdfViewerFeature } from '../types/PdfState';
import { usePdfStore } from '../store/PdfStore';
import { usePdfPersistence } from '../hooks/usePdfPersistence';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export interface CustomPdfViewerProps {
  // === Data ===
  file: Blob | File | string | null;
  fileName?: string;
  highlightInfo?: { [key: number]: string } | null;
  jumpToPage?: number | null;

  // === Persistence (The New Way) ===
  /** Unique slot ID. Required for persistence. */
  viewerId?: string;
  /** Session key (e.g., tab ID, doc ID). If changes, treats as new doc. */
  sessionKey?: string;
  /** Optional store override. If null, uses Context. */
  persistenceStore?: PdfPersistenceStore;

  // === Features ===
  /** Strings of features to disable (e.g., ['rotation', 'find']) */
  disabledFeatures?: PdfViewerFeature[];
}

export const CustomPdfViewer: FC<CustomPdfViewerProps> = ({
  fileName,
  file,
  highlightInfo,
  jumpToPage,
  viewerId,
  sessionKey,
  persistenceStore,
  disabledFeatures = [],
}) => {
  // 1. Resolve Features
  const features = useMemo(() => ({
    toolbar: !disabledFeatures.includes('toolbar'),
    find: !disabledFeatures.includes('find'),
    rotation: !disabledFeatures.includes('rotation'),
    zoom: !disabledFeatures.includes('zoom'),
    pagination: !disabledFeatures.includes('pagination'),
  }), [disabledFeatures]);

  // 2. Resolve Store
  const contextStore = usePdfStore();
  const activeStore = persistenceStore || contextStore;
  const persistenceEnabled = !!viewerId && !!activeStore;

  // 3. Manager & Refs
  const [pdfManager] = useState(() => new PdfManager());
  const viewerRef = useRef<HTMLDivElement>(null);
  const [eventBus, setEventBus] = useState<any>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(true);
  const [internalBlobUrl, setInternalBlobUrl] = useState<string | null>(null);

  // 4. Persistence Hook
  const { getInitialConfig } = usePdfPersistence(
    pdfManager,
    activeStore,
    viewerId,
    sessionKey,
    file,
    persistenceEnabled
  );

  // 5. Blob Handling
  useEffect(() => {
    if (!file) {
      setInternalIsLoading(true);
      return;
    }
    // Handle string URL vs Blob
    const blobUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
    setInternalBlobUrl(blobUrl);

    return () => {
      if (typeof file !== 'string') URL.revokeObjectURL(blobUrl);
      setInternalBlobUrl(null);
    };
  }, [file]);

  // 6. Init Viewer
  useEffect(() => {
    if (!viewerRef.current || !internalBlobUrl) return;

    // Get config from persistence (if matches) OR from props
    const savedConfig = getInitialConfig();

    // Explicit props override saved config for specific things like jumpToPage
    // (Though usually jumpToPage is an imperative action, not init config)
    const initConfig: ViewerConfig = {
        ...savedConfig
    };

    // If jumpToPage is strictly provided as an initial prop (not just an update)
    if (jumpToPage) initConfig.pageNumber = jumpToPage;

    pdfManager.initViewer(
        viewerRef.current,
        EventBus,
        PDFLinkService,
        PDFFindController,
        PDFViewer,
        internalBlobUrl,
        initConfig
    );

    if (pdfManager.eventBus) {
        setEventBus(pdfManager.eventBus);
        const onPagesLoaded = () => setInternalIsLoading(false);
        pdfManager.eventBus.on('pagesloaded', onPagesLoaded);

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
  }, [internalBlobUrl, pdfManager]); // Removed getInitialConfig from deep deps to avoid remount loops

  // 7. Imperative Updates (Highlight, Jump)
  useEffect(() => {
    if (internalIsLoading || !viewerRef.current || !internalBlobUrl) return;
    pdfManager.setActiveHighlight(highlightInfo);
  }, [highlightInfo, pdfManager, internalIsLoading, internalBlobUrl]);

  useEffect(() => {
      if (jumpToPage && !internalIsLoading) {
          pdfManager.handleGoToPage(jumpToPage);
      }
  }, [jumpToPage, internalIsLoading, pdfManager]);

  return (
    <div className={styles.container}>
      {features.toolbar && (
        <PdfToolbar
            showFileName={false}
            fileName={fileName}
            pdfManager={pdfManager}
            features={features} // Pass features down
        />
      )}

      {features.find && eventBus && (
        <PdfFindBar eventBus={eventBus} />
      )}

      {internalIsLoading && (
        <>
          <div className={styles.loader}>
            <div className={styles.loaderBar} />
          </div>
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
          </div>
        </>
      )}
      <div className={`${styles.viewer} pdfViewer`} ref={viewerRef} />
    </div>
  );
};