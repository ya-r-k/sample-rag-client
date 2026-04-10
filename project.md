# Анализ фронтенд кодовой базы: Sample RAG Client

**Проект**: RAG Chat Client (клиент для AI-powered Q&A с документами)  
**Репозиторий**: sample-rag-client  
**Текущее состояние**: Ранняя стадия — настроена инфраструктура (Vite, TypeScript, ESLint), задекларирована структура папок, спецификация и план реализации готовы; **исходный код приложения (компоненты, страницы, API-слой) в репозитории отсутствует** — точка входа `src/main.tsx` указана в `index.html`, но файл не представлен в анализируемой кодовой базе.

---

## 📁 Структура проекта

```
sample-rag-client/
├── SampleRag.Client/           # Корневая папка фронтенд-приложения
│   ├── public/                 # Статические ресурсы (vite.svg)
│   ├── src/                    # Исходный код (структура по .esproj; файлов в репозитории нет)
│   │   ├── api/                # Запланировано: API-слой
│   │   ├── configs/            # Запланировано: конфигурации
│   │   ├── hooks/              # Запланировано: React hooks
│   │   ├── hocs/               # Запланировано: higher-order components
│   │   ├── services/           # Запланировано: сервисы (в т.ч. NewFolder)
│   │   ├── states/store/       # Запланировано: хранилище состояния
│   │   └── utils/              # Запланировано: утилиты
│   ├── .vscode/                # Настройки VS Code (launch.json для отладки)
│   ├── index.html              # HTML-точка входа, подключает /src/main.tsx
│   ├── vite.config.ts          # Конфигурация Vite
│   ├── tsconfig.json           # Корневой TS config (references на app и node)
│   ├── tsconfig.app.json       # TypeScript для приложения (src)
│   ├── tsconfig.node.json      # TypeScript для Node (vite.config)
│   ├── eslint.config.js       # ESLint (flat config)
│   ├── package.json            # Зависимости и скрипты
│   ├── SampleRag.Client.esproj # MSBuild-проект (VS JavaScript SDK)
│   └── README.md, CHANGELOG.md
├── specs/001-rag-chat-client/  # Спецификация фичи: план, исследование, контракты API
└── .specify/                   # Шаблоны и скрипты speckit
```

**Назначение директорий:**

