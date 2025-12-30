// packages/custom-react-pdf-viewer/src/store/PdfStore.tsx
import React, { createContext, useContext, useMemo } from 'react';
import type { PdfPersistenceStore, PdfViewState } from '../types/PdfState';

// --- Default Implementation (LocalStorage) ---
export class LocalStorageStore implements PdfPersistenceStore {
  private prefix: string;

  constructor(prefix: string = 'pdf_v1_') {
    this.prefix = prefix;
  }

  get(viewerId: string): PdfViewState | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${this.prefix}${viewerId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('PdfStore read error:', e);
      return null;
    }
  }

  set(viewerId: string, state: PdfViewState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${this.prefix}${viewerId}`, JSON.stringify(state));
    } catch (e) {
      console.warn('PdfStore write error:', e);
    }
  }

  remove(viewerId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${this.prefix}${viewerId}`);
  }
}

// --- Context & Provider ---
const PdfStoreContext = createContext<PdfPersistenceStore | null>(null);

export const PdfStoreProvider: React.FC<{
  store?: PdfPersistenceStore;
  children: React.ReactNode
}> = ({ store, children }) => {
  // Default to LocalStorage if no store provided
  const activeStore = useMemo(() => store || new LocalStorageStore(), [store]);

  return (
    <PdfStoreContext.Provider value={activeStore}>
      {children}
    </PdfStoreContext.Provider>
  );
};

export const usePdfStore = () => useContext(PdfStoreContext);
