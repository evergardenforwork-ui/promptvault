import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { createDbAdapter, DbAdapter } from "./server/dbAdapter.ts";
import { saveMediaImage, isLocalEngine } from "./server/mediaStorage.ts";
import { createFullBackupZip, processImportZip } from "./server/backupService.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase client (optional if running in local mode)
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

// Universal Storage & DB Engine (Local SQLite or Cloud Supabase)
const db: DbAdapter = createDbAdapter(supabase);

// Google Gemini Setup
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const GEMINI_MODEL = "gemini-3.1-flash-lite";

// ─── camelCase ↔ snake_case helpers ───────────────────────────────────────────

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
    workspace_id: data.workspaceId || null,
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
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : []),
    mainPrompt: row.main_prompt || "",
    usageNotes: row.usage_notes || "",
    mediaType: row.media_type || "photo",
    promptOrigin: row.prompt_origin || "own",
    isPublic: Boolean(row.is_public),
    imageLayoutType: row.image_layout_type || "single",
    imageBefore: row.image_before || null,
    imageAfter: row.image_after || null,
    originalImageBefore: row.original_image_before || null,
    originalImageAfter: row.original_image_after || null,
    originalImageSlot2: row.original_image_slot2 || null,
    additionalImages: Array.isArray(row.additional_images) ? row.additional_images : (typeof row.additional_images === 'string' ? JSON.parse(row.additional_images || '[]') : []),
    filePackageUrl: row.file_package_url || null,
    fileStructure: Array.isArray(row.file_structure) ? row.file_structure : (typeof row.file_structure === 'string' ? JSON.parse(row.file_structure || '[]') : []),
    subSections: Array.isArray(row.sub_sections) ? row.sub_sections : (typeof row.sub_sections === 'string' ? JSON.parse(row.sub_sections || '[]') : []),
    workspaceId: row.workspace_id || null,
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
    workspace_id: data.workspaceId || null,
    author_name: data.authorName || "",
    author_email: data.authorEmail || "",
  };
}

function skillFromDb(row: any, isFavorite = false) {
  return {
    id: row.id,
    userId: row.user_id || "",
    title: row.title,
    description: row.description || "",
    category: row.category || "",
    skillTypes: Array.isArray(row.skill_types) ? row.skill_types : (typeof row.skill_types === 'string' ? JSON.parse(row.skill_types || '[]') : []),
    targetAis: Array.isArray(row.target_ais) ? row.target_ais : (typeof row.target_ais === 'string' ? JSON.parse(row.target_ais || '[]') : ["universal"]),
    skillOrigin: row.skill_origin || "own",
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : []),
    isPublic: Boolean(row.is_public),
    filePackageUrl: row.file_package_url || null,
    fileStructure: Array.isArray(row.file_structure) ? row.file_structure : (typeof row.file_structure === 'string' ? JSON.parse(row.file_structure || '[]') : []),
    workspaceId: row.workspace_id || null,
    authorName: row.author_name || "",
    authorEmail: row.author_email || "",
    createdAt: row.created_at,
    isFavorite,
  };
}

function gitProjectToDb(data: any, userId: string) {
  return {
    user_id: userId,
    title: data.title || "",
    category: data.category || "tools",
    summary: data.summary || "",
    features: data.features || null,
    detailed_description: data.detailedDescription || null,
    install_command: data.installCommand || null,
    author_notes: data.authorNotes || null,
    github_url: data.githubUrl || null,
    demo_url: data.demoUrl || null,
    image: data.image || null,
    tags: data.tags || [],
    pricing: data.pricing || "free",
    is_public: data.isPublic ?? true,
    workspace_id: data.workspaceId || null,
    author_name: data.authorName || "",
    author_email: data.authorEmail || "",
  };
}

function gitProjectFromDb(row: any, isFavorite = false) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category || "tools",
    summary: row.summary || "",
    features: row.features || "",
    detailedDescription: row.detailed_description || "",
    installCommand: row.install_command || "",
    authorNotes: row.author_notes || "",
    githubUrl: row.github_url || "",
    demoUrl: row.demo_url || "",
    image: row.image || null,
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : []),
    pricing: row.pricing || "free",
    isPublic: Boolean(row.is_public),
    workspaceId: row.workspace_id || null,
    authorName: row.author_name || "",
    authorEmail: row.author_email || "",
    createdAt: row.created_at,
    isFavorite,
  };
}

