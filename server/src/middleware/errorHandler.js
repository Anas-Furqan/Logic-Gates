/**
 * Error handling middleware
 */

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Global error handler
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'LexerError' || err.name === 'ParserError') {
    return res.status(400).json({
      error: 'Expression Error',
      message: err.message,
      position: err.position,
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
}
