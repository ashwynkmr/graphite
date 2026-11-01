// Renders the app icon from an SVG in tools/icons/ to every PNG the PWA needs.
// Usage: npm run icons -- [g-pencil|g-pen|cursive|spiral|pencil|notebook|cap]   (default: g-pen; g-*.svg come from build-g.mjs, cursive.svg from build-cursive.mjs)
// Output goes to public/ and is committed.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const name = process.argv.slice(2).find((a) => a !== '--') ?? 'g-pen';
const src = `tools/icons/${name}.svg`;
const svg = readFileSync(src, 'utf8');

function render(size, inset = 0) {
  // Maskable icons keep the mark inside the 80% safe zone: shrink it onto a padded canvas.
  const body = inset ? svg.replace('viewBox="0 0 512 512"', `viewBox="${-inset} ${-inset} ${512 + 2 * inset} ${512 + 2 * inset}"`) : svg;
  return new Resvg(body, { fitTo: { mode: 'width', value: size }, background: background(svg) }).render().asPng();
}

/** The icon's own background colour, so padding for maskable icons matches it. */
function background(text) {
  return /<rect width="512" height="512" fill="(#[0-9a-f]{6})"/i.exec(text)?.[1] ?? '#f6f1e7';
}

writeFileSync('public/icon-192.png', render(192));
writeFileSync('public/icon-512.png', render(512));
writeFileSync('public/icon-512-maskable.png', render(512, 52));
writeFileSync('public/apple-touch-icon.png', render(180));
copyFileSync(src, 'public/favicon.svg');
console.log(`icons written to public/ from ${src}`);
