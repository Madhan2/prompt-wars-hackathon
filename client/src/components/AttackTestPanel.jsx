/**
 * AttackTestPanel — one-click attack scenarios with expected vs. actual results
 */
import { useState } from 'react';
import { ATTACK_SCENARIOS } from '../data/scenarios.js';
import { analyzeRequest } from '../api/client.js';

const TYPE_COLORS = {
  benign:    'var(--green-400)',
  malicious: 'var(--red-400)',
  edge:      'var(--yellow-400)',
};

const TYPE_LABELS = {
  benign: 'SAFE',
  malicious: 'ATTACK',
  edge: 'EDGE CASE',
};

export default function AttackTestPanel({ onResult }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(null);
  const [runningAll, setRunningAll] = useState(false);

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
      await new Promise(r => setTimeout(r, 120)); // small delay between tests
    }
    setRunningAll(false);
  }

  const totalRun = Object.keys(results).length;
  const passed   = Object.values(results).filter(r => r.status === 'pass').length;
  const failed   = Object.values(results).filter(r => r.status === 'fail').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {totalRun > 0
            ? <><span style={{ color: 'var(--green-400)' }}>{passed} passed</span> · <span style={{ color: failed > 0 ? 'var(--red-400)' : 'var(--text-muted)' }}>{failed} failed</span> of {totalRun} run</>
            : 'Click a scenario or run all tests'}
        </div>
        <button
          className="btn btn-sm"
          onClick={runAll}
          disabled={runningAll}
          style={{ gap: 6, display: 'flex', alignItems: 'center' }}
        >
          {runningAll ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Running…</> : '▶ Run All Tests'}
        </button>
      </div>

      <div className="attack-grid">
        {ATTACK_SCENARIOS.map(scenario => {
          const r = results[scenario.id];
          const isRunning = running === scenario.id;
          const statusIcon = isRunning ? '⏳' : r?.status === 'pass' ? '✅' : r?.status === 'fail' ? '❌' : r?.status === 'error' ? '💥' : '';

          return (
            <button
              key={scenario.id}
              className={`attack-card ${scenario.type}`}
              onClick={() => !isRunning && runScenario(scenario)}
              disabled={isRunning || runningAll}
              title={`Expected: ${scenario.expectedVerdict}`}
            >
              <div className="attack-card-header">
                <span className="attack-card-label" style={{ color: TYPE_COLORS[scenario.type] }}>
                  {TYPE_LABELS[scenario.type]}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {statusIcon && <span style={{ fontSize: '0.9rem' }}>{statusIcon}</span>}
                  {r?.data && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      color: r.status === 'pass' ? 'var(--green-400)' : 'var(--red-400)',
                    }}>
                      {r.data.decision}
                    </span>
                  )}
                </div>
              </div>
              <div className="attack-card-desc">{scenario.label.replace(/^(✅|⚠️|🚨)\s*/u, '')}</div>
              <div className="attack-card-desc" style={{ fontSize: '0.72rem', marginTop: 4, opacity: 0.7 }}>{scenario.description}</div>
              <div className="attack-card-expected">
                Expected: {scenario.expectedVerdict} · {scenario.expectedRisk}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
