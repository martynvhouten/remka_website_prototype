(function(){
  const TAILWIND_BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };

  function parseItems(spec) {
    const defaults = [{ min: 0, value: 1 }];
    if (!spec) return defaults;
    const parts = String(spec).trim().split(/\s+/).filter(Boolean);
    const out = [];
    parts.forEach(p => {
      if (p.includes(':')) {
        const [bp, val] = p.split(':');
        const min = TAILWIND_BREAKPOINTS[bp] || 0;
        const v = Math.max(1, parseInt(val, 10) || 1);
        out.push({ min, value: v });
      } else {
        const v = Math.max(1, parseInt(p, 10) || 1);
        out.push({ min: 0, value: v });
      }
    });
    // dedupe by min keeping the last specified value for same min
    const map = new Map();
    out.forEach(o => map.set(o.min, o.value));
    return Array.from(map.entries()).map(([min, value]) => ({ min, value })).sort((a,b)=> a.min - b.min);
  }

  function getSlidesPerView(itemsSpec) {
    const rules = parseItems(itemsSpec);
    const w = window.innerWidth || document.documentElement.clientWidth;
    let current = rules[0]?.value || 1;
    for (const rule of rules) { if (w >= rule.min) current = rule.value; }
    return Math.max(1, current);
  }

  function coerceBoolean(val, fallback=true) {
    if (val == null) return fallback;
    const s = String(val).toLowerCase();
    if (s === 'false' || s === '0' || s === 'no') return false;
    if (s === 'true' || s === '1' || s === 'yes') return true;
    return fallback;
  }

  function setupSlider(container) {
    if (container.__sliderBound) return; // idempotent
    container.__sliderBound = true;

    const viewport = container.querySelector('.slider__viewport') || container;
    const track = container.querySelector('.slider__track');
    if (!track) return;

    // Ensure base classes for native snap and horizontal scroll fallback
    track.classList.add('flex', 'items-center', 'snap-x', 'snap-mandatory');
    viewport.classList.add('h-scroll');

    const arrows = coerceBoolean(container.getAttribute('data-arrows'), true);
    const showDots = coerceBoolean(container.getAttribute('data-dots'), false);
    const rtlEnabled = coerceBoolean(container.getAttribute('data-rtl'), false);
    const gap = Math.max(0, parseInt(container.getAttribute('data-gap'), 10) || 16);
    const itemsSpec = container.getAttribute('data-items') || '';
    const autoplaySpec = container.getAttribute('data-autoplay');
    const autoplayMs = autoplaySpec ? (parseInt(autoplaySpec, 10) || 3000) : 0;

    // Apply gap
    track.style.gap = gap + 'px';

    // RTL: reverse item visual order but keep scroll mechanics predictable
    if (rtlEnabled) {
      track.style.direction = 'rtl';
    } else {
      track.style.direction = 'ltr';
    }

    const slides = () => Array.from(track.children);

    function applyLayout() {
      const spv = getSlidesPerView(itemsSpec);
      const slideWidthCss = `calc((100% - ${(spv - 1)} * ${gap}px) / ${spv})`;
      slides().forEach(li => {
        li.classList.add('snap-start');
        li.style.flex = `0 0 ${slideWidthCss}`;
      });
      updateDots();
    }

    function getStepPx() {
      const first = slides()[0];
      if (first) {
        const rect = first.getBoundingClientRect();
        return Math.max(1, Math.round(rect.width + gap));
      }
      return Math.max(120, Math.round(viewport.clientWidth * 0.8));
    }

    function scrollByStep(dir) {
      const delta = getStepPx() * dir;
      viewport.scrollBy({ left: delta, behavior: 'smooth' });
    }

    function pageCount() {
      const spv = getSlidesPerView(itemsSpec);
      const n = slides().length;
      return Math.max(1, Math.ceil(n / spv));
    }

    function currentPageIndex() {
      const step = getStepPx();
      if (step <= 0) return 0;
      const idx = Math.round(viewport.scrollLeft / step);
      return Math.max(0, Math.min(idx, pageCount() - 1));
    }

    // Dots
    const dotsHost = container.querySelector('.slider__dots') || (function(){ const d = document.createElement('div'); d.className = 'slider__dots'; container.appendChild(d); return d; })();
    function updateDots() {
      if (!showDots) { dotsHost.hidden = true; dotsHost.innerHTML=''; return; }
      const pages = pageCount();
      dotsHost.hidden = pages <= 1;
      dotsHost.innerHTML = '';
      for (let i = 0; i < pages; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'slider__dot';
        b.setAttribute('aria-label', `Ga naar pagina ${i+1}`);
        b.addEventListener('click', () => {
          const step = getStepPx();
          const left = step * i;
          viewport.scrollTo({ left, behavior: 'smooth' });
          setActiveDot(i);
        });
        dotsHost.appendChild(b);
      }
      setActiveDot(currentPageIndex());
    }
    function setActiveDot(index) {
      if (!showDots) return;
      const btns = Array.from(dotsHost.querySelectorAll('button'));
      btns.forEach((b, i) => b.classList.toggle('is-active', i === index));
    }

    // Arrow buttons
    const prevBtn = container.querySelector('[data-slider-prev]');
    const nextBtn = container.querySelector('[data-slider-next]');
    if (arrows) {
      if (prevBtn) prevBtn.hidden = false;
      if (nextBtn) nextBtn.hidden = false;
      const prevDir = rtlEnabled ? +1 : -1;
      const nextDir = rtlEnabled ? -1 : +1;
      prevBtn && prevBtn.addEventListener('click', () => scrollByStep(prevDir));
      nextBtn && nextBtn.addEventListener('click', () => scrollByStep(nextDir));
    } else {
      prevBtn && (prevBtn.hidden = true);
      nextBtn && (nextBtn.hidden = true);
    }

    // Translate vertical wheel to horizontal scroll within viewport area
    viewport.addEventListener('wheel', (e) => {
      const absY = Math.abs(e.deltaY);
      const absX = Math.abs(e.deltaX);
      if (absY > absX) {
        e.preventDefault();
        viewport.scrollBy({ left: e.deltaY, behavior: 'auto' });
      }
    }, { passive: false });

    // Keyboard support when viewport is focused
    viewport.setAttribute('tabindex', viewport.getAttribute('tabindex') || '0');
    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByStep(rtlEnabled ? +1 : -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); scrollByStep(rtlEnabled ? -1 : +1); }
      else if (e.key === 'Home') { e.preventDefault(); viewport.scrollTo({ left: 0, behavior: 'smooth' }); }
      else if (e.key === 'End') { e.preventDefault(); viewport.scrollTo({ left: viewport.scrollWidth, behavior: 'smooth' }); }
    });

    // Autoplay
    let autoplayId = 0;
    function startAutoplay() {
      if (!autoplayMs) return;
      stopAutoplay();
      autoplayId = window.setInterval(() => {
        const atEnd = Math.ceil(viewport.scrollLeft + viewport.clientWidth + 2) >= viewport.scrollWidth;
        if (atEnd) {
          viewport.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollByStep(rtlEnabled ? -1 : +1);
        }
      }, autoplayMs);
    }
    function stopAutoplay() { if (autoplayId) { window.clearInterval(autoplayId); autoplayId = 0; } }

    // Pause autoplay on interaction for better UX
    viewport.addEventListener('pointerdown', stopAutoplay);
    viewport.addEventListener('focusin', stopAutoplay);
    viewport.addEventListener('mouseenter', stopAutoplay);
    viewport.addEventListener('touchstart', stopAutoplay, { passive: true });
    container.addEventListener('mouseleave', startAutoplay);

    // Update dots on scroll end (debounced)
    let scrollTimer = 0;
    viewport.addEventListener('scroll', () => {
      if (!showDots) return;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => setActiveDot(currentPageIndex()), 80);
    }, { passive: true });

    // Initial layout + on resize
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => applyLayout());
      ro.observe(viewport);
    }
    window.addEventListener('resize', applyLayout);
    applyLayout();
    startAutoplay();
  }

  function initAll() {
    document.querySelectorAll('[data-slider]').forEach(setupSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else { initAll(); }
  document.addEventListener('partials:loaded', initAll);
})();


