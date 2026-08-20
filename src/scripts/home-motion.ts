import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let homeContext: gsap.Context | undefined;
let homeEvents: AbortController | undefined;

function setupHomeMotion(): void {
  homeContext?.revert();
  homeContext = undefined;
  homeEvents?.abort();
  homeEvents = undefined;

  const root = document.querySelector<HTMLElement>('[data-home-dashboard]');
  if (root === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  homeEvents = new AbortController();
  const { signal } = homeEvents;

  homeContext = gsap.context(() => {
    const intro = gsap.timeline({ defaults: { duration: 0.72, ease: 'power3.out' } });
    intro
      .from('[data-home-reveal]', { opacity: 0.55, y: 18 }, 0)
      .from('[data-search-reveal]', { opacity: 0.68, y: 12 }, 0.16);

    root.querySelector<HTMLElement>('[data-search-reveal]')?.addEventListener('focusin', (event) => {
      const target = event.currentTarget;
      if (!(target instanceof HTMLElement)) return;
      gsap.killTweensOf(target);
      gsap.set(target, { opacity: 1, y: 0 });
    }, { signal });

    gsap.utils.toArray<HTMLElement>('[data-progress-bar]').forEach((progress) => {
      const fill = progress.firstElementChild;
      const value = Number(progress.getAttribute('aria-valuenow'));
      if (!(fill instanceof HTMLElement) || !Number.isFinite(value)) return;

      gsap.fromTo(fill, { scaleX: 0 }, {
        scaleX: 1,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: progress,
          start: 'top 92%',
          once: true,
        },
      });
    });

    gsap.utils.toArray<HTMLElement>('[data-home-card]').forEach((card) => {
      const animation = gsap.fromTo(card, {
        opacity: 0.62,
        y: 16,
        scale: 0.99,
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.65,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 94%',
          once: true,
        },
      });

      card.addEventListener('focusin', () => {
        card.setAttribute('data-home-focus-final', '');
        animation.progress(1);
        animation.scrollTrigger?.kill();
        animation.kill();
        gsap.set(card, { clearProps: 'opacity,transform' });
      }, { signal });
      card.addEventListener('focusout', (event) => {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && card.contains(nextTarget)) return;
        card.removeAttribute('data-home-focus-final');
      }, { signal });
    });

    gsap.utils.toArray<HTMLElement>('[data-home-visual]').forEach((visual) => {
      gsap.from(visual, {
        opacity: 0.45,
        scale: 0.94,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: visual,
          start: 'top 92%',
          once: true,
        },
      });
    });
  }, root);
}

function cleanupHomeMotion(): void {
  homeContext?.revert();
  homeContext = undefined;
  homeEvents?.abort();
  homeEvents = undefined;
  document.querySelectorAll('[data-home-focus-final]').forEach((card) => {
    card.removeAttribute('data-home-focus-final');
  });
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

setupHomeMotion();
document.addEventListener('astro:page-load', setupHomeMotion);
document.addEventListener('astro:before-swap', cleanupHomeMotion);
