import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const command = process.argv[2]; // 'list', 'reset', 'create', 'delete'
  const email = process.argv[3];
  const newPass = process.argv[4];

  if (!command || command === 'list') {
    console.log("\n📋 Список всех пользователей в Supabase:");
    const { data, error } = await supabase.from("users").select("uid, name, email, role, created_at");
    if (error) return console.error("Ошибка:", error.message);
    console.table(data);
    return;
  }

  if (command === 'reset') {
    if (!email || !newPass) {
      console.log("❌ Использование: npx tsx scripts/manageUsers.ts reset <email> <новый_пароль>");
      return;
    }
    const hash = bcrypt.hashSync(newPass, 10);
    const { error } = await supabase.from("users").update({ password: hash }).eq("email", email);
    if (error) return console.error("❌ Ошибка при сбросе:", error.message);
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
    const hash = bcrypt.hashSync(newPass, 10);

    const { error } = await supabase.from("users").insert({ uid, name, email, password: hash, role });
    if (error) return console.error("❌ Ошибка при создании:", error.message);
    console.log(`✅ Пользователь ${email} создан (роль: ${role}, пароль: ${newPass})`);
    return;
  }

  if (command === 'delete') {
    if (!email) {
      console.log("❌ Использование: npx tsx scripts/manageUsers.ts delete <email>");
      return;
    }
    const { error } = await supabase.from("users").delete().eq("email", email);
    if (error) return console.error("❌ Ошибка при удалении:", error.message);
    console.log(`🗑️ Пользователь ${email} удалён`);
    return;
  }
}

main();
