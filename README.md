# CREOVA AI — Free AI Creative Workspace

> **Create anything. No credits. Just create.**

A complete, polished, production-quality AI creative platform. Images, videos, voices, cards and more — all in one dark cinematic workspace. Runs locally with open-source models. No credits. No paywalls. No fake spinners.

---

## Quick start

### 1. Install the backend

```bash
cd creova-ai/backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start the backend

```bash
cd creova-ai/backend
uvicorn app.main:app --reload --port 8000
```

The API lives at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 3. Install and run the frontend

```bash
cd creova-ai/frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173` and proxies API calls to the backend.

### 4. Open the app

Visit `http://localhost:5173`. Click **"Start Creating — Free"** to enter the workspace.

> **Demo Mode runs automatically** when no AI models are connected.
> Images, videos and audio all have clearly labeled fallback outputs.

---

## Architecture overview

```
creova-ai/
│
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entrypoint
│   │   ├── routes/                 # Image, video, audio, voice, card, core APIs
│   │   ├── services/               # Service adapters (image, video, tts, card, voice-clone)
│   │   ├── models/database.py      # SQLite init + queries
│   │   └── utils/config.py         # Env-based configuration
│   ├── requirements.txt
│   └── .env.example                # Copy to .env for your keys
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Routing
│   │   ├── layouts/AppLayout.jsx   # Sidebar + topbar
│   │   ├── pages/                  # All 11 full pages
│   │   ├── components/             # Shared UI (toast, lightbox, modals, skeletons...)
│   │   ├── services/               # api.js, downloads.js, toast.js
│   │   ├── store/appStore.js       # Zustand global state
│   │   └── utils/                  # Constants, helpers, PDF generator
│   ├── package.json
│   └── vite.config.js
│
├── generated/                      # Runtime output (images/, videos/, audio/, cards/)
├── uploads/                        # User uploaded files
└── README.md
```

---

## How to enable live generation (not demo mode)

> **Fastest path: Agnes AI (free, no card).** Add one key in
> **Settings → AI Providers** (`AGNES_KEY`) and both **image** and **video**
> generation work for real with no paywall. It is the default backend.

### Image generation

**Option A — Agnes AI (free, current default)** ✔ recommended

1. Get a free key at <https://agnes-ai.com> (no payment needed)
2. In the app go to **Settings → AI Providers**

**Option B — Hugging Face free tier (no GPU needed)**

1. Get a free token at <https://huggingface.co/settings/tokens>
   (create it with the **"Inference Providers"** permission)
2. In the app go to **Settings → AI Providers**
3. Paste your token into the **Hugging Face Inference token** field
4. Keep the model on **FLUX.1-schnell** (best free quality) or SDXL Turbo (fastest)
5. Click **Save provider settings**

**Option B — AUTOMATIC1111 / ComfyUI (local GPU)**

1. Start your local SD WebUI with `--api` flag
2. In **Settings → AI Providers**, enter `http://127.0.0.1:7860` as the image endpoint
3. Save — all images will route through your local model

**Option C — Local diffusers (heavy, advanced)**

Requires `torch` and `diffusers` installed in the backend venv.
The image service detects these automatically and uses `stabilityai/sdxl-turbo`.

---

### Video generation

**Option A — Agnes AI (free, current default)** ✔ recommended

1. Get a free key at <https://agnes-ai.com>
2. In **Settings → AI Providers**, paste it and pick **Agnes AI (free)**
3. Keep the model on **agnes-video-v2.0** (free, up to 60s) or **agnes-video-2.5-flash** (free, 4–12s)
4. Text→Video, Image→Video and Video→Video all work

**Option B — Google Veo 2 (free tier, best quality when quota allows)**

1. Go to <https://aistudio.google.com> and sign in with any Google account
2. Click **"Get API key"** → **Create API key** (free, no credit card)
3. In the app go to **Settings → AI Providers**
4. Paste the key (`AIza...`) into **Google AI Studio key — Veo 2**
5. Keep **Veo 2** (`veo-2.0-generate-001`) as the model
6. Click **Save provider settings**

