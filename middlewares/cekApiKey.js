const cekApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized: API Key is missing or invalid",
      data: null
    });
  }

  next();
};

module.exports = cekApiKey;
