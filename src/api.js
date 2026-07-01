const BASE = '/api';

async function request(url, options = {}) {
  const response = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return response.json();
}

export async function fetchLookups() {
  return request('/lookups');
}

export async function fetchRows(tableName) {
  return request(`/${tableName}`);
}

export async function createRow(tableName, data) {
  return request(`/${tableName}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRow(tableName, id, data) {
  return request(`/${tableName}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRow(tableName, id, options = {}) {
  const cascade = options.cascade ? '?cascade=1' : '';

  return request(`/${tableName}/${id}${cascade}`, {
    method: 'DELETE',
  });
}
