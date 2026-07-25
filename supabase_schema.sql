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
-- 5. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_public ON public.prompts(is_public);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_media_type ON public.prompts(media_type);
CREATE INDEX IF NOT EXISTS idx_chats_prompt_id ON public.chats(prompt_id);

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Categories RLS: Read all global or owned categories
CREATE POLICY "Categories read policy" ON public.categories
    FOR SELECT TO public
    USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Categories insert policy" ON public.categories
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Categories delete policy" ON public.categories
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Prompts RLS: Read if public OR if author
CREATE POLICY "Prompts read policy" ON public.prompts
    FOR SELECT TO public
    USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Prompts insert policy" ON public.prompts
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Prompts update policy" ON public.prompts
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Prompts delete policy" ON public.prompts
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Chats RLS
CREATE POLICY "Chats policy" ON public.chats
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 7. STORAGE BUCKETS SETUP (Prompt Images & Prompt Files)
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

CREATE POLICY "Authenticated Insert Images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'prompt-images');

-- Storage Policies for prompt-files (ZIP / MD)
CREATE POLICY "Public Read Files" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'prompt-files');

CREATE POLICY "Authenticated Insert Files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'prompt-files');
