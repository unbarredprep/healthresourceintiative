/* ============================================================
   CLEARCARE — PREPARE PAGE JS
   Calls Groq API to generate appointment prep kits.
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
Return ONLY a valid JSON object with these exact fields, no markdown, no extra text:
{
  "questions": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6", "question 7"],
  "symptomSummary": "A short paragraph the patient can read aloud to their doctor",
  "medicationList": ["medication 1", "medication 2"],
  "checklist": ["item 1", "item 2", "item 3", "item 4", "item 5"]
}`;

    const userMessage = `Condition: ${condition}
Appointment type: ${apptType || 'general'}
Current medications: ${medications || 'none listed'}
Symptoms: ${symptoms || 'none described'}`;

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
        temperature: 0.3,
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
      <div style="font-size:14px;color:var(--gray-500);">${err.message}</div>
    `;
  } finally {
    btn.textContent = 'Build my prep kit';
    btn.disabled    = false;
  }
}
