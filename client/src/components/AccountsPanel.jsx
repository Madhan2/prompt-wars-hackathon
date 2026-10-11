import React, { useEffect, useState } from 'react';
import { getAccounts } from '../api/client.js';
import { Landmark, AlertCircle, User } from 'lucide-react';

export default function AccountsPanel({ onSelectRecipient }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAccounts()
      .then(data => setAccounts(data.accounts || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
        <div className="spin-indicator" style={{ width: 20, height: 20, color: 'var(--accent-primary)' }} />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Loading ledger accounts…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <AlertCircle size={16} />
        <span>Failed to load accounts: {error}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {accounts.map(acc => {
          const isPrimary = acc.id === 'ACC001';
          return (
            <div 
              key={acc.id}
              onClick={() => onSelectRecipient && !isPrimary && onSelectRecipient(acc.owner)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: onSelectRecipient && !isPrimary ? 'pointer' : 'default',
                transition: 'all var(--transition-fast)'
              }}
              className="account-row-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-xs)',
                  background: isPrimary ? 'var(--accent-bg)' : 'var(--bg-card-subtle)',
                  color: isPrimary ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {acc.owner}
                    {isPrimary && (
                      <span style={{ fontSize: '0.65rem', background: 'var(--accent-bg)', color: 'var(--accent-primary)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                        YOU
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {acc.id} · {acc.status || 'ACTIVE'}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  USD
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="info-banner" style={{ marginTop: 4 }}>
        <Landmark size={15} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>Simulated Bank Ledger</strong>: Isolated sandbox accounts. Click any non-primary counterparty to populate the recipient field.
        </span>
      </div>
    </div>
  );
}
