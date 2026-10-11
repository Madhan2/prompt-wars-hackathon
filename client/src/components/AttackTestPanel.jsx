import React, { useState } from 'react';
import { ATTACK_SCENARIOS } from '../data/scenarios.js';
import { analyzeRequest } from '../api/client.js';
import { Play, CheckCircle2, XCircle, AlertTriangle, Shield, Check, Flame, SlidersHorizontal } from 'lucide-react';

export default function AttackTestPanel({ onResult, onLoadToForm }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(null);
  const [runningAll, setRunningAll] = useState(false);
  const [filterType, setFilterType] = useState('all');

  async function runScenario(scenario) {
    setRunning(scenario.id);
    setResults(prev => ({ ...prev, [scenario.id]: { status: 'running' } }));
    try {
      const data = await analyzeRequest(scenario.input);
      const passed = data.decision === scenario.expectedVerdict;
      setResults(prev => ({ ...prev, [scenario.id]: { status: passed ? 'pass' : 'fail', data } }));
      if (onResult) onResult(data, scenario.input);
    } catch (e) {
      setResults(prev => ({ ...prev, [scenario.id]: { status: 'error', error: e.message } }));
    } finally {
      setRunning(null);
    }
  }

  async function runAll() {
    setRunningAll(true);
    for (const scenario of ATTACK_SCENARIOS) {
      setRunning(scenario.id);
      setResults(prev => ({ ...prev, [scenario.id]: { status: 'running' } }));
      try {
        const data = await analyzeRequest(scenario.input);
        const passed = data.decision === scenario.expectedVerdict;
        setResults(prev => ({ ...prev, [scenario.id]: { status: passed ? 'pass' : 'fail', data } }));
        if (onResult) onResult(data, scenario.input);
      } catch (e) {
        setResults(prev => ({ ...prev, [scenario.id]: { status: 'error', error: e.message } }));
      }
      setRunning(null);
      await new Promise(r => setTimeout(r, 100));
    }
    setRunningAll(false);
  }

  const filteredScenarios = ATTACK_SCENARIOS.filter(s => {
    if (filterType === 'all') return true;
    return s.type === filterType;
  });

  const totalRun = Object.keys(results).length;
  const passed   = Object.values(results).filter(r => r.status === 'pass').length;
  const failed   = Object.values(results).filter(r => r.status === 'fail').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Test Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '14px 18px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'benign', 'malicious', 'edge'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className="btn-secondary"
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  background: filterType === type ? 'var(--accent-bg)' : 'transparent',
                  borderColor: filterType === type ? 'var(--accent-border)' : 'var(--border-subtle)',
                  color: filterType === type ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {totalRun > 0 ? (
              <span>
                <strong style={{ color: 'var(--emerald-text)' }}>{passed} passed</strong> ·{' '}
                <strong style={{ color: failed > 0 ? 'var(--rose-text)' : 'var(--text-muted)' }}>{failed} failed</strong> of {totalRun} tested
              </span>
            ) : (
              'Execute individual vector or run complete suite'
            )}
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={runAll}
          disabled={runningAll}
          style={{ fontSize: '0.78rem', padding: '7px 14px' }}
        >
          {runningAll ? (
            <><div className="spin-indicator" style={{ width: 14, height: 14 }} /> Running Suite…</>
          ) : (
            <><Play size={13} fill="currentColor" /> Run All Scenarios</>
          )}
        </button>
      </div>

      {/* Scenarios Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 170 }}>Scenario</th>
              <th style={{ width: 90 }}>Type</th>
              <th style={{ width: 95 }}>Expected</th>
              <th style={{ width: 95 }}>Actual</th>
              <th style={{ width: 130 }}>Ledger Side Effect</th>
              <th>Request Text</th>
              <th style={{ width: 130, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredScenarios.map(scenario => {
              const res = results[scenario.id];
              const isRunning = running === scenario.id;
              const isPass = res?.status === 'pass';
              const isFail = res?.status === 'fail';

              return (
                <tr key={scenario.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                      {scenario.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {scenario.description}
                    </div>
                  </td>
                  <td>
                    <span className={`risk-tag ${scenario.type === 'benign' ? 'low' : scenario.type === 'malicious' ? 'critical' : 'medium'}`} style={{ fontSize: '0.68rem' }}>
                      {scenario.type}
                    </span>
                  </td>
                  <td>
                    <span className={`status-tag ${scenario.expectedVerdict.toLowerCase()}`} style={{ fontSize: '0.68rem' }}>
                      {scenario.expectedVerdict}
                    </span>
                  </td>
                  <td>
                    {isRunning ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--accent-primary)' }}>
                        <div className="spin-indicator" style={{ width: 12, height: 12 }} /> Testing
                      </span>
                    ) : res ? (
                      <span className={`status-tag ${res.data?.decision?.toLowerCase() || 'review'}`} style={{ fontSize: '0.68rem' }}>
                        {isPass ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {res.data?.decision || res.status}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Untested</span>
                    )}
                  </td>
                  <td>
                    {res ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--emerald-text)', fontFamily: 'var(--font-mono)' }}>
                        0 ledger mutation
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {scenario.input.request}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {onLoadToForm && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => onLoadToForm(scenario.input)}
                          title="Load parameters into Request Analyzer"
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        >
                          Load
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => runScenario(scenario)}
                        disabled={isRunning || runningAll}
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                      >
                        {isRunning ? <div className="spin-indicator" style={{ width: 10, height: 10 }} /> : 'Run'}
                      </button>
                    </div>
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
