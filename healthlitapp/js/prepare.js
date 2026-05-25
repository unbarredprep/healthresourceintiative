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

  const TASK_PROMPTS = {

    // Field names match exactly what understand.js reads
    understand: (language) => `You are a friendly medical document translator for ClearCare.
Explain the medical document in plain language at a 6th grade reading level.
Respond entirely in ${language}.
Return ONLY a valid JSON object with these exact fields, no markdown, no extra text:
{
  "simpleSummary": "2-3 sentence plain-language summary of what this document says",
  "whatThisMightMean": "1-2 sentences on what this means for the patient daily life",
  "importantInstructions": ["instruction 1", "instruction 2", "instruction 3"],
  "questionsToAskDoctor": ["question 1", "question 2", "question 3"],
  "whenToSeekUrgentHelp": ["warning sign 1", "warning sign 2"],
  "disclaimer": "ClearCare is not medical advice, does not diagnose conditions, and does not replace a licensed clinician. For emergencies, call 911 or local emergency services."
}`,

    // Field names match exactly what prepare.js reads
    prepare: (language) => `You are a helpful medical appointment preparation assistant for ClearCare.
Help the patient prepare for their upcoming doctor visit.
Respond entirely in ${language}.
Return ONLY a valid JSON object with these exact fields, no markdown, no extra text:
{
  "appointmentSummary": "A short paragraph the patient can read aloud to their doctor describing their situation",
  "topQuestionsToAsk": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6", "question 7"],
  "symptomsDetailsToMention": ["symptom or detail 1", "symptom or detail 2", "symptom or detail 3"],
  "medicationsDocumentsToBring": ["item to bring 1", "item to bring 2", "item to bring 3", "item to bring 4"],
  "redFlagsToRaise": ["red flag 1", "red flag 2"],
  "disclaimer": "ClearCare is not medical advice and does not diagnose conditions."
}`
  };

  async function requestLocalizedHealthOutput(taskType, input, signal) {
    const groqKey = root.CONFIG?.GROQ_KEY;
    if (!groqKey || groqKey.includes('paste')) {
      const error = new Error('Groq API key not set in js/config.js');
      error.code = 'AI_NOT_CONFIGURED';
      throw error;
    }

    const selectedLanguage = getSelectedLanguage();
    const systemPrompt     = TASK_PROMPTS[taskType]?.(selectedLanguage.instructionName);

    if (!systemPrompt) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    // Build user message from whatever input format is passed
    let userMessage = '';
    if (typeof input === 'string') {
      userMessage = input;
    } else if (input.documentText) {
      userMessage = `Please explain this medical document:\n\n${input.documentText}`;
    } else if (input.fileDataUrl) {
      userMessage = `The user uploaded a medical document image (${input.fileName || 'document'}). Image reading is not yet supported — please return a helpful template with placeholder text they can fill in.`;
    } else if (input.condition) {
      // Prepare page input
      userMessage = `Condition: ${input.condition}
Appointment type: ${input.appointmentType || 'general'}
Current medications: ${input.medications || 'none listed'}
Symptoms: ${input.symptoms || 'none described'}`;
    } else {
      userMessage = JSON.stringify(input);
    }

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
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage  }
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

    const cleaned   = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd   = cleaned.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Could not parse AI response. Please try again.');
    }

    const parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));

    // Return in the format both understand.js and prepare.js expect
    return {
      output:   parsed,
      language: {
        code:  selectedLanguage.code,
        label: selectedLanguage.label
      }
    };
  }

  root.ClearCareHealthAI = {
    requestLocalizedHealthOutput,
    getSelectedLanguage
  };

})(window);