Veo 2 generates up to **8-second, 1080p clips** from both text and images
(Text → Video and Image → Video both work). Free tier ≈ **10 videos/day**.
Durations above 8s are clamped to 8s.

**Option B — Custom video endpoint (self-hosted)**

1. Install **ffmpeg** (`winget install ffmpeg` / `brew install ffmpeg`)
2. Start a compatible service (e.g., ComfyUI + Wan 2.1 / AnimateDiff)
3. In **Settings → AI Providers**, enter its URL under **Video endpoint**
4. The endpoint must accept `POST /generate` with the JSON body the backend sends and return the video bytes in the response body.

> Real provider errors are shown to you (never hidden behind a demo result).
> If a model rejects your input — e.g. *"Cannot read image.png (this model
> does not support image input)"* — it means that model only accepts text
> prompts. Use **Text → Video** mode with it, or switch to a model that
> supports image input (Veo 2 does). The **"Try fallback model"** button on the
> error card generates a demo preview explicitly.

---

### Text-to-Speech

**Option A — Browser Web Speech API (always works)**

This is the default. Voices are synthesized on-device and play directly in the browser.
No backend audio is generated — audio comes from the OS speech engine.

**Option B — espeak-ng / espeak (local, fast)**

Install `espeak-ng` on your system. The backend detects it automatically for WAV output.

**Option C — Coqui TTS (high quality, local GPU)**

```bash
pip install TTS
```

Requires ~2 GB model download on first run. The backend auto-detects it.

**Option D — Custom TTS endpoint**

Enter your TTS service URL in Settings → AI Providers (e.g., a FastAPI wrapper around Coqui XTTS / OpenVoice).

---

### Voice cloning

Real voice cloning requires a dedicated model (Coqui XTTS v2 or OpenVoice):

1. Set up a Coqui XTTS server or compatible cloning service
2. In **Settings → AI Providers**, enter the URL as **TTS / voice-cloning endpoint**
3. Without this, cloning uses the browser speech engine with the voice settings applied as pitch/speed controls (labeled as browser fallback)

> Voice cloning always requires explicit user consent (checkbox enforced in the UI and validated in the API).

---

## What each page does

| Page | What it builds |
|------|---------------|
| **Home** | Dashboard with prompt box, quick-create cards, recent creations, stats |
| **Create Hub** | Studio selector (image / video / voice / cards) |
| **Image Generator** | Full prompt control, 10 styles, aspect ratios, seeds, upscale, gallery |
| **Video Studio** | Text/Image/Video modes, duration, camera motion, motion strength, GIF/MP4 |
| **Voice Studio** | TTS with voice gender/style/emotion/speed/pitch, browser Web Speech fallback |
| **Voice Cloning** | Upload reference audio, consent gate, generate & manage cloned voices |
| **Voice Design** | Presets, energy/pitch sliders, preview designed voice in-browser |
| **AI Cards** | Prompt → template content, canvas editor (drag/resize), export PNG/JPG/PDF/SVG |
| **Projects** | Auto-collected assets per generation, rename/duplicate/delete/export |
| **Project Detail** | Timeline view of all assets, per-file download, export project JSON |
| **History** | All generations, filter by type, regenerate, download, delete |
| **Downloads** | All generated files, one-click download |
| **Settings** | Profile, appearance, generation defaults, AI providers, storage |

---

## Free workspace guarantee

CREOVA AI **never** contains:

- Credits / coins / tokens
- Subscription pages
- Pricing / payment UI
- Paywalls
- "Buy credits" buttons
- Hard-coded API keys

Every UI shows either:
- *"Free AI Workspace"*, or
- *"Open-source AI powered"*

When no model is available, Demo Mode activates with **clearly labeled assets** and **real fallbacks**:
- **Images**: Procedurally generated cinematic scene (Pillow)
- **Videos**: Animated GIF with skyline and orb animation (Pillow)
- **Audio**: Browser Web Speech API (no backend audio)
- **Cards**: Real rasterized PNG/JPG/SVG from the card service (no ML needed)

---

## Database (SQLite)

- `projects` — project name, assets JSON, timestamps
- `history` — all generations (type, prompt, filename, metadata, project_id)
- `settings` — key/value store for provider tokens and config
- `voices` — cloned voice metadata

