#!/usr/bin/env node
// Локальная раздача шрифтов вместо Google Fonts (https://kira-ai.net доступ к fonts.gstatic.com
// с сервера не проходит, а для РФ это ещё и медленно).
// Берёт готовые woff2 из распакованных пакетов @fontsource (LTR-каталог в /tmp/fonts по умолчанию)
// и пишет web/public/fonts/*.woff2 + web/src/fonts.css с unicode-range, чтобы браузер качал
// только нужный поднабор.  Запуск: node scripts/selfhost-fonts.mjs [путь-к-пакетам-fontsource]

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const SRC_ROOT = process.argv[2] || '/tmp/fonts';
const OUT_FONTS = path.join(ROOT, 'public/fonts');
const CSS_OUT = path.join(ROOT, 'src/fonts.css');

const RANGES = {
  cyrillic: 'U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212, U+2215, U+FEFF, U+FFFD',
};

const NEEDED = [
  { pkg: 'pkg-literata', family: 'Literata', weights: [400, 600, 700], subsets: ['latin', 'cyrillic'] },
  { pkg: 'pkg-manrope', family: 'Manrope', weights: [400, 600, 700], subsets: ['latin', 'cyrillic'] },
];

if (!existsSync(SRC_ROOT)) {
  console.error(`Нет каталога ${SRC_ROOT}. Распакуйте @fontsource/literata и @fontsource/manrope, например:`);
  console.error('  curl -o manrope.tgz https://registry.npmjs.org/@fontsource/manrope/-/manrope-<ver>.tgz && tar -xzf manrope.tgz && mv package pkg-manrope');
  process.exit(1);
}

mkdirSync(OUT_FONTS, { recursive: true });
const blocks = [];
let total = 0;

for (const entry of NEEDED) {
  const filesDir = path.join(SRC_ROOT, entry.pkg, 'files');
  if (!existsSync(filesDir)) {
    console.error(` пропущено: нет ${filesDir}`);
    continue;
  }
  const have = new Set(readdirSync(filesDir));
  for (const weight of entry.weights) {
    for (const subset of entry.subsets) {
      const file = `${entry.family.toLowerCase()}-${subset}-${weight}-normal.woff2`;
      if (!have.has(file)) continue;
      copyFileSync(path.join(filesDir, file), path.join(OUT_FONTS, file));
      total += statSync(path.join(OUT_FONTS, file)).size;
      blocks.push(
        [
          '@font-face {',
          `  font-family: '${entry.family}';`,
          '  font-style: normal;',
          '  font-display: swap;',
          `  font-weight: ${weight};`,
          `  src: url('/fonts/${file}') format('woff2');`,
          `  unicode-range: ${RANGES[subset]};`,
          '}',
        ].join('\n'),
      );
    }
  }
}

if (!blocks.length) {
  console.error('Ни одного файла не скопировано — проверьте каталог источника.');
  process.exit(1);
}

writeFileSync(CSS_OUT, `/* Сгенерировано scripts/selfhost-fonts.mjs — локальные шрифты, без внешних CDN. */\n${blocks.join('\n\n')}\n`);
console.log(`лиц: ${blocks.length}, вес: ${(total / 1024).toFixed(0)} КБ, файл: ${path.relative(ROOT, CSS_OUT)}`);
console.log(`woff2: ${readdirSync(OUT_FONTS).length} шт в public/fonts`);
