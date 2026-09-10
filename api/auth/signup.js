import bcrypt from 'bcrypt';
import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, firstName, lastName, accountType } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const sql = getSql();
  try {
    console.log('Testing DB connection...');
    await sql`SELECT 1`;
    console.log('DB connection OK');

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await sql`
      INSERT INTO users (email, password_hash) VALUES (${email.toLowerCase()}, ${passwordHash})
      RETURNING id, email, created_at
    `;
    const user = userResult[0];

    await sql`
      INSERT INTO profiles (id, first_name, last_name, username, currency) 
      VALUES (${user.id}, ${firstName || 'New'}, ${lastName || 'User'}, ${email.toLowerCase()}, 'GBP')
    `;

    await sql`
      INSERT INTO accounts (user_id, type, balance, active, tier) 
      VALUES (${user.id}, ${accountType || 'checkings'}, 0.00, true, 'Standard')
    `;

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: firstName || 'New',
      lastName: lastName || 'User',
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Signup error:', err.message, err.stack);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}
