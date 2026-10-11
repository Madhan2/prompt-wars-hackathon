/**
 * VerdictPanel — displays the BankSim security analysis verdict
 */
export default function VerdictPanel({ result, loading }) {
  if (loading) {
    return (
      <div className="verdict-panel empty" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div className="spinner" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Evaluating request against firewall policies…</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="verdict-panel empty">
        <div className="empty-state">
          <div className="empty-state-icon">🛡️</div>
          <div className="empty-state-text">
            Submit a banking request to evaluate security and transaction policies.
          </div>
        </div>
      </div>
    );
  }

  const cls = result.decision?.toLowerCase() || 'empty';
  const decisionIcon = { APPROVE: '✅', BLOCK: '🚫', REVIEW: '⚠️' }[result.decision] || '❓';

  const riskClass = {
    LOW: 'badge-low',
    MEDIUM: 'badge-medium',
    HIGH: 'badge-high',
    CRITICAL: 'badge-critical',
  }[result.risk_level] || 'badge-threat';

  const threatLabel = (result.threat_category || 'NONE').replace(/_/g, ' ');

  return (
    <div className={`verdict-panel ${cls} fade-in`} style={{ position: 'relative' }}>
      <div className="verdict-header">
        <span className="verdict-label">Security Verdict</span>
        <span style={{ fontSize: '1.2rem' }}>{decisionIcon}</span>
      </div>

      <div className="verdict-decision" style={{ marginBottom: 14 }}>
        {result.decision}
      </div>

      <div className="verdict-badges">
        <span className={`badge ${riskClass}`}>
          ⚡ {result.risk_level} RISK
        </span>
        <span className="badge badge-threat">
          🔍 {threatLabel}
        </span>
        {result.requires_review && (
          <span className="badge badge-medium">⚙️ REVIEW REQUIRED</span>
        )}
        {result.benign_exception_applied && (
          <span className="badge badge-low">🟢 CONTEXT GUARD ACTIVE</span>
        )}
      </div>

      <p className="rationale">{result.rationale}</p>

      {result.validation_errors && result.validation_errors.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Validation Issues
          </div>
          {result.validation_errors.map((e, i) => (
            <div key={i} style={{ fontSize: '0.78rem', color: 'var(--review-color)', marginBottom: 4 }}>
              • {e}
            </div>
          ))}
        </div>
      )}

      {result.transaction && (
        <div>
          <hr className="divider" />
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
            Parsed Transaction Details
          </div>
          <div className="tx-grid">
            <span className="tx-key">Recipient</span>
            <span className="tx-val">{result.transaction.recipient}</span>
            <span className="tx-key">Amount</span>
            <span className="tx-val" style={{ color: 'var(--blue-400)' }}>
              ${result.transaction.amount?.toLocaleString()} {result.transaction.currency}
            </span>
            {result.transaction.memo && (
              <>
                <span className="tx-key">Payment Memo</span>
                <span className="tx-val">{result.transaction.memo}</span>
              </>
            )}
            <span className="tx-key">Authorization Status</span>
            <span className="tx-val" style={{ color: 'var(--approve-color)' }}>
              {result.transaction.status}
            </span>
          </div>
          <div className="disclaimer-banner" style={{ marginTop: 14 }}>
            {result.transaction.notice || result.transaction.note || 'Simulated Ledger: Authorization required before settlement.'}
          </div>
        </div>
      )}

      {result.is_balance_inquiry && result.decision === 'APPROVE' && (
        <div style={{ marginTop: 14, padding: '12px', background: 'var(--blue-glow)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--blue-400)', marginBottom: 4 }}>Balance Inquiry Approved</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Retrieve balance via <code style={{ color: 'var(--blue-400)' }}>GET /api/accounts</code>
          </div>
        </div>
      )}
    </div>
  );
}
