import React, { useEffect, useState } from 'react';
import { getTransactions } from '../api/client.js';
import { RefreshCw, ArrowUpRight, CheckCircle2, ShieldCheck, Inbox } from 'lucide-react';

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
    let ignore = false;
    getTransactions()
      .then(data => {
        if (!ignore) setTransactions(data.transactions || []);
      })
      .catch(e => {
        if (!ignore) setError(e.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  if (loading && transactions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
        <div className="spin-indicator" style={{ width: 22, height: 22, color: 'var(--accent-primary)' }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Retrieving ledger audit logs…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <span>Failed to load ledger transactions: {error}</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="empty-box" style={{ padding: '48px 24px' }}>
        <div className="empty-icon-circle">
          <Inbox size={22} />
        </div>
        <div className="empty-title">No Ledger Transactions Recorded</div>
        <div className="empty-desc">
          Only transfers cleared by the security firewall and executed against the simulated bank ledger are permanently recorded here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {transactions.length} verified transaction{transactions.length === 1 ? '' : 's'} recorded
        </span>
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={loadTransactions} 
          disabled={loading}
          style={{ fontSize: '0.75rem', padding: '5px 12px' }}
        >
          <RefreshCw size={13} className={loading ? 'spin-indicator' : ''} />
          Refresh
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tx ID</th>
              <th>Timestamp</th>
              <th>Sender</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Memo</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.txId}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {tx.txId}
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {tx.fromOwner || tx.from}
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {tx.to}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--emerald-text)' }}>
                  ${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td>
                  <span className="status-tag approve" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                    <CheckCircle2 size={11} /> {tx.status || 'SETTLED'}
                  </span>
                </td>
                <td style={{ fontSize: '0.78rem', color: tx.memo ? 'var(--text-secondary)' : 'var(--text-dim)', fontStyle: tx.memo ? 'normal' : 'italic' }}>
                  {tx.memo || 'No memo'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
