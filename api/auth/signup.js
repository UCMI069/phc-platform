import bcrypt from 'bcrypt';
import pool from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, firstName, lastName, accountType } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase(), passwordHash]
    );
    const user = userResult.rows[0];

    await client.query(
      'INSERT INTO profiles (id, first_name, last_name, username, currency) VALUES ($1, $2, $3, $4, $5)',
      [user.id, firstName || 'New', lastName || 'User', email.toLowerCase(), 'GBP']
    );

    await client.query(
      'INSERT INTO accounts (user_id, type, balance, active, tier) VALUES ($1, $2, 0.00, true, $3)',
      [user.id, accountType || 'checkings', 'Standard']
    );

    await client.query('COMMIT');

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: firstName || 'New',
      lastName: lastName || 'User',
      createdAt: user.created_at,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  } finally {
    client.release();
  }
}
