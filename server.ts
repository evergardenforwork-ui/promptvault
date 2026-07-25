import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import AdmZip from "adm-zip";
import bcrypt from "bcryptjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const IMAGES_DIR = path.join(DATA_DIR, "images");
const PROMPTS_FILE = path.join(DATA_DIR, "prompts.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");
const CHATS_FILE = path.join(DATA_DIR, "chats.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

// Google Gemini Setup
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const GEMINI_MODEL = "gemini-2.5-flash-lite";

// Database helpers
function readJson(file: string, fallback: any = {}) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e);
  }
  return fallback;
}

function writeJson(file: string, data: any) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error(`Error writing ${file}:`, e);
  }
}

// Seed helper (loads from firestore-export if local db is empty)
function seedData() {
  const exportPromptsFile = path.join(__dirname, "firestore-export", "prompts.json");
  const exportCategoriesFile = path.join(__dirname, "firestore-export", "categories.json");
  const exportChatsFile = path.join(__dirname, "firestore-export", "chats.json");

  // Prompts seed
  if (!fs.existsSync(PROMPTS_FILE) && fs.existsSync(exportPromptsFile)) {
    console.log("Seeding prompts from firestore-export...");
    const data = readJson(exportPromptsFile);
    // Replace firestore-export local image paths to use `/uploads/` route
    const seeded: any = {};
    for (const [id, prompt] of Object.entries(data)) {
      const p = prompt as any;
      if (p.imageBefore && p.imageBefore.startsWith("images/")) {
        p.imageBefore = p.imageBefore.replace("images/", "/uploads/");
      }
      if (p.imageAfter && p.imageAfter.startsWith("images/")) {
        p.imageAfter = p.imageAfter.replace("images/", "/uploads/");
      }
      if (p.additionalImages) {
        p.additionalImages = p.additionalImages.map((img: string) =>
          img.startsWith("images/") ? img.replace("images/", "/uploads/") : img
        );
      }
      seeded[id] = p;
    }
    writeJson(PROMPTS_FILE, seeded);
  }

  // Categories seed
  if (!fs.existsSync(CATEGORIES_FILE) && fs.existsSync(exportCategoriesFile)) {
    console.log("Seeding categories from firestore-export...");
    writeJson(CATEGORIES_FILE, readJson(exportCategoriesFile));
  }

  // Chats seed
  if (!fs.existsSync(CHATS_FILE) && fs.existsSync(exportChatsFile)) {
    console.log("Seeding chats from firestore-export...");
    writeJson(CHATS_FILE, readJson(exportChatsFile));
  }

  // Users seed (default admin)
  if (!fs.existsSync(USERS_FILE)) {
    console.log("Creating default users file...");
    const adminEmail = process.env.ADMIN_EMAIL || "alexey.unstam@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const hashed = bcrypt.hashSync(adminPassword, 10);
    writeJson(USERS_FILE, {
      [adminEmail]: {
        uid: "admin-uid",
        name: "Admin",
        email: adminEmail,
        password: hashed,
        role: "admin",
      },
    });
  } else {
    // Migrate existing users' passwords to bcrypt hashes
    try {
      const users = readJson(USERS_FILE);
      let changed = false;
      for (const email of Object.keys(users)) {
        const u = users[email];
        if (u && u.password && !u.password.startsWith("$2a$") && !u.password.startsWith("$2b$") && !u.password.startsWith("$2y$")) {
          console.log(`Hashing password for user: ${email}`);
          u.password = bcrypt.hashSync(u.password, 10);
          changed = true;
        }
      }
      if (changed) {
        writeJson(USERS_FILE, users);
      }
    } catch (err) {
      console.error("Error migrating user passwords:", err);
    }
  }
}

seedData();

