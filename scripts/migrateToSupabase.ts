import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env");
  process.exit(1);
}

// Service role client bypasses RLS for migration
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const DATA_DIR = path.join(process.cwd(), "data");
const PROMPTS_FILE = path.join(DATA_DIR, "prompts.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");
const IMAGES_DIR = path.join(DATA_DIR, "images");

async function uploadImageToStorage(localPathOrUploadUrl: string): Promise<string | null> {
  if (!localPathOrUploadUrl) return null;
  
  // If it's already an external HTTP URL, return as is
  if (localPathOrUploadUrl.startsWith("http://") || localPathOrUploadUrl.startsWith("https://")) {
    return localPathOrUploadUrl;
  }

  // Extract filename if it starts with /uploads/ or images/
  let filename = localPathOrUploadUrl.replace(/^\/uploads\//, "").replace(/^images\//, "");
  const filePath = path.join(IMAGES_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Image file not found locally: ${filePath}`);
    return localPathOrUploadUrl;
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg";

    const { data, error } = await supabase.storage
      .from("prompt-images")
      .upload(filename, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`❌ Error uploading ${filename}:`, error.message);
      return localPathOrUploadUrl;
    }

    const { data: publicUrlData } = supabase.storage
      .from("prompt-images")
      .getPublicUrl(filename);

    console.log(`✅ Uploaded image ${filename} -> ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error(`❌ Error processing image ${filename}:`, err);
    return localPathOrUploadUrl;
  }
}

async function migrateCategories(): Promise<Map<string, string>> {
  console.log("\n📦 Migrating Categories...");
  const categoryIdMap = new Map<string, string>(); // oldId -> newUuid

  if (!fs.existsSync(CATEGORIES_FILE)) {
    console.log("No categories.json found.");
    return categoryIdMap;
  }

  const raw = fs.readFileSync(CATEGORIES_FILE, "utf8");
  const categoriesObj = JSON.parse(raw);

  for (const [oldId, cat] of Object.entries<any>(categoriesObj)) {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: cat.name,
        emoji: cat.emoji || "📁",
        color: cat.color || "#6366f1",
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to insert category ${cat.name}:`, error.message);
    } else if (data) {
      categoryIdMap.set(oldId, data.id);
      console.log(`✅ Category migrated: "${cat.name}" (ID: ${data.id})`);
    }
  }

  return categoryIdMap;
}

async function migratePrompts(categoryIdMap: Map<string, string>) {
  console.log("\n🚀 Migrating Prompts and Uploading Images...");

  if (!fs.existsSync(PROMPTS_FILE)) {
    console.log("No prompts.json found.");
    return;
  }

  const raw = fs.readFileSync(PROMPTS_FILE, "utf8");
  const promptsObj = JSON.parse(raw);

  for (const [oldId, prompt] of Object.entries<any>(promptsObj)) {
    console.log(`\nProcessing prompt: "${prompt.title}"...`);

    // Upload main images
    const imageBefore = prompt.imageBefore ? await uploadImageToStorage(prompt.imageBefore) : null;
    const imageAfter = prompt.imageAfter ? await uploadImageToStorage(prompt.imageAfter) : null;
    const originalImageBefore = prompt.originalImageBefore ? await uploadImageToStorage(prompt.originalImageBefore) : null;
    const originalImageAfter = prompt.originalImageAfter ? await uploadImageToStorage(prompt.originalImageAfter) : null;
    const originalImageSlot2 = prompt.originalImageSlot2 ? await uploadImageToStorage(prompt.originalImageSlot2) : null;

    // Upload additional images
    const additionalImages: string[] = [];
    if (Array.isArray(prompt.additionalImages)) {
      for (const img of prompt.additionalImages) {
        const uploaded = await uploadImageToStorage(img);
        if (uploaded) additionalImages.push(uploaded);
      }
    }

    // Process SubSections images
    const subSections = Array.isArray(prompt.subSections) ? prompt.subSections : [];
    const processedSubSections = [];

    for (const sub of subSections) {
      const subImgBefore = sub.imageBefore ? await uploadImageToStorage(sub.imageBefore) : null;
      const subImgAfter = sub.imageAfter ? await uploadImageToStorage(sub.imageAfter) : null;
      const subAddImgs = [];

      if (Array.isArray(sub.additionalImages)) {
        for (const img of sub.additionalImages) {
          const uploaded = await uploadImageToStorage(img);
          if (uploaded) subAddImgs.push(uploaded);
        }
      }

      processedSubSections.push({
        ...sub,
        imageBefore: subImgBefore,
        imageAfter: subImgAfter,
        additionalImages: subAddImgs,
      });
    }

    // Map Category ID
    const newCategoryId = prompt.category ? categoryIdMap.get(prompt.category) || null : null;

    // Insert into Supabase
    const { error } = await supabase.from("prompts").insert({
      title: prompt.title || "Untitled Prompt",
      category_id: newCategoryId,
      tags: Array.isArray(prompt.tags) ? prompt.tags : [],
      main_prompt: prompt.mainPrompt || "",
      sub_sections: processedSubSections,
      image_layout_type: prompt.imageLayoutType || "single",
      image_before: imageBefore,
      image_after: imageAfter,
      original_image_before: originalImageBefore,
      original_image_after: originalImageAfter,
      original_image_slot2: originalImageSlot2,
      additional_images: additionalImages,
      is_public: Boolean(prompt.isPublic),
      prompt_origin: prompt.promptOrigin || "own",
      author_name: prompt.authorName || "Alexey",
      author_email: prompt.authorEmail || "alexey.unstam@gmail.com",
      usage_count: prompt.usageCount || 0,
      usage_notes: prompt.usageNotes || null,
      media_type: prompt.mediaType || "photo",
      created_at: prompt.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error(`❌ Failed to insert prompt "${prompt.title}":`, error.message);
    } else {
      console.log(`✅ Prompt successfully migrated: "${prompt.title}"`);
    }
  }
}

async function main() {
  console.log("⚡ Starting Migration to Supabase...");
  try {
    const categoryIdMap = await migrateCategories();
    await migratePrompts(categoryIdMap);
    console.log("\n🎉 Migration completed successfully!");
  } catch (e) {
    console.error("❌ Migration failed:", e);
  }
}

main();
