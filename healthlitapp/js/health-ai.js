/* ============================================================
   CLEARCARE — HEALTH AI
   Direct Groq API calls. JSON field names match exactly what
   understand.js and prepare.js read from data.output.
   ============================================================ */

(function attachClearCareHealthAI(root) {

  function getSelectedLanguage() {
    const languageTools = root.ClearCareLanguages;
    if (!languageTools) return { code: 'en', label: 'English', instructionName: 'English' };
    return languageTools.getStoredLanguage(root.localStorage);
  }

async function requestLocalizedHealthOutput(taskType, input, signal) {
    const selectedLanguage = getSelectedLanguage();

    const response = await fetch('/api/health-output', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        taskType,
        language: selectedLanguage.code,
        input
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Failed to generate output');
      error.code = data.error;
      throw error;
    }

    return {
      output:   data.output,
      language: data.language
    };
  }

  root.ClearCareHealthAI = {
    requestLocalizedHealthOutput,
    getSelectedLanguage
  };

})(window);
