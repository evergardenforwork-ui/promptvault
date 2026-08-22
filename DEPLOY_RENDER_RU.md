# 🚀 Развертывание PromptVault на Render.com / Vercel

> 💡 **Рекомендация**: Основной платформой развертывания проекта является **Vercel** (Serverless Function через `api/index.ts` и `vercel.json`). Инструкция ниже сохранена для альтернативного деплоя на Render.com в виде Node.js веб-сервиса.
> **Последнее обновление**: 2026-08-23

---

## Вариант 1: Деплой на Vercel (Основной)

1. Зайдите на [vercel.com](https://vercel.com) и нажмите **Add New Project**.
2. Импортируйте репозиторий GitHub `promptvault` (или `superbasetest`).
3. Vercel автоматически применит настройки из `vercel.json`:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. В разделе **Environment Variables** добавьте:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
5. Нажмите **Deploy**.

---

## Вариант 2: Деплой на Render.com (Резервный)

1. Зарегистрируйтесь на [Render.com](https://render.com).
2. Нажмите **New** -> **Web Service** и подключите репозиторий GitHub.
3. Настройки:
   - **Name**: `promptvault`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run dev` (или `npx tsx server.ts`)
4. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: URL вашего проекта Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role ключ Supabase
   - `GEMINI_API_KEY`: API ключ Google Gemini
5. Нажмите **Create Web Service**.
