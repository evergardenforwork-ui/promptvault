# 🔐 Управление пользователями и паролями PromptVault

> Личная инструкция по просмотру, сбросу и управлению учётными записями в Supabase.
> **Последнее обновление**: 2026-08-26

---

## 📌 Как узнать текущие учетные данные?

В базе данных Supabase хранятся **хеши bcrypt** (`$2b$10$...`), а не сам пароль в открытом виде. Расшифровать хэш обратно **невозможно** (это сделано ради безопасности).

Но ты можешь в любой момент **посмотреть список зарегистрированных емейлов** или **установить любой новый пароль за 2 секунды**.

---

## 🛠️ Способ 1: Готовые CLI Команды в консоли (Самый простой способ)

Все команды запускаются в терминале из папки проекта:

### 1. Посмотреть всех пользователей и емейлы:
```bash
npx tsx scripts/manageUsers.ts list
```

### 2. Сменить пароль администратору (или любому пользователю):
```bash
npx tsx scripts/manageUsers.ts reset evergardenforwork@gmail.com ТВОЙ_НОВЫЙ_ПАРОЛЬ
```

### 3. Создать нового пользователя/друга:
```bash
npx tsx scripts/manageUsers.ts create friend@gmail.com Пароль123 ИмяДруга user
```

### 4. Удалить пользователя:
```bash
npx tsx scripts/manageUsers.ts delete friend@gmail.com
```

---

## 🌐 Способ 2: Через интерфейс Supabase Dashboard

1. Перейди в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выбери проект **evergarden**
3. В левом меню выбери **Table Editor** → таблица **`users`**
4. В этой таблице ты увидишь:
   - `email`: твоя почта (например `evergardenforwork@gmail.com`)
   - `role`: `admin`
   - `password`: хэш вида `$2b$10$...`

### Чтобы поменять пароль прямо через SQL Editor в Supabase:
Открой **SQL Editor** в Supabase и выполни запрос:

```sql
-- Хэш ниже — это захешированное слово 'admin123'
UPDATE public.users 
SET password = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW'
WHERE email = 'evergardenforwork@gmail.com';
```

---

## 👑 Способ 3: Управление владением материалами (Auto-Claim & Transfer)

1. **Авто-привязка при импорте (Auto-Claim on Import)**:
   - При импорте любого ZIP-бэкапа (как на локалке, так и в онлайне) сервер автоматически привязывает все карточки к тому пользователю, который делает импорт.
   - Это гарантирует, что чужие `user_id` не создадут конфликтов и карточки сразу станут доступны в фильтрах «Все мои» и «Авторские».

2. **Кнопка в 1 клик `⚡ Привязать всё ко мне`**:
   - Находится во вкладке **«Пользователи»** (`/admin`).
   - Позволяет администратору в 1 клик переназначить все существующие в базе карточки (промпты, скиллы, git, команды, закладки, воркспейсы) своему текущему аккаунту.

3. **Быстрый вход на локалке (SQLite)**:
   - Дефолтный аккаунт: `admin@promptvault.local` / `admin123`.
   - В окне входа доступна кнопка **«⚡ Быстрое заполнение: Admin (admin123)»**.

---

## 🚀 Создание первого профиля при чистом онлайн-хостинге (Supabase + Vercel)

Когда вы разворачиваете проект на новом чистом аккаунте Supabase, для входа в приложение требуется хотя бы один профиль администратора. Создать его можно тремя способами:

### 1. Автоматически при создании схемы БД (Самый рекомендуемый)
Файл [`scripts/schema.sql`](../../scripts/schema.sql) в самом конце содержит команду автоматического создания первого главного администратора:
```sql
INSERT INTO public.users (uid, email, name, role, password)
VALUES (
    'admin-uid',
    'evergardenforwork@gmail.com', -- замените на ваш email при необходимости
    'Admin',
    'admin',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW' -- пароль: admin123
) ON CONFLICT (uid) DO NOTHING;
```
При выполнении `schema.sql` в **Supabase SQL Editor** администратор создаётся мгновенно, и вы сразу можете войти с паролем `admin123`.

### 2. Через консольную CLI-утилиту `manageUsers.ts`
Если в файле `.env` указаны `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`, выполните команду:
```bash
npx tsx scripts/manageUsers.ts create ВАШ_EMAIL@gmail.com ВАШ_ПАРОЛЬ ВашеИмя admin
```
Скрипт сам подключится к Supabase, захеширует пароль через `bcrypt` и создаст профиль.

### 3. Прямым SQL-запросом в Supabase SQL Editor
```sql
-- Генерация админа с паролем admin123
INSERT INTO public.users (uid, email, name, role, password)
VALUES (
    'admin-' || substr(md5(random()::text), 1, 8),
    'my-admin@example.com',
    'Super Admin',
    'admin',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW'
);
```

---

## 🔒 Безопасность и резюме

1. **Где пароли?** В Supabase PostgreSQL (`users` таблица) в виде bcrypt-хэшей.
2. **Как войти под админом?** 
   - **Login**: `evergardenforwork@gmail.com`
   - **Password**: Если забыл — выполни `npx tsx scripts/manageUsers.ts reset evergardenforwork@gmail.com мой_пароль`
3. **Нужно ли передавать логин/пароль на Vercel?**
   - **НЕТ!** Vercel связывается с Supabase через `SUPABASE_SERVICE_ROLE_KEY`. Все аккаунты живут в Supabase БД.
