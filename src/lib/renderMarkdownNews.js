// src/lib/renderMarkdownNews.js
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

// normalisasi indent supaya HTML/paragraph kebaca benar
function dedent(input = '') {
  const lines = String(input).replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  let min = Infinity;
  for (const l of lines) {
    if (!l.trim()) continue;
    const m = l.match(/^[ \t]+/);
    if (m) min = Math.min(min, m[0].length);
    else { min = 0; break; }
  }
  if (!isFinite(min) || min <= 0) return lines.join('\n');
  return lines.map(l => l.slice(min)).join('\n');
}

export async function renderNewsMD(markdownString) {
  const src = dedent(markdownString || '');
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)          // izinkan HTML hasil inject carousel
    .use(rehypeStringify)
    .process(src);
  return String(file);
}
