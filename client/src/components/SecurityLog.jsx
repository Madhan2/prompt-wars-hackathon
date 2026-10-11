/**
 * SecurityLog — shows recent analysis events
 */
export default function SecurityLog({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '24px 20px' }}>
        <div className="empty-state-icon" style={{ fontSize: '1.5rem' }}>📋</div>
        <div className="empty-state-text" style={{ fontSize: '0.78rem' }}>No events yet. Analyze a request to see logs.</div>
      </div>
    );
  }

  return (
    <div className="log-list">
      {entries.map((entry, i) => (
        <div key={i} className="log-entry fade-in">
          <div className={`log-dot ${entry.decision?.toLowerCase()}`} />
          <div className="log-text">
            <strong>{entry.decision}</strong>
            {' — '}
            {entry.threat_category && entry.threat_category !== 'NONE'
              ? entry.threat_category.replace(/_/g, ' ')
              : 'Clean request'}
            {' · '}
            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
              {entry.preview}
            </span>
          </div>
          <div className="log-time">{entry.time}</div>
        </div>
      ))}
    </div>
  );
}
