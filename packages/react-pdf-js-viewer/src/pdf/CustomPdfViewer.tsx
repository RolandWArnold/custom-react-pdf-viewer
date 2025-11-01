// packages/react-pdf-js-viewer/src/pdf/CustomPdfViewer.tsx
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

interface CustomPdfViewerProps {
  fileName?: string;
  blobUrl: string;
  isLoading?: boolean;
  highlightInfo?: { [key: number]: string } | null;
  jumpToPage?: number | null;
}

export const CustomPdfViewer: FC<CustomPdfViewerProps> = ({
  isLoading = true,
  fileName,
  blobUrl,
  highlightInfo,
  jumpToPage,
}) => {
  const [pdfManager] = useState(() => new PdfManager());
  const viewerRef = useRef<HTMLDivElement>(null);
  const [pdfFileName, setPdfFileName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isLoading || !viewerRef.current || !blobUrl) {
      return;
    }

    let initialPageNo = 1;
    const queryParams = new URLSearchParams(window.location.search);
    const qPage = Number(queryParams.get('page'));
    if (qPage && !isNaN(qPage)) {
      initialPageNo = qPage;
    }

    pdfManager.initViewer(viewerRef.current, EventBus, PDFLinkService, PDFFindController, PDFViewer, blobUrl, initialPageNo);
    setPdfFileName(fileName);

    return () => {
      pdfManager?.unmount();
    };
  }, [blobUrl, pdfManager, isLoading]);

  useEffect(() => {
    if (isLoading || !viewerRef.current || !blobUrl) {
      return;
    }
    pdfManager.setActiveHighlight(highlightInfo);
  }, [highlightInfo, blobUrl, pdfManager, isLoading]);

  const toolbarProps: ToolbarProps = { showFileName: false, fileName: pdfFileName, pdfManager, jumpToPage };

  return (
    // 3. Use the 'styles' object for classNames
    <div className={styles.container}>
      <PdfToolbar {...toolbarProps} />
      {pdfManager.eventBus && <PdfFindBar eventBus={pdfManager.eventBus} />}

      {isLoading ? (
        <div className={styles.loader}>
          <div className={styles.loaderBar} />
        </div>
      ) : (
        <div className={`${styles.viewer} pdfViewer`} ref={viewerRef} />
      )}
    </div>
  );
};