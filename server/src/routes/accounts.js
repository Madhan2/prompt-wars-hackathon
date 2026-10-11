/**
 * BankSim Accounts Route
 * Provides authenticated view of authorized test accounts and balances.
 * Discloses simulated ledger status clearly.
 */
import { Router } from 'express';
import { getTestAccounts, getBalance, getAccountTransactions } from '../banking/ledger.js';

const router = Router();

// GET /api/accounts — Return all authorized test accounts
router.get('/', (req, res) => {
  const accounts = getTestAccounts();
  res.json({
    accounts,
    ledger_type: 'SIMULATED_TEST_LEDGER',
    notice: 'Simulated test accounts for banking security evaluation. Not connected to external clearing networks.',
  });
});

// Backward-compatible alias for existing clients
router.get('/demo', (req, res) => {
  const accounts = getTestAccounts();
  res.json({
    accounts,
    ledger_type: 'SIMULATED_TEST_LEDGER',
    notice: 'Simulated test accounts for banking security evaluation.',
  });
});

// GET /api/accounts/:accountId/balance — Balance for a specific test account
router.get('/:accountId/balance', (req, res) => {
  const { accountId } = req.params;
  if (!/^ACC\d{3}$/i.test(accountId)) {
    return res.status(400).json({ error: 'Invalid account ID format. Expected format: ACC001–ACC005.' });
  }
  const data = getBalance(accountId.toUpperCase());
  if (!data) {
    return res.status(404).json({ error: 'Account not found in test ledger.' });
  }
  res.json({
    ...data,
    ledger_type: 'SIMULATED_TEST_LEDGER',
  });
});

// GET /api/accounts/:accountId/transactions — Recent transactions for an account
router.get('/:accountId/transactions', (req, res) => {
  const { accountId } = req.params;
  if (!/^ACC\d{3}$/i.test(accountId)) {
    return res.status(400).json({ error: 'Invalid account ID format. Expected format: ACC001–ACC004.' });
  }
  const transactions = getAccountTransactions(accountId.toUpperCase());
  res.json({
    accountId: accountId.toUpperCase(),
    transactions,
    count: transactions.length,
  });
});

export default router;
