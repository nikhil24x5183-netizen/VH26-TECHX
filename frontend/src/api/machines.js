import { request } from './client';

export async function getMachines() {
  return await request('/machines');
}

export async function getStats() {
  return await request('/stats');
}

export async function resetDatabase() {
  return await request('/reset', {
    method: 'POST'
  });
}

export async function getHealth() {
  return await request('/health');
}

