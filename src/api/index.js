export async function getHealthOutput({ taskType, language, input }, signal) {
  const res = await fetch('/api/health-output', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({ taskType, language, input })
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to generate output');
    err.code = data.error;
    throw err;
  }
  return data;
}

export async function searchConnect(params, signal) {
  const res = await fetch('/api/connect/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify(params)
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Search failed');
    err.code = data.error;
    throw err;
  }
  return data;
}

export async function translateStrings(language, strings) {
  const res = await fetch('/api/ui-translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, strings })
  });
  if (!res.ok) return {};
  const data = await res.json();
  return data.translations || {};
}
