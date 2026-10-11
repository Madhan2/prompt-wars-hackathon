import { useState, useEffect, useCallback } from 'react';
import './index.css';
import { analyzeRequest, executeTransfer, getHealth } from './api/client.js';
import VerdictPanel from './components/VerdictPanel.jsx';
import SecurityLog from './components/SecurityLog.jsx';
import AttackTestPanel from './components/AttackTestPanel.jsx';
import AccountsPanel from './components/AccountsPanel.jsx';
import TransactionsPanel from './components/TransactionsPanel.jsx';

function formatTime(d = new Date()) {
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function App() {
  // ── Form state ────────────────────────────────────────────────────────────
  const [request, setRequest]     = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount]       = useState('');
  const [memo, setMemo]           = useState('');

  // ── Analysis state ────────────────────────────────────────────────────────
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // ── Transfer state ────────────────────────────────────────────────────────
  const [transferring, setTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState(null);
  const [transferError, setTransferError]   = useState(null);
  const [ledgerTrigger, setLedgerTrigger]   = useState(0);

  // ── Log ───────────────────────────────────────────────────────────────────
  const [logEntries, setLogEntries] = useState([]);

  // ── Server health ─────────────────────────────────────────────────────────
  const [serverOnline, setServerOnline] = useState(null);

  // ── Active tab ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('analyze');

  // Check health on mount
  useEffect(() => {
    getHealth()
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));
  }, []);

  // ── Add to log ────────────────────────────────────────────────────────────
  const addToLog = useCallback((data, input) => {
    const preview = (input?.request || '').slice(0, 50) + ((input?.request || '').length > 50 ? '…' : '');
    setLogEntries(prev => [{
      decision: data.decision,
      threat_category: data.threat_category,
      preview,
      time: formatTime(),
    }, ...prev].slice(0, 50));
  }, []);

  // ── Submit analysis ───────────────────────────────────────────────────────
  async function handleAnalyze(e) {
    e?.preventDefault();
    if (!request.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setTransferResult(null);
    setTransferError(null);
    try {
      const data = await analyzeRequest({ request, recipient, amount, memo });
      setResult(data);
      addToLog(data, { request });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Execute transfer ──────────────────────────────────────────────────────
  async function handleTransfer() {
    if (!result || result.decision !== 'APPROVE') return;
    setTransferring(true);
    setTransferError(null);
    setTransferResult(null);
    try {
      const data = await executeTransfer({
        request,
        recipient: result.transaction?.recipient || recipient,
        amount: result.transaction?.amount || amount,
        memo: result.transaction?.memo || memo,
      });
      setTransferResult(data);
      setLedgerTrigger(t => t + 1);
    } catch (err) {
      setTransferError(err.message);
    } finally {
      setTransferring(false);
    }
  }

  const canTransfer = result?.decision === 'APPROVE' && result?.transaction;

  return (
    <div className="app-shell">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">🏦</div>
            <div className="logo-text">
              <h1>BankSim</h1>
              <span>AI Security Firewall</span>
            </div>
          </div>
          <div className="header-status">
            <div className="status-pill">
              <div className="status-dot" style={{
                background: serverOnline === false ? 'var(--red-400)' : 'var(--green-400)',
                boxShadow: `0 0 8px ${serverOnline === false ? 'var(--red-400)' : 'var(--green-400)'}`,
              }} />
              <span style={{ color: serverOnline === false ? 'var(--red-400)' : 'var(--green-400)' }}>
                {serverOnline === null ? 'Connecting…' : serverOnline ? 'Firewall Active' : 'Server Offline'}
              </span>
            </div>
            <div className="mode-badge">SIMULATED LEDGER</div>
          </div>
        </div>
      </header>

      {/* ─── Main Grid ──────────────────────────────────────────────────── */}
      <div className="main-grid">

        {/* ─── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="sidebar">

          {/* Request Form */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">📨 Banking Request</span>
            </div>
            <div className="panel-body">
              <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div className="field-group">
                  <label className="field-label" htmlFor="request-input">Natural Language Request</label>
                  <textarea
                    id="request-input"
                    className="field-textarea"
                    value={request}
                    onChange={e => setRequest(e.target.value)}
                    placeholder="e.g., Transfer $250 to Bob Martinez for the team lunch…"
                    rows={3}
                    maxLength={2000}
                  />
                  <span className="field-hint">{request.length}/2000 characters</span>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                    Structured Parameters (optional)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="field-group">
                      <label className="field-label" htmlFor="recipient-input">Recipient</label>
                      <input
                        id="recipient-input"
                        className="field-input"
                        type="text"
                        value={recipient}
                        onChange={e => setRecipient(e.target.value)}
                        placeholder="Alice Johnson, Bob Martinez…"
                        maxLength={200}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label" htmlFor="amount-input">Amount (USD)</label>
                      <input
                        id="amount-input"
                        className="field-input"
                        type="text"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="250.00"
                        maxLength={20}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label" htmlFor="memo-input">Payment Memo</label>
                      <input
                        id="memo-input"
                        className="field-input"
                        type="text"
                        value={memo}
                        onChange={e => setMemo(e.target.value)}
                        placeholder="Dinner split, rent, invoice #…"
                        maxLength={500}
                      />
                      <span className="field-hint">Memos are inspected as untrusted data for hidden instructions.</span>
                    </div>
                  </div>
                </div>

                {error && <div className="error-msg">⚠️ {error}</div>}

                <button
                  id="analyze-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !request.trim()}
                >
                  {loading
                    ? <><div className="spinner" /> Evaluating Security…</>
                    : '🔍 Analyze Request'}
                </button>

                {canTransfer && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      id="execute-transfer-btn"
                      type="button"
                      className="btn btn-primary"
                      style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', boxShadow: '0 4px 20px #065f4640' }}
                      onClick={handleTransfer}
                      disabled={transferring}
                    >
                      {transferring
                        ? <><div className="spinner" /> Authorizing…</>
                        : '💸 Authorize & Execute Transfer'}
                    </button>
                    {transferResult && (
                      <div style={{ background: 'var(--green-glow)', border: '1px solid var(--approve-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.78rem', color: 'var(--approve-color)' }}>
                        ✅ Transfer Completed — Tx ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{transferResult.transaction?.txId}</code>
                        <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Simulated Ledger: Account debited for verification.</div>
                      </div>
                    )}
                    {transferError && <div className="error-msg">❌ {transferError}</div>}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Test Accounts */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">🏛️ Accounts & Balances</span>
            </div>
            <div className="panel-body" style={{ padding: '14px 16px' }}>
              <AccountsPanel key={ledgerTrigger} />
            </div>
          </div>

          {/* Threat Legend */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">🗺️ Threat Categories</span>
            </div>
            <div className="panel-body" style={{ padding: '14px 16px' }}>
              {[
                { label: 'Prompt Injection', icon: '💉', color: 'var(--red-400)' },
                { label: 'Jailbreak', icon: '🔓', color: 'var(--red-400)' },
                { label: 'Policy Override', icon: '⚡', color: 'var(--red-400)' },
                { label: 'Malicious Memo', icon: '📝', color: 'var(--orange-400)' },
                { label: 'Obfuscation', icon: '🔀', color: 'var(--orange-400)' },
                { label: 'Data Exfiltration', icon: '📤', color: 'var(--orange-400)' },
                { label: 'Ambiguous Request', icon: '❓', color: 'var(--yellow-400)' },
                { label: 'Invalid Transaction', icon: '🚫', color: 'var(--text-muted)' },
              ].map(({ label, icon, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.78rem' }}>
                  <span style={{ fontSize: '0.85rem' }}>{icon}</span>
                  <span style={{ color }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* ─── Content Area ─────────────────────────────────────────────── */}
        <main className="content-area">

          {/* Tab Bar */}
          <div role="tablist" aria-label="Dashboard views" style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 4 }}>
            {[
              { id: 'analyze', label: '🔍 Analysis & Protection' },
              { id: 'tests', label: '🧪 Adversarial Tests' },
              { id: 'log', label: '📋 Security Activity' },
              { id: 'transactions', label: '🏛️ Ledger Audit' },
            ].map(tab => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                className="btn"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  fontSize: '0.8rem',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === tab.id ? 'var(--bg-hover)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: activeTab === tab.id ? '1px solid var(--border)' : '1px solid transparent',
                  transition: 'all var(--transition)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Analysis Tab */}
          {activeTab === 'analyze' && (
            <div id="tabpanel-analyze" role="tabpanel" aria-labelledby="tab-analyze" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Verdict */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">⚖️ Security Verdict</span>
                  {result && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 100,
                      border: '1px solid',
                      ...(result.decision === 'APPROVE'
                        ? { color: 'var(--approve-color)', borderColor: 'var(--approve-color)' }
                        : result.decision === 'BLOCK'
                        ? { color: 'var(--block-color)', borderColor: 'var(--block-color)' }
                        : { color: 'var(--review-color)', borderColor: 'var(--review-color)' })
                    }}>
                      {result.decision}
                    </span>
                  )}
                </div>
                <div className="panel-body">
                  <VerdictPanel result={result} loading={loading} />
                </div>
              </div>

              {/* How It Works */}
              {!result && !loading && (
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">ℹ️ Defense Architecture</span>
                  </div>
                  <div className="panel-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { step: '1', title: 'Validate Structure', desc: 'Input length and type constraints checked before processing.' },
                        { step: '2', title: 'Normalize & Decode', desc: 'Detects Base64, hex, l33t-speak and Unicode obfuscation.' },
                        { step: '3', title: 'Threat Detection', desc: 'Scans all fields for injection, jailbreaks, policy overrides and data exfil.' },
                        { step: '4', title: 'Policy Validation', desc: 'Deterministic rules verify recipient, amount limits, and authorizations.' },
                        { step: '5', title: 'Verdict Engine', desc: 'Authoritative backend gate — AI classification never overrides policies.' },
                        { step: '6', title: 'Fail Closed', desc: 'Any uncertainty or validation failure defaults to BLOCK or REVIEW.' },
                      ].map(({ step, title, desc }) => (
                        <div key={step} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{step}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{title}</span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attack Tests Tab */}
          {activeTab === 'tests' && (
            <div id="tabpanel-tests" role="tabpanel" aria-labelledby="tab-tests" className="panel">
              <div className="panel-header">
                <span className="panel-title">🧪 Adversarial Security Suite</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Automated test verification against server firewall</span>
              </div>
              <div className="panel-body">
                <div className="disclaimer-banner" style={{ marginBottom: 16 }}>
                  Simulated attack vectors evaluated against server security policies.
                </div>
                <AttackTestPanel
                  onResult={(data, input) => {
                    addToLog(data, input);
                  }}
                />
              </div>
            </div>
          )}

          {/* Event Log Tab */}
          {activeTab === 'log' && (
            <div id="tabpanel-log" role="tabpanel" aria-labelledby="tab-log" className="panel">
              <div className="panel-header">
                <span className="panel-title">📋 Security Event Log</span>
                <button
                  className="btn btn-sm"
                  onClick={() => setLogEntries([])}
                  disabled={logEntries.length === 0}
                >
                  Clear
                </button>
              </div>
              <div className="panel-body">
                <SecurityLog entries={logEntries} />
              </div>
            </div>
          )}

          {/* Ledger Audit Tab */}
          {activeTab === 'transactions' && (
            <div id="tabpanel-transactions" role="tabpanel" aria-labelledby="tab-transactions" className="panel">
              <div className="panel-header">
                <span className="panel-title">🏛️ Ledger Audit History</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Simulated account debit records</span>
              </div>
              <div className="panel-body">
                <TransactionsPanel refreshTrigger={ledgerTrigger} />
              </div>
            </div>
          )}

          {/* Footer disclaimer */}
          <div className="disclaimer-banner">
            🛡️ BankSim — Financial AI Security & Transaction Protection Platform. Operating with simulated ledger for security policy evaluation.
          </div>

        </main>
      </div>
    </div>
  );
}
