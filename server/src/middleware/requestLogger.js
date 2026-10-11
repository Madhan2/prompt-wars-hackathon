/**
 * Request logger middleware — logs method, path, status and timing.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`[${level}] ${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`);
  });
  next();
}
