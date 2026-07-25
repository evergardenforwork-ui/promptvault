# 🚀 Развертывание PromptVault на Render.com

Этот проект полностью подготовлен для деплоя на платформе Render. В нем уже настроен Express-сервер (`server.ts`), который будет раздавать собранное React-приложение.

## Шаг 1: Подготовка репозитория
1. Скачайте проект (кнопка Export -> Download ZIP или Export to GitHub).
2. Если скачали ZIP, распакуйте его, инициализируйте git (`git init`), сделайте коммит и запушьте в свой репозиторий на GitHub.

## Шаг 2: Создание Web Service на Render
1. Зарегистрируйтесь или войдите на [Render.com](https://render.com).
2. Нажмите **"New"** -> **"Web Service"**.
3. Выберите **"Build and deploy from a Git repository"** и подключите свой репозиторий GitHub с проектом PromptVault.

## Шаг 3: Настройка сервиса
Заполните настройки следующим образом:
* **Name**: `promptvault` (или любое другое)
* **Region**: Выберите ближайший к вам (например, Frankfurt)
* **Branch**: `main` (или ваша основная ветка)
* **Runtime**: `Node`
* **Build Command**: `npm install && npm run build`
* **Start Command**: `npm run start` (или `node server.ts`)

## Шаг 4: Переменные окружения (Environment Variables)
Прокрутите вниз до раздела **Environment Variables** и добавьте следующие ключи (ключ для Gemini можно получить в Google AI Studio):

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `GEMINI_API_KEY` | Ваш ключ от Google Gemini API |

*(Примечание: `PORT` Render подставит автоматически, его указывать не обязательно. База данных хранится локально в файлах в директории `/data`, поэтому никаких дополнительных баз данных настраивать не нужно).*

## Шаг 5: Деплой
Нажмите кнопку **"Create Web Service"**.
Render начнет установку зависимостей, сборку проекта (Vite build) и запуск сервера. Через несколько минут ваше приложение будет доступно по ссылке вида `https://promptvault-xxxx.onrender.com`.
