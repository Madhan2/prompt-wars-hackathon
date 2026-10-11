// Vercel serverless entry: serves the BankSim Express API from the same
// deployment as the React client, so the browser calls /api/* on its own origin.
import app from '../../server/src/app.js';

export default app;
