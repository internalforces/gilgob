/** @jsxImportSource preact */
import { useId, useLayoutEffect, useRef, useState } from 'preact/hooks';

interface NavigationItem {
  label: string;
  href: string;
  current: boolean;
}

interface Props {
  items: NavigationItem[];
  utilityItems: NavigationItem[];
  githubHref: string;
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function MobileMenu({ items, utilityItems, githubHref }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const closeAndRestoreFocus = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useLayoutEffect(() => {
    const mobileViewport = window.matchMedia('(max-width: 52rem)');
    const closeOutsideMobileViewport = (event: MediaQueryListEvent) => {
      if (!event.matches) setIsOpen(false);
    };

    mobileViewport.addEventListener('change', closeOutsideMobileViewport);
    return () => mobileViewport.removeEventListener('change', closeOutsideMobileViewport);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const background = document.querySelectorAll<HTMLElement>('#main-content, .site-footer');
    document.body.classList.add('menu-open');
    background.forEach((element) => { element.inert = true; });
    window.requestAnimationFrame(() => closeRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAndRestoreFocus();
        return;
      }
      if (event.key !== 'Tab' || dialogRef.current === null) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute('disabled'));
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (first === undefined || last === undefined) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('menu-open');
      background.forEach((element) => { element.inert = false; });
    };
  }, [isOpen]);

  return (
    <div class="mobile-menu">
      <button
        ref={triggerRef}
        class="mobile-menu__trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={isOpen ? '모바일 메뉴 닫기' : '모바일 메뉴 열기'}
        onClick={() => (isOpen ? closeAndRestoreFocus() : setIsOpen(true))}
      >
        <span class="mobile-menu__trigger-lines" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          class="mobile-menu__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAndRestoreFocus();
          }}
        >
          <div
            ref={dialogRef}
            id={menuId}
            class="mobile-menu__panel"
            role="dialog"
            aria-modal="true"
            aria-label="모바일 메뉴"
          >
            <header class="mobile-menu__header">
              <p>탐색</p>
              <button ref={closeRef} type="button" aria-label="모바일 메뉴 닫기" onClick={closeAndRestoreFocus}>
                <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7">
                  <path d="m6 6 12 12M18 6 6 18"></path>
                </svg>
              </button>
            </header>

            <nav aria-label="모바일 주요 메뉴">
              <ul class="mobile-menu__links">
                {items.map((item) => (
                  <li key={item.href}>
                    <a
                      class="mobile-menu__link"
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      onClick={closeAndRestoreFocus}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>

              <details class="mobile-menu__utilities">
                <summary>도구</summary>
                <ul>
                  {utilityItems.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} aria-current={item.current ? 'page' : undefined} onClick={closeAndRestoreFocus}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </nav>

            <div class="mobile-menu__actions">
              <button
                class="button-link"
                type="button"
                data-search-trigger
                aria-label="검색 열기"
                aria-haspopup="dialog"
                onClick={() => setIsOpen(false)}
              >
                검색
              </button>
              <a
                class="button-link"
                href={githubHref}
                target="_blank"
                rel="noreferrer"
                onClick={closeAndRestoreFocus}
                aria-label="GitHub 프로필 열기"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
