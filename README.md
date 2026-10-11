# BankSim — Banking AI Security Firewall & Transaction Protection

> **Enterprise AI Security Firewall** — Blue-team defensive intelligence system engineered to protect banking operations, transaction processors, and customer-facing financial assistants from prompt injection, jailbreaks, policy overrides, malicious payment memos, token obfuscation, and data exfiltration.

---

## Selected Vertical: Financial Services & Banking Security

Autonomous AI agents and natural-language assistants are increasingly deployed in banking environments for account inquiries, wire transfers, peer-to-peer payments, and customer support. However, financial operations carry severe risks:
- Direct prompt injection can trick models into initiating fraudulent wire transfers.
- Malicious payment memos can embed instructions that secondary systems or AI interpreters execute.
- Policy overrides (e.g. claiming administrator authority) can bypass transaction limits.
- Jailbreaks and roleplay attacks can bypass safety filters.
- Data exfiltration requests can leak sensitive customer PII or account details.

**BankSim** addresses this challenge by placing an authoritative, deterministic security firewall between the natural-language interface and financial transaction execution layers. AI outputs are never granted transaction authority.

---

## Problem Statement

Conventional AI systems rely on system prompts or model self-moderation to enforce boundaries. In a financial context, this creates severe vulnerabilities:
1. **Model Non-Determinism:** A model may approve an unauthorized transfer under adversarial pressure or novel phrasing.
2. **Privilege Escalation:** Attackers use authority pretexting ("As CEO / System Admin") to bypass controls.
3. **Indirect Injection via Financial Metadata:** Payment memos and counterparty names are frequently treated as raw text and forwarded to internal processors without validation.
4. **Lack of Verifiable State Invariants:** Blocked or suspicious transactions must never cause state mutations or balance changes.

BankSim solves this by implementing an independent, server-side defense-in-depth pipeline that enforces deterministic transaction validation, fail-closed verdicts, and strict verification before any transaction can debit an account.

---

## Operational Notice

> **Notice:** BankSim operates with an in-memory simulated financial ledger and isolated test accounts (`ACC001`–`ACC005`) to evaluate security behaviors, policy boundaries, and adversarial threat mitigation safely without risk to production settlement networks.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│               React + Vite Frontend Interface               │
│  • Natural-language request input with structured fields    │
│  • Authoritative Security Verdict Panel (APPROVE/BLOCK/REV) │
│  • Adversarial security test harness (1-click evaluation)   │
│  • Security audit activity stream                           │
│  • Ledger transaction audit history                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (CORS + Helmet)
┌──────────────────────────────▼──────────────────────────────┐
│                  Express Security API Engine                 │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Defense-in-Depth Pipeline                           │  │
│  │   1. Input validation & length limits (16 KB max body)│  │
│  │   2. Normalization & multi-encoding decoder           │  │
│  │   3. Modular threat detection engine                  │  │
│  │   4. Deterministic policy & transfer limits validator │  │
│  │   5. Independent verdict decision gatekeeper          │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ Only APPROVE reaches executor│
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │   Simulated Banking Ledger Service                    │  │
│  │   • Isolated test accounts (ACC001–ACC005)            │  │
│  │   • Balance tracking & transfer limits ($50k / $100k) │  │
│  │   • Duplicate transfer & idempotency protection       │  │
│  │   • Audit log of all completed transactions           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Core Security Principles

1. **Fail Closed** — Any unhandled exception, ambiguity, or security violation defaults to `BLOCK` or `REVIEW`.
2. **Zero Model Authority Over Ledger** — AI classifications can never override server-side financial limits, account balance checks, or authorization requirements.
3. **Independent Server Validation** — The backend independently re-runs all threat and transaction checks at the moment of execution; frontend verdicts are never trusted.
4. **Untrusted Data Isolation** — User instructions, recipient identifiers, and payment memos are treated strictly as untrusted parameters and parsed for embedded attacks.
5. **Strict Recipient Verification** — Transfer targets must match authorized directories or verified account IDs.
6. **Idempotency & Duplicate Protection** — Guards against duplicate execution and replay attacks within a 30-second window.

---

## Project Structure

