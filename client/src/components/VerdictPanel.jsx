import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Copy,
  Check,
  FileText,
  Lock
} from 'lucide-react';

export default function VerdictPanel({ result, loading }) {
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="empty-box" style={{ minHeight: 280 }}>
        <div className="spin-indicator" style={{ width: 28, height: 28, color: 'var(--accent-primary)' }} />
        <div className="empty-title" style={{ marginTop: 14 }}>Analyzing Banking Request</div>
        <div className="empty-desc">
          Evaluating input normalization, injection scans, policy bounds, and ledger authority…
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="empty-box" style={{ minHeight: 280 }}>
        <div className="empty-icon-circle">
          <Lock size={20} />
        </div>
        <div className="empty-title">Awaiting Request Input</div>
        <div className="empty-desc">
          Enter a natural-language payment request or choose a pre-configured scenario to view firewall analysis and security verdict.
        </div>
      </div>
    );
  }

  const decision = result.decision || 'REVIEW';
  const riskLevel = result.risk_level || 'LOW';
  const threatCategory = (result.threat_category || 'NONE').replace(/_/g, ' ');

  const isApprove = decision === 'APPROVE';
  const isBlock   = decision === 'BLOCK';
  const isReview  = decision === 'REVIEW';

  const statusClass = isApprove ? 'approve' : isBlock ? 'block' : 'review';
  const riskClass = riskLevel.toLowerCase();

  const handleCopy = () => {
    const jsonStr = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner Decision Card */}
      <div className={`scan-effect ${isBlock ? 'scan-effect-risk' : isReview ? 'scan-effect-warning' : ''}`} style={{
        background: isApprove ? 'var(--emerald-bg)' : isBlock ? 'var(--rose-bg)' : 'var(--amber-bg)',
        border: `1px solid ${isApprove ? 'var(--emerald-border)' : isBlock ? 'var(--rose-border)' : 'var(--amber-border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isApprove ? 'rgba(16, 185, 129, 0.2)' : isBlock ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: isApprove ? 'var(--emerald-text)' : isBlock ? 'var(--rose-text)' : 'var(--amber-text)'
          }}>
            {isApprove && <CheckCircle size={26} />}
            {isBlock && <ShieldAlert size={26} />}
            {isReview && <AlertTriangle size={26} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`status-tag ${statusClass}`} style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                {decision}
              </span>
              <span className={`risk-tag ${riskClass}`}>
                {riskLevel} RISK
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {isApprove && 'Passed all deterministic security controls and limit checks.'}
              {isBlock && 'Critical threat detected. Transaction blocked by defensive firewall.'}
              {isReview && 'Parameters require manual supervisor review before ledger dispatch.'}
            </div>
          </div>
        </div>

        <button 
          type="button"
          className="btn-secondary"
          onClick={handleCopy}
          style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          title="Copy verdict JSON payload"
        >
          {copied ? <><Check size={14} color="var(--emerald-text)" /> Copied</> : <><Copy size={14} /> Copy Verdict</>}
        </button>
      </div>

      {/* Rationale & Threat Metadata */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          PAYLOAD INSPECTION & ANALYSIS
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {result.rationale || 'Firewall completed multi-stage deterministic rules check.'}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 6,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>THREAT SIGNATURE</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: threatCategory === 'NONE' ? 'var(--emerald-text)' : 'var(--rose-text)', marginTop: 2 }}>
              {threatCategory}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>DEFENSE MODE</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
              {result.mode || 'Deterministic Engine'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>REVIEW STATUS</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: result.requires_review ? 'var(--amber-text)' : 'var(--text-muted)', marginTop: 2 }}>
              {result.requires_review ? 'Yes (Mandatory)' : 'No (Automated)'}
            </div>
          </div>

          {result.benign_exception_applied && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>CONTEXT GUARD</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--emerald-text)', marginTop: 2 }}>
                Benign Exception Applied
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Parsed Transaction Parameters */}
      {result.transaction && (
        <div style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileText size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
              Extracted Transaction Parameters
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recipient</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                {result.transaction.recipient || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Amount</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald-text)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {result.transaction.amount ? `$${Number(result.transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Payment Memo</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2, fontStyle: result.transaction.memo ? 'normal' : 'italic' }}>
                {result.transaction.memo || 'No memo provided'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors If Present */}
      {result.validation_errors && result.validation_errors.length > 0 && (
        <div style={{
          background: 'var(--rose-bg)',
          border: '1px solid var(--rose-border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
        }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--rose-text)', textTransform: 'uppercase', marginBottom: 6 }}>
            Validation Constraints Failed ({result.validation_errors.length})
          </div>
          <ul style={{ paddingLeft: 18, fontSize: '0.8rem', color: 'var(--rose-text)', lineHeight: 1.6 }}>
            {result.validation_errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
