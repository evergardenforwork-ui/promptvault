-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '📁',
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. PROMPTS TABLE (WITH FLEXIBLE MEDIA & PACKAGES SUPPORT)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    main_prompt TEXT NOT NULL,
    sub_sections JSONB DEFAULT '[]'::jsonb,
    image_layout_type TEXT DEFAULT 'single',
    image_before TEXT,
    image_after TEXT,
    original_image_before TEXT,
    original_image_after TEXT,
    original_image_slot2 TEXT,
    additional_images TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    prompt_origin TEXT DEFAULT 'own',
    author_name TEXT DEFAULT 'Alexey',
    author_email TEXT DEFAULT 'alexey.unstam@gmail.com',
    usage_count INT DEFAULT 0,
    usage_notes TEXT,
    media_type TEXT DEFAULT 'photo', -- 'photo', 'video', 'text', 'music', 'skill', 'zip_package'
    file_package_url TEXT,          -- URL zip архива или md файла в Storage
    file_structure JSONB DEFAULT '{}'::jsonb, -- Дерево папок из ZIP (skills/prompt/SKILL.md и т.д.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. CHAT MESSAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 5. SKILLS / WORKSPACES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    file_structure JSONB DEFAULT '[]'::jsonb,
    file_package_url TEXT,
    is_favorite BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    author_name TEXT DEFAULT 'Alexey',
    author_email TEXT DEFAULT 'alexey.unstam@gmail.com',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 6. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_public ON public.prompts(is_public);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_media_type ON public.prompts(media_type);
CREATE INDEX IF NOT EXISTS idx_chats_prompt_id ON public.chats(prompt_id);
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.skills(user_id);

-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Public Access Policies
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert categories" ON public.categories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read prompts" ON public.prompts FOR SELECT USING (true);
CREATE POLICY "Allow public insert prompts" ON public.prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update prompts" ON public.prompts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete prompts" ON public.prompts FOR DELETE USING (true);

CREATE POLICY "Allow public read skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Allow public insert skills" ON public.skills FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update skills" ON public.skills FOR UPDATE USING (true);
CREATE POLICY "Allow public delete skills" ON public.skills FOR DELETE USING (true);

-- Chats RLS
CREATE POLICY "Chats policy" ON public.chats FOR ALL USING (true);

-- ==========================================
-- 8. STORAGE BUCKETS SETUP (Prompt Images & Prompt Files)
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prompt-images', 'prompt-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('prompt-files', 'prompt-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for prompt-images
CREATE POLICY "Public Read Images" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'prompt-images');

CREATE POLICY "Public Insert Images" ON storage.objects
    FOR INSERT TO public
    WITH CHECK (bucket_id = 'prompt-images');

-- Storage Policies for prompt-files (ZIP / MD)
CREATE POLICY "Public Read Files" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'prompt-files');

CREATE POLICY "Public Insert Files" ON storage.objects
    FOR INSERT TO public
    WITH CHECK (bucket_id = 'prompt-files');
