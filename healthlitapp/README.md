# ClearCare — Health Literacy & Resource Navigation Platform

> Congressional App Challenge 2026

A free, multilingual platform that helps underserved communities understand their medical documents, prepare for appointments, and find free care nearby.

---

## Live site

Deployed on Vercel — push to `main` branch to deploy automatically.

---

## Folder structure

```
healthlitapp/
├── index.html              ← Landing page
├── vercel.json             ← Vercel deployment config
├── css/
│   └── main.css            ← All styles (shared across pages)
├── js/
│   ├── main.js             ← Global interactions (nav, modals)
│   ├── understand.js       ← Understand page logic + AI stub
│   ├── prepare.js          ← Prepare page logic + AI stub
│   └── connect.js          ← Connect page logic + API stub
├── pages/
│   ├── understand.html     ← Upload & explain documents
│   ├── prepare.html        ← Appointment prep kit generator
│   ├── connect.html        ← Find nearby health resources
│   ├── onboarding.html     ← Language + preference setup
│   └── about.html          ← About the project
└── assets/                 ← Images, icons (add as needed)
```

---

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Framework preset: **Other** (static site)
4. Root directory: leave as-is
5. Click Deploy

---

## Adding the Gemini API (next step)

1. Get a free key at [aistudio.google.com](https://aistudio.google.com)
2. Create a `.env` file (never commit this):
   ```
   VITE_GEMINI_KEY=your_key_here
   ```
3. Replace the `setTimeout` stubs in `js/understand.js` and `js/prepare.js` with real API calls using the pattern in `js/ai.js` (to be created)

---

## Pages

| Page | Path | Status |
|------|------|--------|
| Landing | `/index.html` | ✅ Built |
| Understand | `/pages/understand.html` | ✅ Built (AI stub) |
| Prepare | `/pages/prepare.html` | ✅ Built (AI stub) |
| Connect | `/pages/connect.html` | ✅ Built (API stub) |
| Onboarding | `/pages/onboarding.html` | ✅ Built |
| About | `/pages/about.html` | ✅ Built |

---

## Tech stack

- Pure HTML + CSS + Vanilla JS (no build step required)
- Gemini 2.0 Flash API — free tier, no credit card
- HRSA Health Center API — free government data
- Google Places API — $200/month free credit
- Vercel — free hosting
- Supabase — (future) auth and saved documents

---

*Built with care for the people who need it most.*
