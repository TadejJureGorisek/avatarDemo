// The asset pack ships the Spine skeleton (character.json) with loose PNGs but no .atlas.
// This generates a multi-page Spine atlas: one page per PNG, each holding a single full-size
// region named after the file, which is exactly what the skeleton's attachment paths expect.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'public/assets/character';
const out = join(dir, 'character.atlas');

const pages = readdirSync(dir)
  .filter((f) => f.endsWith('.png'))
  .sort()
  .map((file) => {
    const png = readFileSync(join(dir, file));
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(20);
    const name = file.replace(/\.png$/, '');
    return `${file}\nsize:${w},${h}\nfilter:Linear,Linear\n${name}\nbounds:0,0,${w},${h}\n`;
  });

writeFileSync(out, pages.join('\n'));
console.log(`Wrote ${out} (${pages.length} pages)`);
