#!/usr/bin/env bash
# Развёртка «Орехич» на ai-01 без root: пересборка фронта + перезапуск detached-процесса на 8090.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-8090}"
LOG="$ROOT/server/data/app.log"

echo "1/4 Сборка фронтенда…"
(cd "$ROOT/web" && npm run --silent build > /tmp/orekhich-build.log 2>&1)
grep -E "dist/|built in" /tmp/orekhich-build.log | tail -4

echo "2/4 Остановка старого процесса на порту $PORT…"
OLD=$(pgrep -f "node src/index.js" || true)
if [[ -n "$OLD" ]]; then kill $OLD 2>/dev/null || true; sleep 1; fi

echo "3/4 Запуск нового процесса…"
cd "$ROOT/server"
setsid nohup env PORT="$PORT" HOST=0.0.0.0 STATIC_DIR="$ROOT/web/dist" node src/index.js > "$LOG" 2>&1 &
sleep 2

echo "4/4 Проверки…"
curl -fsS "http://127.0.0.1:$PORT/api/health"; echo
echo -n "HTML: "; curl -fsS -o /dev/null -w '%{http_code} %{size_download} b\n' "http://127.0.0.1:$PORT/"
JS=$(ls "$ROOT/web/dist/assets/"*.js 2>/dev/null | head -1 | xargs -r basename)
CSS=$(ls "$ROOT/web/dist/assets/"*.css 2>/dev/null | head -1 | xargs -r basename)
[[ -n "$JS" ]] && { echo -n "JS-бандл: "; curl -fsS -o /dev/null -w '%{http_code} %{size_download} b\n' "http://127.0.0.1:$PORT/assets/$JS"; }
[[ -n "$CSS" ]] && { echo -n "CSS: "; curl -fsS -o /dev/null -w '%{http_code} %{size_download} b\n' "http://127.0.0.1:$PORT/assets/$CSS"; }
echo -n "SPA-fallback /katalog: "; curl -fsS -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:$PORT/katalog"
echo "Готово: http://127.0.0.1:$PORT"
