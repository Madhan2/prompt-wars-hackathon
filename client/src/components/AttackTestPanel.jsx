import React, { useState } from 'react';
import { ATTACK_SCENARIOS } from '../data/scenarios.js';
import { analyzeRequest } from '../api/client.js';
import { Play, CheckCircle2, XCircle } from 'lucide-react';

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
              <th style={{ width: 170 }}>SCENARIO ID</th>
              <th style={{ width: 90 }}>TYPE</th>
              <th style={{ width: 95 }}>EXPECTED</th>
              <th style={{ width: 95 }}>ACTUAL</th>
              <th style={{ width: 130 }}>LEDGER SIDE EFFECT</th>
              <th>REQUEST TEXT</th>
              <th style={{ width: 130, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredScenarios.map(scenario => {
              const res = results[scenario.id];
              const isRunning = running === scenario.id;
              const isPass = res?.status === 'pass';

              return (
                <tr key={scenario.id} className="scan-effect">
                  <td style={{ verticalAlign: 'top', paddingTop: '14px', paddingBottom: '14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: '0.68rem', marginRight: 8, padding: '3px 6px', background: 'rgba(14, 165, 233, 0.15)', borderRadius: '3px', border: '1px solid rgba(14, 165, 233, 0.3)', letterSpacing: '0.05em', display: 'inline-block', verticalAlign: 'middle' }}>
                        ATK-{String(scenario.scenarioNumber).padStart(3, '0')}
                      </span>
                      <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>{scenario.label}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {scenario.description}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'middle', paddingTop: '14px', paddingBottom: '14px' }}>
                    <span className={`risk-tag ${scenario.type === 'benign' ? 'low' : scenario.type === 'malicious' ? 'critical' : 'medium'}`} style={{ fontSize: '0.68rem' }}>
                      {scenario.type}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'middle', paddingTop: '14px', paddingBottom: '14px' }}>
                    <span className={`status-tag ${scenario.expectedVerdict.toLowerCase()}`} style={{ fontSize: '0.68rem' }}>
                      {scenario.expectedVerdict}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'middle', paddingTop: '14px', paddingBottom: '14px' }}>
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
                  <td style={{ verticalAlign: 'middle', paddingTop: '14px', paddingBottom: '14px' }}>
                    {res ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--emerald-text)', fontFamily: 'var(--font-mono)' }}>
                        0 ledger mutation
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', verticalAlign: 'middle', paddingTop: '14px', paddingBottom: '14px' }}>
                    {scenario.input.request}
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingTop: '14px', paddingBottom: '14px' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {onLoadToForm && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => onLoadToForm(scenario.input)}
                          title="Load parameters into Request Analyzer"
                          style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                        >
                          Load
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => runScenario(scenario)}
                        disabled={isRunning || runningAll}
                        style={{ fontSize: '0.72rem', padding: '5px 10px' }}
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
