/**
 * GET /api/health
 */
import { Router } from 'express';

const router = Router();
const startTime = Date.now();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BankSim Firewall API',
    version: '1.0.0',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    mode: 'DETERMINISTIC',   // 'LLM_ASSISTED' when OpenAI key is present
  });
});

export default router;
