require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Hubungkan ke MongoDB
connectDB();

const loanRoutes = require('./routes/loanRoutes');
const memberRoutes = require('./routes/memberRoutes');
const logger = require('./middlewares/logger');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

app.use(cors());
app.use(express.json());
app.use(logger);

// Method: GET
// URL: /
app.get('/', (req, res) => {
  res.send(`
    <h1>Selamat datang di API Koperasi (MongoDB Integrated)</h1>
    <p>Endpoints yang tersedia:</p>
    <ul>
      <li><a href="/loans">/loans</a> - Endpoint utama pinjaman (Mendukung Filtering, Pagination, Sorting, Projection, Embedding, Referencing)</li>
      <li><a href="/members">/members</a> - Data Master Anggota (Referenced Collection)</li>
    </ul>
  `);
});

app.use('/loans', loanRoutes);
app.use('/members', memberRoutes);

// Penanganan error terpusat
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
}

module.exports = app;