function commandToDb(data: any, userId: string) {
  return {
    user_id: userId,
    title: data.title || "",
    command_text: data.commandText || "",
    description: data.description || null,
    category: data.category || "general",
    skill_id: data.skillId || null,
    skill_title: data.skillTitle || null,
    target_ai: data.targetAi || null,
    tags: data.tags || [],
    variables: data.variables || [],
    is_public: data.isPublic ?? true,
    workspace_id: data.workspaceId || null,
    author_name: data.authorName || "",
    author_email: data.authorEmail || "",
  };
}

function commandFromDb(row: any, isFavorite = false) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    commandText: row.command_text || "",
    description: row.description || "",
    category: row.category || "general",
    skillId: row.skill_id || null,
    skillTitle: row.skill_title || "",
    targetAi: row.target_ai || null,
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : []),
    variables: Array.isArray(row.variables) ? row.variables : (typeof row.variables === 'string' ? JSON.parse(row.variables || '[]') : []),
    isPublic: Boolean(row.is_public),
    workspaceId: row.workspace_id || null,
    authorName: row.author_name || "",
    authorEmail: row.author_email || "",
    usageCount: row.usage_count || 0,
    createdAt: row.created_at,
    isFavorite,
  };
}

function bookmarkToDb(data: any, userId: string) {
  return {
    user_id: userId,
    title: data.title || "",
    url: data.url || "",
    favicon_url: data.faviconUrl || null,
    image: data.image || null,
    description: data.description || null,
    category: data.category || "general",
    folder_id: data.folderId || "tools",
    subcategory: data.subcategory || "",
    tags: data.tags || [],
    is_public: data.isPublic ?? true,
    workspace_id: data.workspaceId || null,
    author_name: data.authorName || "",
    author_email: data.authorEmail || "",
  };
}

function bookmarkFromDb(row: any, isFavorite = false) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    url: row.url || "",
    faviconUrl: row.favicon_url || null,
    image: row.image || null,
    description: row.description || "",
    category: row.category || "general",
    folderId: row.folder_id || "tools",
    subcategory: row.subcategory || "",
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : []),
    isPublic: Boolean(row.is_public),
    workspaceId: row.workspace_id || null,
    authorName: row.author_name || "",
    authorEmail: row.author_email || "",
    clickCount: row.click_count || 0,
    createdAt: row.created_at,
    isFavorite,
  };
}

async function processPromptImages(promptData: any, id: string): Promise<any> {
  const data = { ...promptData };

  if (data.imageBefore?.startsWith("data:"))
    data.imageBefore = await saveMediaImage(data.imageBefore, `${id}_root_before`, supabase);
  if (data.imageAfter?.startsWith("data:"))
    data.imageAfter = await saveMediaImage(data.imageAfter, `${id}_root_after`, supabase);
  if (data.originalImageBefore?.startsWith("data:"))
    data.originalImageBefore = await saveMediaImage(data.originalImageBefore, `${id}_root_orig_before`, supabase);
  if (data.originalImageAfter?.startsWith("data:"))
    data.originalImageAfter = await saveMediaImage(data.originalImageAfter, `${id}_root_orig_after`, supabase);
  if (data.originalImageSlot2?.startsWith("data:"))
    data.originalImageSlot2 = await saveMediaImage(data.originalImageSlot2, `${id}_root_slot2`, supabase);

  if (Array.isArray(data.additionalImages)) {
    data.additionalImages = await Promise.all(
      data.additionalImages.map((img: string, idx: number) =>
        img?.startsWith("data:") ? saveMediaImage(img, `${id}_root_add_${idx}`, supabase) : img
      )
    );
  }

  if (Array.isArray(data.subSections)) {
    data.subSections = await Promise.all(
      data.subSections.map(async (sub: any, sIdx: number) => {
        const s = { ...sub };
        if (s.imageBefore?.startsWith("data:"))
          s.imageBefore = await saveMediaImage(s.imageBefore, `${id}_sub_${sIdx}_before`, supabase);
        if (s.imageAfter?.startsWith("data:"))
          s.imageAfter = await saveMediaImage(s.imageAfter, `${id}_sub_${sIdx}_after`, supabase);
        if (s.originalImageBefore?.startsWith("data:"))
          s.originalImageBefore = await saveMediaImage(s.originalImageBefore, `${id}_sub_${sIdx}_orig_before`, supabase);
        if (s.originalImageAfter?.startsWith("data:"))
          s.originalImageAfter = await saveMediaImage(s.originalImageAfter, `${id}_sub_${sIdx}_orig_after`, supabase);
        if (s.originalImageSlot2?.startsWith("data:"))
          s.originalImageSlot2 = await saveMediaImage(s.originalImageSlot2, `${id}_sub_${sIdx}_orig_slot2`, supabase);

        if (Array.isArray(s.additionalImages)) {
          s.additionalImages = await Promise.all(
            s.additionalImages.map((img: string, aIdx: number) =>
              img?.startsWith("data:") ? saveMediaImage(img, `${id}_sub_${sIdx}_add_${aIdx}`, supabase) : img
            )
          );
        }
        return s;
      })
    );
  }

  return data;
}

