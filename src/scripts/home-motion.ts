import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let homeContext: gsap.Context | undefined;

function setupHomeMotion(): void {
  homeContext?.revert();
  homeContext = undefined;

  const root = document.querySelector<HTMLElement>('[data-home-dashboard]');
  if (root === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  homeContext = gsap.context(() => {
    const intro = gsap.timeline({ defaults: { duration: 0.72, ease: 'power3.out' } });
    intro
      .from('[data-home-reveal]', { autoAlpha: 0, y: 18 }, 0)
      .from('[data-search-reveal]', { autoAlpha: 0, y: 12 }, 0.16);

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
      gsap.from(card, {
        autoAlpha: 0,
        y: 16,
        scale: 0.99,
        duration: 0.65,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 94%',
          once: true,
        },
      });
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
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

setupHomeMotion();
document.addEventListener('astro:page-load', setupHomeMotion);
document.addEventListener('astro:before-swap', cleanupHomeMotion);