- **SampleRag.Client** — SPA на React + TypeScript; сборка через Vite; интеграция с Visual Studio через .esproj (старт `npm run dev`, тесты Jest из `src/`, вывод в `dist`).
- **src/** — по .esproj задекларированы папки в стиле **layer-based** (api, configs, hooks, hocs, services, states, utils). В репозитории файлов в `src/` не обнаружено.
- **specs/** — документация фичи 001-rag-chat-client: спецификация, план реализации, исследование технологий, контракты API (OpenAPI), чеклисты UX/требований.

**Принципы организации кода:** Фактически присутствует только **конфигурационная** и **документационная** часть. По .esproj видна организация по слоям (api, services, states, utils, hooks, hocs). В **плане реализации** (specs) заявлена архитектура **Feature-Sliced Design (FSD)** с слоями `app`, `pages`, `widgets`, `features`, `entities`, `shared` — то есть целевая организация кода отличается от текущей заготовки в .esproj.

---

## 🛠 Технологический стек

| Категория | Технология | Версия | Назначение |
|-----------|------------|--------|------------|
| Фреймворк | React | ^18.2.0 | UI |
| Язык | TypeScript | ^5.2.2 | Типизация |
| Сборка | Vite | ^5.2.0 | Dev-сервер и production build |
| Плагин сборки | @vitejs/plugin-react | ^4.2.1 | Fast Refresh для React |
| Роутинг | react-router-dom | ^7.5.0 | Маршрутизация |
| Состояние | @reduxjs/toolkit, react-redux | ^2.2.5, ^9.1.2 | Глобальное состояние (текущий стек) |
| HTTP | axios | ^1.6.7 | Запросы к API |
| UI-библиотеки | @mui/material, antd | ^7.0.2, ^5.14.1 | Компоненты (текущий стек) |
| Стили (UI) | @emotion/react, @emotion/styled | ^11.14.0 | Используются MUI |
| i18n | i18next, react-i18next, i18next-browser-languagedetector | ^25.0.2, ^15.5.1, ^8.1.0 | Локализация RU/EN |
| Линтинг | ESLint, typescript-eslint, react-hooks, react-refresh | 8.x / 7.x | Линт и правила для React |
| Окружение | Node (ESM) | — | `"type": "module"` в package.json |

**Замечание:** В **спецификации и плане** описан иной целевой стек: Zustand вместо Redux, TanStack Query вместо только axios, shadcn/ui + Headless UI + Lucide React вместо MUI/Ant Design, Tailwind, Framer Motion, react-dropzone. Текущий `package.json` отражает более ранний или параллельный выбор (Redux, MUI, Ant Design) — при следовании спецификации потребуется приведение зависимостей в соответствие с планом.

---

## 🏗 Архитектура

**Текущее состояние:** Реализованной архитектуры приложения в коде нет (нет компонентов, страниц, store, API-вызовов). Ниже — по конфигурации, .esproj и документации.

- **Компонентная архитектура:** Не проанализирована — компонентов в репозитории нет. План предполагает кастомные чат-компоненты на базе shadcn/ui без готовой чат-библиотеки.
- **Разделение логики:** В .esproj зарезервированы папки `hooks` и `hocs`; в исследовании упомянуты кастомный TokenManager и паттерны вроде `useDropzone` для загрузки файлов.
- **Управление состоянием:** В коде используется только конфигурация. В зависимостях — Redux (RTK). В плане — Zustand для UI и клиентского состояния, TanStack Query для серверных данных, idb-keyval только для офлайн-черновиков.
- **API-слой:** В коде отсутствует. По спецификации все запросы к локальному RAG API; аутентификация — Bearer JWT, access token в памяти. На текущем этапе JWT временно получается напрямую из эндпоинта `/api/auth/login` и передаётся в заголовке `Authorization: Bearer <token>`; в дальнейшем реализация может быть заменена на полноценный OIDC-провайдер без изменений остального кода.
- **Роутинг:** Подключён React Router v7; план предполагает плавные переходы (Framer Motion AnimatePresence).
- **Ошибки и загрузка:** В спецификации зафиксированы UX-007 (ошибка/таймаут — сообщение, останов спиннера, retry), SC-008 (загрузка видна в течение 500 ms).

**Пример целевого паттерна (из research.md) — валидация загрузки PDF:**

```ts
useDropzone({
  accept: { 'application/pdf': ['.pdf'] },
  maxSize: 20 * 1024 * 1024, // 20MB
  maxFiles: 1,
  onDropRejected: (rejections) => { /* UX-010 feedback */ },
  validator: (file) => { /* extra checks if needed */ },
});
```

---

## 🎨 UI/UX и стилизация

- **Подходы к стилизации:** В текущих зависимостях — Emotion (через MUI) и компоненты MUI/Ant Design. В плане — Tailwind v3.4+, SCSS, shadcn/ui, Headless UI, Lucide React, темизация через CSS-переменные.
- **Дизайн-система / UI-kit:** Текущий стек — MUI + Ant Design (две полноценные библиотеки). Целевой — единая база на shadcn/ui + Headless UI с сдержанной палитрой.
- **Layout чата:** Страница чата построена как двухколоночный layout: слева фиксированная боковая панель `ChatSidebar` без отступов от края экрана, справа основная область сообщений и инпута. В пустом состоянии (нет выбранного чата) инпут первого сообщения расположен по центру правой области; при переходе в конкретный чат список сообщений заполняет правую часть, а поле ввода сообщения закрепляется внизу экрана.
- **Сообщения:** Сообщения пользователя и системы визуально различаются: пользовательские сообщения выравниваются вправо и отображаются на контрастном фоне, системные — слева, на более спокойном фоне, с цитатами-источниками под ответом. Порядок сообщений сохраняется хронологическим (по мере отправки/получения).
- **Адаптивность:** В коде не реализована; в спецификации заложена поддержка современных браузеров и удобный интерфейс (в т.ч. SC-009 — первый сценарий «вопрос–ответ» без подсказок).
- **Темизация:** В плане — сдержанная палитра через CSS-переменные в `:root`, без ярких акцентов.
- **Доступность (a11y):** В спецификации UX-011 — видимые focus-состояния и поддержка клавиатурной навигации.

---

## ✅ Качество кода

- **ESLint:** Используется flat config (`eslint.config.js`): `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`. Игнорируется `dist`. Для .ts/.tsx включены recommended правила и `react-refresh/only-export-components` (warn). Type-aware или strict type-checked правила не включены — в README предложено перейти на `recommendedTypeChecked`/`strictTypeChecked` с `parserOptions.project`.
- **Prettier / Stylelint:** В репозитории не найдены.
- **Именование и организация:** Единых соглашений в коде не видно из-за отсутствия исходников; план предписывает FSD и запрет `any`.
- **TypeScript:** В `tsconfig.app.json` включены `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`; целевой план запрещает `any`.
- **TanStack Query (`queryFn`):** Нельзя передавать `queryFn: apiFn` напрямую, если `apiFn` ожидает объект фильтров/параметров с необязательными полями. TanStack Query передает `QueryFunctionContext` (`{ client, queryKey, signal }`), и TypeScript может считать типы совместимыми, из-за чего фильтры молча станут `undefined`. Используйте обертку `queryFn: () => apiFn(filters)` или извлекайте фильтры из `queryKey`.
- **Тесты:** В .esproj указаны Jest и корень тестов `src/`. В конституции проекта зафиксировано: тесты не обязательны. Тестовых файлов в репозитории не обнаружено.
- **Документация в коде:** Не применимо — кода приложения нет. README — стандартный Vite+React+TS; CHANGELOG описывает создание проекта через create-vite и добавление .esproj.

---

## 🔧 Ключевые «компоненты» и конфигурации

Поскольку компонентов приложения нет, ниже — ключевые артефакты инфраструктуры и контракта.

### 1. Vite (vite.config.ts)

Назначение: сборка и dev-сервер. Задаёт порт 5274 и React-плагин.

```ts
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [plugin()],
  server: { port: 5274 },
});
```

### 2. TypeScript (tsconfig.app.json)

Назначение: компиляция исходников в `src` (ES2020, ESNext modules, strict, jsx: react-jsx, noEmit для Vite).

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
```

