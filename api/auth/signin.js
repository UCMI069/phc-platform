import bcrypt from 'bcrypt';
import getPool from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const pool = getPool();
    console.log('Testing DB connection...');
    await pool.query('SELECT 1');
    console.log('DB connection OK');

    const userResult = await pool.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const profResult = await pool.query(
      'SELECT first_name, last_name, is_admin, blocked, account_level, currency FROM profiles WHERE id = $1',
      [user.id]
    );
    const profile = profResult.rows[0] || {};

    res.json({
      id: user.id,
      email: user.email,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      isAdmin: profile.is_admin || false,
      blocked: profile.blocked || false,
      accountLevel: profile.account_level || 'starter',
      currency: profile.currency || 'GBP',
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Signin error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Login failed. Please try again.' });
  }
}
