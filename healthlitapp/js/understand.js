/* ============================================================
   CLEARCARE — UNDERSTAND PAGE JS
   Calls Gemini API to explain uploaded medical documents.
   Requires: js/config.js loaded before this file in understand.html
   ============================================================ */

async function handleFile(input) {
  if (!input.files.length) return;
  const file = input.files[0];
  const zone = document.getElementById('uploadZone');

  zone.innerHTML = `
    <div class="upload-icon">⏳</div>
    <h3>Reading "${file.name}"…</h3>
    <p>Translating your document into plain language</p>
  `;

  try {
    const base64  = await fileToBase64(file);
    const language = window.ClearCare?.getLangName() || 'English';

    const systemPrompt = `You are a friendly medical document translator.
Explain the document in plain language at a 6th grade reading level.
Respond in ${language}.
Return ONLY a valid JSON object with these exact fields:
{
  "summary": "2-3 sentence plain-language summary",
  "whatThisMeans": "what this means for the patient daily life",
  "warnings": ["warning 1", "warning 2"],
  "nextSteps": ["step 1", "step 2", "step 3"]
}
No markdown, no extra text, just the JSON.`;

    const content = [
      { inlineData: { mimeType: file.type, data: base64 } },
      { text: "Please explain this medical document." }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONFIG.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: content }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
        })
      }
    );

    const data    = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const result  = JSON.parse(rawText.replace(/```json|```/g, '').trim());

    document.getElementById('fileName').textContent      = file.name;
    document.getElementById('summaryText').textContent   = result.summary;
    document.getElementById('meansText').textContent     = result.whatThisMeans;

    const warnings = document.getElementById('warningsArea');
    warnings.innerHTML = (result.warnings || []).map(w => `
      <div style="background:var(--red-light);border-radius:var(--radius-sm);padding:10px 14px;font-size:14px;color:#7F1D1D;margin-bottom:8px;">
        ⚠️ ${w}
      </div>
    `).join('');

    document.getElementById('nextStepsList').innerHTML =
      (result.nextSteps || []).map(s => `<li>${s}</li>`).join('');

    document.getElementById('resultCard').style.display = 'block';
    document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    zone.innerHTML = `
      <div class="upload-icon">❌</div>
      <h3>Something went wrong</h3>
      <p>${err.message || 'Please check your Gemini API key in js/config.js'}</p>
      <br/><span class="btn btn-primary" onclick="location.reload()">Try again</span>
    `;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
