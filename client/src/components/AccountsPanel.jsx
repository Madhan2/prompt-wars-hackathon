/**
 * AccountsPanel — shows authorized test accounts from the BankSim ledger
 */
import { useEffect, useState } from 'react';
import { getAccounts } from '../api/client.js';

export default function AccountsPanel() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAccounts()
      .then(data => setAccounts(data.accounts || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
      <div className="spinner" />
    </div>
  );

  if (error) return <div className="error-msg">Failed to load accounts: {error}</div>;

  return (
    <div>
      <div className="accounts-list">
        {accounts.map(acc => (
          <div key={acc.id} className="account-card">
            <div className="account-info">
              <span className="account-name">{acc.owner}</span>
              <span className="account-id">{acc.id}</span>
            </div>
            <span className="account-bal">
              ${acc.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
      <div className="disclaimer-banner" style={{ marginTop: 12 }}>
        Simulated Ledger: Test accounts configured for security evaluation. No live financial institution connected.
      </div>
    </div>
  );
}
