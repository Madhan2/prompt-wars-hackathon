/**
 * BankSim Policy Validator
 * Deterministic rule enforcement for banking requests.
 * Independent of LLM output — this is the authoritative gatekeeper.
 */
import { THREAT, RISK, DECISION } from '../detection/detector.js';

const MAX_TRANSFER_AMOUNT = parseFloat(process.env.MAX_TRANSFER_AMOUNT) || 50_000;

// Valid account ID regex
const VALID_ACCOUNT_ID = /^ACC\d{3}$/i;

// Known authorized recipient directory for the test environment
const KNOWN_RECIPIENTS = [
  'alice johnson', 'bob martinez', 'carol lee', 'dave okonkwo', 'elena rostova',
  'rahul sharma', 'rahul',
  'acc001', 'acc002', 'acc003', 'acc004', 'acc005',
];

/**
 * Deterministically extract transfer parameters from a natural-language request.
 */
export function parseNaturalLanguageTransfer(requestText) {
  if (!requestText || typeof requestText !== 'string') {
    return { hasTransferIntent: false, recipient: null, amount: null, memo: null };
  }

  const text = requestText.trim();
  const isInformationalInquiry = /\b(what\s+is|how\s+much|how\s+do\s+i|can\s+i|tell\s+me|explain|check\s+my|inquire)\b/i.test(text) &&
                                 /\b(limit|balance|fee|status|policy|schedule|routing|account\s+number)\b/i.test(text);
  const hasTransferIntent = !isInformationalInquiry && /\b(transfer|send|wire|pay|remit|forward)\b/i.test(text);

  let recipient = null;
  let amount = null;
  let memo = null;

  // Extract amount: e.g., "$250", "₹500", "₹-500", "500 INR", "250 USD", "250 dollars"
  const amountMatch = text.match(/[₹$]\s*(-?[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i) ||
                      text.match(/\b(-?[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:dollars|usd|inr|rupees?)\b/i);
  if (amountMatch) {
    amount = amountMatch[1].replace(/,/g, '');
  }

  // Extract recipient: e.g., "to Bob Martinez", "to Rahul Sharma", "to ACC002"
  // Avoid misidentifying phrases like "told me to ignore"
  const toMatch = text.match(/(?:transfer|send|wire|pay|remit|forward)\s+(?:.*?\s+)?to\s+([A-Za-z0-9\s]+?)(?:\s+(?:for|with|memo|regarding|ref)\b|[.,;]|$)/i) ||
                  text.match(/\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s+(?:for|with|memo|regarding|ref)\b|[.,;]|$)/);
  if (toMatch) {
    const rawTo = toMatch[1].trim();
    // Exclude generic words like "everyone", "my account", "ignore"
    if (!/^(everyone|anyone|all|all\s+accounts|someone|ignore|check)$/i.test(rawTo)) {
      recipient = rawTo;
    }
  }

  // Extract memo: e.g., "for the team lunch", "for rent"
  const forMatch = text.match(/\b(?:for|memo|regarding)\s+([^.,;]+)/i);
  if (forMatch) {
    memo = forMatch[1].trim();
  }

  return {
    hasTransferIntent,
    recipient,
    amount,
    memo,
  };
}

/**
 * Parse and validate a transfer request.
 * Returns { valid, errors, parsedTransaction }
 */
export function validateTransfer({ request, recipient, amount, memo }) {
  const errors = [];

  // 1. Recipient validation
  const recipientStr = (recipient || '').trim();
  if (!recipientStr) {
    errors.push('Recipient is required');
  } else if (recipientStr.length > 200) {
    errors.push('Recipient field exceeds maximum length of 200 characters');
  } else {
    // Check for injection / special characters
    if (/[<>{}]|--\s|;\s*(drop|select|insert|delete|update)/i.test(recipientStr)) {
      errors.push('Recipient field contains invalid characters');
    }
    const recipLower = recipientStr.toLowerCase();
    const isKnown = KNOWN_RECIPIENTS.some(r => recipLower.includes(r)) ||
                    VALID_ACCOUNT_ID.test(recipientStr);
    if (!isKnown) {
      errors.push(`Unknown recipient "${recipientStr}". Expected valid test account name or ID (ACC001–ACC004).`);
    }
  }

  // 2. Amount validation
  let parsedAmount = null;
  const rawAmount = amount !== undefined && amount !== null ? String(amount).trim() : '';
  if (!rawAmount) {
    errors.push('Amount is required');
  } else {
    parsedAmount = parseFloat(rawAmount.replace(/[,$\s₹]|inr|usd/gi, ''));
    if (isNaN(parsedAmount)) {
      errors.push('Amount must be a valid number');
    } else if (!isFinite(parsedAmount)) {
      errors.push('Amount must be finite');
    } else if (parsedAmount <= 0) {
      errors.push('Amount must be positive');
    } else if (parsedAmount > MAX_TRANSFER_AMOUNT) {
      errors.push(`Amount exceeds the single-transfer limit of $${MAX_TRANSFER_AMOUNT.toLocaleString()}`);
    }
  }

  // 3. Memo safety check (treat as UNTRUSTED data — never execute as instructions)
  const memoStr = (memo || '').trim();
  if (memoStr.length > 500) {
    errors.push('Memo field exceeds maximum length of 500 characters');
  }

  const valid = errors.length === 0;
  return {
    valid,
    errors,
    parsedTransaction: valid ? {
      recipient: recipientStr,
      amount: parsedAmount,
      memo: memoStr || null,
      currency: 'USD',
    } : null,
  };
}

/**
 * Compute risk score and decision given threat findings and validation results.
 */
export function computeVerdict(threatReport, validationResult) {
  // Any active threat triggers BLOCK (or REVIEW for ambiguity)
  if (!threatReport.clean) {
    const isJailbreakOrInjection = [
      THREAT.JAILBREAK,
      THREAT.PROMPT_INJECTION,
      THREAT.POLICY_OVERRIDE,
      THREAT.MALICIOUS_MEMO,
      THREAT.OBFUSCATION,
    ].includes(threatReport.threat);

    if (isJailbreakOrInjection) {
      return {
        decision: DECISION.BLOCK,
        risk_level: RISK.CRITICAL,
      };
    }
    if (threatReport.threat === THREAT.DATA_EXFILTRATION) {
      return {
        decision: DECISION.BLOCK,
        risk_level: RISK.HIGH,
      };
    }
    if (threatReport.threat === THREAT.AMBIGUOUS_REQUEST) {
      return {
        decision: DECISION.REVIEW,
        risk_level: RISK.MEDIUM,
      };
    }
    return {
      decision: DECISION.BLOCK,
      risk_level: RISK.HIGH,
    };
  }

  // No attack detected, but business validation failed → REVIEW
  if (!validationResult.valid) {
    return {
      decision: DECISION.REVIEW,
      risk_level: RISK.MEDIUM,
    };
  }

  // Clean and valid
  return {
    decision: DECISION.APPROVE,
    risk_level: RISK.LOW,
  };
}

/**
 * Build a clear, human-readable rationale string for the audit log.
 */
export function buildRationale(threatReport, validationResult, verdict) {
  if (!threatReport.clean) {
    const threatLabel = threatReport.threat.replace(/_/g, ' ');
    const count = threatReport.findings.length;
    const extras = count > 1 ? ` (${count} threat signals detected)` : '';
    return `Request blocked by security firewall due to detected ${threatLabel}${extras}. Transaction was not submitted to the banking ledger.`;
  }
  if (!validationResult.valid) {
    return `Request requires compliance review due to validation requirements: ${validationResult.errors.join('; ')}.`;
  }
  return 'Request passed all security firewall and transaction policy checks. Transaction details are valid and within authorized limits.';
}
