/**
 * BankSim Threat Detector
 * Deterministic, rule-based detection engine for prompt injection,
 * jailbreaks, policy overrides, malicious memos and obfuscation.
 *
 * Architecture: modular detectors → score aggregation → verdict
 */

// ─── Constants ────────────────────────────────────────────────────────────────
export const THREAT = {
  NONE: 'NONE',
  PROMPT_INJECTION: 'PROMPT_INJECTION',
  JAILBREAK: 'JAILBREAK',
  POLICY_OVERRIDE: 'POLICY_OVERRIDE',
  MALICIOUS_MEMO: 'MALICIOUS_MEMO',
  OBFUSCATION: 'OBFUSCATION',
  DATA_EXFILTRATION: 'DATA_EXFILTRATION',
  AMBIGUOUS_REQUEST: 'AMBIGUOUS_REQUEST',
  INVALID_TRANSACTION: 'INVALID_TRANSACTION',
};

export const RISK = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' };
export const DECISION = { APPROVE: 'APPROVE', BLOCK: 'BLOCK', REVIEW: 'REVIEW' };

// ─── Normalization ────────────────────────────────────────────────────────────
/**
 * Normalize text for pattern matching while preserving original for display.
 * Decodes common obfuscation strategies.
 */
export function normalizeText(raw) {
  if (typeof raw !== 'string') return '';
  let t = raw;

  // Collapse whitespace tricks (zero-width, non-breaking spaces, etc.)
  t = t.replace(/[\u200B-\u200F\u2028\u2029\uFEFF]/g, '');

  // Simple Base64 decode attempt (catch embedded instructions)
  try {
    const b64Matches = t.match(/[A-Za-z0-9+/]{20,}={0,2}/g) || [];
    for (const m of b64Matches) {
      try {
        const decoded = Buffer.from(m, 'base64').toString('utf8');
        // Only attach if the decoded result looks like text (not binary)
        if (/^[\x20-\x7E\s]+$/.test(decoded) && decoded.length > 5) {
          t += ' DECODED:' + decoded;
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }

  // Hex decode attempt
  const hexMatches = t.match(/(?:0x)?([0-9A-Fa-f]{2}(?:\s*[0-9A-Fa-f]{2})+)/g) || [];
  for (const m of hexMatches) {
    try {
      const hex = m.replace(/0x|\s/g, '');
      const decoded = Buffer.from(hex, 'hex').toString('utf8');
      if (/^[\x20-\x7E\s]+$/.test(decoded) && decoded.length > 3) {
        t += ' HEXDECODED:' + decoded;
      }
    } catch { /* ignore */ }
  }

  // URL decode
  try { t += ' URLDEC:' + decodeURIComponent(t); } catch { /* ignore */ }

  return t.toLowerCase();
}

// ─── Pattern Libraries ────────────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  // Classic injection starters
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|constraints?)/i,
  /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(everything|all|prior|previous)\s*(you|instructions?|rules?)?/i,
  /new\s+(instruction|directive|command|order|rule|task)s?[:;]/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|system\|>/i,
  /<\|user\|>/i,
  /<\|assistant\|>/i,
  /system\s*prompt\s*[:=]/i,
  /you\s+are\s+now\s+(a|an|the)\s+\w+/i,       // "you are now a DAN"
  /act\s+as\s+(a|an)\s+(different|new|unrestricted|evil)/i,
  /pretend\s+(you\s+are|to\s+be)\s+(a|an)\s+\w+/i,
  /from\s+now\s+on\s+(you|act|behave)/i,
  /switch\s+(to|into)\s+(developer|admin|god|unrestricted)\s+mode/i,
  /override\s+(safety|security|filter|restriction|policy|rule)/i,
  /bypass\s+(safety|security|filter|restriction|policy|rule)/i,
  /jailbreak/i,
  /do\s+anything\s+now/i,      // DAN
  /developer\s+mode/i,
  /god\s+mode/i,
  /do\s+not\s+filter/i,
  /disable\s+(safety|filter|security|restrictions?)/i,
];

const JAILBREAK_PATTERNS = [
  /\bDAN\b/,                           // "Do Anything Now"
  /do\s+anything\s+now/i,
  /you\s+are\s+now\s+DAN/i,
  /jailbreak/i,
  /unrestricted\s+(ai|mode|access)/i,
  /without\s+(any\s+)?(restrictions?|limits?|filters?|safety|checks?)/i,
  /no\s+(restrictions?|limits?|filters?|rules?|safety)/i,
  /evil\s+(mode|ai|twin|gpt)/i,
  /opposite\s+day/i,
  /hypothetically\s+(speaking\s*,\s*)?(if|what\s+if)/i,  // hypothetical bypass
  /in\s+a\s+fictional\s+(scenario|world|story)/i,
  /for\s+(educational|research)\s+purposes/i,
  /as\s+a\s+thought\s+experiment/i,
  /roleplay\s+(as|where)/i,
  /you\s+are\s+playing\s+(a|the\s+role\s+of)/i,
  /imagine\s+you\s+(have\s+no\s+)?restrictions/i,
  /pretend\s+(that\s+)?(you\s+are|there\s+are\s+no)\s+(rules|restrictions|safety)/i,
  /demonstrat(e|ing)\s+(bypass|circumvent|break)/i,
  /bypass(ing)?\s+(security|safety|restriction|filter|check|limit)/i,
];

const POLICY_OVERRIDE_PATTERNS = [
  /override\s+(the\s+)?(transaction|transfer|security|daily|limit|policy)/i,
  /increase\s+(the\s+)?(limit|cap|maximum|threshold)/i,
  /raise\s+(the\s+)?(limit|cap|maximum|threshold)/i,
  /disable\s+(the\s+)?(limit|cap|maximum|threshold|check|validation)/i,
  /bypass\s+(the\s+)?(limit|cap|maximum|threshold|check|validation)/i,
  /approve\s+(this\s+)?(transfer|transaction|request)\s+(anyway|regardless|without|no\s+matter)/i,
  /skip\s+(the\s+)?(check|validation|review|approval|limit)/i,
  /you\s+have\s+special\s+(permission|authority|access|override)/i,
  /as\s+(admin|administrator|root|superuser|ceo|manager|system)/i,
  /i\s+am\s+(admin|administrator|root|superuser|ceo|manager|authorized\s+to\s+override)/i,
  /grant\s+(me\s+)?(admin|root|elevated|full)\s+access/i,
  /emergency\s+(override|bypass|exception|authorization)/i,
  /i\s+authorize\s+(you\s+to\s+)?(transfer|send|move)\s+.{0,30}\s+(without|bypass|ignore)/i,
];

const DATA_EXFIL_PATTERNS = [
  /show\s+(me\s+)?(all\s+)?(account|customer|user|internal|system)\s+(numbers?|data|records?|details?|information|credentials?)/i,
  /reveal\s+(the\s+)?(your\s+)?(system|internal|all|every|other|hidden|admin|master|secret)?\s*(prompt|instruction|password|key|token|account)/i,
  /print\s+(the\s+)?(system\s+prompt|instructions|your\s+prompt)/i,
  /what\s+(are|is)\s+(your|the)\s+(system\s+prompt|instructions|internal|secret)/i,
  /list\s+(all\s+)?(account|customer|user)\s+(numbers?|data|records?|details?)/i,
  /access\s+(all\s+|every\s+)?(account|customer|user|internal)/i,
  /dump\s+(database|data|records?|accounts?)/i,
  /export\s+(all\s+)?(data|records?|accounts?|customers?)/i,
  /send\s+(account|personal|private|confidential)\s+(data|information|details?|records?)/i,
  /transfer\s+.*\s+to\s+.*external.*server/i,
  /exfiltrat/i,
  /reveal\s+your\s+(system|prompt|instructions?)/i,
  /show\s+your\s+(system\s+prompt|instructions?|internal)/i,
  /list\s+all\s+(account|customer)/i,
];

const OBFUSCATION_PATTERNS = [
  // l33t speak patterns for "ignore", "jailbreak", etc.
  /1gn[o0]r[e3]/i,
  /j[a4][1i]lbr[e3][a4]k/i,
  // Note: l33t "system prompt" pattern removed — too many false positives on real English
  // Character spacing: i g n o r e
  /i\s+g\s+n\s+o\s+r\s+e/i,
  /j\s+a\s+i\s+l\s+b\s+r\s+e\s+a\s+k/i,
  // Unicode lookalikes (Cyrillic, etc.)
  /[\u0400-\u04FF]{3,}/,   // Cyrillic block
  /[\u0370-\u03FF]{3,}/,   // Greek block (possible lookalike attack)
  // Reversed text markers
  /DECODED:/,   // Our own marker — means obfuscated content was found
  /HEXDECODED:/,
  // Suspicious repeated characters suggesting encoding
  /(.)\1{5,}/,   // e.g. "aaaaaaaaa" — possible padding
  // Common b64 payload starters
  /SW5zdHJ1Y3Rpb24|aWdub3Jl|c3lzdGVtIHByb21wdA/i,  // "Instruction", "ignore", "system prompt" in b64
];

const AMBIGUITY_PATTERNS = [
  // Conflicting instructions in a single message
  /transfer\s+.+\s+(and\s+also\s+)?(don'?t\s+transfer|cancel|stop|abort|hold)/i,
  /pay\s+.+\s+(but\s+not|except|unless)/i,
  // Wildcard recipients
  /transfer\s+to\s+(everyone|all\s+accounts|all\s+users|anyone)/i,
  /send\s+money\s+to\s+(everyone|all\s+accounts|all\s+users)/i,
  // Unclear intent
  /transfer\s+some\s+money/i,
  /send\s+an?\s+amount/i,
];

// ─── Individual Detectors ─────────────────────────────────────────────────────

function detectInjection(normalized) {
  for (const pat of INJECTION_PATTERNS) {
    if (pat.test(normalized)) {
      return { found: true, pattern: pat.source };
    }
  }
  return { found: false };
}

function detectJailbreak(normalized) {
  for (const pat of JAILBREAK_PATTERNS) {
    if (pat.test(normalized)) {
      return { found: true, pattern: pat.source };
    }
  }
  return { found: false };
}

function detectPolicyOverride(normalized) {
  for (const pat of POLICY_OVERRIDE_PATTERNS) {
    if (pat.test(normalized)) {
      return { found: true, pattern: pat.source };
    }
  }
  return { found: false };
}

function detectDataExfiltration(normalized) {
  for (const pat of DATA_EXFIL_PATTERNS) {
    if (pat.test(normalized)) {
      return { found: true, pattern: pat.source };
    }
  }
  return { found: false };
}

function detectObfuscation(normalized) {
  for (const pat of OBFUSCATION_PATTERNS) {
    if (pat.test(normalized)) {
      return { found: true, pattern: pat.source };
    }
  }
  return { found: false };
}

function detectAmbiguity(normalized) {
  for (const pat of AMBIGUITY_PATTERNS) {
    if (pat.test(normalized)) {
      return { found: true, pattern: pat.source };
    }
  }
  return { found: false };
}

/**
 * Check a memo specifically — tighter rules because memos are
 * frequently used as injection vectors.
 */
function inspectMemo(memo) {
  if (!memo) return { found: false };
  const normalized = normalizeText(memo);
  // Any injection-like instruction in a memo is MALICIOUS_MEMO
  const allMemoPatterns = [
    ...INJECTION_PATTERNS,
    ...JAILBREAK_PATTERNS,
    ...POLICY_OVERRIDE_PATTERNS,
    ...DATA_EXFIL_PATTERNS,
    ...OBFUSCATION_PATTERNS,
    // Extra memo-specific patterns
    /\bexecute\b/i,
    /\brun\s+command\b/i,
    /\beval\b/i,
    /\bcurl\s+http/i,
    /\bwget\s+http/i,
    /note\s+to\s+(system|ai|model|bank|server)/i,
    /\[hidden\s+instruction\]/i,
    /\/\*.*inject.*\*\//i,
  ];
  for (const pat of allMemoPatterns) {
    if (pat.test(normalized)) {
      return { found: true, pattern: pat.source };
    }
  }
  return { found: false };
}

// ─── False-Positive Guard ─────────────────────────────────────────────────────
/**
 * Patterns that look dangerous but are legitimate in a banking context.
 * E.g. "please ignore the old payment" is normal English.
 */
const BENIGN_EXCEPTIONS = [
  // "ignore the old standing order" — "ignore" in ordinary context
  /ignore\s+(the\s+)?(old|previous|last|pending)\s+(payment|order|transfer|transaction|invoice|charge|fee|error|mistake)/i,
  // "transfer limit of $X" — discussing limits, not overriding them
  /transfer\s+limit\s+(of|is|was|has\s+been)/i,
  // "bypass the usual memo" — might look like bypass but is benign
];

function hasBenignException(raw) {
  for (const pat of BENIGN_EXCEPTIONS) {
    if (pat.test(raw)) return true;
  }
  return false;
}

// ─── Main Detector ────────────────────────────────────────────────────────────
/**
 * Run all detectors across all input fields.
 * Returns a structured threat report.
 */
export function detectThreats({ request, recipient, amount, memo }) {
  const allText = [request, recipient, memo].filter(Boolean).join(' ');
  const normalized = normalizeText(allText);

  const benignException = hasBenignException(allText);

  const injectionResult = detectInjection(normalized);
  const jailbreakResult = detectJailbreak(normalized);
  const policyResult    = detectPolicyOverride(normalized);
  const exfilResult     = detectDataExfiltration(normalized);
  const obfuscResult    = detectObfuscation(normalized);
  const ambigResult     = detectAmbiguity(normalized);
  const memoResult      = inspectMemo(memo);

  const findings = [];

  if (injectionResult.found)  findings.push({ type: THREAT.PROMPT_INJECTION, ...injectionResult });
  if (jailbreakResult.found)  findings.push({ type: THREAT.JAILBREAK, ...jailbreakResult });
  if (policyResult.found)     findings.push({ type: THREAT.POLICY_OVERRIDE, ...policyResult });
  if (exfilResult.found)      findings.push({ type: THREAT.DATA_EXFILTRATION, ...exfilResult });
  if (obfuscResult.found)     findings.push({ type: THREAT.OBFUSCATION, ...obfuscResult });
  if (ambigResult.found)      findings.push({ type: THREAT.AMBIGUOUS_REQUEST, ...ambigResult });
  if (memoResult.found)       findings.push({ type: THREAT.MALICIOUS_MEMO, ...memoResult });

  // If a benign exception applies, downgrade single low-severity findings
  if (benignException && findings.length === 1 &&
      [THREAT.PROMPT_INJECTION, THREAT.POLICY_OVERRIDE].includes(findings[0].type)) {
    return {
      clean: true,
      threat: THREAT.NONE,
      findings: [],
      benignExceptionApplied: true,
    };
  }

  if (findings.length === 0) {
    return { clean: true, threat: THREAT.NONE, findings: [] };
  }

  // Priority order for primary threat label
  const priority = [
    THREAT.JAILBREAK,
    THREAT.PROMPT_INJECTION,
    THREAT.MALICIOUS_MEMO,
    THREAT.POLICY_OVERRIDE,
    THREAT.OBFUSCATION,
    THREAT.DATA_EXFILTRATION,
    THREAT.AMBIGUOUS_REQUEST,
  ];
  const primaryThreat = priority.find(t => findings.some(f => f.type === t)) || findings[0].type;

  return {
    clean: false,
    threat: primaryThreat,
    findings,
  };
}
