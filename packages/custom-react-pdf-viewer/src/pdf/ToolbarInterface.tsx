import PdfManager from './PdfManager';

export interface ToolbarProps {
  showFileName: boolean;
  fileName?: string;
  pdfManager?: PdfManager;
  isFileLoading?: boolean;
  jumpToPage?: number | null;
  features: {
      zoom: boolean;
      rotation: boolean;
      pagination: boolean;
      find: boolean;
  };
}
