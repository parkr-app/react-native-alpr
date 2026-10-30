import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const output = join(here, 'output');
const web = join(output, 'web');
const tmp = join(output, '.tmp');

const SHOTS = ['scan-bmw-i3', 'scan-nissan-e-nv200', 'photo-tesla-model-s', 'photo-nissan-leaf'];
const PHONE_HEIGHT = 1200;

function magick(...args) {
  return execFileSync('magick', args, { encoding: 'utf8' }).trim();
}

function framed(source, target, height) {
  const screen = join(tmp, 'screen.png');
  magick(source, '-resize', `x${height}`, screen);
  const [width] = magick('identify', '-format', '%w %h', screen).split(' ').map(Number);
  const bezel = Math.round(height * 0.018);
  const radius = Math.round(width * 0.11);
  const outerW = width + bezel * 2;
  const outerH = height + bezel * 2;
  magick(
    '-size', `${outerW}x${outerH}`, 'xc:none',
    '-fill', '#16161a', '-draw', `roundrectangle 0,0,${outerW - 1},${outerH - 1},${radius + bezel},${radius + bezel}`,
    '(', screen,
    '(', '-size', `${width}x${height}`, 'xc:none', '-fill', 'white', '-draw', `roundrectangle 0,0,${width - 1},${height - 1},${radius},${radius}`, ')',
    '-compose', 'DstIn', '-composite', ')',
    '-compose', 'Over', '-geometry', `+${bezel}+${bezel}`, '-composite',
    '(', '+clone', '-background', 'black', '-shadow', '35x24+0+16', ')',
    '+swap', '-background', 'none', '-layers', 'merge', '+repage', '-depth', '8',
    target
  );
}

mkdirSync(web, { recursive: true });
mkdirSync(tmp, { recursive: true });

for (const platform of ['ios', 'android']) {
  for (const shot of SHOTS) {
    const source = join(output, platform, `${shot}.png`);
    if (!existsSync(source)) continue;
    const frame = join(tmp, 'frame.png');
    const target = join(web, `${platform}-${shot}.webp`);
    framed(source, frame, PHONE_HEIGHT);
    magick(frame, '-quality', '80', target);
    console.log(target);
  }
}

rmSync(tmp, { recursive: true, force: true });
