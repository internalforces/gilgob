/** @jsxImportSource preact */
import { useId, useLayoutEffect, useRef, useState } from 'preact/hooks';

interface NavigationItem {
  label: string;
  href: string;
  current: boolean;
}

interface Props {
  items: NavigationItem[];
  githubHref: string;
}

export default function MobileMenu({ items, githubHref }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeAndRestoreFocus = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAndRestoreFocus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

      <nav id={menuId} class="mobile-menu__panel" aria-label="모바일 주요 메뉴" hidden={!isOpen}>
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
      </nav>
    </div>
  );
}
