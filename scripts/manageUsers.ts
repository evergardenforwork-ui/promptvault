import { createClient } from "@supabase/supabase-js";
import { createDbAdapter, DbAdapter } from "../server/dbAdapter.ts";
import { localDb } from "../server/localDb.ts";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasSupabaseCreds = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes("placeholder")
);

const supabase = hasSupabaseCreds
  ? createClient(supabaseUrl!, supabaseServiceKey!, { auth: { persistSession: false } })
  : undefined;

const db: DbAdapter = createDbAdapter(supabase);

async function main() {
  const command = process.argv[2]; // 'list', 'reset', 'create', 'delete'
  const email = process.argv[3];
  const newPass = process.argv[4];

  console.log(`\n⚙️ Режим хранилища: ${db.isLocal ? "💻 LOCAL SQLite (data/promptvault.db)" : "☁️ CLOUD Supabase"}`);

  if (!command || command === 'list') {
    console.log("📋 Список всех пользователей:");
    const users = await db.getUsers();
    console.table(users);
    return;
  }

  if (command === 'reset') {
    if (!email || !newPass) {
      console.log("❌ Использование: npx tsx scripts/manageUsers.ts reset <email> <новый_пароль>");
      return;
    }
    const user = await db.findUserByEmail(email);
    if (!user) {
      console.error(`❌ Пользователь с email "${email}" не найден.`);
      return;
    }
    const hash = bcrypt.hashSync(newPass, 10);
    await db.updateUserPassword(user.uid, hash);
    console.log(`✅ Пароль для ${email} успешно изменён на "${newPass}"`);
    return;
  }

  if (command === 'create') {
    if (!email || !newPass) {
      console.log("❌ Использование: npx tsx scripts/manageUsers.ts create <email> <пароль> [имя] [роль]");
      return;
    }
    const name = process.argv[5] || "User";
    const role = process.argv[6] || "user";
    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    await db.createUser({ uid, email, password: newPass, name, role });
    console.log(`✅ Пользователь ${email} создан (роль: ${role}, пароль: ${newPass})`);
    return;
  }

  if (command === 'delete') {
    if (!email) {
      console.log("❌ Использование: npx tsx scripts/manageUsers.ts delete <email>");
      return;
    }
    const user = await db.findUserByEmail(email);
    if (!user) {
      console.error(`❌ Пользователь с email "${email}" не найден.`);
      return;
    }
    await db.deleteUser(user.uid);
    console.log(`🗑️ Пользователь ${email} удалён`);
    return;
  }
}

main();
