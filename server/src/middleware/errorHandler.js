/**
 * Centralized error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('[BankSim] Unhandled error:', err.message);
  // Never leak stack traces in production
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'An internal server error occurred.' : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
