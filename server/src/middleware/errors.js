export function notFound(req, res) { res.status(404).json({ message: 'Endpoint not found.' }); }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid record ID.' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: 'Please check your input.' });
  const status = err.status || 500;
  if (status >= 500) console.error('Request failed:', err.name);
  res.status(status).json({ message: status >= 500 ? 'Something went wrong. Please try again.' : err.message });
}
