/* ============================================================
   CLEARCARE — HEALTH AI
   Replaces /api/health-output with direct Groq API calls.
   Requires: js/config.js loaded before this file.
   ============================================================ */

(function attachClearCareHealthAI(root) {

  function getSelectedLanguage() {
    const languageTools = root.ClearCareLanguages;
    if (!languageTools) return { code: 'en', label: 'English', instructionName: 'English' };
    return languageTools.getStoredLanguage(root.localStorage);
  }

  const TASK_PROMPTS = {
    understand: (language) => `You are a friendly medical document translator for ClearCare.
Explain the medical document in plain language at a 6th grade reading level.
Respond entirely in ${language}.
Return ONLY a valid JSON object with these exact fields, no markdown, no extra text:
{
  "summary": "2-3 sentence plain-language summary of what this document says",
  "whatThisMeans": "1-2 sentences on what this means for the patient's daily life",
  "instructions": ["key instruction 1", "key instruction 2", "key instruction 3"],
  "doctorQuestions": ["question to ask doctor 1", "question to ask doctor 2", "question to ask doctor 3"],
  "urgentHelp": ["warning sign to watch for 1", "warning sign to watch for 2"],
  "disclaimer": "ClearCare is not medical advice and does not diagnose conditions."
}`,

    prepare: (language) => `You are a helpful medical appointment preparation assistant for ClearCare.
Help the patient prepare for their upcoming doctor visit.
Respond entirely in ${language}.
Return ONLY a valid JSON object with these exact fields, no markdown, no extra text:
{
  "questions": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6", "question 7"],
  "symptomSummary": "A short paragraph the patient can read aloud to their doctor",
  "medicationList": ["medication 1", "medication 2"],
  "checklist": ["item to bring or do 1", "item 2", "item 3", "item 4", "item 5"]
}`
  };

  async function requestLocalizedHealthOutput(taskType, input, signal) {
    const groqKey = root.CONFIG?.GROQ_KEY;
    if (!groqKey || groqKey.includes('paste')) {
      throw new Error('Groq API key not set. Please add your key to js/config.js.');
    }

    const selectedLanguage = getSelectedLanguage();
    const systemPrompt     = TASK_PROMPTS[taskType]?.(selectedLanguage.instructionName);

    if (!systemPrompt) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    const userMessage = typeof input === 'string'
      ? input
      : JSON.stringify(input);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      signal,
      body: JSON.stringify({
        model:    'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt  },
          { role: 'user',   content: userMessage   }
        ],
        temperature: 0.2,
        max_tokens:  1500
      })
    });

    const data    = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';

    if (!rawText) {
      throw new Error('No response from Groq. Check your API key in js/config.js.');
    }

    // Safely extract JSON from response
    const cleaned   = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd   = cleaned.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Could not parse AI response. Please try again.');
    }

    return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
  }

  root.ClearCareHealthAI = {
    requestLocalizedHealthOutput,
    getSelectedLanguage
  };

})(window);
