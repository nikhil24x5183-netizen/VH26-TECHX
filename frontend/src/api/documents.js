import { request } from './client';

export async function getDocuments() {
  return await request('/documents');
}

export async function getDocument(documentId) {
  return await request(`/documents/${documentId}`);
}

export async function uploadDocument(formData) {
  return await request('/documents/upload', {
    method: 'POST',
    body: formData
  });
}

export async function deleteDocument(documentId) {
  return await request(`/documents/${documentId}`, {
    method: 'DELETE'
  });
}
