// Орехич — точка входа: поднимает HTTP-сервер поверх приложения
import fs from 'node:fs';
import { createApp, resolveStaticDir } from './app.js';

const PORT = Number(process.env.PORT || 8090);
const HOST = process.env.HOST || '0.0.0.0';
const DIST = resolveStaticDir();

createApp().listen(PORT, HOST, () => {
  console.log(`🥜 Орехич: http://${HOST}:${PORT}  (api: /api/health, static: ${fs.existsSync(DIST) ? DIST : 'нет сборки'})`);
});