// Image extraction helper
function saveBase64Image(dataUrl: string, prefix: string): string {
  if (!dataUrl.startsWith("data:image/")) return dataUrl; // Not a base64 string
  const matches = dataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches) return dataUrl;

  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const filename = `${prefix}_${Date.now()}.${ext}`;
  const filepath = path.join(IMAGES_DIR, filename);

  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
}

function saveSubSectionImages(sub: any, promptId: string, subIdx: number): any {
  if (!sub) return sub;
  const s = { ...sub };
  if (s.imageBefore) {
    s.imageBefore = saveBase64Image(s.imageBefore, `${promptId}_sub_${subIdx}_before`);
  }
  if (s.imageAfter) {
    s.imageAfter = saveBase64Image(s.imageAfter, `${promptId}_sub_${subIdx}_after`);
  }
  if (s.originalImageBefore) {
    s.originalImageBefore = saveBase64Image(s.originalImageBefore, `${promptId}_sub_${subIdx}_orig_before`);
  }
  if (s.originalImageAfter) {
    s.originalImageAfter = saveBase64Image(s.originalImageAfter, `${promptId}_sub_${subIdx}_orig_after`);
  }
  if (s.originalImageSlot2) {
    s.originalImageSlot2 = saveBase64Image(s.originalImageSlot2, `${promptId}_sub_${subIdx}_orig_slot2`);
  }
  if (s.additionalImages) {
    s.additionalImages = s.additionalImages.map((img: string, idx: number) =>
      saveBase64Image(img, `${promptId}_sub_${subIdx}_add_${idx}`)
    );
  }
  return s;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Static uploads
  app.use("/uploads", express.static(IMAGES_DIR));

  // Simple Auth Middleware
  function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const users = readJson(USERS_FILE);
    const user = Object.values(users).find((u: any) => u.uid === token);
    if (!user) {
      return res.status(401).json({ message: "Invalid session token" });
    }
    (req as any).user = user;
    next();
  }

  // --- API Routes ---

  // Auth Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const users = readJson(USERS_FILE);
    const user = users[email];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }
    res.json({
      token: user.uid,
      user: {
        uid: user.uid,
        displayName: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });

  // GET Prompts
  app.get("/api/prompts", authenticate, (req, res) => {
    const user = (req as any).user;
    const promptsMap = readJson(PROMPTS_FILE);
    const promptsList = Object.entries(promptsMap).map(([id, p]: [string, any]) => ({
      id,
      ...p,
    }));

    const visiblePrompts = user.role === "admin"
      ? promptsList
      : promptsList.filter((p) => p.isPublic || p.userId === user.uid);

    // Pagination support (optional — без параметров возвращает всё)
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : null;
    const offsetParam = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    if (limitParam !== null && !isNaN(limitParam)) {
      const total = visiblePrompts.length;
      const items = visiblePrompts.slice(offsetParam, offsetParam + limitParam);
      return res.json({ items, total, hasMore: offsetParam + limitParam < total });
    }

    res.json(visiblePrompts);
  });

  // POST Prompt
  app.post("/api/prompts", authenticate, (req, res) => {
    const user = (req as any).user;
    const promptData = req.body;
    const id = `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process images
    if (promptData.imageBefore) {
      promptData.imageBefore = saveBase64Image(promptData.imageBefore, `${id}_before`);
    }
    if (promptData.imageAfter) {
      promptData.imageAfter = saveBase64Image(promptData.imageAfter, `${id}_after`);
    }
    if (promptData.originalImageBefore) {
      promptData.originalImageBefore = saveBase64Image(promptData.originalImageBefore, `${id}_orig_before`);
    }
    if (promptData.originalImageAfter) {
      promptData.originalImageAfter = saveBase64Image(promptData.originalImageAfter, `${id}_orig_after`);
    }
    if (promptData.originalImageSlot2) {
      promptData.originalImageSlot2 = saveBase64Image(promptData.originalImageSlot2, `${id}_orig_slot2`);
    }
    if (promptData.additionalImages) {
      promptData.additionalImages = promptData.additionalImages.map((img: string, idx: number) =>
        saveBase64Image(img, `${id}_add_${idx}`)
      );
    }
    if (promptData.subSections) {
      promptData.subSections = promptData.subSections.map((sub: any, idx: number) =>
        saveSubSectionImages(sub, id, idx)
      );
    }

    const newPrompt = {
      ...promptData,
      userId: user.uid,
      authorName: user.displayName || "User",
      authorEmail: user.email,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    const promptsMap = readJson(PROMPTS_FILE);
    promptsMap[id] = newPrompt;
    writeJson(PROMPTS_FILE, promptsMap);

    res.status(201).json({ id, ...newPrompt });
  });

  // PUT Prompt
  app.put("/api/prompts/:id", authenticate, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;
    const promptUpdate = req.body;
    const promptsMap = readJson(PROMPTS_FILE);

    if (!promptsMap[id]) {
      return res.status(404).json({ message: "Промпт не найден" });
    }

    const existing = promptsMap[id];
    if (existing.userId !== user.uid && user.role !== "admin") {
      return res.status(403).json({ message: "Нет доступа" });
    }

    // Process updated images
    if (promptUpdate.imageBefore) {
      promptUpdate.imageBefore = saveBase64Image(promptUpdate.imageBefore, `${id}_before`);
    }
    if (promptUpdate.imageAfter) {
      promptUpdate.imageAfter = saveBase64Image(promptUpdate.imageAfter, `${id}_after`);
    }
    if (promptUpdate.originalImageBefore) {
      promptUpdate.originalImageBefore = saveBase64Image(promptUpdate.originalImageBefore, `${id}_orig_before`);
    }
    if (promptUpdate.originalImageAfter) {
      promptUpdate.originalImageAfter = saveBase64Image(promptUpdate.originalImageAfter, `${id}_orig_after`);
    }
    if (promptUpdate.originalImageSlot2) {
      promptUpdate.originalImageSlot2 = saveBase64Image(promptUpdate.originalImageSlot2, `${id}_orig_slot2`);
    }
    if (promptUpdate.additionalImages) {
      promptUpdate.additionalImages = promptUpdate.additionalImages.map((img: string, idx: number) =>
        saveBase64Image(img, `${id}_add_${idx}`)
      );
    }
    if (promptUpdate.subSections) {
      promptUpdate.subSections = promptUpdate.subSections.map((sub: any, idx: number) =>
        saveSubSectionImages(sub, id, idx)
      );
    }

    const updated = {
      ...existing,
      ...promptUpdate,
      // Prevent changing author/creation via client update unless admin
      userId: existing.userId,
      createdAt: existing.createdAt,
    };

    promptsMap[id] = updated;
    writeJson(PROMPTS_FILE, promptsMap);

    res.json({ id, ...updated });
  });

  // DELETE Prompt
  app.delete("/api/prompts/:id", authenticate, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;
    const promptsMap = readJson(PROMPTS_FILE);

    if (!promptsMap[id]) {
      return res.status(404).json({ message: "Промпт не найден" });
    }

    if (promptsMap[id].userId !== user.uid && user.role !== "admin") {
      return res.status(403).json({ message: "Нет доступа" });
    }

    delete promptsMap[id];
    writeJson(PROMPTS_FILE, promptsMap);

    // Clean up chats for this prompt
    const chatsMap = readJson(CHATS_FILE);
    let chatsChanged = false;
    for (const chatId of Object.keys(chatsMap)) {
      if (chatsMap[chatId].promptId === id) {
        delete chatsMap[chatId];
        chatsChanged = true;
      }
    }
    if (chatsChanged) writeJson(CHATS_FILE, chatsMap);

    res.json({ message: "Промпт удален" });
  });

  // GET Categories
  app.get("/api/categories", authenticate, (req, res) => {
    const user = (req as any).user;
    const catsMap = readJson(CATEGORIES_FILE);
    const catsList = Object.entries(catsMap)
      .map(([id, c]: [string, any]) => ({ id, ...c }))
      .filter((c: any) => 
        c.userId === user.uid || 
        c.userId === "admin-uid" ||
        !c.userId
      );
    res.json(catsList);
  });

  // POST Category
  app.post("/api/categories", authenticate, (req, res) => {
    const user = (req as any).user;
    const catData = req.body;
    const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newCat = {
      ...catData,
      userId: user.uid,
    };

    const catsMap = readJson(CATEGORIES_FILE);
    catsMap[id] = newCat;
    writeJson(CATEGORIES_FILE, catsMap);

    res.status(201).json({ id, ...newCat });
  });

  // DELETE Category
  app.delete("/api/categories/:id", authenticate, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;
    const catsMap = readJson(CATEGORIES_FILE);

    if (!catsMap[id]) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    if (catsMap[id].userId !== user.uid) {
      return res.status(403).json({ message: "Нет доступа" });
    }

    delete catsMap[id];
    writeJson(CATEGORIES_FILE, catsMap);
    res.json({ message: "Категория удалена" });
  });

  // GET Chats
  app.get("/api/chats", authenticate, (req, res) => {
    const user = (req as any).user;
    const { promptId } = req.query;
    const chatsMap = readJson(CHATS_FILE);
    const chatsList = Object.entries(chatsMap)
      .map(([id, msg]: [string, any]) => ({ id, ...msg }))
      .filter((msg: any) => msg.promptId === promptId && msg.userId === user.uid)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json(chatsList);
  });

  // POST Chat message
  app.post("/api/chats", authenticate, (req, res) => {
    const user = (req as any).user;
    const { promptId, content, image } = req.body;
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let savedImg = image;
    if (image) {
      savedImg = saveBase64Image(image, `${id}_chat`);
    }

    const newMsg = {
      promptId,
      userId: user.uid,
      role: "user",
      content,
      image: savedImg || null,
      createdAt: new Date().toISOString(),
    };

    const chatsMap = readJson(CHATS_FILE);
    chatsMap[id] = newMsg;
    writeJson(CHATS_FILE, chatsMap);

    res.status(201).json({ id, ...newMsg });
  });

  // POST Clear chats
  app.post("/api/chats/clear", authenticate, (req, res) => {
    const user = (req as any).user;
    const { promptId } = req.query;
    const chatsMap = readJson(CHATS_FILE);

    let changed = false;
    for (const chatId of Object.keys(chatsMap)) {
      if (chatsMap[chatId].promptId === promptId && chatsMap[chatId].userId === user.uid) {
        delete chatsMap[chatId];
        changed = true;
      }
    }

    if (changed) {
      writeJson(CHATS_FILE, chatsMap);
    }
    res.json({ message: "История чата очищена" });
  });

  // GET Export Backup Zip
  app.get("/api/export", authenticate, (req, res) => {
    const user = (req as any).user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Только администратор может экспортировать данные" });
    }

    try {
      const zip = new AdmZip();
      
      if (fs.existsSync(PROMPTS_FILE)) zip.addLocalFile(PROMPTS_FILE);
      if (fs.existsSync(CATEGORIES_FILE)) zip.addLocalFile(CATEGORIES_FILE);
      if (fs.existsSync(CHATS_FILE)) zip.addLocalFile(CHATS_FILE);
      if (fs.existsSync(USERS_FILE)) zip.addLocalFile(USERS_FILE);

      const buffer = zip.toBuffer();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename=promptvault_backup_${Date.now()}.zip`);
      res.send(buffer);
    } catch (e: any) {
      console.error("Export Error:", e);
      res.status(500).json({ message: e.message || "Ошибка экспорта данных" });
    }
  });

  // POST Import Backup Zip
  app.post("/api/import", authenticate, (req, res) => {
    const user = (req as any).user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Только администратор может импортировать данные" });
    }

    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ message: "Файл не передан" });
    }

    try {
      const matches = file.match(/^data:application\/[a-zA-Z+-]+;base64,(.+)$/) || file.match(/^data:charset=binary;base64,(.+)$/);
      const base64Data = matches ? matches[1] : file;
      const buffer = Buffer.from(base64Data, "base64");

      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      // Validate JSON formatting in zip entries before extracting
      zipEntries.forEach((entry) => {
        const entryName = entry.entryName;
        if (entryName === "prompts.json" || entryName === "categories.json" || entryName === "chats.json" || entryName === "users.json") {
          const content = entry.getData().toString("utf8");
          JSON.parse(content);
        }
      });

      let importedCount = 0;
      zipEntries.forEach((entry) => {
        const entryName = entry.entryName;
        const targetPath = 
          entryName === "prompts.json" ? PROMPTS_FILE :
          entryName === "categories.json" ? CATEGORIES_FILE :
          entryName === "chats.json" ? CHATS_FILE :
          entryName === "users.json" ? USERS_FILE : null;

        if (targetPath) {
          const content = entry.getData().toString("utf8");
          const parsed = JSON.parse(content);
          writeJson(targetPath, parsed);
          importedCount++;
        }
      });

      res.json({ message: `Импорт успешно завершен. Восстановлено файлов: ${importedCount}` });
    } catch (e: any) {
      console.error("Import Error:", e);
      res.status(500).json({ message: e.message || "Ошибка импорта данных. Убедитесь, что архив корректен." });
    }
  });

  // POST Gemini Chat
  app.post("/api/gemini/chat", authenticate, async (req, res) => {
    const { prompt, systemInstruction, history, images } = req.body;
    try {
      const contents = history.map((turn: any) => {
        const parts: any[] = [];
        if (turn.role === "user" && turn.image) {
          const imgPart = dataUrlToInlinePart(turn.image);
          if (imgPart) parts.push(imgPart);
        }
        if (turn.text?.trim()) parts.push({ text: turn.text });
        return { role: turn.role, parts: parts.length ? parts : [{ text: "" }] };
      });

      const attachImages = (images || [])
        .map((img: string) => dataUrlToInlinePart(img))
        .filter((x: any) => x !== null);

      contents.push({
        role: "user",
        parts: [...attachImages, { text: prompt || (attachImages.length ? "Смотри изображения." : "") }],
      });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
        },
      });

      res.json({ text: response.text ?? "" });
    } catch (e: any) {
      console.error("Gemini Chat Error:", e);
      res.status(500).json({ message: e.message || "Ошибка работы с Gemini" });
    }
  });

  // POST Gemini Analyze
  app.post("/api/gemini/analyze", authenticate, async (req, res) => {
    const { image, prompt } = req.body;
    try {
      const inline = dataUrlToInlinePart(image);
      if (!inline) throw new Error("Invalid image data URL");

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            parts: [inline, { text: prompt || "Analyze this image and describe it in detail." }],
          },
        ],
      });
      res.json({ text: response.text ?? "" });
    } catch (e: any) {
      console.error("Gemini Analyze Error:", e);
      res.status(500).json({ message: e.message || "Ошибка работы с Gemini" });
    }
  });

  function dataUrlToInlinePart(dataUrl: string): { inlineData: { data: string; mimeType: string } } | null {
    // If it's a server URL (like `/uploads/...`), read it from file and convert to base64 for Gemini
    if (dataUrl.startsWith("/uploads/")) {
      const filename = path.basename(dataUrl);
      const filepath = path.join(IMAGES_DIR, filename);
      if (fs.existsSync(filepath)) {
        const mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
        const base64 = fs.readFileSync(filepath, "base64");
        return { inlineData: { mimeType, data: base64 } };
      }
      return null;
    }

    const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return null;
    return { inlineData: { mimeType: m[1] || "image/jpeg", data: m[2] } };
  }

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
