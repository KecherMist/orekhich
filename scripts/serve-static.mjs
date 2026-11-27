// Локальная проверка статичной сборки для GitHub Pages: раздаёт web/dist по пути /<repo>/.
// Запуск: node scripts/serve-static.mjs [порт]   →  http://127.0.0.1:8091/orekhich/

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'web', 'dist');
const BASE = '/orekhich';
const PORT = Number(process.argv[2]) || 8091;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith(BASE)) {
    res.writeHead(302, { Location: `${BASE}/` });
    res.end();
    return;
  }
  let rel = url.slice(BASE.length) || '/';
  let file = path.join(DIST, rel);
  if (file.endsWith('/')) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, process.env.HOST || '127.0.0.1', () => {
  console.log(`статичный предпросмотр: порт ${PORT}, база ${BASE}, отдаёт ${DIST}`);
});