// ─── Gemini Helpers ─────────────────────────────────────────────────────────

function isGeminiEnabled(): boolean {
  if (process.env.DISABLE_AI === "true" || process.env.GEMINI_DISABLED === "true") return false;
  return Boolean(process.env.GEMINI_API_KEY);
}

const aiRequestLog = new Map<string, number[]>();

function checkAiRateLimit(userId: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const timestamps = (aiRequestLog.get(userId) || []).filter((t) => now - t < 60_000);

  const lastReq = timestamps[timestamps.length - 1];
  if (lastReq && now - lastReq < 3000) {
    const waitSec = Math.ceil((3000 - (now - lastReq)) / 1000);
    return { allowed: false, message: `Слишком частые запросы. Подождите ещё ${waitSec} сек.` };
  }

  if (timestamps.length >= 15) {
    return { allowed: false, message: "Превышен лимит запросов к ИИ (макс 15/мин). Подождите минуту." };
  }

  timestamps.push(now);
  aiRequestLog.set(userId, timestamps);
  return { allowed: true };
}

const GEMINI_TIMEOUT_MS = 25000;

async function generateWithTimeout(params: any): Promise<any> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Превышен таймаут ответа Gemini (25 с).")), GEMINI_TIMEOUT_MS);
  });
  try {
    return await Promise.race([ai.models.generateContent(params), timeoutPromise]);
  } catch (err: any) {
    if (params.model !== "gemini-2.0-flash" && (err?.message?.includes("not found") || err?.message?.includes("404") || err?.status === 404)) {
      console.warn(`⚠️ [Gemini] Model ${params.model} not available, falling back to gemini-2.0-flash`);
      const fallbackParams = { ...params, model: "gemini-2.0-flash" };
      return await Promise.race([ai.models.generateContent(fallbackParams), timeoutPromise]);
    }
    throw err;
  } finally {
    clearTimeout(timer!);
  }
}

function dataUrlToInlinePart(dataUrl: string): { inlineData: { mimeType: string; data: string } } | null {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) return null;
  return {
    inlineData: {
      mimeType: matches[1],
      data: matches[2],
    },
  };
}

// ─── AUTH MIDDLEWARE ────────────────────────────────────────────────────────

async function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return res.status(401).json({ message: "Недействительный токен" });
  }

  try {
    const user = await db.findUserByUid(token);
    if (!user) {
      return res.status(401).json({ message: "Пользователь не найден" });
    }
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: "Ошибка проверки авторизации" });
  }
}

