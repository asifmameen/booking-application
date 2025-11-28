const express = require('express');
const bodyParser = require('express').json;
require('dotenv').config();

const routes = require('./routes');

const app = express();
app.use(bodyParser());

app.use('/api', routes);

// basic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Service B listening on port ${port}`));
