import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// ── Generic query endpoint (server-side only) ──
app.post('/api/query', async (req, res) => {
  const { query, params } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const result = await pool.query(query, params || []);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(400).json({ data: null, error: { message: err.message } });
  }
});

// ── Signup ──
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, firstName, lastName, accountType } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check duplicate
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase(), passwordHash]
    );
    const user = userResult.rows[0];

    // Create profile
    await client.query(
      'INSERT INTO profiles (id, first_name, last_name, username, currency) VALUES ($1, $2, $3, $4, $5)',
      [user.id, firstName || 'New', lastName || 'User', email.toLowerCase(), 'GBP']
    );

    // Create account
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
});

// ── Signin ──
app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const userResult = await pool.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get profile
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
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── Get user by ID ──
app.get('/api/auth/user/:id', async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const profResult = await pool.query(
      'SELECT first_name, last_name, phone, country, avatar_url, is_admin, blocked, account_level, currency FROM profiles WHERE id = $1',
      [user.id]
    );
    const profile = profResult.rows[0] || {};

    res.json({
      id: user.id,
      email: user.email,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      phone: profile.phone || '',
      country: profile.country || '',
      avatarUrl: profile.avatar_url || '',
      isAdmin: profile.is_admin || false,
      blocked: profile.blocked || false,
      accountLevel: profile.account_level || 'starter',
      currency: profile.currency || 'GBP',
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ── Update profile ──
app.put('/api/auth/user/:id', async (req, res) => {
  try {
    const { firstName, lastName, phone, country } = req.body;
    const fields = [];
    const values = [];
    let i = 1;

    if (firstName !== undefined) { fields.push(`first_name = $${i++}`); values.push(firstName); }
    if (lastName !== undefined) { fields.push(`last_name = $${i++}`); values.push(lastName); }
    if (phone !== undefined) { fields.push(`phone = $${i++}`); values.push(phone); }
    if (country !== undefined) { fields.push(`country = $${i++}`); values.push(country); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE profiles SET ${fields.join(', ')} WHERE id = $${i}`, values);

    res.json({ success: true });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
