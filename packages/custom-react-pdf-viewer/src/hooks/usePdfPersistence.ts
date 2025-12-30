// packages/custom-react-pdf-viewer/src/hooks/usePdfPersistence.ts
import { useEffect, useRef, useCallback } from 'react';
import type PdfManager from '../pdf/PdfManager';
import type { PdfPersistenceStore, PdfViewState } from '../types/PdfState';
import { debounce } from '../utils/debounce'; // You'll need a simple debounce util

export function usePdfPersistence(
  manager: PdfManager,
  store: PdfPersistenceStore | null | undefined,
  viewerId: string | undefined,
  sessionKey: string | undefined,
  fileRef: any, // The actual file object/blob
  isEnabled: boolean
) {
  const isRestored = useRef(false);
  const previousSessionKey = useRef<string | undefined>(sessionKey);

  // 1. Load Initial State (Synchronous-ish)
  // We want to return specific config options (scale/rotation) to be used during INIT
  const getInitialConfig = useCallback(() => {
    if (!isEnabled || !store || !viewerId) return {};

    const saved = store.get(viewerId);
    if (!saved) return {};

    // Session Guard: If sessionKey provided, it MUST match.
    if (sessionKey && saved.sessionKey !== sessionKey) {
        return {};
    }

    // If no sessionKey provided, we can optionally check file metadata here
    // But per requirements: if sessionKey missing, we trust the viewerId slot
    // UNLESS the user explicitly wants strict safety.

    return {
        scale: saved.scale,
        rotation: saved.rotation,
        pageNumber: saved.pageNumber // Used as fallback
    };
  }, [isEnabled, store, viewerId, sessionKey]);


  // 2. The Restore Logic (After Layout)
  useEffect(() => {
    if (!manager.eventBus || !isEnabled || !store || !viewerId) return;

    const onPagesLoaded = () => {
        if (isRestored.current) return;

        const saved = store.get(viewerId);
        // Same guard checks
        if (!saved) return;
        if (sessionKey && saved.sessionKey !== sessionKey) return;

        // Execute precise scroll restore
        // We use requestAnimationFrame to ensure PDF.js has finalized DOM sizes
        requestAnimationFrame(() => {
            manager.restoreViewState(saved);
            isRestored.current = true;
        });
    };

    manager.eventBus.on('pagesloaded', onPagesLoaded);
    return () => {
        manager.eventBus?.off('pagesloaded', onPagesLoaded);
    };
  }, [manager.eventBus, isEnabled, store, viewerId, sessionKey]);


  // 3. The Save Logic (Debounced)
  useEffect(() => {
    if (!manager.eventBus || !isEnabled || !store || !viewerId) return;

    const saveState = debounce(() => {
        const snapshot = manager.getCurrentViewState(sessionKey);
        if (snapshot) {
            store.set(viewerId, snapshot);
        }
    }, 400); // 400ms debounce

    // Listen to all events that change view
    manager.eventBus.on('pagechanging', saveState);
    manager.eventBus.on('scalechanging', saveState);
    manager.eventBus.on('rotationchanging', saveState);

    // Scroll is tricky. PDF.js doesn't emit 'scroll'.
    // We need to listen to the container.
    // (This is often done inside PdfManager or passed ref here.
    //  Let's assume PdfManager exposes the element or we rely on pagechanging for coarse updates,
    //  but for scroll restoration we really want scroll events.)
    const container = manager.viewerElement;
    container?.addEventListener('scroll', saveState);

    return () => {
        saveState.clear?.(); // If debounce has clear
        manager.eventBus?.off('pagechanging', saveState);
        manager.eventBus?.off('scalechanging', saveState);
        manager.eventBus?.off('rotationchanging', saveState);
        container?.removeEventListener('scroll', saveState);
    };
  }, [manager.eventBus, manager.viewerElement, isEnabled, store, viewerId, sessionKey]);

  // Reset restored flag if file/session changes
  useEffect(() => {
      if (sessionKey !== previousSessionKey.current) {
          isRestored.current = false;
          previousSessionKey.current = sessionKey;
      }
  }, [sessionKey]);

  return { getInitialConfig };
}

// Simple debounce helper if you don't have lodash
function debounce(func: Function, wait: number) {
  let timeout: any;
  const debounced = (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.clear = () => clearTimeout(timeout);
  return debounced;
}
