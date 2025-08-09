import { visit } from 'unist-util-visit';

export default function carouselDirective() {
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type === 'containerDirective' &&
        node.name === 'carousel'
      ) {
        const data = node.attributes || {};
        const images = [];

        // Ambil konten di dalam directive
        if (node.children && node.children.length > 0) {
          node.children.forEach((child) => {
            if (child.type === 'text') {
              const lines = child.value.split('\n').filter(Boolean);
              lines.forEach((line) => {
                const [url, alt] = line.split('|').map(s => s.trim());
                images.push({ url, alt });
              });
            }
          });
        }

        // Render HTML carousel
        node.type = 'html';
        node.value = `
<div class="carousel-container" data-interval="${data.intervalMs || 5000}">
  ${images.map((img, idx) => {
    if (!img.url) {
      // Tidak ada gambar → tampilkan teks alt saja
      return `<div class="carousel-slide${idx === 0 ? ' active' : ''}"><div class="p-6 text-center text-gray-500 dark:text-gray-300">${img.alt || ''}</div></div>`;
    }
    // Ada gambar → tampilkan <img>
    return `
    <div class="carousel-slide${idx === 0 ? ' active' : ''}">
      <img src="${img.url}" alt="${img.alt || ''}" class="w-full h-full object-${data.objectFit || 'cover'}" loading="lazy" decoding="async" />
    </div>`;
  }).join('')}
</div>
        `;
      }
    });
  };
}
