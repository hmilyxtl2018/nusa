# Nusa

Southeast Asian food intelligence. Photograph a meal; Nusa names the helpful compounds and the ones to watch — in the languages of the region.

Nusa 是面向东南亚多语言人群的餐盘智能体：拍下一餐，分别解读有益成分与功效、需留意成分与影响。

## What it does

1. **Language first** — English, Bahasa Indonesia, Bahasa Melayu, Thai, Vietnamese, Filipino, Simplified Chinese, Khmer, Lao, Burmese. Native names, no flags.
2. **Dietary profile** — Halal, vegetarian, vegan, Buddhist vegetarian, no beef; diabetes, blood pressure, pregnancy, gout, kidney, cholesterol; common allergies.
3. **Read the plate** — dish identity, balance score, beneficial compounds (with evidence strength), cautions, rough nutrition, diet flags.
4. **Ask Nusa** — follow-up questions about *this* meal (diabetes, halal, gentler eating, pairings).
5. **On-device history** — scans stay on the device. Not medical advice.

## Stack

React 19, TanStack Start, Tailwind v4, Zustand, xAI vision (`grok-4.5`) for plate analysis.

## Develop

```bash
npm install
npm run dev
```

The app expects `XAI_API_KEY` on the server for analysis. Photos are compressed on the client before they are sent.

Plate analysis runs in **two phases** (identity + deep nutrition/culture), validated with Zod and one repair retry. Optional server env knobs (see `.env.example`):

| Env | Default | Notes |
|---|---|---|
| `NUSA_VISION_DETAIL_PASS_A` | `auto` | Vision `detail` for fast identity pass |
| `NUSA_VISION_DETAIL_PASS_B` | `high` | Vision `detail` for deep pass |
| `NUSA_MODEL_PASS_A` | `grok-4.5` | Model for Pass A (falls back to `NUSA_MODEL_FALLBACK`) |
| `NUSA_MODEL_PASS_B` | `grok-4.5` | Model for Pass B |
| `NUSA_MODEL_ASK` | `grok-4.5` | Text-only follow-up (`askAboutPlate`, no image) |
| `NUSA_MODEL_FALLBACK` | `grok-4.6` | Used when primary returns 400/404 |

```bash
npm run typecheck
npm run build
```

## Deploy (Vercel)

Nusa is a TanStack Start app with server functions (`analyzePlate`, `askAboutPlate`). It cannot live on GitHub Pages. The build already uses Nitro’s Vercel preset.

**Do not keep running from the Grok preview.** Import the repo once:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hmilyxtl2018/nusa&env=XAI_API_KEY,VITE_AUTH_ENABLED&envDescription=XAI_API_KEY%20from%20console.x.ai.%20Set%20VITE_AUTH_ENABLED=false.&project-name=nusa&repository-name=nusa)

Or in the Vercel dashboard: **Add New → Project → Import** [`hmilyxtl2018/nusa`](https://github.com/hmilyxtl2018/nusa).

| Env | Value | Notes |
|---|---|---|
| `XAI_API_KEY` | `xai-…` | Server only. From [console.x.ai](https://console.x.ai). |
| `VITE_AUTH_ENABLED` | `false` | Required. If unset, the build turns sign-in **on**. |
| `DATABASE_URL` | *(omit)* | Leave empty. Auth is off; no Postgres needed. |

After the first deploy you get `https://nusa-….vercel.app`. Attach a custom domain under **Settings → Domains** (buy the name at Cloudflare or your registrar; point DNS to Vercel).

Hobby is enough to start. Read-plate calls can take 15–40s; the function timeout is set to 60s. Cap spend in the xAI console — every public visitor uses this key.

Cloudflare Workers is a later move (change Nitro `preset` and re-test vision body size). Do not start there.

## Promo

A 9:16 mobile film lives at [`docs/nusa-promo-mobile.mp4`](docs/nusa-promo-mobile.mp4) — photograph the meal, read both sides of the plate.