```
prompt-wars-hackathon/
├── server/
│   ├── .env                    # Runtime configuration (git-ignored)
│   ├── .env.example            # Configuration template with placeholders
│   ├── package.json
│   └── src/
│       ├── index.js            # Express application bootstrap & middleware
│       ├── routes/
│       │   ├── analyze.js      # POST /api/analyze
│       │   ├── transactions.js # GET /api/transactions, POST /api/transactions/transfer
│       │   ├── accounts.js     # GET /api/accounts, GET /api/accounts/:id/balance
│       │   └── health.js       # GET /api/health
│       ├── detection/
│       │   └── detector.js     # Modular threat detection engine
│       ├── policy/
│       │   └── validator.js    # Deterministic policy validation & NLP parser
│       ├── banking/
│       │   └── ledger.js       # Simulated banking ledger service
│       ├── middleware/
│       │   ├── errorHandler.js # Controlled error handler (no secret leaks)
│       │   └── requestLogger.js# Request audit logging
│       └── tests/
│           └── runTests.js     # Comprehensive automated security test suite (72 assertions)
└── client/
    ├── .env                    # Frontend environment configuration (git-ignored)
    ├── .env.example            # Client configuration template
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Accessible banking security dashboard
        ├── index.css           # Cohesive design system & styles
        ├── api/client.js       # Typed API client
        ├── data/scenarios.js   # Adversarial security test scenarios
        └── components/
            ├── VerdictPanel.jsx      # Security verdict & rationale display
            ├── SecurityLog.jsx       # Real-time event log
            ├── AttackTestPanel.jsx   # One-click adversarial evaluation harness
            ├── AccountsPanel.jsx     # Account balances & status
            └── TransactionsPanel.jsx # Ledger audit history
```

---

## Installation & Setup

### Prerequisites
- Node.js ≥ 18.0.0
- npm ≥ 9.0.0

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

### 2. Frontend Setup

```bash
cd ../client
npm install
cp .env.example .env
```

---

## Running the Application

### Start the Backend Service

```bash
cd server
npm run dev
# Running on http://localhost:3001
```

### Start the Frontend Application

```bash
cd client
npm run dev
# Running on http://localhost:5173
```

### Run Automated Security Test Suite

```bash
cd server
npm test
# Executes 72 automated assertions covering all 18 security and functional scenarios
```

### Run Frontend Linter & Production Build

```bash
cd client
npm run lint    # oxlint: 0 errors, 0 warnings
npm run build   # vite build: production bundle in dist/
```

---

## API Reference

### 1. Health Verification
`GET /api/health`

Returns service health, uptime, and security engine mode.

```json
{
  "status": "ok",
  "service": "BankSim Firewall API",
  "version": "1.0.0",
  "uptime_seconds": 120,
  "timestamp": "2026-10-11T05:30:00.000Z",
  "mode": "DETERMINISTIC"
}
```

### 2. Request Security Analysis
`POST /api/analyze`

Evaluates natural-language requests and structured parameters through the threat detection pipeline.

**Request Payload:**
```json
{
  "request": "Transfer $250 to Bob Martinez for team lunch",
  "recipient": "Bob Martinez",
  "amount": "250",
  "memo": "Team lunch reimbursement"
}
```

**Verdict Response:**
```json
{
  "decision": "APPROVE",
  "risk_level": "LOW",
  "threat_category": "NONE",
  "rationale": "Request passed all security firewall and transaction policy checks.",
  "transaction": {
    "recipient": "Bob Martinez",
    "amount": 250,
    "currency": "USD",
    "memo": "Team lunch reimbursement",
    "status": "PENDING_AUTHORIZATION",
    "notice": "Simulated Ledger: Authorization required before transaction settlement."
  },
  "requires_review": false,
  "threat_count": 0,
  "benign_exception_applied": false
}
```

### 3. Transaction Execution Gate
`POST /api/transactions/transfer`

Independently validates and authorizes transfers against the simulated ledger.

**Request Payload:**
```json
{
  "request": "Transfer $250 to Bob Martinez",
  "recipient": "Bob Martinez",
  "amount": "250",
  "memo": "Reimbursement",
  "fromAccount": "ACC001"
}
```

**Execution Response:**
```json
{
  "success": true,
  "transaction": {
    "txId": "TX-1791694966-ABCDE",
    "from": "ACC001",
    "fromOwner": "Alice Johnson",
    "to": "Bob Martinez",
    "amount": 250,
    "currency": "USD",
    "newBalance": 12200.00,
    "status": "COMPLETED_SIMULATED",
    "timestamp": "2026-10-11T05:30:00.000Z"
  },
  "notice": "Simulated Ledger: Transfer processed for security evaluation."
}
```

### 4. Account Inquiries
`GET /api/accounts` — Returns test accounts with balances.  
`GET /api/accounts/:accountId/balance` — Returns verified balance for a specific account.  
`GET /api/transactions` — Returns recent transaction audit log.

---

## Threat Detection Matrix

