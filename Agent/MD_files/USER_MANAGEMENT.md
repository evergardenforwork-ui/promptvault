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
*(После этого пароль станет `admin123`, и ты сможешь войти)*

---

## 🔒 Безопасность и резюме

1. **Где пароли?** В Supabase PostgreSQL (`users` таблица) в виде bcrypt-хэшей.
2. **Как войти под админом?** 
   - **Login**: `evergardenforwork@gmail.com`
   - **Password**: Если забыл — выполни `npx tsx scripts/manageUsers.ts reset evergardenforwork@gmail.com мой_пароль`
3. **Нужно ли передавать логин/пароль на Vercel?**
   - **НЕТ!** Vercel связывается с Supabase через `SUPABASE_SERVICE_ROLE_KEY`. Все аккаунты живут в Supabase БД.