// ─── SERVER INITIALIZATION ──────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON Body Parser (50MB for base64 images & ZIP archives)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Static Local Uploads (images and packages)
  const uploadsPath = path.join(process.cwd(), "data", "uploads");
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsPath));

  // ─── API: Health Check ──────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      mode: db.isLocal ? "local-sqlite" : "cloud-supabase",
      timestamp: new Date().toISOString(),
      env: {
        hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
        nodeEnv: process.env.NODE_ENV || "development",
      },
    });
  });

  // ─── API: Auth ──────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email и пароль обязательны" });
      }

      const user = await db.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }

      const safeUser = {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      res.json({ token: user.uid, user: safeUser });
    } catch (err) {
      console.error("Login route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Favorites ─────────────────────────────────────────────────────
  app.get("/api/favorites", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const favs = await db.getFavorites(user.uid);
      res.json(favs);
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/favorites/toggle", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const { itemId, itemType } = req.body;
      if (!itemId || !itemType) {
        return res.status(400).json({ message: "itemId и itemType обязательны" });
      }

      const { added } = await db.toggleFavorite(user.uid, itemId, itemType);
      const favs = await db.getFavorites(user.uid);
      res.json({ added, favorites: favs });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: User Management (Admin only) ───────────────────────────────────
  app.get("/api/users", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Доступ запрещен: требуется роль администратора" });
      }
      const users = await db.getUsers();
      res.json(users);
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/users", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Доступ запрещен: требуется роль администратора" });
      }

      const { email, password, name, role } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ message: "Email, пароль и имя обязательны" });
      }

      const existing = await db.findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Пользователь с таким email уже существует" });
      }

      const created = await db.createUser({ email, password, name, role });
      res.status(201).json(created);
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.delete("/api/users/:uid", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Доступ запрещен: требуется роль администратора" });
      }
      if (req.params.uid === user.uid) {
        return res.status(400).json({ message: "Нельзя удалить собственный аккаунт" });
      }

      await db.deleteUser(req.params.uid);
      res.json({ message: "Пользователь удален" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.put("/api/users/:uid/password", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Доступ запрещен: требуется роль администратора" });
      }
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Пароль должен содержать минимум 6 символов" });
      }

      const hash = bcrypt.hashSync(password, 10);
      await db.updateUserPassword(req.params.uid, hash);
      res.json({ message: "Пароль изменён" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Prompts ───────────────────────────────────────────────────────
  app.get("/api/prompts", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const workspaceId = (req.query.workspaceId as string) || null;

      const { items, total, hasMore } = await db.getPrompts({ limit, offset, workspaceId });
      const favs = await db.getFavorites(user.uid);
      const favIds = new Set(favs.prompts);

      const mapped = items.map((r: any) => promptFromDb(r, favIds.has(r.id)));

      if (limit !== undefined) {
        return res.json({ items: mapped, total, hasMore });
      }
      res.json(mapped);
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/prompts", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const tempId = `prompt_${Date.now()}`;
      const processed = await processPromptImages(req.body, tempId);

      const dbPayload = promptToDb(processed, user.uid);
      dbPayload.author_name = user.name || user.email;
      dbPayload.author_email = user.email || "";

      const created = await db.createPrompt(dbPayload);
      res.status(201).json(promptFromDb(created));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.put("/api/prompts/:id", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const processed = await processPromptImages(req.body, id);
      const dbPayload = promptToDb(processed, user.uid);

      const updated = await db.updatePrompt(id, dbPayload);
      res.json(promptFromDb(updated));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.delete("/api/prompts/:id", authenticate, async (req, res) => {
    try {
      await db.deletePrompt(req.params.id);
      res.json({ message: "Промпт удален" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Skills ────────────────────────────────────────────────────────
  app.get("/api/skills", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const rows = await db.getSkills();
      const favs = await db.getFavorites(user.uid);
      const favIds = new Set(favs.skills);

      res.json(rows.map((r: any) => skillFromDb(r, favIds.has(r.id))));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/skills", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const dbPayload = skillToDb(req.body, user.uid);
      dbPayload.author_name = user.name || user.email;
      dbPayload.author_email = user.email || "";

      const created = await db.createSkill(dbPayload);
      res.status(201).json(skillFromDb(created));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.put("/api/skills/:id", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const dbPayload = skillToDb(req.body, user.uid);

      const updated = await db.updateSkill(id, dbPayload);
      res.json(skillFromDb(updated));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.delete("/api/skills/:id", authenticate, async (req, res) => {
    try {
      await db.deleteSkill(req.params.id);
      res.json({ message: "Скилл удален" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Skill Hints ───────────────────────────────────────────────────
  app.get("/api/skills/:id/hints", authenticate, async (req, res) => {
    try {
      const hints = await db.getSkillHints(req.params.id);
      res.json(hints.map((h: any) => ({
        id: h.id,
        skillId: h.skill_id,
        userId: h.user_id,
        title: h.title,
        text: h.text,
        createdAt: h.created_at,
      })));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/skills/:id/hints", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const { title, text } = req.body;
      if (!title || !text) {
        return res.status(400).json({ message: "Заголовок и текст обязательны" });
      }

      const created = await db.createSkillHint(req.params.id, { user_id: user.uid, title, text });
      res.status(201).json({
        id: created.id,
        skillId: created.skill_id,
        userId: created.user_id,
        title: created.title,
        text: created.text,
        createdAt: created.created_at,
      });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.delete("/api/skills/:id/hints/:hintId", authenticate, async (req, res) => {
    try {
      await db.deleteSkillHint(req.params.hintId);
      res.json({ message: "Подсказка удалена" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Categories ────────────────────────────────────────────────────
  app.get("/api/categories", authenticate, async (_req, res) => {
    try {
      const rows = await db.getCategories();
      res.json(rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        emoji: r.emoji || "",
        color: r.color || "",
      })));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/categories", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const { name, emoji, color } = req.body;
      if (!name) return res.status(400).json({ message: "Название обязательно" });

      const created = await db.createCategory({ user_id: user.uid, name, emoji, color });
      res.status(201).json({
        id: created.id,
        userId: created.user_id,
        name: created.name,
        emoji: created.emoji || "",
        color: created.color || "",
      });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.delete("/api/categories/:id", authenticate, async (req, res) => {
    try {
      await db.deleteCategory(req.params.id);
      res.json({ message: "Категория удалена" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Chats ─────────────────────────────────────────────────────────
  app.get("/api/chats", authenticate, async (req, res) => {
    try {
      const { promptId } = req.query;
      if (!promptId) return res.status(400).json({ message: "promptId обязателен" });

      const chats = await db.getChats(promptId as string);
      res.json(chats.map((c: any) => ({
        id: c.id,
        promptId: c.prompt_id,
        userId: c.user_id,
        role: c.role,
        content: c.content,
        image: c.image || null,
        createdAt: c.created_at,
      })));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/chats", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const { promptId, content, role, image } = req.body;
      if (!promptId || !content) return res.status(400).json({ message: "promptId и content обязательны" });

      const msg = await db.createChatMessage({
        prompt_id: promptId,
        user_id: user.uid,
        role: role || "user",
        content,
        image,
      });

      res.status(201).json({
        id: msg.id,
        promptId: msg.prompt_id,
        userId: msg.user_id,
        role: msg.role,
        content: msg.content,
        image: msg.image || null,
        createdAt: msg.created_at,
      });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/chats/clear", authenticate, async (req, res) => {
    try {
      const { promptId } = req.query;
      if (!promptId) return res.status(400).json({ message: "promptId обязателен" });

      await db.clearChats(promptId as string);
      res.json({ message: "Чат очищен" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Git Projects (AI Tools Hub) ────────────────────────────────────
  app.get("/api/git-projects", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const rows = await db.getGitProjects();
      const favs = await db.getFavorites(user.uid);
      const favIds = new Set(favs.gitProjects);

      res.json(rows.map((r: any) => gitProjectFromDb(r, favIds.has(r.id))));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/git-projects", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = { ...req.body };

      if (data.image?.startsWith("data:")) {
        data.image = await saveMediaImage(data.image, `git_${Date.now()}`, supabase);
      }

      const dbPayload = gitProjectToDb(data, user.uid);
      dbPayload.author_name = user.name || user.email;
      dbPayload.author_email = user.email || "";

      const created = await db.createGitProject(dbPayload);
      res.status(201).json(gitProjectFromDb(created));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.put("/api/git-projects/:id", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const data = { ...req.body };

      if (data.image?.startsWith("data:")) {
        data.image = await saveMediaImage(data.image, `git_${id}_${Date.now()}`, supabase);
      }

      const dbPayload = gitProjectToDb(data, user.uid);
      const updated = await db.updateGitProject(id, dbPayload);
      res.json(gitProjectFromDb(updated));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.delete("/api/git-projects/:id", authenticate, async (req, res) => {
    try {
      await db.deleteGitProject(req.params.id);
      res.json({ message: "Проект удален" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Commands & Workflows ──────────────────────────────────────────
  app.get("/api/commands", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const rows = await db.getCommands();
      const favs = await db.getFavorites(user.uid);
      const favIds = new Set(favs.commands);

      res.json(rows.map((r: any) => commandFromDb(r, favIds.has(r.id))));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/commands", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const dbPayload = commandToDb(req.body, user.uid);
      dbPayload.author_name = user.name || user.email;
      dbPayload.author_email = user.email || "";

      const created = await db.createCommand(dbPayload);
      res.status(201).json(commandFromDb(created));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.put("/api/commands/:id", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const dbPayload = commandToDb(req.body, user.uid);

      const updated = await db.updateCommand(id, dbPayload);
      res.json(commandFromDb(updated));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.delete("/api/commands/:id", authenticate, async (req, res) => {
    try {
      await db.deleteCommand(req.params.id);
      res.json({ message: "Команда удалена" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/commands/:id/use", authenticate, async (req, res) => {
    try {
      const result = await db.useCommand(req.params.id);
      res.json({ usageCount: result.usage_count });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Bookmarks & Web Sites ─────────────────────────────────────────
  app.get("/api/bookmarks", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const rows = await db.getBookmarks();
      const favs = await db.getFavorites(user.uid);
      const favIds = new Set(favs.bookmarks);

      res.json(rows.map((r: any) => bookmarkFromDb(r, favIds.has(r.id))));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/bookmarks", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = { ...req.body };

      if (data.image?.startsWith("data:")) {
        data.image = await saveMediaImage(data.image, `bookmark_${Date.now()}`, supabase);
      }

      const dbPayload = bookmarkToDb(data, user.uid);
      dbPayload.author_name = user.name || user.email;
      dbPayload.author_email = user.email || "";

      const created = await db.createBookmark(dbPayload);
      res.status(201).json(bookmarkFromDb(created));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.put("/api/bookmarks/:id", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const data = { ...req.body };

      if (data.image?.startsWith("data:")) {
        data.image = await saveMediaImage(data.image, `bookmark_${id}_${Date.now()}`, supabase);
      }

      const dbPayload = bookmarkToDb(data, user.uid);
      const updated = await db.updateBookmark(id, dbPayload);
      res.json(bookmarkFromDb(updated));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.delete("/api/bookmarks/:id", authenticate, async (req, res) => {
    try {
      await db.deleteBookmark(req.params.id);
      res.json({ message: "Закладка удалена" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/bookmarks/:id/click", authenticate, async (req, res) => {
    try {
      const result = await db.clickBookmark(req.params.id);
      res.json({ clickCount: result.click_count });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Workspaces ────────────────────────────────────────────────────
  app.get("/api/workspaces", authenticate, async (_req, res) => {
    try {
      const rows = await db.getWorkspaces();
      res.json(rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        icon: r.icon || "📁",
        color: r.color || "sky-400",
        isDefault: Boolean(r.is_default),
        createdAt: r.created_at,
      })));
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.post("/api/workspaces", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const { name, icon, color } = req.body;
      if (!name) return res.status(400).json({ message: "Название обязательно" });

      const created = await db.createWorkspace({
        user_id: user.uid,
        name,
        icon: icon || "📁",
        color: color || "sky-400",
      });

      res.status(201).json({
        id: created.id,
        userId: created.user_id,
        name: created.name,
        icon: created.icon,
        color: created.color,
        isDefault: Boolean(created.is_default),
        createdAt: created.created_at,
      });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.put("/api/workspaces/:id", authenticate, async (req, res) => {
    try {
      const { name, icon, color } = req.body;
      const updated = await db.updateWorkspace(req.params.id, { name, icon, color });
      res.json({
        id: updated.id,
        userId: updated.user_id,
        name: updated.name,
        icon: updated.icon,
        color: updated.color,
        isDefault: Boolean(updated.is_default),
        createdAt: updated.created_at,
      });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  app.delete("/api/workspaces/:id", authenticate, async (req, res) => {
    try {
      await db.deleteWorkspace(req.params.id);
      res.json({ message: "Пространство удалено" });
    } catch (err) {
      console.error("Route error:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });

  // ─── API: Universal Full-Media Export & Import ───────────────────────────
  app.get("/api/export", authenticate, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Только администратор может экспортировать данные" });
    }

    try {
      const workspaceId = (req.query.workspaceId as string) || null;
      const { buffer, filename } = await createFullBackupZip(db, workspaceId);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (e: any) {
      console.error("Export Error:", e);
      res.status(500).json({ message: e.message || "Ошибка экспорта данных" });
    }
  });

  app.post("/api/import", authenticate, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Только администратор может импортировать данные" });
    }

    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ message: "Файл не передан" });
    }

    try {
      const matches =
        file.match(/^data:application\/[a-zA-Z+-]+;base64,(.+)$/) ||
        file.match(/^data:charset=binary;base64,(.+)$/);
      const base64Data = matches ? matches[1] : file;
      const buffer = Buffer.from(base64Data, "base64");

      const result = await processImportZip(db, buffer);
      res.json(result);
    } catch (e: any) {
      console.error("Import Error:", e);
      res.status(500).json({ message: e.message || "Ошибка импорта данных" });
    }
  });

  // ─── API: Gemini ────────────────────────────────────────────────────────
  app.post("/api/gemini/chat", authenticate, async (req, res) => {
    try {
      if (!isGeminiEnabled()) {
        return res.status(503).json({ message: "ИИ временно отключен" });
      }

      const user = (req as any).user;
      const rateCheck = checkAiRateLimit(user.uid);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
      }

      const { prompt, systemInstruction, history, images } = req.body;
      if (!prompt) return res.status(400).json({ message: "Промпт обязателен" });

      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const turn of history) {
          if (turn.parts && Array.isArray(turn.parts)) {
            contents.push({ role: turn.role === "model" ? "model" : "user", parts: turn.parts });
          }
        }
      }

      const userParts: any[] = [];
      if (Array.isArray(images)) {
        for (const img of images) {
          const inline = dataUrlToInlinePart(img);
          if (inline) userParts.push(inline);
        }
      }
      userParts.push({ text: String(prompt).slice(0, 8000) });
      contents.push({ role: "user", parts: userParts });

      const response = await generateWithTimeout({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: systemInstruction ? String(systemInstruction).slice(0, 4000) : undefined,
          maxOutputTokens: 2048,
        },
      });

      res.json({ text: response.text ?? "" });
    } catch (e: any) {
      console.error("Gemini Chat Error:", e);
      res.status(500).json({ message: e.message || "Ошибка работы с Gemini" });
    }
  });

  app.post("/api/gemini/analyze", authenticate, async (req, res) => {
    try {
      if (!isGeminiEnabled()) {
        return res.status(503).json({ message: "ИИ временно отключен" });
      }

      const user = (req as any).user;
      const rateCheck = checkAiRateLimit(user.uid);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
      }

      const { image, prompt } = req.body;
      if (!image) return res.status(400).json({ message: "Изображение обязательно" });

      const inline = dataUrlToInlinePart(image);
      if (!inline) throw new Error("Неверный формат изображения");

      const safePrompt = prompt ? String(prompt).slice(0, 2000) : "Детально проанализируй это изображение.";

      const response = await generateWithTimeout({
        model: GEMINI_MODEL,
        contents: [
          {
            parts: [inline, { text: safePrompt }],
          },
        ],
        config: { maxOutputTokens: 2048 },
      });

      res.json({ text: response.text ?? "" });
    } catch (e: any) {
      console.error("Gemini Analyze Error:", e);
      res.status(500).json({ message: e.message || "Ошибка работы с Gemini" });
    }
  });

  app.post("/api/gemini/parse-tool", authenticate, async (req, res) => {
    try {
      if (!isGeminiEnabled()) {
        const reason = !process.env.GEMINI_API_KEY
          ? "ИИ-парсер отключен: не задан GEMINI_API_KEY в файле .env (или в Environment Variables на Vercel)."
          : "ИИ-парсер временно отключен администратором (DISABLE_AI=true).";
        return res.status(503).json({ message: reason });
      }

      const user = (req as any).user;
      const rateCheck = checkAiRateLimit(user.uid);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
      }

      const { url, text, imageBase64, imagesBase64 } = req.body;
      // Нормализуем: собираем все изображения в один массив (новый формат + старый)
      const allImages: string[] = [];
      if (Array.isArray(imagesBase64)) allImages.push(...imagesBase64.slice(0, 4));
      else if (imageBase64) allImages.push(imageBase64);

      if (!url && !text && allImages.length === 0) {
        return res.status(400).json({ error: "Необходим хотя бы один из параметров: url, text или imagesBase64" });
      }

      const safeUrl = url ? String(url).trim().slice(0, 500) : "";
      const safeText = text ? String(text).trim().slice(0, 12000) : "";

      const PARSE_SYSTEM_PROMPT = `Ты — экспертный технический аналитик программных инструментов и ИИ-проектов.
Тебе предоставлены скриншоты постов из Telegram/Twitter, ссылка на GitHub-репозиторий или текстовое описание инструмента.
Если предоставлено несколько скриншотов — объедини информацию из всех и создай единый связный результат.
Твоя задача — извлечь ключевую информацию и вернуть строгий JSON по схеме без каких-либо пояснений.

Правила:
- title: точное официальное название проекта (без эмодзи)
- category: ТОЛЬКО одно из: agents | tools | models | media | scrapers | other
- summary: краткая ёмкая суть (слоган) на русском языке, 1-2 предложения, без технических деталей
- features: список из 3-7 ключевых возможностей через буллет "• ", каждая с новой строки, на русском
- detailedDescription: подробное описание архитектуры, стека технологий и сценариев применения на русском (2-4 предложения)
- installCommand: точные консольные команды установки и запуска через переносы строк (git clone, pip install, uv, docker run)
- githubUrl: полная ссылка https://github.com/... (если есть в тексте или можно вычислить)
- demoUrl: ссылка на демо/сайт (если есть)
- tags: массив из 4-7 точных технических тегов на английском в нижнем регистре
- pricing: ТОЛЬКО одно из: free | freemium | paid`;

      // Добавляем все изображения в parts (Gemini поддерживает несколько inline_data)
      const parts: any[] = [];
      for (const imgBase64 of allImages) {
        const inlinePart = dataUrlToInlinePart(imgBase64);
        if (inlinePart) parts.push(inlinePart);
      }

      let userText = "Проанализируй следующий материал и верни JSON с информацией о проекте:\n\n";
      if (safeUrl) userText += `GitHub URL: ${safeUrl}\n`;
      if (safeText) userText += `Текст описания:\n${safeText}\n`;
      if (allImages.length > 0 && !safeUrl && !safeText) userText += `Анализируй предоставленные скриншоты (${allImages.length} шт.).`;
      else if (allImages.length > 0) userText += `Дополнительно предоставлено ${allImages.length} скриншот(а/ов) — учти их.`;

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
              title: { type: "string" },
              category: { type: "string", enum: ["agents", "tools", "models", "media", "scrapers", "other"] },
              summary: { type: "string" },
              features: { type: "string" },
              detailedDescription: { type: "string" },
              installCommand: { type: "string" },
              githubUrl: { type: "string" },
              demoUrl: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              pricing: { type: "string", enum: ["free", "freemium", "paid"] },
            },
            required: ["title", "category", "summary", "tags", "pricing"],
          },
        },
      });

      const rawText = response.text ?? "{}";
      let parsed: any = {};
      try {
        const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        console.error("parse-tool JSON parse error, raw:", rawText);
        return res.status(500).json({ error: "Gemini вернул невалидный JSON", raw: rawText });
      }

      res.json(parsed);
    } catch (e: any) {
      console.error("Gemini parse-tool Error:", e);
      res.status(500).json({ message: e.message || "Ошибка Gemini парсера" });
    }
  });

  // ─── Vite Integration ─────────────────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      if (
        req.originalUrl.startsWith("/api/") ||
        req.originalUrl.startsWith("/uploads/")
      ) {
        return next();
      }
      try {
        const template = fs.readFileSync(
          path.join(__dirname, "index.html"),
          "utf-8"
        );
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ PromptVault server running on http://0.0.0.0:${PORT}`);
    console.log(`🚀 Mode: ${db.isLocal ? "💻 LOCAL (SQLite)" : `☁️ CLOUD (${process.env.SUPABASE_URL})`}`);
  });
}

startServer();