| Threat Classification | Detection Strategy | Mitigation Action |
|---|---|---|
| **Direct Prompt Injection** | Multi-pattern regex across system instruction overrides, delimiter injection (`[SYSTEM]`, `<\|system\|>`), and prompt cancellation | Immediate `BLOCK` (Critical Risk) |
| **Jailbreak & Roleplay** | "Do Anything Now" (DAN), unrestricted AI mode, fictional scenario framing, and adversarial persona adoption detection | Immediate `BLOCK` (Critical Risk) |
| **Policy Override Attempts** | Impersonation of administrative roles (admin, root, CEO), emergency exemption claims, and limit tampering | Immediate `BLOCK` (Critical Risk) |
| **Malicious Payment Memos** | Dedicated inspection of memo fields for hidden directives, script payloads, and secondary execution vectors | Immediate `BLOCK` (Critical Risk) |
| **Encoding Obfuscation** | Normalization engine handles zero-width spaces, Base64 strings, hexadecimal byte sequences, URL encoding, and character spacing | Decoding & `BLOCK` (Critical Risk) |
| **Data Exfiltration** | Pattern detection targeting system prompt extraction, credential dumps, and customer PII enumeration | Immediate `BLOCK` (High Risk) |
| **Ambiguity & Conflicts** | Identification of conflicting commands, wildcard recipients ("everyone"), and missing critical details | Route to `REVIEW` (Medium Risk) |
| **Context Guard** | Contextual distinction ensuring benign banking language (e.g. "ignore the old standing order", limit inquiries) is not blocked | Approved via Context Guard |

---

## Test Coverage & Verification Results

The automated regression test suite (`server/src/tests/runTests.js`) executes 72 assertions covering all required functional, security, and invariant scenarios:

```
BankSim Test Suite — 72 tests: 72 passed, 0 failed ✅

Scenario 01: Valid balance inquiry returns correct result               PASS
Scenario 02: Valid, authorized transfer with known recipient & amount   PASS
Scenario 03: Missing recipient is rejected or sent for review           PASS
Scenario 04: Missing amount is rejected or sent for review              PASS
Scenario 05a: Zero amount ($0) is rejected                              PASS
Scenario 05b: Negative amount (-$100) is rejected                       PASS
Scenario 05c: Non-numeric and malformed amounts are rejected            PASS
Scenario 05d: Non-finite amount (Infinity) is rejected                  PASS
Scenario 05e: Amount exceeding $50,000 single transfer limit is rejectedPASS
Scenario 06: Direct prompt injection cannot bypass security checks     PASS
Scenario 07: Jailbreak and roleplay attempts cannot override policy     PASS
Scenario 08: Fake administrator instructions cannot authorize transfers PASS
Scenario 09: Malicious instructions in payment memos cannot override    PASS
Scenario 10: Obfuscated or encoded malicious instructions handled safelyPASS
Scenario 11: Requests to expose private customer information are blockedPASS
Scenario 12: Ambiguous requests do not execute transactions             PASS
Scenario 13: Unauthorized transfers are blocked by ledger               PASS
Scenario 14: Benign requests with suspicious words are not rejected     PASS
Scenario 15: Backend errors return controlled fail-closed responses     PASS
Scenario 16: Natural language parameter extraction without form fields  PASS
Scenario 17: Malformed and oversized requests are rejected safely       PASS
Scenario 18: Repeated requests cannot cause duplicate transfers         PASS
CRITICAL INVARIANT: Zero ledger side effects on blocked/review requests PASS
```

---

## Assumptions & Limitations

1. **Simulated Financial Ledger:** Operates in-memory test accounts (`ACC001`–`ACC005`) for safe security evaluation. Account state resets on process restart.
2. **Directory Whitelist:** Recipient verification checks against authorized test directory accounts for determinism.
3. **Language Scope:** Primary adversarial patterns target English-language prompt injections, jailbreaks, and obfuscation techniques.
4. **Local Network Transport:** Configured for local development (`localhost:3001` and `localhost:5173`) using HTTP with Helmet security headers and CORS origin restrictions.

---

## Production Deployment Checklist

For deployment in production enterprise environments connecting to live banking rails:

1. **Identity & Access Management:** Integrate OAuth 2.0 / OpenID Connect with MFA and role-based access control.
2. **Mutual TLS (mTLS):** Require certificates for all inter-service API communications.
3. **Hardware Security Modules (HSM):** Store private keys and signing certificates in FIPS 140-2 Level 3 validated HSMs.
4. **Persistent Audit Trail:** Stream immutable transaction logs to WORM (Write Once, Read Many) compliant storage.
5. **Real Core Banking Integration:** Connect via ISO 20022 messaging or certified core banking APIs (e.g. Plaid, Stripe Treasury).
6. **Regulatory Compliance:** Implement BSA/AML, OFAC sanctions screening, and KYC checks prior to transaction dispatch.
