(function attachClearCareHealthAI(root) {
  const HEALTH_OUTPUT_ENDPOINT = '/api/health-output';

  function getSelectedLanguage() {
    const languageTools = root.ClearCareLanguages;
    if (!languageTools) return { code: 'en', label: 'English', instructionName: 'English' };
    return languageTools.getStoredLanguage(root.localStorage);
  }

  async function requestLocalizedHealthOutput(taskType, input, signal) {
    const selectedLanguage = getSelectedLanguage();
    const response = await fetch(HEALTH_OUTPUT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal,
      body: JSON.stringify({
        taskType,
        language: selectedLanguage.code,
        input
      })
    });

    const data = await readJsonResponse(response);
    if (!response.ok) {
      const error = new Error(data.message || 'Language output failed.');
      error.code = data.error || 'AI_OUTPUT_FAILED';
      error.status = response.status;
      throw error;
    }

    return data;
  }

  async function readJsonResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('The language service returned an unexpected response.');
    }

    return response.json();
  }

  root.ClearCareHealthAI = {
    requestLocalizedHealthOutput,
    getSelectedLanguage
  };
})(window);
