/* ============================================================
   CLEARCARE — UNDERSTAND PAGE JS
   Calls Groq API to explain uploaded medical documents.
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
    // Step 1: Extract text from the file
    const text = await extractText(file);

    if (!text || text.trim().length < 10) {
      throw new Error('Could not read text from this file. Please try a different file or type out the key details below.');
    }

    const language = window.ClearCare?.getLangName() || 'English';

    const systemPrompt = `You are a friendly medical document translator.
Explain the document in plain language at a 6th grade reading level.
Respond in ${language}.
Return ONLY a valid JSON object with these exact fields, no markdown, no extra text:
{
  "summary": "2-3 sentence plain-language summary",
  "whatThisMeans": "what this means for the patient daily life",
  "warnings": ["warning 1", "warning 2"],
  "nextSteps": ["step 1", "step 2", "step 3"]
}`;

    const userMessage = `Please explain this medical document in plain language:\n\n${text.substring(0, 3000)}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage  }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    const data    = await response.json();
    console.log('Groq raw response:', JSON.stringify(data));
    const rawText = data.choices?.[0]?.message?.content || '';

    if (!rawText) throw new Error('No response from Groq. Check your API key in config.js.');

    const cleaned   = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd   = cleaned.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Could not parse response. Raw: ' + cleaned.substring(0, 200));
    }

    const result = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));

    // Render results
    document.getElementById('fileName').textContent    = file.name;
    document.getElementById('summaryText').textContent = result.summary;
    document.getElementById('meansText').textContent   = result.whatThisMeans;

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
      <p>${err.message}</p>
      <br/><span class="btn btn-primary" style="cursor:pointer;" onclick="location.reload()">Try again</span>
    `;
  }
}

// ── Extract text from uploaded file ──
async function extractText(file) {
  const type = file.type;

  // Plain text files
  if (type === 'text/plain') {
    return await file.text();
  }

  // For PDF and images — read as text if possible, otherwise prompt user
  if (type === 'application/pdf') {
    // Basic PDF text extraction — works for text-based PDFs
    const arrayBuffer = await file.arrayBuffer();
    const bytes       = new Uint8Array(arrayBuffer);
    let text          = '';
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 32 && bytes[i] < 127) {
        text += String.fromCharCode(bytes[i]);
      }
    }
    // Pull out readable chunks
    const readable = text.match(/[A-Za-z0-9\s,.\-:;'"!?()]{20,}/g) || [];
    return readable.join(' ');
  }

  // For images — ask user to describe or type the content
  if (type.startsWith('image/')) {
    throw new Error('Image files are not yet supported. Please type out the key details from your document in the text box instead, or upload a PDF.');
  }

  throw new Error('Unsupported file type. Please upload a PDF or text file.');
}
