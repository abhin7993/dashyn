# Dashyn - AI Photo Editor

Transform your photos with 14 AI-powered vibe looks. Built with React + Vite as a PWA, deployed on Vercel, powered by RunPod serverless.

## Architecture

```
User (PWA on any device)
  → Vercel serverless API (proxy + asset management)
    → RunPod endpoint (ComfyUI + Qwen Image Edit)
      → Returns AI-generated image
```

## Quick Start

### 1. Add Your Assets

Put costume and background images in `public/assets/`:

```
public/assets/
├── old_money/
│   ├── Male/         ← male costume images (.jpg/.png)
│   ├── Female/       ← female costume images
│   └── Background/   ← background images
├── airport_look/
│   ├── Male/
│   ├── Female/
│   └── Background/
├── (other vibes...)
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd dashyn
vercel

# Set environment variables
vercel env add RUNPOD_API_KEY    # your RunPod API key
vercel env add RUNPOD_ENDPOINT_ID  # default: rbgsokk5io7v6s

# Deploy to production
vercel --prod
```

### 3. Install as App

- **Android**: Open URL in Chrome → Menu → "Add to Home Screen"
- **iOS**: Open URL in Safari → Share → "Add to Home Screen"  
- **Desktop**: Works directly in browser

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RUNPOD_API_KEY` | Your RunPod API key | Yes |
| `RUNPOD_ENDPOINT_ID` | RunPod endpoint ID | Yes (default: rbgsokk5io7v6s) |

## Available Vibes

1. Old Money 💎
2. Office Siren 🔥
3. Airport Look ✈️
4. Cyberpunk Gamer 🎮
5. South Delhi 🛍️
6. Bali Bohemian 🌺
7. Mountain Mornings 🏔️
8. Phi Phi Island 🏝️
9. Dubai Rich 🤑
10. Santorini 🇬🇷
11. Himalayan Odyssey ⛰️
12. Emily in Paris 🗼
13. NYC Streets 🗽
14. Holi Calm 🎨

## Adding a New Vibe

1. Add vibe definition in `src/vibes.js`
2. Create folder in `public/assets/<vibe_id>/` with Male/, Female/, Background/
3. Deploy — that's it!

## API Routes

- `POST /api/submit` — Submit generation job to RunPod
- `GET /api/status/:jobId` — Poll job status
- `GET /api/assets/:vibeId/:gender` — Get random costume + background URLs

## Local Development

```bash
npm install
npm run dev
```

For local dev, create `.env.local`:
```
RUNPOD_API_KEY=your_key
RUNPOD_ENDPOINT_ID=rbgsokk5io7v6s
```

## Tech Stack

- **Frontend**: React 18 + Vite + PWA
- **Backend**: Vercel Serverless Functions
- **AI**: Qwen Image Edit 2511 + Lightning LoRA (4-step)
- **GPU**: RunPod Serverless (A40 48GB)
- **Workflow**: ComfyUI (official worker)
