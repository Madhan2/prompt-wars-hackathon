import React from 'react';
import { Clock, Shield, AlertTriangle, ShieldCheck, ShieldAlert, FileText } from 'lucide-react';

export default function SecurityLog({ entries, onClear }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="empty-box" style={{ padding: '48px 24px' }}>
        <div className="empty-icon-circle">
          <Shield size={20} />
        </div>
        <div className="empty-title">No Security Events Recorded</div>
        <div className="empty-desc">
          Evaluated requests, threat alerts, and automated policy decisions will appear in this real-time audit log.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing {entries.length} recent audit event{entries.length === 1 ? '' : 's'}
        </span>
        {onClear && (
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClear} 
            style={{ fontSize: '0.74rem', padding: '5px 10px' }}
          >
            Clear Log
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 100 }}>Time</th>
              <th style={{ width: 110 }}>Decision</th>
              <th style={{ width: 100 }}>Risk Level</th>
              <th style={{ width: 160 }}>Threat Category</th>
              <th>Request Summary</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const isApprove = entry.decision === 'APPROVE';
              const isBlock = entry.decision === 'BLOCK';
              const isReview = entry.decision === 'REVIEW';
              const statusClass = isApprove ? 'approve' : isBlock ? 'block' : 'review';
              const riskClass = (entry.risk_level || 'low').toLowerCase();

              return (
                <tr key={idx}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {entry.time}
                  </td>
                  <td>
                    <span className={`status-tag ${statusClass}`} style={{ fontSize: '0.7rem' }}>
                      {entry.decision}
                    </span>
                  </td>
                  <td>
                    <span className={`risk-tag ${riskClass}`} style={{ fontSize: '0.68rem' }}>
                      {entry.risk_level || (isApprove ? 'LOW' : isBlock ? 'CRITICAL' : 'MEDIUM')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', fontWeight: 600, color: isApprove ? 'var(--text-secondary)' : isBlock ? 'var(--rose-text)' : 'var(--amber-text)' }}>
                    {entry.threat_category && entry.threat_category !== 'NONE'
                      ? entry.threat_category.replace(/_/g, ' ')
                      : 'None (Clean)'}
                  </td>
                  <td style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                    {entry.preview}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
