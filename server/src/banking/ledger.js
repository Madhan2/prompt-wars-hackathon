/**
 * BankSim Ledger Service
 * Provides in-memory simulated test accounts, balances, and audit history.
 * 
 * NOTICE: Fictitious test accounts used strictly for security evaluation
 * and financial workflow verification. Not connected to live clearing networks.
 */

// ─── Test Accounts ────────────────────────────────────────────────────────────
const accounts = {
  ACC001: {
    id: 'ACC001',
    owner: 'Alice Johnson',
    email: 'alice.johnson@banksim.local',
    balance: 12_450.00,
    currency: 'USD',
    authorized: true,
    dailyTransferred: 0,
    status: 'ACTIVE',
  },
  ACC002: {
    id: 'ACC002',
    owner: 'Bob Martinez',
    email: 'bob.martinez@banksim.local',
    balance: 5_800.50,
    currency: 'USD',
    authorized: true,
    dailyTransferred: 0,
    status: 'ACTIVE',
  },
  ACC003: {
    id: 'ACC003',
    owner: 'Carol Lee',
    email: 'carol.lee@banksim.local',
    balance: 88_200.00,
    currency: 'USD',
    authorized: true,
    dailyTransferred: 0,
    status: 'ACTIVE',
  },
  ACC004: {
    id: 'ACC004',
    owner: 'Dave Okonkwo',
    email: 'dave.okonkwo@banksim.local',
    balance: 320.75,
    currency: 'USD',
    authorized: true,
    dailyTransferred: 0,
    status: 'ACTIVE',
  },
  ACC005: {
    id: 'ACC005',
    owner: 'Elena Rostova (Suspended)',
    email: 'elena.rostova@banksim.local',
    balance: 10_000.00,
    currency: 'USD',
    authorized: false,
    dailyTransferred: 0,
    status: 'SUSPENDED',
  },
};

// ─── Transaction Log ──────────────────────────────────────────────────────────
const transactionLog = [];
const processedIdempotencyKeys = new Map();

// ─── Limit Helpers ────────────────────────────────────────────────────────────
const MAX_TRANSFER_AMOUNT = parseFloat(process.env.MAX_TRANSFER_AMOUNT) || 50_000;
const DAILY_TRANSFER_LIMIT = parseFloat(process.env.DAILY_TRANSFER_LIMIT) || 100_000;

/**
 * Return safe public view of an account (no excessive internal metadata).
 */
function safeAccountView(acc) {
  return {
    id: acc.id,
    owner: acc.owner,
    balance: acc.balance,
    currency: acc.currency,
    status: acc.status,
  };
}

/**
 * Get all test accounts (safe public fields only).
 */
export function getTestAccounts() {
  return Object.values(accounts).map(safeAccountView);
}

// Backward-compatibility alias
export const getDemoAccounts = getTestAccounts;

/**
 * Get balance and metadata for an account.
 * Only returns data for accounts in the authorized test set.
 */
export function getBalance(accountId) {
  const acc = accounts[accountId];
  if (!acc) return null;
  return {
    id: acc.id,
    owner: acc.owner,
    balance: acc.balance,
    currency: acc.currency,
    status: acc.status,
  };
}

/**
 * Execute a validated transfer in the simulated ledger.
 * Returns { success, txId, from, to, amount, newBalance, timestamp } or throws.
 *
 * CRITICAL: Must only be called AFTER server-side security checks pass.
 */
export function executeTransfer({ fromAccountId, toRecipient, amount, memo, idempotencyKey }) {
  const from = accounts[fromAccountId];
  if (!from) {
    throw new Error(`Source account ${fromAccountId} not found`);
  }
  if (!from.authorized) {
    throw new Error('Source account is not authorized for transfers');
  }
  if (amount <= 0 || !isFinite(amount)) {
    throw new Error('Invalid transfer amount');
  }
  if (amount > MAX_TRANSFER_AMOUNT) {
    throw new Error(`Amount exceeds single-transfer limit of $${MAX_TRANSFER_AMOUNT.toLocaleString()}`);
  }
  if (from.dailyTransferred + amount > DAILY_TRANSFER_LIMIT) {
    throw new Error(`Transfer would exceed daily limit of $${DAILY_TRANSFER_LIMIT.toLocaleString()}`);
  }
  if (from.balance < amount) {
    throw new Error('Insufficient funds');
  }

  // Idempotency check
  if (idempotencyKey) {
    if (processedIdempotencyKeys.has(idempotencyKey)) {
      return processedIdempotencyKeys.get(idempotencyKey);
    }
  }

  // Duplicate transfer protection: identical transfer within 30 seconds
  const now = Date.now();
  const recentDuplicate = transactionLog.find(tx =>
    tx.from === fromAccountId &&
    tx.to.toLowerCase() === toRecipient.toLowerCase() &&
    tx.amount === amount &&
    now - tx.createdAtEpoch < 30_000
  );
  if (recentDuplicate) {
    throw new Error('Duplicate transfer detected within 30 seconds. Request rejected for fraud prevention.');
  }

  // Debit the test account
  from.balance = parseFloat((from.balance - amount).toFixed(2));
  from.dailyTransferred = parseFloat((from.dailyTransferred + amount).toFixed(2));

  const tx = {
    txId: `TX-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    createdAtEpoch: now,
    timestamp: new Date().toISOString(),
    from: fromAccountId,
    fromOwner: from.owner,
    to: toRecipient,
    amount,
    currency: 'USD',
    memo: memo ? '[SANITIZED — NON-EXECUTABLE DATA]' : null,
    status: 'COMPLETED_SIMULATED',
  };

  transactionLog.push(tx);

  const response = {
    success: true,
    txId: tx.txId,
    from: from.id,
    fromOwner: from.owner,
    to: toRecipient,
    amount,
    currency: 'USD',
    newBalance: from.balance,
    status: tx.status,
    timestamp: tx.timestamp,
    notice: 'Simulated Ledger: Transfer processed for security evaluation.',
  };

  if (idempotencyKey) {
    processedIdempotencyKeys.set(idempotencyKey, response);
  }

  return response;
}

/**
 * Return last N transactions from the audit log.
 */
export function getRecentTransactions(n = 20) {
  return transactionLog.slice(-n).reverse();
}

/**
 * Return transactions filtered by account ID.
 */
export function getAccountTransactions(accountId, n = 20) {
  return transactionLog
    .filter(tx => tx.from === accountId || tx.to.toUpperCase() === accountId.toUpperCase())
    .slice(-n)
    .reverse();
}
