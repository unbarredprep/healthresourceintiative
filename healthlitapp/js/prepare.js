/* ============================================================
   CLEARCARE — PREPARE PAGE JS
   Handles prep kit form and will call Gemini API in production
   ============================================================ */

function buildPrepKit() {
  const condition = document.getElementById('condition').value.trim();
  const apptType  = document.getElementById('apptType').value;

  if (!condition) {
    document.getElementById('condition').focus();
    document.getElementById('condition').style.borderColor = 'var(--red)';
    return;
  }
  document.getElementById('condition').style.borderColor = '';

  // TODO: In production, call Gemini API
  // import { buildAppointmentPrep } from '../js/ai.js'
  // const result = await buildAppointmentPrep({ condition, appointmentType: apptType, medications, language })

  // Simulated response for demo
  document.getElementById('prepEmpty').style.display = 'none';

  setTimeout(() => {
    const questions = [
      `What caused my ${condition || 'condition'} and is it serious?`,
      'What are my treatment options and which do you recommend?',
      'Are there any lifestyle changes I should make?',
      'What side effects should I watch for with any new medication?',
      'When should I come back for a follow-up?',
      'Is there anything I should avoid doing or eating?',
      'Who should I call if I have questions or feel worse?'
    ];
    document.getElementById('questionsList').innerHTML =
      questions.map(q => `<li>${q}</li>`).join('');

    document.getElementById('symptomSummary').textContent =
      `"I have been experiencing issues related to ${condition || 'my condition'}. I wanted to come in today to understand more about what is happening and what I can do about it."`;

    const checklist = [
      'Bring a photo ID and any insurance cards',
      'Bring a list of all medications you are currently taking',
      'Write down your symptoms and when they started',
      'Bring this printed question list',
      'Arrive 15 minutes early to fill out paperwork',
      'Bring a trusted friend or family member if possible'
    ];
    document.getElementById('checklistItems').innerHTML = checklist.map(item => `
      <li style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--blue-ghost);font-size:15px;color:var(--gray-700);">
        <input type="checkbox" style="width:18px;height:18px;accent-color:var(--blue-rich);cursor:pointer;flex-shrink:0;" />
        ${item}
      </li>
    `).join('');

    document.getElementById('prepResult').style.display = 'block';
    document.getElementById('prepResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 1200);
}
