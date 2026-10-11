const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function analyzeRequest(payload) {
  const res = await fetch(`${API}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${res.status}`);
  }
  return res.json();
}

export async function executeTransfer(payload) {
  const res = await fetch(`${API}/api/transactions/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Transfer failed: ${res.status}`);
  return data;
}

export async function getAccounts() {
  const res = await fetch(`${API}/api/accounts`);
  if (!res.ok) throw new Error('Failed to load accounts');
  return res.json();
}

// Backward-compatible alias
export const getDemoAccounts = getAccounts;

export async function getTransactions() {
  const res = await fetch(`${API}/api/transactions`);
  if (!res.ok) throw new Error('Failed to load transaction history');
  return res.json();
}

export async function getHealth() {
  const res = await fetch(`${API}/api/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}
