/**
 * api/index.ts — Vercel Serverless adapter для PromptVault
 *
 * Vercel вызывает этот файл как Serverless Function.
 * Все /api/* запросы перенаправляются сюда через vercel.json rewrites.
 *
 * В production: Vite билд уже собран в dist/, Vercel раздаёт его как Static.
 * Этот файл отвечает ТОЛЬКО за API роуты.
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import AdmZip from "adm-zip";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Supabase (SERVICE_ROLE — server only, bypasses RLS) ─────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("CRITICAL CONFIG ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables!");
}

const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseServiceKey || "placeholder-key",
  { auth: { persistSession: false } }
);

// ─── Google Gemini ────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const GEMINI_MODEL = "gemini-3.1-flash-lite";

// ─── camelCase → snake_case helpers ──────────────────────────────────────────

function promptToDb(data: any, userId: string) {
  return {
    user_id: userId,
    title: data.title,
    category: data.category || "",
    tags: data.tags || [],
    main_prompt: data.mainPrompt || "",
    usage_notes: data.usageNotes || "",
    media_type: data.mediaType || "photo",
    prompt_origin: data.promptOrigin || "own",
    is_public: data.isPublic ?? false,
    image_layout_type: data.imageLayoutType || "single",
    image_before: data.imageBefore || null,
    image_after: data.imageAfter || null,
    original_image_before: data.originalImageBefore || null,
    original_image_after: data.originalImageAfter || null,
    original_image_slot2: data.originalImageSlot2 || null,
    additional_images: data.additionalImages || [],
    file_package_url: data.filePackageUrl || null,
    file_structure: data.fileStructure || [],
    sub_sections: data.subSections || [],
    author_name: data.authorName || "",
    author_email: data.authorEmail || "",
    usage_count: data.usageCount ?? 0,
  };
}

function promptFromDb(row: any, isFavorite = false) {
  return {
    id: row.id,
    userId: row.user_id || "",
    title: row.title,
    category: row.category || "",
    tags: row.tags || [],
    mainPrompt: row.main_prompt || "",
    usageNotes: row.usage_notes || "",
    mediaType: row.media_type || "photo",
    promptOrigin: row.prompt_origin || "own",
    isPublic: row.is_public ?? false,
    imageLayoutType: row.image_layout_type || "single",
    imageBefore: row.image_before || null,
    imageAfter: row.image_after || null,
    originalImageBefore: row.original_image_before || null,
    originalImageAfter: row.original_image_after || null,
    originalImageSlot2: row.original_image_slot2 || null,
    additionalImages: row.additional_images || [],
    filePackageUrl: row.file_package_url || null,
    fileStructure: row.file_structure || [],
    subSections: row.sub_sections || [],
    authorName: row.author_name || "",
    authorEmail: row.author_email || "",
    usageCount: row.usage_count || 0,
    createdAt: row.created_at,
    isFavorite,
  };
}

function skillToDb(data: any, userId: string) {
  return {
    user_id: userId,
    title: data.title,
    description: data.description || "",
    category: data.category || "",
    skill_types: data.skillTypes || [],
    target_ais: data.targetAis || ["universal"],
    skill_origin: data.skillOrigin || "own",
    tags: data.tags || [],
    is_public: data.isPublic ?? false,
    file_package_url: data.filePackageUrl || null,
    file_structure: data.fileStructure || [],
    author_name: data.authorName || "",
    author_email: data.authorEmail || "",
  };
}

function skillFromDb(row: any, isFavorite = false) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || "",
    category: row.category || "",
    skillTypes: row.skill_types || [],
    targetAis: row.target_ais || ["universal"],
    skillOrigin: row.skill_origin || "own",
    tags: row.tags || [],
    isPublic: row.is_public,
    filePackageUrl: row.file_package_url,
    fileStructure: row.file_structure || [],
    authorName: row.author_name || "",
    authorEmail: row.author_email || "",
    createdAt: row.created_at,
    isFavorite,
  };
}

// ─── Image upload helper ──────────────────────────────────────────────────────

async function uploadImage(dataUrl: string, prefix: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) return dataUrl;
  const matches = dataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches) return dataUrl;
  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const filename = `${prefix}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("prompt-images")
    .upload(filename, buffer, { contentType: `image/${matches[1]}`, upsert: true });
  if (error) { console.error("Storage upload error:", error); return dataUrl; }
  const { data } = supabase.storage.from("prompt-images").getPublicUrl(filename);
  return data.publicUrl;
}

async function processPromptImages(promptData: any, id: string): Promise<any> {
  const data = { ...promptData };
  if (data.imageBefore?.startsWith("data:")) data.imageBefore = await uploadImage(data.imageBefore, `${id}_root_before`);
  if (data.imageAfter?.startsWith("data:")) data.imageAfter = await uploadImage(data.imageAfter, `${id}_root_after`);
  if (data.originalImageBefore?.startsWith("data:")) data.originalImageBefore = await uploadImage(data.originalImageBefore, `${id}_root_orig_before`);
  if (data.originalImageAfter?.startsWith("data:")) data.originalImageAfter = await uploadImage(data.originalImageAfter, `${id}_root_orig_after`);
  if (data.originalImageSlot2?.startsWith("data:")) data.originalImageSlot2 = await uploadImage(data.originalImageSlot2, `${id}_root_slot2`);
  if (Array.isArray(data.additionalImages)) {
    data.additionalImages = await Promise.all(
      data.additionalImages.map((img: string, idx: number) =>
        img?.startsWith("data:") ? uploadImage(img, `${id}_root_add_${idx}`) : Promise.resolve(img)
      )
    );
  }
  if (Array.isArray(data.subSections)) {
    data.subSections = await Promise.all(
      data.subSections.map(async (sub: any, subIdx: number) => {
        if (!sub) return sub;
        const s = { ...sub };
        if (s.imageBefore?.startsWith("data:")) s.imageBefore = await uploadImage(s.imageBefore, `${id}_sub_${subIdx}_before`);
        if (s.imageAfter?.startsWith("data:")) s.imageAfter = await uploadImage(s.imageAfter, `${id}_sub_${subIdx}_after`);
        if (s.originalImageBefore?.startsWith("data:")) s.originalImageBefore = await uploadImage(s.originalImageBefore, `${id}_sub_${subIdx}_orig_before`);
        if (s.originalImageAfter?.startsWith("data:")) s.originalImageAfter = await uploadImage(s.originalImageAfter, `${id}_sub_${subIdx}_orig_after`);
        if (s.originalImageSlot2?.startsWith("data:")) s.originalImageSlot2 = await uploadImage(s.originalImageSlot2, `${id}_sub_${subIdx}_slot2`);
        if (Array.isArray(s.additionalImages)) {
          s.additionalImages = await Promise.all(
            s.additionalImages.map((img: string, idx: number) =>
              img?.startsWith("data:") ? uploadImage(img, `${id}_sub_${subIdx}_add_${idx}`) : Promise.resolve(img)
            )
          );
        }
        return s;
      })
    );
  }
  return data;
}

// ─── Gemini helper ────────────────────────────────────────────────────────────

function dataUrlToInlinePart(dataUrl: string) {
  const match = dataUrl?.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

// ─── Express App ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── Auth Middleware ──────────────────────────────────────────────────────────

async function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  const { data: user, error } = await supabase
    .from("users")
    .select("uid, name, email, role")
    .eq("uid", token)
    .single();
  if (error || !user) return res.status(401).json({ message: "Invalid session token" });
  (req as any).user = { uid: user.uid, displayName: user.name, email: user.email, role: user.role };
  next();
}

async function getUserFavoriteIds(uid: string): Promise<{ prompts: string[]; skills: string[]; gitProjects: string[]; commands: string[]; bookmarks: string[] }> {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("item_id, item_type")
    .eq("user_id", uid);
  if (error || !data) return { prompts: [], skills: [], gitProjects: [], commands: [], bookmarks: [] };
  return {
    prompts: data.filter((r) => r.item_type === "prompt").map((r) => r.item_id),
    skills: data.filter((r) => r.item_type === "skill").map((r) => r.item_id),
    gitProjects: data.filter((r) => r.item_type === "git_project").map((r) => r.item_id),
    commands: data.filter((r) => r.item_type === "command").map((r) => r.item_id),
    bookmarks: data.filter((r) => r.item_type === "bookmark").map((r) => r.item_id),
  };
}

// ─── API: Auth ────────────────────────────────────────────────────────────────

// ─── Diagnostic: Health Check (TEMPORARY) ─────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? `✅ (${process.env.SUPABASE_URL.substring(0, 25)}...)` : "❌ MISSING",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `✅ (${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...)` : "❌ MISSING",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "✅ present" : "❌ MISSING",
    },
    node_version: process.version,
  });
});

app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("[LOGIN] === Login attempt ===");
    console.log("[LOGIN] SUPABASE_URL present:", !!process.env.SUPABASE_URL);
    console.log("[LOGIN] SUPABASE_SERVICE_ROLE_KEY present:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("[LOGIN] req.body:", JSON.stringify(req.body));

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email и пароль обязательны" });

    console.log("[LOGIN] Querying Supabase for email:", email);
    const { data: user, error } = await supabase.from("users").select("uid, name, email, password, role").eq("email", email).single();
    console.log("[LOGIN] Supabase response - data:", !!user, "error:", error ? JSON.stringify(error) : "none");

    if (error) {
      console.error("[LOGIN] Supabase auth query error:", JSON.stringify(error));
      return res.status(500).json({ message: "Ошибка базы данных при авторизации", debug: error.message });
    }
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }
    console.log("[LOGIN] Success for user:", user.uid);
    res.json({ token: user.uid, user: { uid: user.uid, displayName: user.name, email: user.email, role: user.role } });
  } catch (err: any) {
    console.error("[LOGIN] CAUGHT ERROR:", err?.message, err?.stack);
    res.status(500).json({ error: "Внутренняя ошибка сервера", debug: err?.message });
  }
});

// ─── API: Prompts ─────────────────────────────────────────────────────────────

app.get("/api/prompts", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const favs = await getUserFavoriteIds(user.uid);
    let query = supabase.from("prompts").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (user.role !== "admin") query = query.or(`user_id.eq.${user.uid},is_public.eq.true`);
    if (limit > 0) query = query.range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    const items = (data || []).map((row) => promptFromDb(row, favs.prompts.includes(row.id)));
    if (limit > 0) {
      res.json({ items, total: count ?? 0, hasMore: offset + items.length < (count ?? 0) });
    } else {
      res.json(items);
    }
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.post("/api/prompts", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!req.body.title || !req.body.mainPrompt) return res.status(400).json({ error: "Поля title и mainPrompt обязательны" });
    const tempId = `tmp_${Date.now()}`;
    const processed = await processPromptImages(req.body, tempId);
    const dbData = promptToDb(processed, user.uid);
    dbData.author_name = user.displayName || "";
    dbData.author_email = user.email || "";
    const { data, error } = await supabase.from("prompts").insert(dbData).select().single();
    if (error) throw error;
    res.status(201).json(promptFromDb(data, false));
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.put("/api/prompts/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing, error: fetchErr } = await supabase.from("prompts").select("user_id").eq("id", id).single();
    if (fetchErr || !existing) return res.status(404).json({ message: "Промпт не найден" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ message: "Нет доступа" });
    const processed = await processPromptImages(req.body, id);
    const dbData = promptToDb(processed, existing.user_id);
    const { data, error } = await supabase.from("prompts").update(dbData).eq("id", id).select().single();
    if (error) throw error;
    const favs = await getUserFavoriteIds(user.uid);
    res.json(promptFromDb(data, favs.prompts.includes(data.id)));
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.delete("/api/prompts/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing, error: fetchErr } = await supabase.from("prompts").select("user_id").eq("id", id).single();
    if (fetchErr || !existing) return res.status(404).json({ message: "Промпт не найден" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ message: "Нет доступа" });
    await Promise.allSettled([
      supabase.from("chats").delete().eq("prompt_id", id),
      supabase.from("user_favorites").delete().eq("item_id", id),
    ]);
    const { error } = await supabase.from("prompts").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "Промпт удален" });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

// ─── API: Skills ──────────────────────────────────────────────────────────────

app.get("/api/skills", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const favs = await getUserFavoriteIds(user.uid);
    let query = supabase.from("skills").select("*").order("created_at", { ascending: false });
    if (user.role !== "admin") query = query.or(`user_id.eq.${user.uid},is_public.eq.true`);
    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map((row) => skillFromDb(row, favs.skills.includes(row.id))));
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.post("/api/skills", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!req.body.title) return res.status(400).json({ error: "Поле title обязательно" });
    const dbData = { ...skillToDb(req.body, user.uid), author_name: user.displayName || "", author_email: user.email || "" };
    const { data, error } = await supabase.from("skills").insert(dbData).select().single();
    if (error) throw error;
    res.status(201).json(skillFromDb(data, false));
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.put("/api/skills/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing, error: fetchErr } = await supabase.from("skills").select("user_id").eq("id", id).single();
    if (fetchErr || !existing) return res.status(404).json({ message: "Пакет скиллов не найден" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ message: "Нет доступа" });
    const dbData = skillToDb(req.body, existing.user_id);
    const { data, error } = await supabase.from("skills").update(dbData).eq("id", id).select().single();
    if (error) throw error;
    const favs = await getUserFavoriteIds(user.uid);
    res.json(skillFromDb(data, favs.skills.includes(data.id)));
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.delete("/api/skills/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing, error: fetchErr } = await supabase.from("skills").select("user_id").eq("id", id).single();
    if (fetchErr || !existing) return res.status(404).json({ message: "Пакет скиллов не найден" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ message: "Нет доступа" });
    await Promise.allSettled([
      supabase.from("skill_hints").delete().eq("skill_id", id),
      supabase.from("user_favorites").delete().eq("item_id", id),
    ]);
    const { error } = await supabase.from("skills").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "Пакет скиллов удален" });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

// ─── API: Skill Hints ─────────────────────────────────────────────────────────

app.get("/api/skills/:id/hints", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("skill_hints").select("*").eq("skill_id", id).order("created_at", { ascending: true });
    if (error) throw error;
    res.json((data || []).map((row: any) => ({ id: row.id, skillId: row.skill_id, userId: row.user_id, title: row.title, text: row.text, createdAt: row.created_at })));
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.post("/api/skills/:id/hints", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { title, text } = req.body;
    if (!title || !text) return res.status(400).json({ error: "Поля title и text обязательны" });
    const { data, error } = await supabase.from("skill_hints").insert({ skill_id: id, user_id: user.uid, title: title.trim(), text: text.trim() }).select().single();
    if (error) throw error;
    res.status(201).json({ id: data.id, skillId: data.skill_id, userId: data.user_id, title: data.title, text: data.text, createdAt: data.created_at });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.delete("/api/skills/:id/hints/:hintId", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id, hintId } = req.params;
    const { data: existing, error: fetchErr } = await supabase.from("skill_hints").select("user_id").eq("id", hintId).eq("skill_id", id).single();
    if (fetchErr || !existing) return res.status(404).json({ message: "Подсказка не найдена" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ message: "Нет доступа" });
    const { error } = await supabase.from("skill_hints").delete().eq("id", hintId);
    if (error) throw error;
    res.json({ message: "Подсказка удалена" });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

// ─── API: Categories ──────────────────────────────────────────────────────────

app.get("/api/categories", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { data, error } = await supabase.from("categories").select("id, user_id, name, emoji, color").order("name");
    if (error) throw error;
    const filtered = (data || []).filter((c: any) => !c.user_id || c.user_id === user.uid || c.user_id === "admin-uid");
    res.json(filtered.map((row: any) => ({ id: row.id, userId: row.user_id || null, name: row.name, emoji: row.emoji || "", color: row.color || "" })));
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.post("/api/categories", authenticate, async (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: "Поле name обязательно" });
    const user = (req as any).user;
    const { name, emoji, color } = req.body;
    const { data, error } = await supabase.from("categories").insert({ user_id: user.uid, name, emoji: emoji || "", color: color || "" }).select("id, user_id, name, emoji, color").single();
    if (error) throw error;
    res.status(201).json({ id: data.id, userId: data.user_id, name: data.name, emoji: data.emoji || "", color: data.color || "" });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.delete("/api/categories/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing, error: fetchErr } = await supabase.from("categories").select("user_id").eq("id", id).single();
    if (fetchErr || !existing) return res.status(404).json({ message: "Категория не найдена" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ message: "Нет доступа" });
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "Категория удалена" });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

// ─── API: Chats ───────────────────────────────────────────────────────────────

app.get("/api/chats", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { promptId } = req.query;
    if (!promptId) return res.status(400).json({ error: "promptId обязателен" });
    const { data, error } = await supabase.from("chats").select("*").eq("prompt_id", promptId as string).eq("user_id", user.uid).order("created_at", { ascending: true });
    if (error) throw error;
    res.json((data || []).map((row) => ({ id: row.id, promptId: row.prompt_id, userId: row.user_id, role: row.role, content: row.content, image: row.image, createdAt: row.created_at })));
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.post("/api/chats", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { promptId, content, image } = req.body;
    let savedImg = image || null;
    if (image?.startsWith("data:")) {
      const msgId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      savedImg = await uploadImage(image, `${msgId}_chat`);
    }
    const { data, error } = await supabase.from("chats").insert({ prompt_id: promptId, user_id: user.uid, role: "user", content, image: savedImg }).select().single();
    if (error) throw error;
    res.status(201).json({ id: data.id, promptId: data.prompt_id, userId: data.user_id, role: data.role, content: data.content, image: data.image, createdAt: data.created_at });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.post("/api/chats/clear", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { promptId } = req.query;
    if (!promptId) return res.status(400).json({ error: "promptId обязателен" });
    const { error } = await supabase.from("chats").delete().eq("prompt_id", promptId as string).eq("user_id", user.uid);
    if (error) throw error;
    res.json({ message: "История чата очищена" });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

// ─── API: Favorites ───────────────────────────────────────────────────────────

app.get("/api/favorites", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const favs = await getUserFavoriteIds(user.uid);
    res.json(favs);
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.post("/api/favorites/toggle", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { itemId, itemType } = req.body;
    if (!itemId || !itemType) return res.status(400).json({ error: "itemId и itemType обязательны" });
    const { data: existing } = await supabase.from("user_favorites").select("*").eq("user_id", user.uid).eq("item_id", itemId).eq("item_type", itemType).single();
    let added: boolean;
    if (existing) {
      await supabase.from("user_favorites").delete().eq("user_id", user.uid).eq("item_id", itemId).eq("item_type", itemType);
      added = false;
    } else {
      await supabase.from("user_favorites").insert({ user_id: user.uid, item_id: itemId, item_type: itemType });
      added = true;
    }
    const favs = await getUserFavoriteIds(user.uid);
    res.json({ added, favorites: favs });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

// ─── API: Users (admin only) ──────────────────────────────────────────────────

app.get("/api/users", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") return res.status(403).json({ message: "Только администратор" });
    const { data, error } = await supabase.from("users").select("uid, name, email, role").order("name");
    if (error) throw error;
    res.json((data || []).map((u: any) => ({ uid: u.uid, name: u.name, displayName: u.name, email: u.email, role: u.role })));
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.post("/api/users", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") return res.status(403).json({ message: "Только администратор" });
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password обязательны" });
    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hash = bcrypt.hashSync(password, 10);
    const { data, error } = await supabase.from("users").insert({ uid, name, email, password: hash, role: role || "user" }).select("uid, name, email, role").single();
    if (error) throw error;
    res.status(201).json({ uid: data.uid, name: data.name, displayName: data.name, email: data.email, role: data.role });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.delete("/api/users/:uid", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") return res.status(403).json({ message: "Только администратор" });
    const { uid } = req.params;
    if (uid === "admin-uid") return res.status(400).json({ message: "Нельзя удалить главного администратора" });
    await supabase.from("user_favorites").delete().eq("user_id", uid);
    const { error } = await supabase.from("users").delete().eq("uid", uid);
    if (error) throw error;
    res.json({ message: "Пользователь удален" });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

app.put("/api/users/:uid/password", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") return res.status(403).json({ message: "Только администратор" });
    const { uid } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "password обязателен" });
    const hash = bcrypt.hashSync(password, 10);
    const { error } = await supabase.from("users").update({ password: hash }).eq("uid", uid);
    if (error) throw error;
    res.json({ message: "Пароль изменён" });
  } catch (err) { console.error("Route error:", err); res.status(500).json({ error: "Внутренняя ошибка сервера" }); }
});

// ─── API: Export / Import (admin only) ───────────────────────────────────────

app.get("/api/export", authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin") return res.status(403).json({ message: "Только администратор" });
  try {
    const [prompts, skills, categories, users, chats, favorites] = await Promise.all([
      supabase.from("prompts").select("*"),
      supabase.from("skills").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("users").select("uid, name, email, role"),
      supabase.from("chats").select("*"),
      supabase.from("user_favorites").select("*"),
    ]);
    const zip = new AdmZip();
    zip.addFile("prompts.json", Buffer.from(JSON.stringify(prompts.data || [], null, 2)));
    zip.addFile("skills.json", Buffer.from(JSON.stringify(skills.data || [], null, 2)));
    zip.addFile("categories.json", Buffer.from(JSON.stringify(categories.data || [], null, 2)));
    zip.addFile("users.json", Buffer.from(JSON.stringify(users.data || [], null, 2)));
    zip.addFile("chats.json", Buffer.from(JSON.stringify(chats.data || [], null, 2)));
    zip.addFile("favorites.json", Buffer.from(JSON.stringify(favorites.data || [], null, 2)));
    const buffer = zip.toBuffer();
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=promptvault_backup_${Date.now()}.zip`);
    res.send(buffer);
  } catch (e: any) { res.status(500).json({ message: e.message || "Ошибка экспорта" }); }
});

// ─── API: Gemini ──────────────────────────────────────────────────────────────

// 🛡️ Kill switch & Guards
function isGeminiEnabled(): boolean {
  if (process.env.DISABLE_AI === "true" || process.env.GEMINI_DISABLED === "true") return false;
  return Boolean(process.env.GEMINI_API_KEY);
}

// 🛡️ Rate Limiting per User (в памяти): 1 запрос в 3 секунды, max 15 в минуту
const aiRequestLog = new Map<string, number[]>();

function checkAiRateLimit(userId: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const timestamps = (aiRequestLog.get(userId) || []).filter((t) => now - t < 60_000);

  const lastReq = timestamps[timestamps.length - 1];
  if (lastReq && now - lastReq < 3000) {
    const waitSec = Math.ceil((3000 - (now - lastReq)) / 1000);
    return { allowed: false, message: `Слишком частые запросы. Подождите ${waitSec} сек перед следующим AI-анализом.` };
  }

  if (timestamps.length >= 15) {
    return { allowed: false, message: "Превышен минутный лимит запросов к ИИ (макс 15/мин). Подождите немного." };
  }

  timestamps.push(now);
  aiRequestLog.set(userId, timestamps);
  return { allowed: true };
}

// 🛡️ Таймаут вызова Gemini (25 секунд)
const GEMINI_TIMEOUT_MS = 25000;

async function generateWithTimeout(params: any): Promise<any> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Превышено время ожидания ответа Gemini (25 сек). Попробуйте позже.")), GEMINI_TIMEOUT_MS);
  });
  try {
    return await Promise.race([ai.models.generateContent(params), timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

app.post("/api/gemini/chat", authenticate, async (req, res) => {
  const { prompt, systemInstruction, history = [], images = [] } = req.body;
  try {
    if (!isGeminiEnabled()) return res.status(503).json({ message: "ИИ-функции временно отключены администратором." });
    const user = (req as any).user;
    const rateCheck = checkAiRateLimit(user.uid);
    if (!rateCheck.allowed) return res.status(429).json({ message: rateCheck.message });

    const parts: any[] = [];
    for (const img of images) { const p = dataUrlToInlinePart(img); if (p) parts.push(p); }
    if (prompt) parts.push({ text: String(prompt).slice(0, 10000) });
    const contents = [
      ...history.map((m: any) => ({ role: m.role, parts: [{ text: String(m.content || "").slice(0, 10000) }] })),
      { role: "user", parts },
    ];
    const response = await generateWithTimeout({ model: GEMINI_MODEL, contents, config: { systemInstruction, maxOutputTokens: 2048 } });
    res.json({ text: response.text ?? "" });
  } catch (e: any) { console.error("Gemini Chat Error:", e); res.status(500).json({ message: e.message || "Ошибка работы с Gemini" }); }
});

app.post("/api/gemini/analyze", authenticate, async (req, res) => {
  const { image, prompt } = req.body;
  try {
    if (!isGeminiEnabled()) return res.status(503).json({ message: "ИИ-функции временно отключены администратором." });
    const user = (req as any).user;
    const rateCheck = checkAiRateLimit(user.uid);
    if (!rateCheck.allowed) return res.status(429).json({ message: rateCheck.message });

    const inline = dataUrlToInlinePart(image);
    if (!inline) throw new Error("Invalid image data URL");
    const safePrompt = prompt ? String(prompt).slice(0, 2000) : "Analyze this image.";
    const response = await generateWithTimeout({ model: GEMINI_MODEL, contents: [{ parts: [inline, { text: safePrompt }] }], config: { maxOutputTokens: 2048 } });
    res.json({ text: response.text ?? "" });
  } catch (e: any) { console.error("Gemini Analyze Error:", e); res.status(500).json({ message: e.message || "Ошибка работы с Gemini" }); }
});

// ─── API: Git Projects (AI Tools Hub) ────────────────────────────────────────

function gitProjectToDb(data: any, userId: string) {
  return {
    user_id: userId,
    title: data.title || '',
    category: data.category || 'tools',
    summary: data.summary || '',
    features: data.features || null,
    detailed_description: data.detailedDescription || null,
    install_command: data.installCommand || null,
    author_notes: data.authorNotes || null,
    github_url: data.githubUrl || null,
    demo_url: data.demoUrl || null,
    image: data.image || null,
    tags: data.tags || [],
    pricing: data.pricing || 'free',
    is_public: data.isPublic ?? true,
    author_name: data.authorName || '',
    author_email: data.authorEmail || '',
  };
}

function gitProjectFromDb(row: any, isFavorite = false) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category || 'tools',
    summary: row.summary || '',
    features: row.features || '',
    detailedDescription: row.detailed_description || '',
    installCommand: row.install_command || '',
    authorNotes: row.author_notes || '',
    githubUrl: row.github_url || '',
    demoUrl: row.demo_url || '',
    image: row.image || null,
    tags: row.tags || [],
    pricing: row.pricing || 'free',
    isPublic: row.is_public,
    authorName: row.author_name || '',
    authorEmail: row.author_email || '',
    createdAt: row.created_at,
    isFavorite,
  };
}

app.get("/api/git-projects", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { data, error } = await supabase.from("git_projects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const { data: favData } = await supabase.from("user_favorites").select("item_id").eq("user_id", user.uid).eq("item_type", "git_project");
    const favIds = new Set((favData || []).map((f: any) => f.item_id));
    res.json((data || []).map((row: any) => gitProjectFromDb(row, favIds.has(row.id))));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/git-projects", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!req.body.title || !req.body.summary) return res.status(400).json({ error: "title и summary обязательны" });
    let imageUrl = req.body.image || null;
    if (imageUrl?.startsWith("data:image/")) imageUrl = await uploadImage(imageUrl, "git_project");
    const dbRow = gitProjectToDb({ ...req.body, image: imageUrl, authorName: user.displayName, authorEmail: user.email }, user.uid);
    const { data, error } = await supabase.from("git_projects").insert(dbRow).select().single();
    if (error) throw error;
    res.status(201).json(gitProjectFromDb(data));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/git-projects/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing } = await supabase.from("git_projects").select("user_id").eq("id", id).single();
    if (!existing) return res.status(404).json({ error: "Проект не найден" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ error: "Нет прав" });
    let imageUrl = req.body.image || null;
    if (imageUrl?.startsWith("data:image/")) imageUrl = await uploadImage(imageUrl, `git_project_${id}`);
    const updates: any = {
      title: req.body.title, category: req.body.category, summary: req.body.summary,
      features: req.body.features ?? null, detailed_description: req.body.detailedDescription ?? null,
      install_command: req.body.installCommand ?? null, author_notes: req.body.authorNotes ?? null,
      github_url: req.body.githubUrl ?? null, demo_url: req.body.demoUrl ?? null,
      tags: req.body.tags || [], pricing: req.body.pricing || 'free', is_public: req.body.isPublic ?? true,
    };
    if (imageUrl !== undefined) updates.image = imageUrl;
    const { data, error } = await supabase.from("git_projects").update(updates).eq("id", id).select().single();
    if (error) throw error;
    res.json(gitProjectFromDb(data));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/git-projects/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing } = await supabase.from("git_projects").select("user_id").eq("id", id).single();
    if (!existing) return res.status(404).json({ error: "Проект не найден" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ error: "Нет прав" });
    const { error } = await supabase.from("git_projects").delete().eq("id", id);
    if (error) throw error;
    await supabase.from("user_favorites").delete().eq("item_id", id).eq("item_type", "git_project");
    res.json({ message: "Проект удалён" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── API: Commands & Workflows ────────────────────────────────────────────

function extractVariables(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))).filter(Boolean);
}

function commandToDb(data: any, userId: string) {
  const autoVars = extractVariables(data.commandText || '');
  const combinedVars = Array.from(new Set([...(data.variables || []), ...autoVars]));
  return {
    user_id: userId,
    title: data.title,
    command_text: data.commandText,
    description: data.description || null,
    category: data.category || 'other',
    skill_id: data.skillId || null,
    target_ai: data.targetAi || 'universal',
    tags: data.tags || [],
    variables: combinedVars,
    is_public: data.isPublic ?? true,
    author_name: data.authorName || '',
    author_email: data.authorEmail || '',
    usage_count: data.usageCount ?? 0,
  };
}

function commandFromDb(row: any, isFavorite = false) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    commandText: row.command_text,
    description: row.description || '',
    category: row.category || 'other',
    skillId: row.skill_id || null,
    skillTitle: row.skills ? row.skills.title : undefined,
    targetAi: row.target_ai || 'universal',
    tags: row.tags || [],
    variables: row.variables || [],
    isFavorite,
    isPublic: row.is_public,
    authorName: row.author_name || '',
    authorEmail: row.author_email || '',
    usageCount: row.usage_count || 0,
    createdAt: row.created_at,
  };
}

app.get("/api/commands", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    let { data, error } = await supabase.from("commands").select("*, skills(id, title)").order("created_at", { ascending: false });
    if (error) {
      const fallback = await supabase.from("commands").select("*").order("created_at", { ascending: false });
      if (fallback.error) throw fallback.error;
      data = fallback.data;
    }
    const { data: favData } = await supabase.from("user_favorites").select("item_id").eq("user_id", user.uid).eq("item_type", "command");
    const favIds = new Set((favData || []).map((f: any) => f.item_id));
    res.json((data || []).map((row: any) => commandFromDb(row, favIds.has(row.id))));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/commands", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!req.body.title || !req.body.commandText) return res.status(400).json({ error: "title и commandText обязательны" });
    const dbRow = commandToDb({ ...req.body, authorName: user.displayName, authorEmail: user.email }, user.uid);
    const { data, error } = await supabase.from("commands").insert(dbRow).select().single();
    if (error) throw error;
    res.status(201).json(commandFromDb(data));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/commands/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing } = await supabase.from("commands").select("user_id").eq("id", id).single();
    if (!existing) return res.status(404).json({ error: "Команда не найдена" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ error: "Нет прав" });
    const autoVars = extractVariables(req.body.commandText || '');
    const combinedVars = Array.from(new Set([...(req.body.variables || []), ...autoVars]));
    const updates: any = {
      title: req.body.title, command_text: req.body.commandText, description: req.body.description ?? null,
      category: req.body.category || 'other', skill_id: req.body.skillId || null, target_ai: req.body.targetAi || 'universal',
      tags: req.body.tags || [], variables: combinedVars, is_public: req.body.isPublic ?? true,
    };
    const { data, error } = await supabase.from("commands").update(updates).eq("id", id).select().single();
    if (error) throw error;
    res.json(commandFromDb(data));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/commands/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing } = await supabase.from("commands").select("user_id").eq("id", id).single();
    if (!existing) return res.status(404).json({ error: "Команда не найдена" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ error: "Нет прав" });
    const { error } = await supabase.from("commands").delete().eq("id", id);
    if (error) throw error;
    await supabase.from("user_favorites").delete().eq("item_id", id).eq("item_type", "command");
    res.json({ message: "Команда удалена" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/commands/:id/use", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("commands").select("usage_count").eq("id", id).single();
    if (error || !data) return res.status(404).json({ error: "Команда не найдена" });
    const newCount = (data.usage_count || 0) + 1;
    await supabase.from("commands").update({ usage_count: newCount }).eq("id", id);
    res.json({ usageCount: newCount });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── API: Bookmarks & Web Sites ─────────────────────────────────────────────

function bookmarkToDb(data: any, userId: string) {
  return {
    user_id: userId,
    title: data.title,
    url: data.url,
    description: data.description || null,
    folder: data.folder || 'Общее',
    category: data.category || 'default',
    image: data.image || null,
    favicon: data.favicon || null,
    tags: data.tags || [],
    is_public: data.isPublic ?? true,
    author_name: data.authorName || '',
    author_email: data.authorEmail || '',
    click_count: data.clickCount ?? 0,
  };
}

function bookmarkFromDb(row: any, isFavorite = false) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    url: row.url,
    description: row.description || '',
    folder: row.folder || 'Общее',
    category: row.category || 'default',
    image: row.image || null,
    favicon: row.favicon || null,
    tags: row.tags || [],
    isFavorite,
    isPublic: row.is_public,
    authorName: row.author_name || '',
    authorEmail: row.author_email || '',
    clickCount: row.click_count || 0,
    createdAt: row.created_at,
  };
}

app.get("/api/bookmarks", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { data, error } = await supabase.from("bookmarks").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const favs = await getUserFavoriteIds(user.uid);
    const favSet = new Set(favs.bookmarks || []);
    res.json((data || []).map((row: any) => bookmarkFromDb(row, favSet.has(row.id))));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/bookmarks", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const body = req.body;
    if (!body.title || !body.url) return res.status(400).json({ error: "Поля title и url обязательны" });

    let imageUrl = body.image || null;
    if (imageUrl && imageUrl.startsWith("data:image/")) {
      imageUrl = await uploadImage(imageUrl, "bookmark");
    }

    const dbRow = bookmarkToDb(
      { ...body, image: imageUrl, authorName: user.displayName, authorEmail: user.email },
      user.uid
    );

    const { data, error } = await supabase.from("bookmarks").insert(dbRow).select().single();
    if (error) throw error;
    res.status(201).json(bookmarkFromDb(data));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/bookmarks/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing } = await supabase.from("bookmarks").select("user_id").eq("id", id).single();
    if (!existing) return res.status(404).json({ error: "Закладка не найдена" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ error: "Нет прав на редактирование" });

    let imageUrl = req.body.image || null;
    if (imageUrl && imageUrl.startsWith("data:image/")) {
      imageUrl = await uploadImage(imageUrl, `bookmark_${id}`);
    }

    const updates: any = {
      title: req.body.title,
      url: req.body.url,
      description: req.body.description ?? null,
      folder: req.body.folder || 'Общее',
      category: req.body.category || 'default',
      favicon: req.body.favicon ?? null,
      tags: req.body.tags || [],
      is_public: req.body.isPublic ?? true,
    };
    if (imageUrl !== undefined) updates.image = imageUrl;

    const { data, error } = await supabase.from("bookmarks").update(updates).eq("id", id).select().single();
    if (error) throw error;
    res.json(bookmarkFromDb(data));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/bookmarks/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { data: existing } = await supabase.from("bookmarks").select("user_id").eq("id", id).single();
    if (!existing) return res.status(404).json({ error: "Закладка не найдена" });
    if (existing.user_id !== user.uid && user.role !== "admin") return res.status(403).json({ error: "Нет прав на удаление" });

    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) throw error;

    await supabase.from("user_favorites").delete().eq("item_id", id).eq("item_type", "bookmark");
    res.json({ message: "Закладка удалена" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/bookmarks/:id/click", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("bookmarks").select("click_count").eq("id", id).single();
    if (error || !data) return res.status(404).json({ error: "Закладка не найдена" });

    const newCount = (data.click_count || 0) + 1;
    await supabase.from("bookmarks").update({ click_count: newCount }).eq("id", id);
    res.json({ clickCount: newCount });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// 🪄 Gemini Smart Parser
app.post("/api/gemini/parse-tool", authenticate, async (req, res) => {
  try {
    if (!isGeminiEnabled()) return res.status(503).json({ message: "ИИ-парсер временно отключен администратором." });
    const user = (req as any).user;
    const rateCheck = checkAiRateLimit(user.uid);
    if (!rateCheck.allowed) return res.status(429).json({ message: rateCheck.message });

    const { url, text, imageBase64 } = req.body;
    if (!url && !text && !imageBase64) return res.status(400).json({ error: "Нужен url, text или imageBase64" });

    const safeUrl = url ? String(url).trim().slice(0, 500) : "";
    const safeText = text ? String(text).trim().slice(0, 12000) : "";

    const PARSE_SYSTEM_PROMPT = `Ты — экспертный технический аналитик программных инструментов и ИИ-проектов.
Тебе предоставлен скриншот поста из Telegram/Twitter, ссылка на GitHub-репозиторий или текстовое описание инструмента.
Твоя задача — извлечь ключевую информацию и вернуть строгий JSON по схеме без каких-либо пояснений.

Правила:
- title: точное официальное название проекта (без эмодзи)
- category: ТОЛЬКО одно из: agents | tools | models | media | scrapers | other
- summary: краткая ёмкая суть на русском языке, 1-2 предложения
- features: список из 3-7 ключевых возможностей через буллет "• ", каждая с новой строки, на русском
- detailedDescription: подробное описание архитектуры и сценариев применения на русском (2-4 предложения)
- installCommand: точные консольные команды установки и запуска
- githubUrl: полная ссылка https://github.com/... (если есть)
- demoUrl: ссылка на демо/сайт (если есть)
- tags: массив из 4-7 технических тегов на английском в нижнем регистре
- pricing: ТОЛЬКО одно из: free | freemium | paid`;

    const parts: any[] = [];
    if (imageBase64) { const p = dataUrlToInlinePart(imageBase64); if (p) parts.push(p); }
    let userText = "Проанализируй следующий материал и верни JSON с информацией о проекте:\n\n";
    if (safeUrl) userText += `GitHub URL: ${safeUrl}\n`;
    if (safeText) userText += `Текст описания:\n${safeText}\n`;
    if (imageBase64 && !safeUrl && !safeText) userText += "Анализируй предоставленный скриншот.";
    parts.push({ text: userText });

    const response = await generateWithTimeout({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: PARSE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        responseSchema: {
          type: "object" as any,
          properties: {
            title: { type: "string" }, category: { type: "string", enum: ["agents", "tools", "models", "media", "scrapers", "other"] },
            summary: { type: "string" }, features: { type: "string" }, detailedDescription: { type: "string" },
            installCommand: { type: "string" }, githubUrl: { type: "string" }, demoUrl: { type: "string" },
            tags: { type: "array", items: { type: "string" } }, pricing: { type: "string", enum: ["free", "freemium", "paid"] },
          },
          required: ["title", "category", "summary", "tags", "pricing"],
        },
      },
    });

    const rawText = response.text ?? "{}";
    try {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      res.json(JSON.parse(cleaned));
    } catch {
      res.status(500).json({ error: "Gemini вернул невалидный JSON", raw: rawText });
    }
  } catch (e: any) { console.error("parse-tool Error:", e); res.status(500).json({ message: e.message || "Ошибка парсера" }); }
});

// ─── Export для Vercel ────────────────────────────────────────────────────────
export default app;

