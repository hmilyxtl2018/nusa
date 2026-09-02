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

```bash
npm run typecheck
npm run build
```

## License

Private project unless you add a license.
