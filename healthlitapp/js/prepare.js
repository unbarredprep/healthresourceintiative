/* ============================================================
   CLEARCARE — PREPARE PAGE JS
   Calls Gemini API to generate appointment prep kits.
   Requires: js/config.js loaded before this file in prepare.html
   ============================================================ */

async function buildPrepKit() {
  const condition   = document.getElementById('condition').value.trim();
  const apptType    = document.getElementById('apptType').value;
  const medications = document.getElementById('medications').value.trim();
  const symptoms    = document.getElementById('symptoms').value.trim();
  const btn         = document.querySelector('[onclick="buildPrepKit()"]');

  if (!condition) {
    document.getElementById('condition').style.borderColor = 'var(--red)';
    document.getElementById('condition').focus();
    return;
  }
  document.getElementById('condition').style.borderColor = '';

  btn.textContent = 'Building your kit…';
  btn.disabled    = true;
  document.getElementById('prepEmpty').style.display  = 'none';
  document.getElementById('prepResult').style.display = 'none';

  try {
    const language = window.ClearCare?.getLangName() || 'English';

    const systemPrompt = `You are a helpful medical appointment preparation assistant.
Help patients prepare for their doctor visits.
Respond in ${language}.
Return ONLY a valid JSON object with these exact fields:
{
  "questions": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6", "question 7"],
  "symptomSummary": "A short paragraph the patient can read aloud to their doctor",
  "medicationList": ["medication 1", "medication 2"],
  "checklist": ["item 1", "item 2", "item 3", "item 4", "item 5"]
}
No markdown, no extra text, just the JSON.`;

    const userMessage = `
Condition: ${condition}
Appointment type: ${apptType || 'general'}
Current medications: ${medications || 'none listed'}
Symptoms: ${symptoms || 'none described'}
    `.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONFIG.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1000 }
        })
      }
    );

    const data    = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

   if (!rawText) throw new Error('Gemini returned an empty response. Check your API key in config.js.');

   // Strip any markdown fences Gemini might add
   const cleaned = rawText
  .replace(/```json/gi, '')
  .replace(/```/g, '')
  .trim();

   // Find the JSON object inside the response
   const jsonStart = cleaned.indexOf('{');
   const jsonEnd   = cleaned.lastIndexOf('}');

   if (jsonStart === -1 || jsonEnd === -1) {
     throw new Error('Could not find JSON in Gemini response. Raw response: ' + cleaned.substring(0, 200));
   }

   const result = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));

    document.getElementById('questionsList').innerHTML =
      (result.questions || []).map(q => `<li>${q}</li>`).join('');

    document.getElementById('symptomSummary').textContent = result.symptomSummary || '';

    document.getElementById('checklistItems').innerHTML =
      (result.checklist || []).map(item => `
        <li style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--blue-ghost);font-size:15px;color:var(--gray-700);">
          <input type="checkbox" style="width:18px;height:18px;accent-color:var(--blue-rich);cursor:pointer;flex-shrink:0;" />
          ${item}
        </li>
      `).join('');

    document.getElementById('prepResult').style.display = 'block';
    document.getElementById('prepResult').scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    document.getElementById('prepEmpty').style.display  = 'block';
    document.getElementById('prepEmpty').innerHTML = `
      <div style="font-size:32px;margin-bottom:12px;">❌</div>
      <div style="font-family:var(--font-display);font-size:18px;color:var(--navy);margin-bottom:8px;">Something went wrong</div>
      <div style="font-size:14px;color:var(--gray-500);">${err.message || 'Check your Gemini API key in js/config.js'}</div>
    `;
  } finally {
    btn.textContent = 'Build my prep kit';
    btn.disabled    = false;
  }
}
