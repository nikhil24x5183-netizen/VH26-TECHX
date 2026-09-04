import { request } from './client';

export async function sendChatMessage({ question, selected_machine, api_key, previous_context }) {
  return await request('/chat', {
    method: 'POST',
    body: JSON.stringify({
      question,
      selected_machine,
      api_key,
      previous_context
    })
  });
}

export async function clarifyAmbiguity({ query_term, selected_machine }) {
  return await request('/chat/clarify', {
    method: 'POST',
    body: JSON.stringify({ query_term, selected_machine })
  });
}

export async function searchManuals({ query, selected_machine }) {
  return await request('/search', {
    method: 'POST',
    body: JSON.stringify({ query, selected_machine })
  });
}

export async function submitFeedback({ question, answer, feedback_type, comments }) {
  return await request('/feedback', {
    method: 'POST',
    body: JSON.stringify({ question, answer, feedback_type, comments })
  });
}

export async function runEvaluation() {
  return await request('/evaluation');
}
