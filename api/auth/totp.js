import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const path = req.url.split('/api/auth/totp')[1] || '/';
  
  // POST /api/auth/totp/setup - Setup 2FA
  if (req.url.includes('/setup') && req.method === 'POST') {
    return handleSetup(req, res);
  }
  
  // POST /api/auth/totp/configure - Enable/disable 2FA
  if (req.url.includes('/configure') && req.method === 'POST') {
    return handleConfigure(req, res);
  }
  
  // POST /api/auth/totp/verify - Verify TOTP token
  if (req.url.includes('/verify') && req.method === 'POST') {
    return handleVerify(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}

async function handleSetup(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    const speakeasy = require('speakeasy');
    const QRCode = require('qrcode');

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

async function handleConfigure(req, res) {
  const { userId, enable, token, secret } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    const speakeasy = require('speakeasy');

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
      const { neon } = require('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL);
      await sql`UPDATE profiles SET is_2fa_enabled = false, totp_secret = NULL, totp_verified = false WHERE id = ${userId}`;
      res.json({ success: true, message: '2FA disabled successfully' });
    }
  } catch (err) {
    console.error('Configure 2FA error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to configure 2FA' });
  }
}

async function handleVerify(req, res) {
  const { userId, token, purpose } = req.body;
  if (!userId || !token) return res.status(400).json({ error: 'userId and token are required' });

  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    const speakeasy = require('speakeasy');

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