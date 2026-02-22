# CLAUDE.md — Dashyn Project Context

## What is Dashyn?

Dashyn is an AI-powered photo editor that transforms selfies into styled looks. Users upload a selfie, pick a "vibe" (e.g., Old Money, Airport Look), and receive an AI-generated photo of themselves wearing a matching outfit in a matching background.

## Tech Stack

- **Frontend**: React 18 + Vite, deployed as a PWA on Vercel
- **Backend**: Vercel Serverless Functions (Node.js, in `/api/`)
- **AI Engine**: ComfyUI running Qwen Image Edit 2511 model on RunPod Serverless (A40 48GB GPU)
- **Auth**: Firebase Phone OTP Authentication
- **Database**: Firebase Firestore
- **Payments**: Razorpay (India) + Stripe (international)
- **Models**: Qwen Image Edit 2511 + Lightning LoRA (4-step generation)

## Architecture

```
User Phone/Browser (PWA)
  → Vercel Frontend (React)
    → Vercel API Routes (serverless proxy)
      → RunPod Endpoint (ComfyUI + Qwen Image Edit)
      → Firebase (auth + user data)
      → Razorpay / Stripe (payments)
```

## How the AI Generation Works

1. Frontend sends 3 images to RunPod: selfie (person), costume reference, background reference
2. All images are preprocessed: selfie & background cropped to 9:16 portrait, all resized to max 1024px
3. A ComfyUI workflow runs on RunPod using the official `runpod/worker-comfyui:5.7.1-base` Docker image
4. The workflow uses TextEncodeQwenImageEditPlus node with 3 image inputs + a text prompt
5. Output is a 768x1344 image (9:16 portrait) generated in 4 steps via Lightning LoRA
6. Result returned as base64 PNG

### ComfyUI Workflow Details

The workflow is defined in `src/api.js` as the `WORKFLOW` constant. Key nodes:
- UNETLoader → loads `qwen_image_edit_2511_bf16.safetensors` (39GB, fp8)
- CLIPLoader → loads `qwen_2.5_vl_7b_fp8_scaled.safetensors` (8.8GB)
- VAELoader → loads `qwen_image_vae.safetensors` (243MB)
- LoraLoaderModelOnly → loads Lightning LoRA for 4-step generation
- TextEncodeQwenImageEditPlus → takes 3 images + prompt
- KSampler → 4 steps, euler sampler, simple scheduler, cfg=1

### Model Paths on RunPod

Models live on a network volume (`vibe-editor-vol`, EU-SE-1, 70GB):
- `/runpod-volume/models/diffusion_models/qwen_image_edit_2511_bf16.safetensors`
- `/runpod-volume/models/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors`
- `/runpod-volume/models/vae/qwen_image_vae.safetensors`
- `/runpod-volume/models/loras/Qwen-Image-Edit-2511-Lightning-4steps-V1.0-fp32.safetensors`

### RunPod Endpoint

- Endpoint ID: `rbgsokk5io7v6s`
- Docker image: `ghcr.io/abhin7993/vibe-worker:latest` (based on `runpod/worker-comfyui:5.7.1-base`)
- GPU: A40 48GB
- Workers: 0 active, 1 max (serverless)
- Cold start: ~60-90s (first request), Warm: ~10-15s

## Project Structure

```
dashyn/
├── api/                          # Vercel serverless functions
│   ├── submit.js                 # POST /api/submit → proxy to RunPod /run
│   ├── status/[jobId].js         # GET /api/status/:id → proxy to RunPod /status
│   ├── assets/[vibeId]/[gender].js  # GET → returns random costume + background URLs
│   ├── lib/firebase.js           # Shared Firestore helpers for API routes
│   └── payment/
│       ├── razorpay/
│       │   ├── create.js         # Create Razorpay subscription
│       │   ├── verify.js         # Verify payment signature, activate plan
│       │   └── webhook.js        # Handle subscription lifecycle events
│       └── stripe/
│           ├── create-checkout.js # Create Stripe Checkout session
│           └── webhook.js        # Handle Stripe subscription events
├── src/
│   ├── main.jsx                  # Entry point, wraps App with AuthProvider
│   ├── App.jsx                   # Main app — all screens/steps
│   ├── api.js                    # Image processing + RunPod API communication
│   ├── vibes.js                  # Vibe definitions + prompt strategies
│   ├── firebase.js               # Firebase config, auth helpers, credit system
│   ├── AuthContext.jsx            # React context for user auth state
│   ├── PhoneLogin.jsx             # Phone OTP login component
│   ├── PricingPage.jsx            # Subscription plans + payment triggers
│   └── index.css                 # Global styles, animations
├── public/
│   ├── favicon.svg
│   └── assets/                   # Costume + background images per vibe
│       ├── old_money/{Male,Female,Background}/
│       ├── airport_look/{Male,Female,Background}/
│       └── ... (14 vibes total)
├── index.html
├── package.json
├── vite.config.js                # Vite + PWA plugin config
├── vercel.json                   # Vercel deployment config
└── .env.example                  # All required environment variables
```

## User Flow (Steps in App.jsx)

