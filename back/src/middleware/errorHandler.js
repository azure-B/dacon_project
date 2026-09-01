function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;
