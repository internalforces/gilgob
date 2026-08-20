/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  createPagefindLoader,
  createSearchController,
  resolvePagefindUrl,
  SearchUnavailableError,
  type PagefindResult,
} from '../../lib/search/pagefind';
import './search-dialog.css';

interface Props {
  base: string;
}

type ViewState = 'idle' | 'loading' | 'results' | 'empty' | 'error' | 'unavailable';

const categoryLabels: Record<string, string> = {
  'Computer Science': '컴퓨터 과학',
  'Data & Mathematics': '데이터와 수학',
  AI: '인공지능',
  Finance: '금융',
  Research: '리서치',
  Projects: '프로젝트',
  Learning: '학습',
};

function statusMessage(state: ViewState): string {
  switch (state) {
    case 'loading': return '검색 중입니다.';
    case 'empty': return '일치하는 지식을 찾지 못했습니다.';
    case 'error': return '검색 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.';
    case 'unavailable': return '현재 검색을 사용할 수 없습니다. 메뉴에서 지식을 둘러보세요.';
    default: return '검색어를 입력하면 지식, 탐구, 프로젝트와 학습 기록을 찾습니다.';
  }
}

export default function SearchDialog({ base }: Props) {
  const controller = useMemo(() => createSearchController(createPagefindLoader(base)), [base]);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [activeIndex, setActiveIndex] = useState(-1);
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const composingRef = useRef(false);
  const openRef = useRef(false);

  const openSearch = (trigger?: HTMLElement | null) => {
    if (openRef.current) {
      inputRef.current?.focus();
      return;
    }
    restoreFocusRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    openRef.current = true;
    setIsOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const closeSearch = () => {
    window.clearTimeout(timerRef.current);
    openRef.current = false;
    setIsOpen(false);
    const restoreTarget = restoreFocusRef.current;
    window.requestAnimationFrame(() => {
      if (restoreTarget?.isConnected) {
        restoreTarget.focus();
        return;
      }
      document.querySelector<HTMLElement>('.mobile-menu__trigger, [data-search-trigger]')?.focus();
    });
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLElement>('[data-search-trigger]');
      if (!trigger) return;
      event.preventDefault();
      openSearch(trigger);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
      } else if (event.key === 'Escape' && openRef.current) {
        event.preventDefault();
        closeSearch();
      }
    };
    const cleanup = () => {
      window.clearTimeout(timerRef.current);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('astro:before-swap', cleanup);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('astro:before-swap', cleanup, { once: true });
    return cleanup;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const restoreScroll = () => {
      document.body.style.overflow = previousOverflow;
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('astro:before-swap', restoreScroll, { once: true });
    return () => {
      document.removeEventListener('astro:before-swap', restoreScroll);
      restoreScroll();
    };
  }, [isOpen]);

  const runSearch = async (value: string) => {
    setViewState('loading');
    setActiveIndex(-1);
    try {
      const nextResults = await controller.query(value);
      if (controller.currentQuery() !== value) return;
      setResults(nextResults);
      setViewState(nextResults.length > 0 ? 'results' : 'empty');
    } catch (error) {
      if (controller.currentQuery() !== value) return;
      setResults([]);
      setViewState(error instanceof SearchUnavailableError ? 'unavailable' : 'error');
    }
  };

  const scheduleSearch = (value: string) => {
    window.clearTimeout(timerRef.current);
    if (!value.trim()) {
      setResults([]);
      setActiveIndex(-1);
      setViewState('idle');
      return;
    }
    setViewState('loading');
    timerRef.current = window.setTimeout(() => void runSearch(value), 120);
  };

  useEffect(() => {
    if (!isOpen || !inputRef.current) return;
    const input = inputRef.current;
    const handleCompositionStart = () => {
      composingRef.current = true;
      window.clearTimeout(timerRef.current);
    };
    const handleCompositionEnd = () => {
      composingRef.current = false;
      const value = input.value;
      setQuery(value);
      scheduleSearch(value);
    };

    input.addEventListener('compositionstart', handleCompositionStart);
    input.addEventListener('compositionend', handleCompositionEnd);
    return () => {
      input.removeEventListener('compositionstart', handleCompositionStart);
      input.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, [isOpen]);

  const moveSelection = (direction: 1 | -1) => {
    if (results.length === 0) return;
    setActiveIndex((current) => {
      if (current < 0) return direction === 1 ? 0 : results.length - 1;
      return (current + direction + results.length) % results.length;
    });
  };

  const navigateToActiveResult = () => {
    const activeResult = results[activeIndex];
    if (activeResult) window.location.assign(resolvePagefindUrl(activeResult.url, base));
  };

  const handleDialogKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), a[href]:not([tabindex="-1"])',
    )];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div class="search-dialog-layer" data-pagefind-ignore onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeSearch();
    }}>
      <section
        ref={dialogRef}
        id="site-search-dialog"
        class="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-search-title"
        onKeyDown={handleDialogKeyDown}
      >
        <div class="search-dialog__header">
          <div>
            <h2 id="site-search-title">통합 검색</h2>
            <p>연결해 둔 모든 지식에서 필요한 맥락을 찾습니다.</p>
          </div>
          <button class="search-dialog__close" type="button" aria-label="검색 닫기" onClick={closeSearch}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="m6 6 12 12M18 6 6 18"></path>
            </svg>
          </button>
        </div>

        <div class="search-dialog__field">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="6.5"></circle>
            <path d="m16 16 4 4"></path>
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            aria-label="지식 전체 검색"
            aria-controls="site-search-results"
            aria-activedescendant={activeIndex >= 0 ? `site-search-result-${activeIndex}` : undefined}
            autocomplete="off"
            placeholder="검색어를 입력하세요"
            onInput={(event) => {
              const value = event.currentTarget.value;
              setQuery(value);
              if (!composingRef.current && !event.isComposing) scheduleSearch(value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                moveSelection(1);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                moveSelection(-1);
              } else if (event.key === 'Enter' && activeIndex >= 0) {
                event.preventDefault();
                navigateToActiveResult();
              }
            }}
          />
          {query && (
            <button
              class="search-dialog__clear"
              type="button"
              aria-label="검색어 지우기"
              onClick={() => {
                setQuery('');
                scheduleSearch('');
                inputRef.current?.focus();
              }}
            >지우기</button>
          )}
        </div>

        <div class="search-dialog__content">
          {viewState !== 'results' && (
            <div class={`search-dialog__status search-dialog__status--${viewState}`} role="status" aria-live="polite">
              <span class="search-dialog__status-signal" aria-hidden="true"></span>
              <p>{statusMessage(viewState)}</p>
            </div>
          )}

          <ul
            id="site-search-results"
            class="search-dialog__results"
            role="listbox"
            aria-label="검색 결과"
            hidden={viewState !== 'results'}
          >
            {viewState === 'results' && results.map((result, index) => {
              const title = result.meta.title || '제목 없는 문서';
              const type = result.meta.type || '문서';
              const category = categoryLabels[result.meta.category] || result.meta.category || '분야 미지정';
              return (
                <li key={`${result.url}-${index}`} role="presentation">
                  <a
                    id={`site-search-result-${index}`}
                    class={`search-result${activeIndex === index ? ' search-result--active' : ''}`}
                    href={resolvePagefindUrl(result.url, base)}
                    role="option"
                    aria-selected={activeIndex === index}
                    tabindex={-1}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span class="search-result__meta"><span>{type}</span><span>{category}</span></span>
                    <strong>{title}</strong>
                    <span class="search-result__excerpt">{result.plain_excerpt || result.excerpt}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div class="search-dialog__footer" aria-label="검색 키보드 도움말">
          <span><kbd>↑</kbd><kbd>↓</kbd> 결과 이동</span>
          <span><kbd>Enter</kbd> 열기</span>
          <span><kbd>Esc</kbd> 닫기</span>
        </div>
      </section>
    </div>
  );
}