### 3. ESLint (eslint.config.js)

Назначение: линтинг .ts/.tsx с поддержкой React hooks и React Refresh.

```js
export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
```

### 4. Точка входа (index.html)

Подключает SPA через единственный модуль `main.tsx` (файл в репозитории отсутствует).

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

### 5. MSBuild-проект (SampleRag.Client.esproj)

Назначение: интеграция с Visual Studio — команда запуска `npm run dev`, тесты Jest из `src/`, вывод в `dist`, задекларированная структура папок под слой api, configs, hooks, hocs, services, states/store, utils.

---

## 📋 Паттерны и лучшие практики (по спецификации)

- **Переиспользуемые паттерны:** Кастомный TokenManager (получение JWT через `/api/auth/login`, хранение в памяти и автоматическое обновление при 401), react-dropzone для валидации PDF (тип, 20MB) до отправки на сервер, FSD для масштабирования фич.
- **Производительность:** В плане — загрузка видна в течение 500 ms, ответ за &lt;30 s, отображение загруженного документа в течение 10 s после загрузки.
- **Асинхронность:** План — TanStack Query с правилами retry (без retry на 401/403), SSE через EventSource при необходимости.
- **Валидация:** Клиентская проверка загрузки: только PDF, макс. 20MB; невалидные файлы не отправляются (FR-015, UX-010).
- **Локализация:** react-i18next, ленивая загрузка JSON, ICU; языки RU/EN (FR-016, SC-007).

---

## 🔧 Инфраструктура разработки

- **Скрипты (package.json):**  
  - `dev` — `vite` (запуск dev-сервера на порту 5274).  
  - `build` — `tsc && vite build` (проверка типов и сборка).  
  - `lint` — `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`.  
  - `preview` — `vite preview` (просмотр production-сборки).
