import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse path from Vercel catch-all or fallback to req.url
  const pathSegments = req.query.path || [];
  let fullPath = '/' + (Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments);
  
  // Fallback: parse from req.url if query.path is empty
  if (!fullPath || fullPath === '/') {
    try {
      const url = new URL(req.url, `https://${req.headers.host}`);
      fullPath = url.pathname;
      const prefix = '/api/auth';
      if (fullPath.startsWith(prefix)) {
        fullPath = fullPath.slice(prefix.length);
      }
    } catch (e) {
      // fallback to original fullPath
    }
  }
  
  // Strip /auth/ prefix if present
  if (fullPath.startsWith('/auth/')) {
    fullPath = fullPath.slice(5);
  }
  if (!fullPath.startsWith('/')) fullPath = '/' + fullPath;
  const path = fullPath;
  const method = req.method;

  // ===== AUTH ENDPOINTS =====
  if (path === 'signin' && method === 'POST') {
    return handleSignin(req, res);
  }
  if (path === 'signup' && method === 'POST') {
    return handleSignup(req, res);
  }
  if (path === 'user' && method === 'GET') {
    return handleGetUser(req, res);
  }

  // ===== TOTP/2FA ENDPOINTS =====
  if (path === 'totp/setup' && method === 'POST') {
    return handleSetup2FA(req, res);
  }
  if (path === 'totp/configure' && method === 'POST') {
    return handleConfigure2FA(req, res);
  }
  if (path === 'totp/verify' && method === 'POST') {
    return handleVerifyTOTP(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}

// ===== AUTH HANDLERS =====
async function handleSignin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1`;
    const userResult = await sql`
      SELECT id, email, password_hash, created_at FROM users WHERE email = ${email.toLowerCase()}
    `;
    if (userResult.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = userResult[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const profResult = await sql`
      SELECT first_name, last_name, is_admin, blocked, account_level, currency, is_2fa_enabled FROM profiles WHERE id = ${user.id}
    `;
    const profile = profResult[0] || {};

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
      is2FAEnabled: profile.is_2fa_enabled || false,
      requires2FA: profile.is_2fa_enabled || false,
    });
  } catch (err) {
    console.error('Signin error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Login failed. Please try again.' });
  }
}

async function handleSignup(req, res) {
  const { email, password, firstName, lastName, accountType } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1`;
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

async function handleGetUser(req, res) {
  const userId = req.headers['x-user-id'] || req.query.user_id;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const profResult = await sql`
      SELECT id, first_name, last_name, email, currency, is_admin, blocked, is_2fa_enabled, kyc_verified, credit_card_tier, credit_card_status
      FROM profiles WHERE id = ${userId}
    `;
    if (profResult.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: profResult[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ===== TOTP/2FA HANDLERS =====
async function handleSetup2FA(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const userResult = await sql`SELECT email FROM users WHERE id = ${userId}`;
    if (userResult.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userResult[0];

    const secret = speakeasy.generateSecret({
      name: `PHC Platform (${user.email})`,
      issuer: 'PHC Platform',
    });

    await sql`UPDATE profiles SET totp_secret = ${secret.base32} WHERE id = ${userId}`;

    const otpauthUrl = secret.otpauth_url;
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    res.json({ secret: secret.base32, qrCode, otpauthUrl });
  } catch (err) {
    console.error('2FA setup error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to set up 2FA' });
  }
}

async function handleConfigure2FA(req, res) {
  const { userId, enable, token, secret } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    if (enable) {
      if (!token) return res.status(400).json({ error: 'TOTP token is required to enable 2FA' });

      let storedSecret = secret;
      if (!storedSecret) {
        const profResult = await sql`SELECT totp_secret FROM profiles WHERE id = ${userId}`;
        if (profResult.length === 0) return res.status(404).json({ error: 'Profile not found' });
        storedSecret = profResult[0].totp_secret;
      }
      if (!storedSecret) return res.status(400).json({ error: '2FA setup incomplete. Generate a secret first.' });

      const verified = speakeasy.totp.verify({ secret: storedSecret, token, encoding: 'base32', window: 2 });
      if (!verified) return res.status(401).json({ error: 'Invalid verification code' });

      await sql`UPDATE profiles SET is_2fa_enabled = true, totp_verified = true WHERE id = ${userId}`;
      res.json({ success: true, message: '2FA enabled successfully' });
    } else {
      await sql`UPDATE profiles SET is_2fa_enabled = false, totp_secret = NULL, totp_verified = false WHERE id = ${userId}`;
      res.json({ success: true, message: '2FA disabled successfully' });
    }
  } catch (err) {
    console.error('Configure 2FA error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to configure 2FA' });
  }
}

async function handleVerifyTOTP(req, res) {
  const { userId, token, purpose } = req.body;
  if (!userId || !token) return res.status(400).json({ error: 'userId and token are required' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    const profResult = await sql`SELECT totp_secret FROM profiles WHERE id = ${userId} AND is_2fa_enabled = true`;
    if (profResult.length === 0) return res.status(404).json({ error: 'User not found or 2FA not enabled' });

    const secret = profResult[0].totp_secret;
    if (!secret) return res.status(400).json({ error: 'TOTP secret not set' });

    const verified = speakeasy.totp.verify({ secret, token, encoding: 'base32', window: 2 });
    if (!verified) return res.status(401).json({ error: 'Invalid verification code' });

    res.json({ verified: true, purpose: purpose || 'auth' });
  } catch (err) {
    console.error('TOTP verify error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Verification failed' });
  }
}