FROM node:20-alpine

# Значения по умолчанию в образе; переопределение: docker run -e VITE_...=...
# Для сборки с другими дефолтами: docker build --build-arg VITE_API_BASE_URL=...
ARG VITE_API_BASE_URL=http://localhost:5234
ARG VITE_AUTH_LOGIN_URL=http://localhost:5234/api/auth/login
ARG VITE_APP_NAME="Sample RAG Client"

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_AUTH_LOGIN_URL=${VITE_AUTH_LOGIN_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

WORKDIR /usr/src/app/SampleRag.Client

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Windows CRLF ломает shebang (ошибка "no such file or directory")
RUN tr -d '\r' < /usr/local/bin/docker-entrypoint.sh > /tmp/docker-entrypoint.sh \
  && mv /tmp/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh \
  && chmod +x /usr/local/bin/docker-entrypoint.sh

COPY SampleRag.Client/package.json SampleRag.Client/package-lock.json* ./
RUN npm install --ignore-scripts

# Только файлы клиента — index.html и vite.config в корне WORKDIR (иначе Vite отдаёт 404)
COPY SampleRag.Client/ ./

EXPOSE 5274
ENV NODE_ENV=development

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5274"]
