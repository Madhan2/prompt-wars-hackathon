/**
 * BankSim — Defensive AI Firewall for Banking
 * Entry point for local development / traditional hosting.
 * (On Vercel the app is served by client/api/index.js instead.)
 */
import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BankSim] Server listening on http://localhost:${PORT}`);
  console.log(`[BankSim] Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