- **Среда:** Проект создан через `create-vite` (react-ts); в плане упомянуты husky, Prettier — в текущем репозитории не настроены.
- **Pre-commit / CI/CD:** Не обнаружены; в плане указана необходимость проходить constitution check и при необходимости запускать `npm audit`.
- **Docker:** Не найден.

---

## 📋 Выводы и рекомендации

**Сильные стороны:** Чёткая спецификация и план (RAG Chat Client), исследование технологий (research.md) с обоснованием выбора библиотек и лицензий; контракты API (OpenAPI); строгий TypeScript и базовая настройка ESLint; конституция проекта задаёт единые ограничения (FSD, лицензии MIT/Apache-2.0, хранение токенов, без SSR).

**Текущие ограничения:** Исходный код приложения отсутствует — нет `main.tsx`, App, страниц, виджетов, API-клиента, store. Структура в .esproj (api, configs, hooks, hocs, services, states, utils) не совпадает с заявленной FSD (app, pages, widgets, features, entities, shared). Зависимости в package.json (Redux, MUI, Ant Design) расходятся с планом (Zustand, TanStack Query, shadcn/ui, Tailwind, react-dropzone и др.).

**Рекомендации:**

1. **Привести зависимости в соответствие со спецификацией:** внедрить Zustand, TanStack Query, shadcn/ui, Tailwind, Framer Motion, react-dropzone; при необходимости поэтапно убрать Redux, MUI, Ant Design или явно зафиксировать причины их сохранения.
2. **Реализовать точку входа и FSD-каркас:** добавить `src/main.tsx`, провайдеры (router, i18n, store), базовый layout и маршруты согласно плану.
3. **Унифицировать структуру:** перейти от папок в .esproj к FSD (app, pages, widgets, features, entities, shared) и обновить .esproj под новое дерево.
4. **Усилить линтинг:** включить type-aware ESLint с `tsconfig.app.json` и при желании Prettier/Stylelint для единого стиля.
5. **Уровень сложности:** По задумке — **middle/senior**: FSD, кастомный TokenManager, i18n, доступность, строгие требования к производительности и UX; текущее состояние — **junior-friendly** (только конфигурация и документация).

Итог: кодовая база представляет собой **подготовленный каркас** с продуманной документацией и целевой архитектурой; для полноценного анализа реализации потребуется появление исходного кода в `src/` и согласование зависимостей со спецификацией.

---

## POST /api/messages — SSE stream (`MessagePartResponse`)

When the response is `text/event-stream`, **each** SSE `data:` line is one JSON object in **camelCase**, matching the backend `MessagePartResponse` (same fields as the C# DTO).

### `GenerationStep` (numeric)

| Value | Name |
|------:|------|
| 0 | `unknown` |
| 1 | `aiThinking` |
| 2 | `toolUsing` |
| 3 | `toolResult` |
| 4 | `responseMessage` — assistant reply text chunks (`text` appended to the in-flight assistant message) |
| 5 | `newChatName` — `text` is the new chat title |

JSON uses the property **`step`** for this enum. Some payloads may send the same value as **`role`** instead; the client normalizes both to `step` when parsing.

### `AiTool` (numeric)

| Value | Name |
|------:|------|
| 0 | `unknown` |
| 1 | `currentTime` |
| 2 | `internalDocumentData` |

### Shape (camelCase)

- `text?: string`
- `createdAt?: string` (ISO)
- `step: number` (see `GenerationStep`; or `role` as an alias for `step`)
- `newChatId?: string` (GUID string when the server creates a chat mid-stream)
- `toolsCalls?: { tool: number, arguments?: object }[]`
- `toolsResults?: { tool: number, value?: unknown }[]`

### New thread: first SSE frame

If **no chat** was selected (`chatId` omitted in the request), the **first** event from the API is typically:

```json
{
  "newChatId": "<guid>",
  "text": "<proposed chat title>",
  "role": 5
}
```

Here `role` / `step` **`5`** is `NewChatName` (`GenerationStep`). The client must treat `newChatId` as the real chat id (navigate to `/chats/:id`, bind stream state, seed messages, etc.). Further frames use `step` **`4`** (`ResponseMessage`) for answer deltas and **`1`–`3`** for thinking / tool call / tool result as needed.
