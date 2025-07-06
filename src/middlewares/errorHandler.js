// A simple error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
  });
};

module.exports = errorHandler;
