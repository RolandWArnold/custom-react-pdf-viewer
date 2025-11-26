// packages/custom-react-pdf-viewer/src/pdf/PdfFindBar.tsx
import React, { useState, useEffect, useRef, useId } from 'react';
import type { FunctionComponent } from 'react';
import styles from '../css/PdfFindBar.module.css';
import { EventBus } from 'pdfjs-dist/web/pdf_viewer.mjs';

const MATCHES_COUNT_LIMIT = 1000;
const FindState = {
  FOUND: 0,
  NOT_FOUND: 1,
  WRAPPED: 2,
  PENDING: 3,
};
interface PdfFindBarProps {
  eventBus: InstanceType<typeof EventBus>;
}

export const PdfFindBar: FunctionComponent<PdfFindBarProps> = ({ eventBus }) => {
  // === DIAGNOSTIC LOG ===
  // Verify the component is mounting and has an eventBus
  useEffect(() => {
    console.log('[PdfFindBar] Mounted. EventBus present:', !!eventBus);
  }, [eventBus]);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightAll, setHighlightAll] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchDiacritics, setMatchDiacritics] = useState(false);
  const [entireWord, setEntireWord] = useState(false);
  const [findMessage, setFindMessage] = useState('');
  const [matchesCount, setMatchesCount] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState('');

  const findFieldRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(isOpen);

  const baseId = useId();
  const findHighlightAllId = `${baseId}-find-highlight-all`;
  const findMatchCaseId = `${baseId}-find-match-case`;
  const findMatchDiacriticsId = `${baseId}-find-match-diacritics`;
  const findEntireWordId = `${baseId}-find-entire-word`;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        console.log('[PdfFindBar] Ctrl+F detected');
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [eventBus, query, caseSensitive, entireWord, highlightAll, matchDiacritics]);

  useEffect(() => {
    // Listen for the toggle event from the toolbar
    const toggleFindBar = () => {
        console.log('[PdfFindBar] Received toggle event. Current state:', isOpen);
        setIsOpen(open => !open);
    };

    const handleUpdateState = (data: {
      state: number,
      previous: string,
      matchesCount: { total: number }
    }) => {
       let msg = '';
      let newStatus = '';
      switch (data.state) {
        case FindState.FOUND:
          break;
        case FindState.PENDING:
          newStatus = 'pending';
          break;
        case FindState.NOT_FOUND:
          msg = 'Phrase not found';
          newStatus = 'notFound';
          break;
        case FindState.WRAPPED:
          msg = `Reached ${data.previous ? 'top' : 'bottom'} of document`;
          break;
      }
      setFindMessage(msg);
      setStatus(newStatus);
      if (data.matchesCount) {
        setMatchesCount(mc => ({ ...mc, total: data.matchesCount.total }));
      }
    };

    const handleUpdateMatches = (data: { matchesCount: { current: number, total: number } }) => {
      setMatchesCount(data.matchesCount);
      setStatus(data.matchesCount.total === 0 ? 'notFound' : '');
    };

    // Subscribe
    console.log('[PdfFindBar] Subscribing to events');
    eventBus.on('findbar-toggle', toggleFindBar);
    eventBus.on('updatefindcontrolstate', handleUpdateState);
    eventBus.on('updatefindmatchescount', handleUpdateMatches);

    return () => {
      console.log('[PdfFindBar] Unsubscribing');
      eventBus.off('findbar-toggle', toggleFindBar);
      eventBus.off('updatefindcontrolstate', handleUpdateState);
      eventBus.off('updatefindmatchescount', handleUpdateMatches);
    };
  }, [eventBus]); // Removed isOpen from dependency to avoid re-subscribing

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      console.log('[PdfFindBar] Opening... focusing input');
      findFieldRef.current?.select();
      findFieldRef.current?.focus();
    }

    if (!isOpen && prevIsOpenRef.current) {
      eventBus.dispatch('find', {
        source: 'PdfFindBar',
        type: 'barclose',
      });
      setFindMessage('');
      setMatchesCount({ current: 0, total: 0 });
      setStatus('');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, eventBus]);

  console.log('[PdfFindBar] isOpen:', isOpen);

  // ... (Event Handlers: handleQueryChange, handleKeyDown, etc. remain the same)
  // ... Keep the handlers exactly as they were in previous source
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    eventBus.dispatch('find', {
      source: 'PdfFindBar',
      type: 'find',
      query: newQuery,
      caseSensitive: caseSensitive,
      entireWord: entireWord,
      highlightAll: highlightAll,
      findPrevious: false,
      matchDiacritics: matchDiacritics,
    });
    if (!newQuery) {
      setFindMessage('');
      setMatchesCount({ current: 0, total: 0 });
      setStatus('');
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      eventBus.dispatch('find', {
        source: 'PdfFindBar',
        type: 'again',
        query,
        caseSensitive,
        entireWord,
        highlightAll,
        findPrevious: e.shiftKey,
        matchDiacritics,
      });
      e.preventDefault();
    }
  };
  const onHighlightAll = () => {
    setHighlightAll(h => {
      const next = !h;
      eventBus.dispatch('find', { source: 'PdfFindBar', type: 'highlightallchange', query, caseSensitive, entireWord, highlightAll: next, findPrevious: false, matchDiacritics });
      return next;
    });
  };
  const onCaseSensitive = () => {
    setCaseSensitive(c => {
      const next = !c;
      eventBus.dispatch('find', { source: 'PdfFindBar', type: 'casesensitivitychange', query, caseSensitive: next, entireWord, highlightAll, findPrevious: false, matchDiacritics });
      return next;
    });
  };
  const onMatchDiacritics = () => {
    setMatchDiacritics(m => {
      const next = !m;
      eventBus.dispatch('find', { source: 'PdfFindBar', type: 'diacriticmatchingchange', query, caseSensitive, entireWord, highlightAll, findPrevious: false, matchDiacritics: next });
      return next;
    });
  };
  const onEntireWord = () => {
    setEntireWord(w => {
      const next = !w;
      eventBus.dispatch('find', { source: 'PdfFindBar', type: 'entirewordchange', query, caseSensitive, entireWord: next, highlightAll, findPrevious: false, matchDiacritics });
      return next;
    });
  };
  const onFindPrevious = () => {
    eventBus.dispatch('find', { source: 'PdfFindBar', type: 'again', query, caseSensitive, entireWord, highlightAll, findPrevious: true, matchDiacritics });
  };
  const onFindNext = () => {
    eventBus.dispatch('find', { source: 'PdfFindBar', type: 'again', query, caseSensitive, entireWord, highlightAll, findPrevious: false, matchDiacritics });
  };

  // === Render Logic ===
  let matchesCountText = '';
  if (matchesCount.total > 0) {
    if (matchesCount.total > MATCHES_COUNT_LIMIT) {
      matchesCountText = 'More than 1,000 matches';
    } else {
      matchesCountText = `${matchesCount.current} of ${matchesCount.total} matches`;
    }
  }

  const message = findMessage ? findMessage : matchesCountText;

  // === DIAGNOSTIC LOG ===
  if (!isOpen) {
    console.log('[PdfFindBar] isOpen is false, returning null'); // Optional: noisy log
    return null;
  }

  console.log('[PdfFindBar] Rendering UI'); // Confirm we are actually trying to render pixels

  return (
    <div
      className={`${styles.findbar} ${styles.doorHanger}`}
      aria-live="polite"
    >
      <div className={styles.findbarInputContainer}>
        <span className={`${styles.loadingInput} ${status === 'pending' ? styles.pending : ''}`}>
          <input
            ref={findFieldRef}
            className={styles.toolbarField}
            title="Find"
            placeholder="Find in document…"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            data-status={status}
          />
        </span>
        <div className={styles.splitToolbarButton}>
          <button className={styles.toolbarButton} title="Find the previous occurrence of the phrase" onClick={onFindPrevious}>
            <span>Previous</span>
          </button>
          <div className={styles.splitToolbarButtonSeparator}></div>
          <button className={styles.toolbarButton} title="Find the next occurrence of the phrase" onClick={onFindNext}>
            <span>Next</span>
          </button>
        </div>
      </div>

      <div className={styles.findbarOptionsOneContainer}>
        <input type="checkbox" id={findHighlightAllId} className={styles.toolbarField} checked={highlightAll} onChange={onHighlightAll} />
        <label htmlFor={findHighlightAllId} className={styles.toolbarLabel}>Highlight All</label>
        <input type="checkbox" id={findMatchCaseId} className={styles.toolbarField} checked={caseSensitive} onChange={onCaseSensitive} />
        <label htmlFor={findMatchCaseId} className={styles.toolbarLabel}>Match Case</label>
      </div>
      <div className={styles.findbarOptionsTwoContainer}>
        <input type="checkbox" id={findMatchDiacriticsId} className={styles.toolbarField} checked={matchDiacritics} onChange={onMatchDiacritics} />
        <label htmlFor={findMatchDiacriticsId} className={styles.toolbarLabel}>Match Diacritics</label>
        <input type="checkbox" id={findEntireWordId} className={styles.toolbarField} checked={entireWord} onChange={onEntireWord} />
        <label htmlFor={findEntireWordId} className={styles.toolbarLabel}>Whole Words</label>
      </div>

      <div className={styles.findbarMessageContainer}>
        <span className={styles.findResultsCount} data-status={status}>
          {message}
        </span>
      </div>
    </div>
  );
};