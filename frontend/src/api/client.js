/**
 * Centralized Fetch API Client for MaintAI.
 * Automatically handles base headers, error parsing, and API error states.
 */

const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;
  
  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const apiKey = localStorage.getItem('maint_ai_gemini_key');
  if (apiKey && !headers['X-API-Key']) {
    headers['X-API-Key'] = apiKey;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.message || errorDetail;
      } catch (e) {
        // Not JSON
      }
      throw new Error(errorDetail);
    }

    return await response.json();
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err);
    throw err;
  }
}
