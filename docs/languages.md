# ClearCare Language Setup

ClearCare stores the selected language in `localStorage` as `clearcare_language`.
The approved language list lives in `healthlitapp/js/languages.js` and is shared by the browser UI and Cloudflare Worker.
The static website UI is translated through `/api/ui-translate`, and Understand/Prepare health outputs are generated through `/api/health-output`.

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

## Gemini Setup

The browser never receives the Gemini API key. The Worker uses it for:

- `/api/ui-translate` site interface translation
- `/api/health-output` localized Understand and Prepare outputs

Set the production secret with Wrangler:

```powershell
npx wrangler secret put GEMINI_API_KEY
```

You can also set it in the Cloudflare dashboard:

1. Open the Worker in Cloudflare.
2. Go to Settings.
3. Open Variables and Secrets.
4. Add `GEMINI_API_KEY` as a secret.
5. Redeploy the Worker.

Optional model override:

```powershell
npx wrangler secret put GEMINI_MODEL
```

By default, ClearCare uses `gemini-2.5-flash` for site translation and language-powered health outputs.

If `GEMINI_API_KEY` is missing, ClearCare still loads in English. Understand and Prepare show:

> Language-powered explanations are not configured yet. Please add GEMINI_API_KEY as a Cloudflare secret.

## Local Development

For local Worker development, use Wrangler secrets or a local `.dev.vars` file:

```txt
GEMINI_API_KEY=...
```

Do not commit `.env`, `.dev.vars`, or API keys.

## Adding a Language

1. Add a new object to `healthlitapp/js/languages.js`.
2. Include `code`, `label`, and `instructionName`.
3. Test the language modal and onboarding language list.
4. Test UI translation on the home, Understand, Prepare, Connect, and About pages.
5. Generate outputs on Understand and Prepare.

## Manual Verification

- Select Spanish, refresh the page, and confirm Spanish stays selected.
- Open the site in a fresh browser profile and confirm the language prompt appears.
- Select Spanish and confirm navigation, page headings, form labels, placeholders, and buttons translate.
- Generate an Understand output and confirm it is in Spanish.
- Select Nepali and generate a Prepare output.
- Remove or omit `GEMINI_API_KEY` and confirm the app shows the setup message instead of crashing.
- Confirm English is the default for new users.

ClearCare does not store uploaded medical documents. The Worker sends the text or supported image to Gemini only to generate the requested explanation or prep kit.
