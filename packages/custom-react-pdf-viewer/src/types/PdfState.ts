// packages/custom-react-pdf-viewer/src/types/PdfState.ts

export type PdfViewerFeature =
  | "toolbar"
  | "find"
  | "rotation"
  | "zoom"
  | "pagination"
  | "print"
  | "download";

export interface PdfScrollAnchor {
  pageIndex: number; // 0-based
  ratioY: number;    // 0.0 to 1.0 (relative to page height)
  ratioX?: number;   // 0.0 to 1.0 (relative to page width)
}

export interface PdfViewState {
  version: 1;
  pageNumber: number;
  scale: number | string; // numeric (1.5) or preset ("page-width")
  rotation: number;
  scrollAnchor?: PdfScrollAnchor;
  sessionKey?: string; // Used to validate if this state belongs to the current session
  updatedAt: number;
}

export interface PdfPersistenceStore {
  get(viewerId: string): PdfViewState | null;
  set(viewerId: string, state: PdfViewState): void;
  remove(viewerId: string): void;
}
