// Орехич — приложение Express (без запуска): используется и в проде, и в тестах
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import api from './api.js';
import './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

export function resolveStaticDir() {
  return process.env.STATIC_DIR || path.join(ROOT, '..', 'web', 'dist');
}

export function createApp({ staticDir } = {}) {
  const DIST = staticDir || resolveStaticDir();
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '250kb' }));

  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  }, api);

  if (fs.existsSync(DIST)) {
    app.use(
      express.static(DIST, {
        index: 'index.html',
        setHeaders(res, filePath) {
          // HTML отдаём без кэша, чтобы после деплоя браузер сразу забрал новый index.html,
          // а хешированные бандлы /assets/index-<hash>.js можно держать в кэше месяцами.
          if (filePath.endsWith('.html')) res.set('Cache-Control', 'no-cache');
          else res.set('Cache-Control', 'public, max-age=2592000, immutable');
        },
      }),
    );
    app.get(/^(?!\/api).*/, (_req, res) =>
      res.set('Cache-Control', 'no-cache').sendFile(path.join(DIST, 'index.html')),
    );
  } else {
    app.get('/', (_req, res) => res.type('html').send(
      '<h1>Орехич API работает</h1><p>Фронтенд не собран: отсутствует ' + DIST + '</p>'));
  }

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Некорректный JSON в запросе' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Слишком большой запрос' });
    const status = Number(err.status || err.statusCode || 500);
    if (status >= 500) console.error('[error]', err.stack || err.message);
    res.status(status >= 400 && status < 500 ? status : 500).json({
      error: status >= 400 && status < 500 ? (err.message || 'Ошибка запроса') : 'Внутренняя ошибка лавки. Попробуйте ещё раз.',
    });
  });

  return app;
}