The `creova.db` file is created in the backend directory on first run.

---

## Storage architecture

All files are stored in `./generated/` (images, videos, audio, cards) and `./uploads/`.

```
generated/
├── images/    *.png
├── videos/    *.mp4 / *.gif
├── audio/     *.wav
└── cards/     *.png, *.jpg, *.svg
```

The storage is local during development. The service adapter (`Config.STORAGE_BACKEND`)
is designed so swapping to cloud object storage requires changing only `config.py`.

---

## Environment variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Default | What it does |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Backend bind address |
| `PORT` | `8000` | Backend port |
| `HUGGINGFACE_TOKEN` | empty | Enables HF Inference API image generation |
| `HF_IMAGE_MODEL` | `stabilityai/sdxl-turbo` | Primary HF image model (set to `black-forest-labs/FLUX.1-schnell` for best free quality) |
| `IMG_LOCAL_ENDPOINT` | empty | AUTOMATIC1111 / ComfyUI txt2img URL |
| `GEMINI_API_KEY` | empty | Enables Veo 2 video generation (free AI Studio key) |
| `VEO_MODEL` | `veo-2.0-generate-001` | Veo model used for videos |
| `VIDEO_ENDPOINT` | empty | Video model service URL |
| `TTS_ENDPOINT` | empty | TTS / voice-cloning service URL |
| `STORAGE_BACKEND` | `local` | Storage adapter selector |

---

## Production deployment (Vercel + Render)

This project deploys as **two pieces**: the React frontend on **Vercel** and the
FastAPI backend on **Render** (a real long-running server — required because
video generation polls Agnes for minutes, which Vercel serverless functions
cannot do).

### 1. Backend → Render

`render.yaml` is already in the repo root. Deploy:

1. Push this repo to GitHub (e.g. `github.com/aradhya09-ai/Creova-ai`).
2. Go to <https://dashboard.render.com> → **New** → **Blueprint**.
3. Connect your repo — Render provisions the `creova-ai-backend` service.
4. In the service **Environment** tab, set the dashboard-only secrets
   (values are never in git):
   - `AGNES_KEY` — Agnes AI key (free video + image, **required for real output**)
   - `POLLINATIONS_KEY` — optional fallback
   - `GEMINI_API_KEY` — optional Veo fallback
5. Deploy. The backend gets a public URL like
   `https://creova-ai-backend.onrender.com` (confirm `/api/health` returns 200).

> Free Render instances **sleep after ~15 min idle** (first request wakes them,
> ~30-60s) and use an **ephemeral filesystem**: SQLite history and generated
> files reset on redeploy/restart. Provider keys set as env vars survive
> because they are read from the environment, not the DB. A persistent disk
> (paid) under `/var/data` with `GENERATED_DIR`/`UPLOAD_DIR` pointed at it keeps
> everything across deploys.

### 2. Frontend → Vercel

`vercel.json` is already in the repo root (`rootDirectory: "frontend"`). Deploy:

1. Go to <https://vercel.com> → **Add New Project** → import your GitHub repo.
2. Vercel auto-detects Vite; build command `npm run build`, output `dist`.
3. In the project **Env Vars**, add:
   - `VITE_API_URL` = your Render backend URL, e.g. `https://creova-ai-backend.onrender.com`
4. **Deploy**. The frontend now calls your hosted backend directly.
   (Leave this unset locally — the Vite dev proxy handles `localhost:8000`.)

CORS is already open (`*`) on the backend, so no origin config is needed.

---

## Tech stack summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Lucide icons, Zustand |
| Backend | Python 3.10+, FastAPI, Uvicorn, Pillow |
| Database | SQLite (via stdlib sqlite3) |
| Storage | Local filesystem, swappable to cloud |
| Image gen | Hugging Face free tier / AUTOMATIC1111 / diffusers (all optional) |
| Video gen | ffmpeg / PyAV / Pillow GIF fallback (all optional) |
| TTS | Browser Web Speech API / espeak / Coqui TTS (all optional) |
| Voice cloning | Coqui XTTS / OpenVoice endpoint (optional) |

---

## License

MIT — use freely for any project, personal or commercial.
