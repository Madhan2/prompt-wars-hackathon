/**
 * BankSim Analysis Engine
 * Core security pipeline:
 * Input validation → Normalization → Threat detection → Policy verification → Verdict
 */
import { Router } from 'express';
import { detectThreats, THREAT } from '../detection/detector.js';
import { validateTransfer, computeVerdict, buildRationale, parseNaturalLanguageTransfer } from '../policy/validator.js';

const router = Router();

router.post('/', (req, res) => {
  try {
    const { request, recipient: rawRecipient, amount: rawAmount, memo: rawMemo } = req.body || {};

    // ── 1. Input structure validation ────────────────────────────────────────
    if (!request || typeof request !== 'string') {
      return res.status(400).json({
        error: 'Field "request" is required and must be a string.',
      });
    }
    if (request.length > 2000) {
      return res.status(400).json({
        error: 'Field "request" exceeds maximum length of 2000 characters.',
      });
    }

    // ── 2. Natural language extraction fallback ──────────────────────────────
    // If structured fields are omitted, attempt deterministic extraction from the prompt
    let recipient = rawRecipient;
    let amount = rawAmount;
    let memo = rawMemo;

    const naturalExtraction = parseNaturalLanguageTransfer(request);
    if (!recipient && naturalExtraction.recipient) {
      recipient = naturalExtraction.recipient;
    }
    if ((amount === undefined || amount === null || amount === '') && naturalExtraction.amount) {
      amount = naturalExtraction.amount;
    }
    if (!memo && naturalExtraction.memo) {
      memo = naturalExtraction.memo;
    }

    // ── 3. Threat Detection (inspect all fields + memos) ──────────────────────
    const threatReport = detectThreats({ request, recipient, amount, memo });

    // ── 4. Transaction Validation ────────────────────────────────────────────
    const isTransferAttempt = Boolean(recipient || amount || naturalExtraction.hasTransferIntent);
    let validationResult = { valid: true, errors: [], parsedTransaction: null };

    if (isTransferAttempt) {
      validationResult = validateTransfer({ request, recipient, amount, memo });
    }

    // ── 5. Verdict Calculation ───────────────────────────────────────────────
    const { decision, risk_level } = computeVerdict(threatReport, validationResult);
    const rationale = buildRationale(threatReport, validationResult, { decision, risk_level });

    // ── 6. Structured Transaction Summary (only on clean APPROVE) ────────────
    let transaction = null;
    if (decision === 'APPROVE' && validationResult.parsedTransaction) {
      transaction = {
        ...validationResult.parsedTransaction,
        type: 'TRANSFER',
        status: 'PENDING_AUTHORIZATION',
        notice: 'Simulated Ledger: Authorization required before transaction settlement.',
      };
    }

    const isBalanceInquiry = /balance|how\s+much|account\s+balance|check\s+(my\s+)?balance/i.test(request);

    const response = {
      decision,
      risk_level,
      threat_category: threatReport.threat,
      rationale,
      transaction,
      requires_review: decision === 'REVIEW',
      is_balance_inquiry: isBalanceInquiry && !isTransferAttempt,
      validation_errors: validationResult.errors.length > 0 ? validationResult.errors : undefined,
      threat_count: threatReport.findings.length,
      benign_exception_applied: threatReport.benignExceptionApplied || false,
    };

    res.json(response);
  } catch (err) {
    // Fail closed: Any internal error immediately yields BLOCK
    console.error('[/api/analyze] Security analysis exception:', err.message);
    res.status(200).json({
      decision: 'BLOCK',
      risk_level: 'HIGH',
      threat_category: THREAT.NONE,
      rationale: 'Security analysis encountered an error. Request failed closed for safety.',
      transaction: null,
      requires_review: false,
      error: 'Security evaluation failed closed',
    });
  }
});

export default router;
