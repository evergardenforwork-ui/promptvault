# PromptVault

PromptVault is a personal library and vault for neural network prompts featuring an integrated AI assistant (Gemini), multi-user support, chat isolation, flexible image layouts, and an interactive inline image cropper.

## 📂 Architecture & Tech Stack

This project is a modern fullstack web application:

- **Frontend**: React 19, Vite, Tailwind CSS v4 (for fast, cutting-edge utility styles), Framer Motion / Motion.
- **Backend / API**: Express.js (`server.ts`) for local API routing and serving static assets in production.
- **Database**: Local JSON file storage under `/data` (users, categories, prompts, chat histories), automatically seeded on startup from `/firestore-export` if empty.
- **AI Integration**: Google Gemini API (model `gemini-2.5-flash-lite`) via `@google/genai` for assistant chat proxying and visual image analysis.

---

## 🖼️ Core Features

### 1. Image Layouts & Cropper

You can customize the visual structure of your prompts with high fidelity:

* **Supported Grid Layouts**:
  * **Single Image** — 1 standalone image.
  * **Before/After Slider** — an interactive horizontal slider for comparing two images (e.g. before/after generation).
  * **Vertical Split** — 2 stacked images (top & bottom).
  * **Horizontal Split** — 2 side-by-side images (left & right).
  * **Split 1-2** — 3 images: 1 large on the left, 2 smaller stacked on the right.
  * **Merge 2-1** — 3 images: 2 side-by-side on the top, pointing to 1 combined result on the bottom.

* **Built-in Image Cropper Modal**:
  Clicking any empty slot or selecting "Replace" / "Crop" on an existing image opens a custom cropping window:
  * **Re-positioning (Pan)**: Drag the image around using mouse/touch inputs to change the center of focus.
  * **Scaling (Zoom)**: Adjust zoom level from 100% to 300% using buttons or a slider.
  * **Aspect Ratio Locking**: The crop frame automatically updates its aspect ratio to match the target layout slot precisely.
  * **Canvas Crop**: Cropping is executed client-side via HTML5 Canvas. It generates optimized base64 data which is processed by the server and saved as a static image in `/uploads`.

### 2. Interactive Navigation & Filters Bar

* **Ownership & Source Tabs**: Toggle between **"All"**, **"My Own (Authored)"**, **"My Own (From Web)"**, and **"Others (Public)"** with real-time prompt counts displayed on each tab.
* **Visual Origin Badges**: Prompt cards show **"My"** or **"From Web"** labels overlaying the image to immediately identify content origins.
* **Integrated Categories & Hashtags Scrollbar**: Quick 1-click filtering by category or tag using a smooth-scrolling pills bar at the top of the feed.
* **Create Categories on the Fly**: Instantly add new categories directly from the main view using the **`+ Category`** button at the end of the scrollbar.
* **Interactive Tag Badges**: Click any tag badge on a prompt card to immediately filter the entire feed by that hashtag.

---

## 📁 Directory Structure

```bash
promptvault/
├── data/                    # Local JSON database and uploaded media assets
│   ├── images/              # Stored image files
│   ├── prompts.json         # Prompts database
│   ├── categories.json      # Category list
│   ├── chats.json           # Gemini chat histories
│   └── users.json           # User credentials and session tokens
├── firestore-export/        # Backup dumps for seeding
├── src/
│   ├── components/
│   │   ├── auth/            # LoginForm.tsx
│   │   ├── layout/          # Sidebar.tsx
│   │   └── ui/              # Reusable UI (Toast, CategoryForm, ImageCropper)
│   ├── sections/
│   │   └── photo/           # Prompt components (PhotoCard, PhotoForm, PhotoView)
│   ├── services/
│   │   ├── api.ts           # Fetch client for interfacing with Express server
│   │   └── gemini.ts        # Helper proxy for Gemini AI operations
│   ├── types.ts             # TypeScript definitions
│   └── main.tsx             # React mount entrypoint
├── server.ts                # Express backend routing & asset serving
├── vite.config.ts           # Vite configuration
└── package.json             # Scripts and packages
```

---

## 🛠️ Local Development

1. **Install Dependencies:**
   Run in the project root:
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The local app runs on `http://localhost:3000`.

---

## 🔐 Authentication & Roles

* **Admin Role**: Users with email `alexey.unstam@gmail.com` automatically receive administrator privileges (can modify/delete any prompt).
* **Prompt Visibility**: Create public prompts (visible to all registered users) or private prompts (only visible to yourself).
* **Assistant Isolation**: Chat history with the Gemini assistant is fully isolated per-user and per-prompt.
