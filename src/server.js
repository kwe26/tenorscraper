require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const tenorRoutes = require('./routes/tenorRoutes');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'tenor-scrap-api' });
});

app.use('/', tenorRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'Use /search?q=your-query or /view?url=<tenor-gif-url>'
  });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: 'Request failed',
    message: err.message || 'Unknown error'
  });
});

app.listen(port, () => {
  console.log(`Tenor scraping API running at http://localhost:${port}`);
});
