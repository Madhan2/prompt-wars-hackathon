import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { analyzeRequest, executeTransfer, getHealth, getAccounts, getTransactions } from './api/client.js';
import VerdictPanel from './components/VerdictPanel.jsx';
import SecurityLog from './components/SecurityLog.jsx';
import AttackTestPanel from './components/AttackTestPanel.jsx';
import AccountsPanel from './components/AccountsPanel.jsx';
import TransactionsPanel from './components/TransactionsPanel.jsx';

import {
  Shield,
  LayoutDashboard,
  Search,
  History,
  FlaskConical,
  Settings,
  RefreshCw,
  Send,
  Menu,
  X,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Landmark
} from 'lucide-react';

function formatTime(d = new Date()) {
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function App() {
  // ── Navigation & Shell State ──────────────────────────────────────────────
  const [activePage, setActivePage] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Form State ────────────────────────────────────────────────────────────
  const [request, setRequest]     = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount]       = useState('');
  const [memo, setMemo]           = useState('');

  // ── Analysis & Transfer State ─────────────────────────────────────────────
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const [transferring, setTransferring]     = useState(false);
  const [transferResult, setTransferResult] = useState(null);
  const [transferError, setTransferError]   = useState(null);
  const [ledgerTrigger, setLedgerTrigger]   = useState(0);

  // ── Security Audit Log ────────────────────────────────────────────────────
  const [logEntries, setLogEntries] = useState([]);

  // ── Connection & Backend Status ───────────────────────────────────────────
  // null = connecting, true = online, false = offline
  const [serverOnline, setServerOnline] = useState(null);
  const [healthData, setHealthData]     = useState(null);
  const [healthChecking, setHealthChecking] = useState(false);

  // ── System Accounts & Tx Counts (for dashboard metrics) ────────────────────
  const [accountCount, setAccountCount] = useState(5);
  const [txCount, setTxCount] = useState(0);

  // Health check function
  const checkServerHealth = useCallback(async () => {
    setHealthChecking(true);
    try {
      const data = await getHealth();
      setServerOnline(true);
      setHealthData(data);
    } catch {
      setServerOnline(false);
      setHealthData(null);
    } finally {
      setHealthChecking(false);
    }
  }, []);

  // Poll health on mount and every 30s
  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000);
    return () => clearInterval(interval);
  }, [checkServerHealth]);

  // Load transaction and account counts for real stats
  useEffect(() => {
    getTransactions().then(d => {
      if (d.transactions) setTxCount(d.transactions.length);
    }).catch(() => {});

    getAccounts().then(d => {
      if (d.accounts) setAccountCount(d.accounts.length);
    }).catch(() => {});
  }, [ledgerTrigger]);

  // ── Audit Logging Helper ──────────────────────────────────────────────────
  const addToLog = useCallback((data, input) => {
    const preview = (input?.request || '').slice(0, 60) + ((input?.request || '').length > 60 ? '…' : '');
    setLogEntries(prev => [{
      decision: data.decision,
      threat_category: data.threat_category,
      risk_level: data.risk_level,
      preview,
      time: formatTime(),
    }, ...prev].slice(0, 100));
  }, []);

  // ── Submit Analysis ───────────────────────────────────────────────────────
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
      setError(err.message || 'Server communication failure');
    } finally {
      setLoading(false);
    }
  }

  // ── Execute Transfer ──────────────────────────────────────────────────────
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
      setTransferError(err.message || 'Execution error');
    } finally {
      setTransferring(false);
    }
  }

  // Pre-load a scenario into the analyzer form
  const handleLoadScenario = (input) => {
    setRequest(input.request || '');
    setRecipient(input.recipient || '');
    setAmount(input.amount || '');
    setMemo(input.memo || '');
    setActivePage('analyzer');
    setResult(null);
    setTransferResult(null);
    setTransferError(null);
  };

  // Metrics derived from live log
  const approvedCount = logEntries.filter(e => e.decision === 'APPROVE').length;
  const reviewCount   = logEntries.filter(e => e.decision === 'REVIEW').length;
  const blockedCount  = logEntries.filter(e => e.decision === 'BLOCK').length;
  const totalAnalyzed = logEntries.length;

  const canTransfer = result?.decision === 'APPROVE' && result?.transaction;

  // Navigation Items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyzer', label: 'Request Analyzer', icon: Search },
    { id: 'ledger', label: 'Transaction Security', icon: Landmark },
    { id: 'activity', label: 'Security Activity', icon: History },
    { id: 'testing', label: 'Testing Center', icon: FlaskConical },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      <div 
        className={`mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* ─── Navigation Sidebar ────────────────────────────────────────── */}
      <aside className={`app-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-icon">
              <Shield size={20} strokeWidth={2.4} />
            </div>
            <div className="brand-info">
              <span className="brand-name">BankSim</span>
              <span className="brand-tag">AI Firewall and Guardrail Defense</span>
            </div>
          </div>
          <button
            type="button"
            className="menu-toggle-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          <div className="nav-section-label">Operations</div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="ledger-spec-badge">
            <span className="ledger-spec-title">Firewall Policy</span>
            <span className="ledger-spec-val">Deterministic Engine</span>
          </div>
          <div className="ledger-spec-badge">
            <span className="ledger-spec-title">Ledger Sandbox</span>
            <span className="ledger-spec-val">Isolated Banking Core</span>
          </div>
        </div>
      </aside>

      {/* ─── App Main Content ──────────────────────────────────────────── */}
      <div className="app-main">
        {/* Top Navigation Bar */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button 
              type="button" 
              className="menu-toggle-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={18} />
            </button>
            <div className="breadcrumbs">
              <span className="breadcrumb-root">BankSim</span>
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-current">
                {navItems.find(i => i.id === activePage)?.label}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Real Connection Status Pill */}
            <div className={`conn-status-pill ${serverOnline === null ? 'connecting' : serverOnline ? 'online' : 'offline'}`}>
              <div className="pulse-dot" />
              <span>
                {serverOnline === null ? 'Connecting…' : serverOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <button
              type="button"
              className="topbar-icon-btn"
              onClick={checkServerHealth}
              disabled={healthChecking}
              title="Refresh backend status"
              aria-label="Refresh connection health"
            >
              <RefreshCw size={14} className={healthChecking ? 'spin-indicator' : ''} />
            </button>
          </div>
        </header>

        {/* Dynamic Page Router */}
        <main className="page-container">

          {/* ══════════════════════════════════════════════════════════════════
              PAGE 1: OVERVIEW
             ══════════════════════════════════════════════════════════════════ */}
          {activePage === 'overview' && (
            <>
              {/* Overview Header Banner */}
              <div className="dashboard-header">
                <div className="dashboard-title-group">
                  <h2>Financial Transaction Security Overview</h2>
                  <p>
                    Defensive AI gateway protecting core banking ledgers against prompt injections, policy overrides, 
                    unauthorized fund routing, and malicious payment memos.
                  </p>
                </div>
                <button 
                  type="button" 
                  className="quick-action-btn"
                  onClick={() => setActivePage('analyzer')}
                >
                  <Search size={15} />
                  Analyze New Request
                </button>
              </div>

              {/* Real Metrics KPI Grid */}
              <div className="metrics-grid">
                <div className="metric-card scan-effect">
                  <div className="metric-header">
                    <span className="metric-label" style={{ fontFamily: 'var(--font-mono)' }}>ANALYZED</span>
                    <div className="metric-icon-box total"><History size={16} /></div>
                  </div>
                  <div className="metric-value">{totalAnalyzed}</div>
                  <div className="metric-subtext">Session audit events</div>
                </div>

                <div className="metric-card scan-effect">
                  <div className="metric-header">
                    <span className="metric-label" style={{ fontFamily: 'var(--font-mono)' }}>APPROVED</span>
                    <div className="metric-icon-box approve"><CheckCircle size={16} /></div>
                  </div>
                  <div className="metric-value" style={{ color: 'var(--emerald-text)' }}>{approvedCount}</div>
                  <div className="metric-subtext">Clean & policy compliant</div>
                </div>

                <div className="metric-card scan-effect">
                  <div className="metric-header">
                    <span className="metric-label" style={{ fontFamily: 'var(--font-mono)' }}>REVIEW</span>
                    <div className="metric-icon-box review"><AlertTriangle size={16} /></div>
                  </div>
                  <div className="metric-value" style={{ color: 'var(--amber-text)' }}>{reviewCount}</div>
                  <div className="metric-subtext">Ambiguous / missing parameters</div>
                </div>

                <div className="metric-card scan-effect">
                  <div className="metric-header">
                    <span className="metric-label" style={{ fontFamily: 'var(--font-mono)' }}>BLOCKED</span>
                    <div className="metric-icon-box block"><ShieldAlert size={16} /></div>
                  </div>
                  <div className="metric-value" style={{ color: 'var(--rose-text)' }}>{blockedCount}</div>
                  <div className="metric-subtext">Adversarial attacks prevented</div>
                </div>
              </div>

              {/* Two Column Section: Recent Events + Defense Specs */}
              <div className="grid-3col">
                <div className="card-panel">
                  <div className="card-panel-header">
                    <div className="card-panel-title">
                      <History size={17} color="var(--accent-primary)" />
                      Recent Security Events
                    </div>
                    {logEntries.length > 0 && (
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={() => setActivePage('activity')}
                        style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                      >
                        View Full Log
                      </button>
                    )}
                  </div>
                  <div className="card-panel-body" style={{ padding: 0 }}>
                    <SecurityLog entries={logEntries.slice(0, 5)} />
                  </div>
                </div>

                <div className="card-panel">
                  <div className="card-panel-header">
                    <div className="card-panel-title">
                      <Shield size={17} color="var(--accent-primary)" />
                      Gateway Defense Stack
                    </div>
                  </div>
                  <div className="card-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { title: 'Structural Bounds', desc: '16KB payload and length validation protects against memory overflow' },
                      { title: 'Decoding Guard', desc: 'Detects base64, hex, l33t-speak and zero-width unicode injection' },
                      { title: 'Deterministic Policy', desc: 'Authoritative limit and recipient validation cannot be bypassed by LLM' },
                      { title: 'Fail-Closed Gate', desc: 'Unrecognized or uncertain requests automatically default to BLOCK' }
                    ].map((step, idx) => (
                      <div key={idx} style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 14px'
                      }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {step.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {step.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PAGE 2: REQUEST ANALYZER (PRIMARY INTERACTION)
             ══════════════════════════════════════════════════════════════════ */}
          {activePage === 'analyzer' && (
            <div className="grid-2col">
              {/* Left Column: Form & Quick Scenarios */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="card-panel">
                  <div className="card-panel-header">
                    <div className="card-panel-title">
                      <Search size={17} color="var(--accent-primary)" />
                      Banking Request Intake
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Firewall Protected
                    </span>
                  </div>

                  <div className="card-panel-body">
                    <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="request-text">
                          <span>Natural Language Request</span>
                          <span className="form-label-meta">{request.length}/2000</span>
                        </label>
                        <textarea
                          id="request-text"
                          className="form-textarea"
                          value={request}
                          onChange={e => setRequest(e.target.value)}
                          placeholder="e.g. Please send $250 to Bob Martinez for the quarterly team lunch…"
                          rows={3}
                          maxLength={2000}
                          required
                        />
                        <span className="form-helper">
                          Full prompt scanned for adversarial injections, system prompt leak attempts, and jailbreaks.
                        </span>
                      </div>

                      {/* Structured Parameters Accordion-like Box */}
                      <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                          Optional Structured Parameters
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" htmlFor="recipient-field">Recipient</label>
                          <input
                            id="recipient-field"
                            type="text"
                            className="form-input"
                            value={recipient}
                            onChange={e => setRecipient(e.target.value)}
                            placeholder="e.g. Bob Martinez, Alice Johnson"
                            maxLength={200}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" htmlFor="amount-field">Amount (USD)</label>
                          <input
                            id="amount-field"
                            type="text"
                            className="form-input"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="e.g. 250.00"
                            maxLength={20}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" htmlFor="memo-field">Payment Memo</label>
                          <input
                            id="memo-field"
                            type="text"
                            className="form-input"
                            value={memo}
                            onChange={e => setMemo(e.target.value)}
                            placeholder="e.g. Team lunch reimbursement"
                            maxLength={500}
                          />
                          <span className="form-helper" style={{ marginTop: 4 }}>
                            Memos are isolated as untrusted data and scanned for hidden instructions.
                          </span>
                        </div>
                      </div>

                      {error && (
                        <div className="error-banner">
                          <AlertTriangle size={16} />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        id="analyze-submit-btn"
                        type="submit"
                        className="btn-primary"
                        disabled={loading || !request.trim()}
                      >
                        {loading ? (
                          <><div className="spin-indicator" /> Evaluating Security Policies…</>
                        ) : (
                          <><Search size={15} /> Analyze Request</>
                        )}
                      </button>

                      {/* Transfer Execution CTA when APPROVE */}
                      {canTransfer && (
                        <div style={{
                          background: 'var(--emerald-bg)',
                          border: '1px solid var(--emerald-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10
                        }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--emerald-text)', fontWeight: 600 }}>
                            Firewall Approved — Ready for Ledger Settlement
                          </div>

                          <button
                            type="button"
                            className="btn-success"
                            onClick={handleTransfer}
                            disabled={transferring}
                          >
                            {transferring ? (
                              <><div className="spin-indicator" /> Authorizing Transfer…</>
                            ) : (
                              <><Send size={15} /> Execute & Debit Ledger</>
                            )}
                          </button>

                          {transferResult && (
                            <div className="success-banner" style={{ marginTop: 4 }}>
                              <CheckCircle size={16} />
                              <div>
                                Transfer Settled — Tx ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{transferResult.transaction?.txId}</code>
                              </div>
                            </div>
                          )}

                          {transferError && (
                            <div className="error-banner">
                              <AlertTriangle size={16} />
                              <span>{transferError}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Column: Security Verdict Panel */}
              <div>
                <div className="card-panel" style={{ height: '100%' }}>
                  <div className="card-panel-header">
                    <div className="card-panel-title">
                      <Shield size={17} color="var(--accent-primary)" />
                      Security Verdict & Policy Result
                    </div>
                  </div>
                  <div className="card-panel-body">
                    <VerdictPanel result={result} loading={loading} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PAGE 3: TRANSACTION SECURITY & LEDGER AUDIT
             ══════════════════════════════════════════════════════════════════ */}
          {activePage === 'ledger' && (
            <div className="grid-3col">
              <div className="card-panel">
                <div className="card-panel-header">
                  <div className="card-panel-title">
                    <Landmark size={17} color="var(--accent-primary)" />
                    Simulated Ledger Audit Trail
                  </div>
                </div>
                <div className="card-panel-body">
                  <TransactionsPanel refreshTrigger={ledgerTrigger} />
                </div>
              </div>

              <div className="card-panel">
                <div className="card-panel-header">
                  <div className="card-panel-title">
                    <Shield size={17} color="var(--accent-primary)" />
                    Authorized Accounts
                  </div>
                </div>
                <div className="card-panel-body">
                  <AccountsPanel 
                    key={ledgerTrigger} 
                    onSelectRecipient={(name) => {
                      setRecipient(name);
                      setActivePage('analyzer');
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PAGE 4: SECURITY ACTIVITY LOG
             ══════════════════════════════════════════════════════════════════ */}
          {activePage === 'activity' && (
            <div className="card-panel">
              <div className="card-panel-header">
                <div className="card-panel-title">
                  <History size={17} color="var(--accent-primary)" />
                  Comprehensive Security Activity Log
                </div>
              </div>
              <div className="card-panel-body">
                <SecurityLog 
                  entries={logEntries} 
                  onClear={() => setLogEntries([])} 
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PAGE 5: TESTING CENTER
             ══════════════════════════════════════════════════════════════════ */}
          {activePage === 'testing' && (
            <div className="card-panel">
              <div className="card-panel-header">
                <div className="card-panel-title">
                  <FlaskConical size={17} color="var(--accent-primary)" />
                  Automated Adversarial Testing Suite
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Evaluates against live backend firewall policies
                </span>
              </div>
              <div className="card-panel-body">
                <AttackTestPanel 
                  onResult={addToLog} 
                  onLoadToForm={handleLoadScenario}
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PAGE 6: SETTINGS
             ══════════════════════════════════════════════════════════════════ */}
          {activePage === 'settings' && (
            <div className="card-panel">
              <div className="card-panel-header">
                <div className="card-panel-title">
                  <Settings size={17} color="var(--accent-primary)" />
                  Firewall Gateway Configuration
                </div>
              </div>
              <div className="card-panel-body" style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="info-banner">
                  <Shield size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Production Safeguards Active</strong>: Configuration settings represent enforced security invariants configured on the server environment.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>Backend Firewall Service</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>http://localhost:3001/api</div>
                    </div>
                    <span className={`status-tag ${serverOnline ? 'approve' : 'block'}`}>
                      {serverOnline ? 'Connected' : 'Offline'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>Classification Engine Mode</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Deterministic Multi-Stage Rule Engine</div>
                    </div>
                    <span className="status-tag approve">
                      {healthData?.mode || 'DETERMINISTIC'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>Maximum Transfer Limit</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Single transaction ceiling before mandatory block/review</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      $50,000.00 USD
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>Fail-Closed Enforcement</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Server errors or malformed input immediately deny ledger access</div>
                    </div>
                    <span className="status-tag approve">
                      ENFORCED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-divider" />
          <p className="footer-text">
            Developed with love <span className="footer-heart">♥</span> and security awareness by <span className="footer-author">Madhan Vigneswaran</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
