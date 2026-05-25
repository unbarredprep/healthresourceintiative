/* ============================================================
   CLEARCARE - UNDERSTAND PAGE JS
   Generates localized plain-language explanations through Worker
   ============================================================ */

let understandController = null;

async function handleFile(input) {
  if (!input.files.length) return;
  const file = input.files[0];
  const status = document.getElementById('understandStatus');

  clearUnderstandStatus();
  setFileName(file.name);

  if (file.size > 5 * 1024 * 1024) {
    showUnderstandStatus('This file is too large for the demo. Paste the important text into the box below.', 'error');
    return;
  }

  if (file.type.startsWith('text/') || /\.txt$/i.test(file.name)) {
    const text = await file.text();
    document.getElementById('documentTextInput').value = text.trim();
    showUnderstandStatus('Text added. You can review it, then generate an explanation.', 'success');
    document.getElementById('documentTextInput').focus();
    return;
  }

  if (file.type.startsWith('image/')) {
    showUnderstandStatus('Reading the image and generating an explanation...', 'success');
    await generateExplanation({ fileName: file.name, fileDataUrl: await readFileAsDataUrl(file) });
    return;
  }

  status.textContent = 'PDF text extraction is not available in this browser demo yet. Paste the document text below to generate an explanation.';
  status.className = 'inline-status error';
  translateUnderstandElement(status);
  document.getElementById('documentTextInput').focus();
}

async function generateExplanationFromText() {
  const documentText = document.getElementById('documentTextInput').value.trim();
  if (!documentText) {
    showUnderstandStatus('Paste medical document text first, then generate an explanation.', 'error');
    document.getElementById('documentTextInput').focus();
    return;
  }

  await generateExplanation({ documentText });
}

async function generateExplanation(input) {
  const healthAI = window.ClearCareHealthAI;
  const language = healthAI.getSelectedLanguage();

  if (understandController) understandController.abort();
  understandController = new AbortController();

  setUnderstandLoading(true, `Generating in ${language.label}...`);

  try {
    const data = await healthAI.requestLocalizedHealthOutput('understand', input, understandController.signal);
    renderUnderstandOutput(data.output, data.language?.label || language.label, input.fileName);
    showUnderstandStatus(`Generated in ${data.language?.label || language.label}.`, 'success');
  } catch (error) {
    if (error.name === 'AbortError') return;

    if (error.code === 'AI_NOT_CONFIGURED') {
      showUnderstandStatus('Language-powered explanations are not configured yet. Please add GEMINI_API_KEY as a Cloudflare secret.', 'error');
      return;
    }

    showUnderstandStatus('We could not generate the explanation right now. Please try again.', 'error');
  } finally {
    setUnderstandLoading(false);
    understandController = null;
  }
}

function renderUnderstandOutput(output, languageLabel, fileName = '') {
  const safeOutput = output || {};
  setFileName(fileName || `Generated in ${languageLabel}`);

  document.getElementById('summaryText').textContent = safeOutput.simpleSummary || 'No summary was returned.';
  document.getElementById('meansText').textContent = safeOutput.whatThisMightMean || 'No explanation was returned.';
  renderList('instructionsList', safeOutput.importantInstructions);
  renderList('doctorQuestionsList', safeOutput.questionsToAskDoctor);
  renderList('urgentHelpList', safeOutput.whenToSeekUrgentHelp);
  document.getElementById('understandDisclaimer').textContent =
    safeOutput.disclaimer || 'ClearCare is not medical advice, does not diagnose conditions, and does not replace a licensed clinician. For emergencies, call 911 or local emergency services.';

  const resultCard = document.getElementById('resultCard');
  resultCard.style.display = 'block';
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderList(id, items) {
  const list = document.getElementById(id);
  const values = Array.isArray(items) && items.length ? items : ['No items were returned.'];
  list.innerHTML = values.map(item => `<li>${escapeHTML(String(item))}</li>`).join('');
}

function setUnderstandLoading(isLoading, message = '') {
  const button = document.getElementById('generateExplanationButton');
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Generating...' : 'Generate explanation';
  translateUnderstandElement(button);
  if (message) showUnderstandStatus(message, 'success');
}

function showUnderstandStatus(message, type = '') {
  const status = document.getElementById('understandStatus');
  status.textContent = message;
  status.className = `inline-status ${type}`.trim();
  translateUnderstandElement(status);
}

function clearUnderstandStatus() {
  showUnderstandStatus('');
}

function setFileName(fileName) {
  document.getElementById('fileName').textContent = fileName || '';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function translateUnderstandElement(element) {
  window.ClearCareI18n?.translateElement(element, { refreshOriginals: true });
}
