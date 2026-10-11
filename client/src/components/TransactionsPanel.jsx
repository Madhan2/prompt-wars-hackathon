/**
 * TransactionsPanel — displays recent transactions executed in the simulated ledger
 */
import { useEffect, useState } from 'react';
import { getTransactions } from '../api/client.js';

export default function TransactionsPanel({ refreshTrigger }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function loadTransactions() {
    setLoading(true);
    getTransactions()
      .then(data => setTransactions(data.transactions || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTransactions();
  }, [refreshTrigger]);

  if (loading && transactions.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return <div className="error-msg">Failed to load transactions: {error}</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '32px 20px' }}>
        <div className="empty-state-icon" style={{ fontSize: '1.8rem' }}>🏛️</div>
        <div className="empty-state-text">No executed transactions recorded in this session yet.</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 6 }}>
          Approved transfers executed via the firewall will appear here in the audit log.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {transactions.length} transaction{transactions.length === 1 ? '' : 's'} recorded
        </span>
        <button className="btn btn-sm" onClick={loadTransactions}>
          ↻ Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {transactions.map(tx => (
          <div
            key={tx.txId}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--blue-400)', fontWeight: 600 }}>
                  {tx.txId}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: 8 }}>
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--approve-color)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                -${tx.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {tx.currency}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <span>
                From: <strong>{tx.fromOwner || tx.from}</strong> → To: <strong>{tx.to}</strong>
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                Status: {tx.status}
              </span>
            </div>

            {tx.memo && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Memo: {tx.memo}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
