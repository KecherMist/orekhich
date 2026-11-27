#!/usr/bin/env bash
# Публикация витрины на GitHub Pages: web/dist → ветка gh-pages (без GitHub Actions).
# Требуется: собранный web (npm ci в web/) и git-доступ к репозиторию.
#   bash scripts/deploy-pages.sh
# Переопределение: REPO=владелец/имя BRANCH=gh-pages bash scripts/deploy-pages.sh
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
REPO="${REPO:-KecherMist/orekhich}"
owner=${REPO%%/*}
name=${REPO#*/}
BRANCH="${BRANCH:-gh-pages}"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo "1/3 сборка web/dist с базой ${name}/"
( cd "$root/web" && VITE_BASE="/${name}/" npm run build >/dev/null )

echo "2/3 ветка ${BRANCH}"
cp -R "$root/web/dist/." "$tmp/"
touch "$tmp/.nojekyll"
(
  cd "$tmp"
  git init -q
  git checkout -q -b "$BRANCH"
  git remote add origin "https://github.com/${REPO}.git"
  git add -A
  git -c user.name="${GIT_AUTHOR_NAME:-Vitaliy}" -c user.email="${GIT_AUTHOR_EMAIL:-$owner@users.noreply.github.com}" \
    commit -q -m "Pages: $(date -u '+%Y-%m-%d %H:%M UTC')"
  git push -q --force origin "$BRANCH"
)

echo "3/3 опубликовано: https://${owner}.github.io/${name}/"
echo "Если сайт не обновился: Settings → Pages → SOURCE: GitHub Actions (или ветка ${BRANCH}), затем ?v=N в адресе."
