/**
 * BankSim Transactions Route
 * Independent, authoritative server-side validation and execution.
 * Only executes transfers that pass full security inspection.
 */
import { Router } from 'express';
import { detectThreats } from '../detection/detector.js';
import { validateTransfer, computeVerdict } from '../policy/validator.js';
import { executeTransfer, getRecentTransactions } from '../banking/ledger.js';

const router = Router();

// GET /api/transactions — Return recent audit log of transactions
router.get('/', (req, res) => {
  const transactions = getRecentTransactions(50);
  res.json({
    transactions,
    count: transactions.length,
    ledger_type: 'SIMULATED_TEST_LEDGER',
  });
});

// POST /api/transactions/transfer — Authorize and execute transaction
router.post('/transfer', (req, res) => {
  try {
    const { request, recipient, amount, memo, fromAccount, idempotencyKey } = req.body || {};

    // ── 1. Structural check ──────────────────────────────────────────────────
    if (!request || typeof request !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Field "request" is required and must be a string.',
      });
    }
    if (!recipient || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Both "recipient" and "amount" are required for transfer execution.',
      });
    }

    // ── 2. Independent server-side security checks (Fail closed) ──────────────
    const threatReport = detectThreats({ request, recipient, amount, memo });
    const validationResult = validateTransfer({ request, recipient, amount, memo });
    const { decision, risk_level } = computeVerdict(threatReport, validationResult);

    if (decision !== 'APPROVE') {
      return res.status(403).json({
        success: false,
        error: 'Transfer rejected: Independent server security policy failed.',
        decision,
        risk_level,
        threat_category: threatReport.threat,
        validation_errors: validationResult.errors,
      });
    }

    // ── 3. Execute transfer via ledger ─────────────────────────────────────────
    const sourceAccountId = fromAccount || 'ACC001'; // Default test account (Alice)
    const result = executeTransfer({
      fromAccountId: sourceAccountId,
      toRecipient: validationResult.parsedTransaction.recipient,
      amount: validationResult.parsedTransaction.amount,
      memo: validationResult.parsedTransaction.memo,
      idempotencyKey,
    });

    res.json({
      success: true,
      transaction: result,
      notice: 'Simulated Ledger: Transfer processed for security evaluation.',
    });
  } catch (err) {
    // Controlled error responses without leaking internal stack traces
    const isClientError = /not found|insufficient|invalid|limit|duplicate/i.test(err.message);
    res.status(isClientError ? 422 : 500).json({
      success: false,
      error: err.message || 'Transaction processing failed',
    });
  }
});

export default router;
