const notFound = (req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "Endpoint tidak ditemukan",
    data: null
  });
};

module.exports = notFound;
