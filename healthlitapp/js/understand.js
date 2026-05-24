/* ============================================================
   CLEARCARE — UNDERSTAND PAGE JS
   Handles file upload UI and will call Gemini API in production
   ============================================================ */

function handleFile(input) {
  if (!input.files.length) return;
  const file = input.files[0];
  const zone = document.getElementById('uploadZone');

  zone.innerHTML = `
    <div class="upload-icon">⏳</div>
    <h3>Processing "${file.name}"…</h3>
    <p>Reading your document and generating a plain-language explanation</p>
  `;

  // TODO: In production, extract text from file then call Gemini API
  // import { explainDocument } from '../js/ai.js'
  // const text = await extractText(file)
  // const result = await explainDocument(text, localStorage.getItem('cc_lang') || 'English')

  // Simulated response for demo/prototype
  setTimeout(() => {
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('summaryText').textContent =
      'Your doctor found that your blood pressure is higher than normal. This is called hypertension. The medication prescribed helps relax your blood vessels so your heart does not have to work as hard.';
    document.getElementById('meansText').textContent =
      'You will need to take one pill every morning with food. Try to reduce salty foods and walk for 20 minutes a day if you can. Do not stop taking the medication without talking to your doctor first.';

    const warnings = document.getElementById('warningsArea');
    warnings.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="background:var(--red-light);border-radius:var(--radius-sm);padding:10px 14px;font-size:14px;color:#7F1D1D;">
          ⚠️ Call your doctor immediately if you feel chest pain, sudden dizziness, or have trouble breathing
        </div>
        <div style="background:var(--amber-light);border-radius:var(--radius-sm);padding:10px 14px;font-size:14px;color:#92400E;">
          ⚠️ Do not take this medication with grapefruit juice
        </div>
      </div>
    `;

    const steps = document.getElementById('nextStepsList');
    steps.innerHTML = [
      'Take your medication every morning at the same time',
      'Schedule a follow-up appointment in 2 weeks',
      'Check your blood pressure daily if you have a home monitor',
      'Avoid salty and processed foods',
      'Call the clinic if you experience any side effects'
    ].map(s => `<li>${s}</li>`).join('');

    document.getElementById('resultCard').style.display = 'block';
    document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 2200);
}
