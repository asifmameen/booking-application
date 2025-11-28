const express = require('express');
const router = express.Router();
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
require('dotenv').config();

const { verifyJwt } = require('./middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3600';
const SERVICE_A_URL = process.env.SERVICE_A_URL;
const SERVICE_A_INTERNAL_TOKEN = process.env.SERVICE_A_INTERNAL_TOKEN || 'service-a-internal-token';

/**
 * Health
 */
router.get('/health', (req, res) => res.json({ ok: true }));

/**
 * Login (issues JWT)
 * NOTE: This example expects a `users` table with columns (username, password_hash).
 * Password hashing algorithm must match whatever you used to seed the DB.
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username & password required' });

  try {
    const result = await db.query('SELECT id, username, email, password_hash FROM users WHERE username = $1 LIMIT 1', [username]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    // Compare password - this expects the password_hash to be a bcrypt hash.
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { sub: user.id, username: user.username, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM, expiresIn: Number(JWT_EXPIRES_IN) });
    return res.json({ success: true, token });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Products listing & filtering - reads from products table
 */
router.get('/products', async (req, res) => {
  const { category, min_price, max_price, q, page = 1, limit = 50 } = req.query;
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

  let where = [];
  let params = [];
  let idx = 1;

  if (category) { where.push(`category = $${idx++}`); params.push(category); }
  if (min_price) { where.push(`price >= $${idx++}`); params.push(min_price); }
  if (max_price) { where.push(`price <= $${idx++}`); params.push(max_price); }
  if (q) { where.push(`name ILIKE $${idx++}`); params.push(`%${q}%`); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT id, name, category, price, available_quantity FROM products ${whereSql} ORDER BY price LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  try {
    const result = await db.query(sql, params);
    return res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error('products error', err);
    return res.status(500).json({ error: 'DB error' });
  }
});

/**
 * Proxy booking to Service A
 * - Requires JWT (user)
 * - Forwards Authorization header and includes internal token
 */
router.post('/book', verifyJwt, async (req, res) => {
  const { product_id, quantity } = req.body || {};
  if (!product_id || !quantity) return res.status(400).json({ error: 'product_id and quantity required' });

  try {
    const response = await axios.post(`${SERVICE_A_URL}/api/reserve/`, {
      product_id,
      quantity
    }, {
      headers: {
        Authorization: req.headers.authorization, // forward user's JWT
        'x-internal-token': SERVICE_A_INTERNAL_TOKEN,
        'Content-Type': 'application/json'
      },
      timeout: 10_000
    });

    return res.status(response.status).json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    } else {
      console.error('proxy error', err.message || err);
      return res.status(500).json({ error: 'Service A unreachable' });
    }
  }
});

module.exports = router;
