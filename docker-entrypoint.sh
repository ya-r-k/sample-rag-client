#!/bin/sh
set -e
cd /usr/src/app/SampleRag.Client

# Vite подхватывает VITE_* из process.env и из .env; файл гарантирует значения при старте
# (в т.ч. после docker run -e). Запросы к API идут из браузера на хост — используйте localhost, не имя контейнера API.
{
  echo "VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:5234}"
  echo "VITE_AUTH_LOGIN_URL=${VITE_AUTH_LOGIN_URL:-http://localhost:5234/api/auth/login}"
  echo "VITE_APP_NAME=${VITE_APP_NAME:-Sample RAG Client}"
} > .env

exec "$@"
