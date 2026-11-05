const notFound = (req, res, next) => {
  const error = new Error("Endpoint tidak ditemukan");
  error.status = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    status: "error",
    message: err.type === 'entity.parse.failed' ? "Format JSON tidak valid" : err.message,
    data: null
  });
};

module.exports = { notFound, errorHandler };
