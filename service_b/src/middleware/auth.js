const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const jwtAlg = process.env.JWT_ALGORITHM || 'HS256';

function verifyJwt(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid Authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: [jwtAlg] });
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { verifyJwt };
