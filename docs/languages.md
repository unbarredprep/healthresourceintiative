# ClearCare Language Setup

ClearCare stores the selected language in `localStorage` as `clearcare_language`.
The approved language list lives in `healthlitapp/js/languages.js` and is shared by the browser UI and Cloudflare Worker.

## Supported Languages

- English (`en`)
- Spanish (`es`)
- Nepali (`ne`)
- Hindi (`hi`)
- Arabic (`ar`)
- Vietnamese (`vi`)
- Chinese Simplified (`zh`)
- French (`fr`)
- Urdu (`ur`)
- Korean (`ko`)

## OpenAI Setup

Understand and Prepare call the Cloudflare Worker route `/api/health-output`.
The browser never receives the OpenAI API key.

Set the production secret with Wrangler:

```powershell
npx wrangler secret put OPENAI_API_KEY
```

You can also set it in the Cloudflare dashboard:

1. Open the Worker in Cloudflare.
2. Go to Settings.
3. Open Variables and Secrets.
4. Add `OPENAI_API_KEY` as a secret.
5. Redeploy the Worker.

Optional model override:

```powershell
npx wrangler secret put OPENAI_MODEL
```

If `OPENAI_API_KEY` is missing, ClearCare shows:

> Language-powered explanations are not configured yet. Please add OPENAI_API_KEY as a Cloudflare secret.

## Local Development

For local Worker development, use Wrangler secrets or a local `.dev.vars` file:

```txt
OPENAI_API_KEY=sk-...
```

Do not commit `.env`, `.dev.vars`, or API keys.

## Adding a Language

1. Add a new object to `healthlitapp/js/languages.js`.
2. Include `code`, `label`, and `instructionName`.
3. Test the language modal and onboarding language list.
4. Generate outputs on Understand and Prepare.

## Manual Verification

- Select Spanish, refresh the page, and confirm Spanish stays selected.
- Generate an Understand output and confirm it is in Spanish.
- Select Nepali and generate a Prepare output.
- Remove or omit `OPENAI_API_KEY` and confirm the app shows the setup message instead of crashing.
- Confirm English is the default for new users.

ClearCare does not store uploaded medical documents. The Worker sends the text or supported image to OpenAI only to generate the requested explanation or prep kit.
