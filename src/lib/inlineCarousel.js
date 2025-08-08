// src/lib/inlineCarousel.js

// Ubah blok :::carousel ... ::: di dalam string jadi HTML carousel siap pakai
export function injectInlineCarousel(raw = '') {
  if (!raw || typeof raw !== 'string') return raw;

  // Regex tangkap blok :::carousel ... ::: (multiline, greedy minimal)
  const re = /:::carousel\s*([\s\S]*?)\s*:::/gi;

  return raw.replace(re, (_, inner) => {
    // Pisah baris, trimming rapi
    const lines = inner
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    // Baris pertama opsional JSON option
    let opts = {};
    let startIdx = 0;
    if (lines[0] && lines[0].startsWith('{') && lines[0].endsWith('}')) {
      try {
        opts = JSON.parse(lines[0]);
        startIdx = 1;
      } catch {
        // cuek, kalau JSON salah ya abaikan opsi
      }
    }

    // Sisanya: /path.webp|Alt text
    const images = [];
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      // Support format satu baris panjang (dipisah spasi) juga:
      // /a.webp|Alt A /b.webp|Alt B
      const parts = line.split(/\s+(?=\/)/g); // split di spasi yang diikuti '/'
      for (const p of parts) {
        if (!p.trim()) continue;
        const [src, ...altParts] = p.trim().split('|');
        const alt = (altParts.join('|') || '').trim() || 'Carousel Image';
        if (src) images.push({ src: src.trim(), alt });
      }
    }

    // Opsi
    const heightMobile = Number(opts.heightMobile ?? 360);
    const heightDesktop = Number(opts.heightDesktop ?? 560);
    const objectFit = String(opts.objectFit ?? 'cover');
    const intervalMs = Number(opts.intervalMs ?? 8000);

    // ID unik per blok
    const rid = 'crs_' + Math.random().toString(36).slice(2, 9);

    // HTML hasil
    const slidesHtml = images
      .map(
        (img, i) => `
      <div class="carousel-slide${i === 0 ? ' active' : ''}">
        <img src="${img.src}" alt="${escapeHtml(img.alt)}" class="w-full h-full" loading="lazy" decoding="async" />
      </div>`
      )
      .join('\n');

    const dotsHtml = images
      .map(
        (_img, i) =>
          `<button class="w-3 h-3 rounded-full ${i === 0 ? 'bg-white' : 'bg-gray-400/70'}" data-dot="${i}"></button>`
      )
      .join('\n');

    return `
<div id="${rid}" class="relative w-full carousel-wrapper overflow-hidden bg-gray-50 dark:bg-gray-800 m-0 p-0"
  style="--crs-h-mobile:${heightMobile}px; --crs-h-desktop:${heightDesktop}px; --crs-fit:${objectFit}; --crs-interval:${intervalMs}ms;">
  <style>
    #${rid}.carousel-wrapper { height: var(--crs-h-mobile); padding:0; margin:0; }
    @media (min-width: 768px) { #${rid}.carousel-wrapper { height: var(--crs-h-desktop); } }
    #${rid} .carousel-slide { position:absolute; inset:0; opacity:0; transition:opacity .7s ease-in-out; pointer-events:none; }
    #${rid} .carousel-slide.active { opacity:1; pointer-events:auto; }
    #${rid} img { object-fit: var(--crs-fit); }
    #${rid}:hover .carousel-arrow { opacity:1; }
    #${rid} .carousel-arrow { opacity:0; transition:opacity .3s ease; }
  </style>

  ${slidesHtml}

  <button type="button" class="carousel-arrow absolute top-0 left-0 z-20 flex items-center justify-center h-full px-4 group focus:outline-none" data-prev>
    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-500/50 group-hover:bg-gray-700/80">
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </span>
  </button>
  <button type="button" class="carousel-arrow absolute top-0 right-0 z-20 flex items-center justify-center h-full px-4 group focus:outline-none" data-next>
    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-500/50 group-hover:bg-gray-700/80">
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7" />
      </svg>
    </span>
  </button>

  <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20" data-dots>
    ${dotsHtml}
  </div>

  <script>(function(){
    const root = document.getElementById('${rid}');
    if (!root) return;
    const slides = root.querySelectorAll('.carousel-slide');
    const dots = root.querySelectorAll('[data-dots] button');
    const prevBtn = root.querySelector('[data-prev]');
    const nextBtn = root.querySelector('[data-next]');
    const interval = parseInt(getComputedStyle(root).getPropertyValue('--crs-interval')) || 8000;

    let current = 0, timer;

    function show(i){
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
      dots.forEach((d, idx) => {
        d.classList.toggle('bg-white', idx === i);
        d.classList.toggle('bg-gray-400/70', idx !== i);
      });
      current = i;
    }
    function next(){ show((current + 1) % slides.length); }
    function prev(){ show((current - 1 + slides.length) % slides.length); }
    function start(){ stop(); timer = setInterval(next, interval); }
    function stop(){ if (timer) clearInterval(timer); }

    prevBtn?.addEventListener('click', prev);
    nextBtn?.addEventListener('click', next);
    dots.forEach((d, i) => d.addEventListener('click', () => show(i)));

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    show(0); start();
  })();</script>
</div>
`.trim();
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
