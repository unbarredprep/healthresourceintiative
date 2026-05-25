/* ============================================================
   CLEARCARE - PREPARE PAGE JS
   Generates localized appointment prep through Worker
   ============================================================ */

let prepareController = null;

async function buildPrepKit() {
  const condition = document.getElementById('condition').value.trim();
  const appointmentType = document.getElementById('apptType').value;
  const medications = document.getElementById('medications').value.trim();
  const symptoms = document.getElementById('symptoms').value.trim();

  if (!condition) {
    document.getElementById('condition').focus();
    document.getElementById('condition').style.borderColor = 'var(--red)';
    showPrepareStatus('Enter the condition or concern first.', 'error');
    return;
  }

  document.getElementById('condition').style.borderColor = '';

  const healthAI = window.ClearCareHealthAI;
  const language = healthAI.getSelectedLanguage();

  if (prepareController) prepareController.abort();
  prepareController = new AbortController();

  setPrepareLoading(true, `Generating in ${language.label}...`);
  document.getElementById('prepEmpty').style.display = 'none';

  try {
    const data = await healthAI.requestLocalizedHealthOutput('prepare', {
      condition,
      appointmentType,
      medications,
      symptoms
    }, prepareController.signal);

    renderPrepareOutput(data.output, data.language?.label || language.label);
    showPrepareStatus(`Generated in ${data.language?.label || language.label}.`, 'success');
  } catch (error) {
    if (error.name === 'AbortError') return;

    document.getElementById('prepEmpty').style.display = 'block';
    if (error.code === 'AI_NOT_CONFIGURED') {
      showPrepareStatus('Language-powered explanations are not configured yet. Please add GEMINI_API_KEY as a Cloudflare secret.', 'error');
      return;
    }

    showPrepareStatus('We could not build your prep kit right now. Please try again.', 'error');
  } finally {
    setPrepareLoading(false);
    prepareController = null;
  }
}

function renderPrepareOutput(output) {
  const safeOutput = output || {};

  document.getElementById('symptomSummary').textContent =
    safeOutput.appointmentSummary || 'No appointment summary was returned.';
  renderList('questionsList', safeOutput.topQuestionsToAsk);
  renderList('detailsToMentionList', safeOutput.symptomsDetailsToMention);
  renderChecklist('checklistItems', safeOutput.medicationsDocumentsToBring);
  renderList('redFlagsList', safeOutput.redFlagsToRaise);
  document.getElementById('prepareDisclaimer').textContent =
    safeOutput.disclaimer || 'ClearCare is not medical advice, does not diagnose conditions, and does not replace a licensed clinician. For emergencies, call 911 or local emergency services.';

  const prepResult = document.getElementById('prepResult');
  prepResult.style.display = 'block';
  prepResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderList(id, items) {
  const list = document.getElementById(id);
  const values = Array.isArray(items) && items.length ? items : ['No items were returned.'];
  list.innerHTML = values.map(item => `<li>${escapeHTML(String(item))}</li>`).join('');
}

function renderChecklist(id, items) {
  const list = document.getElementById(id);
  const values = Array.isArray(items) && items.length ? items : ['Bring any medical papers, medication bottles, and questions you want to ask.'];
  list.innerHTML = values.map(item => `
    <li>${escapeHTML(String(item))}</li>
  `).join('');
}

function setPrepareLoading(isLoading, message = '') {
  const button = document.getElementById('buildPrepButton');
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Generating...' : 'Build my prep kit';
  if (message) showPrepareStatus(message, 'success');
}

function showPrepareStatus(message, type = '') {
  const status = document.getElementById('prepareStatus');
  status.textContent = message;
  status.className = `inline-status ${type}`.trim();
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