1. **Upload** (step 1) — user picks a selfie
2. **Vibe Grid** (step 2) — choose from 14 vibes
3. **Gender** (step 3) — Men's or Women's look (determines costume folder)
4. **Prompt Strategy** (step 4) — pick A-F prompt or "Run ALL" for comparison
5. **Processing** (step 5) — spinner with elapsed timer, shows reference images
6. **Result** (step 6) — generated image with save/share/retry
7. **Gallery** (step 7) — "Run ALL" mode: streams results as they complete
8. **Login** (step 8) — Phone OTP via Firebase
9. **Pricing** (step 9) — Subscription plans

## 14 Vibes

old_money, office_siren, airport_look, cyberpunk_gamer, south_delhi_sobo, bali_bohemian, mountain_mornings, phi_phi_look, dubai_rich, santorini, himalayan_odyssey, emily_in_paris, nyc_streets, holi_calm

Each vibe has a folder in `public/assets/<vibe_id>/` with `Male/`, `Female/`, and `Background/` subfolders containing reference images.

## Prompt Engineering — Current Status

We tested 18+ prompt strategies (A through X) across 4 rounds. Key findings:

### What works:
- **"Delete + Replace" framing** (Prompt N) — telling model to actively delete the background first
- **"New Photo At Location" framing** (Prompt O) — reframing as traveling to a new place
- **No face mention** — explicitly asking to "preserve face" makes the model ALTER the face more
- **Shorter prompts** tend to work better than long detailed ones
- **Including accessories** — must say "outfit, accessories, jewelry, bags, shoes" not just "outfit"
- **"Most suitable pose"** — adding this improves natural posing

### What doesn't work:
- Mentioning face/identity preservation → model changes face MORE
- Long lists of what to preserve → model ignores or overcompensates
- "Edit Image 1 only" framing → causes layered/composited look
- Background blending is a persistent issue — original background leaks through regardless of prompt

### Current best prompts (Round 4, in vibes.js):
Strategies S through X, all hybrids of N+O approach. Still testing.

### Known remaining issues:
- Background from original selfie sometimes blends with reference background
- This may be a model/workflow limitation, not just a prompt issue
- Possible fixes to explore: background removal preprocessing, different workflow nodes

## Payment System

### Tiers:
| Plan | Price (India) | Price (Global) | Daily Gens | Fast Credits/month |
|------|--------------|----------------|------------|-------------------|
| Free | ₹0 | $0 | 1 | 0 |
| Basic | ₹199/mo | $4.99/mo | 10 | 20 |
| Pro | ₹499/mo | $9.99/mo | Unlimited | 100 |

### How credits work:
- **Free (no login)**: 1 generation/day tracked via localStorage
- **Free (logged in)**: 1 generation/day tracked in Firestore
- **Paid**: Daily limit based on plan, fast credits for priority queue
- Credits reset daily (generations) and monthly (fast credits via webhook)
- Indian users → Razorpay, International → Stripe (auto-detected by timezone)

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `RUNPOD_API_KEY` / `RUNPOD_ENDPOINT_ID` — for AI generation
- `VITE_FIREBASE_*` — client-side Firebase config (must have VITE_ prefix)
- `FIREBASE_PROJECT_ID` / `FIREBASE_API_KEY` — server-side Firestore access
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_PLAN_*` — Razorpay subscriptions
- `STRIPE_SECRET_KEY` / `STRIPE_PRICE_*` — Stripe subscriptions

## Deployment

```bash
npm install
vercel --prod
```

All env vars must be set in Vercel dashboard or via `vercel env add`.

## GitHub Repos

- **Worker (Docker)**: https://github.com/abhin7993/vibe-worker
  - GitHub Actions builds and pushes to ghcr.io/abhin7993/vibe-worker:latest on push to main
  - Dockerfile extends runpod/worker-comfyui:5.7.1-base with custom nodes + extra_model_paths.yaml

## Key Design Decisions

1. **PWA over native app** — instant UI updates without app store approvals
2. **Vercel serverless proxy** — hides RunPod API key from frontend
3. **Assets in public/ folder** — served by Vercel CDN, but limited to ~50MB total (images must be compressed JPEG)
4. **Device-based free tier** — no login friction for first generation
5. **Firebase over custom auth** — built-in phone OTP, minimal backend code
6. **Official ComfyUI worker** — easier than custom handler, workflow sent from frontend
7. **9:16 portrait output** — optimal for phone screens, person + background cropped to this ratio
8. **Costume NOT cropped** — it's a reference image only, doesn't need specific aspect ratio

## Common Tasks

### Add a new vibe:
1. Add entry to `VIBES` array in `src/vibes.js`
2. Create `public/assets/<vibe_id>/{Male,Female,Background}/` with images
3. Deploy

### Change prompts:
Edit `PROMPT_STRATEGIES` in `src/vibes.js`. After prompt testing is done, the winning prompt should be set as the default and the prompt selection step can be removed from the user flow.

### Update pricing:
1. Edit `PLANS` and `PLAN_LIMITS` in `src/firebase.js`
2. Edit `PLAN_CONFIG` in `api/lib/firebase.js`
3. Create new plans/prices in Razorpay and Stripe dashboards
4. Update plan IDs in env vars

### Test locally:
```bash
npm run dev
# Need .env.local with all vars
```

### Compress asset images (if too large for Vercel):
```bash
find public/assets -name "*.png" -exec sh -c 'magick "$1" -resize "1024x1024>" -quality 85 "${1%.png}.jpg" && rm "$1"' _ {} \;
```
