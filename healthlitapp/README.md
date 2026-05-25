# ClearCare - Health Literacy & Resource Navigation Platform

Congressional App Challenge 2026 project for helping people understand medical information, prepare for appointments, and find nearby care resources.

## Live Site

This project is deployed with Cloudflare Workers and Static Assets.

## Folder Structure

```text
healthlitapp/
  index.html
  css/main.css
  js/
    languages.js
    main.js
    health-ai.js
    understand.js
    prepare.js
    connect.js
  pages/
    understand.html
    prepare.html
    connect.html
    onboarding.html
    about.html
  assets/
```

## Tech Stack

- Pure HTML, CSS, and vanilla JavaScript
- Cloudflare Workers with Static Assets
- OpenAI Responses API called only from the Worker
- HRSA Health Center Data
- OpenStreetMap, Overpass, and Nominatim public data

## Language-Powered Outputs

Understand and Prepare use the Cloudflare Worker route `/api/health-output` to generate plain-language healthcare outputs in the selected language.

Set the OpenAI key as a Cloudflare secret:

```powershell
npx wrangler secret put OPENAI_API_KEY
```

For local Worker development, add the key to `.dev.vars`:

```text
OPENAI_API_KEY=sk-...
```

Do not commit `.env`, `.dev.vars`, or API keys. See `../docs/languages.md` for supported languages, setup steps, and manual verification.

## Pages

| Page | Path | Status |
| --- | --- | --- |
| Home | `/index.html` | Built |
| Understand | `/pages/understand.html` | Built with localized AI output |
| Prepare | `/pages/prepare.html` | Built with localized AI output |
| Connect | `/pages/connect.html` | Built with public provider search |
| Onboarding | `/pages/onboarding.html` | Built |
| About | `/pages/about.html` | Built |

## Safety

ClearCare is not medical advice and does not diagnose or prescribe. Users should contact a licensed clinician for medical decisions and call 911 or local emergency services in an emergency.
