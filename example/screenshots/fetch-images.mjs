import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const testImages = join(here, '..', 'test-images');
const out = join(testImages, 'showcase');
const thumbs = join(testImages, 'thumbs');
const images = JSON.parse(readFileSync(join(here, 'images.json'), 'utf8'));
const headers = { 'User-Agent': 'react-native-alpr-screenshots/1.0 (https://alpr.parkr.app)' };
const PHOTO_WIDTH = 1600;
const PORTRAIT = { width: 1206, height: 2622 };
const THUMB_SIZE = 192;
// Test images that are not on Wikimedia Commons, only thumbnailed.
const LOCAL_IMAGES = ['plate-1.png', 'EE40366.jpg', 'EL11788.jpg', 'EV67586.jpg', 'EV82391.jpg', 'MLY3587.jpg'];

// Wikimedia rate limits bursts of requests with 429.
async function get(url) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, { headers });
    if (response.ok) return response;
    if (response.status !== 429 || attempt === 5) throw new Error(`${response.status} ${url}`);
    await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
  }
}

async function imageInfo(title, width) {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|size',
    format: 'json',
    ...(width ? { iiurlwidth: String(width) } : {}),
  });
  const response = await get(`https://commons.wikimedia.org/w/api.php?${params}`);
  const page = Object.values((await response.json()).query.pages)[0];
  if (!page.imageinfo) throw new Error(`Not found on Wikimedia Commons: ${title}`);
  return page.imageinfo[0];
}

async function download(url, path) {
  const response = await get(url);
  writeFileSync(path, Buffer.from(await response.arrayBuffer()));
}

function magick(...args) {
  execFileSync('magick', args, { stdio: 'inherit' });
}

function thumbnail(source, id) {
  magick(source, '-thumbnail', `${THUMB_SIZE}x${THUMB_SIZE}^`, '-gravity', 'center', '-extent', `${THUMB_SIZE}x${THUMB_SIZE}`, '-strip', '-quality', '80', join(thumbs, `${id}.jpg`));
}

mkdirSync(out, { recursive: true });
mkdirSync(thumbs, { recursive: true });
const tmp = join(out, '.download.jpg');
const credits = [
  '# Showcase images',
  '',
  'Photos from Wikimedia Commons used by the example app and the screenshot pipeline (`screenshots/`). Recreate them with `node screenshots/fetch-images.mjs`.',
  '',
  '| File | Source | Author | License |',
  '| --- | --- | --- | --- |',
];

for (const image of images) {
  const info = await imageInfo(image.commons, image.portrait ? undefined : PHOTO_WIDTH);
  await download(image.portrait ? info.url : info.thumburl ?? info.url, tmp);
  if (image.portrait) {
    const cropHeight = info.height;
    const cropWidth = Math.round((cropHeight * PORTRAIT.width) / PORTRAIT.height);
    const x = Math.max(0, Math.min(info.width - cropWidth, Math.round(info.width * image.portrait.centerX - cropWidth / 2)));
    magick(tmp, '-auto-orient', '-crop', `${cropWidth}x${cropHeight}+${x}+0`, '+repage', '-resize', `${PORTRAIT.width}x`, '-strip', '-quality', '85', join(out, `${image.id}.jpg`));
  } else {
    magick(tmp, '-auto-orient', '-resize', `${PHOTO_WIDTH}x>`, '-strip', '-quality', '85', join(out, `${image.id}.jpg`));
  }
  thumbnail(join(out, `${image.id}.jpg`), image.id);
  const page = info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(image.commons.replace(/ /g, '_'))}`;
  credits.push(`| \`${image.id}.jpg\` | [${image.commons.replace(/^File:/, '')}](${page}) | ${image.author} | ${image.license} |`);
  console.log(`${image.id}.jpg`);
}

for (const file of LOCAL_IMAGES) {
  thumbnail(join(testImages, file), file.replace(/\.\w+$/, ''));
}

rmSync(tmp, { force: true });
credits.push('', 'Portrait images are cropped and all images are resized. They show the plates as photographed.', '');
writeFileSync(join(out, 'CREDITS.md'), credits.join('\n'));
