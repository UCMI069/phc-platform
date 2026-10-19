import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, token, purpose } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ error: 'userId and token are required' });
  }

  try {
    const sql = getSql();

    const profResult = await sql`
      SELECT totp_secret FROM profiles WHERE id = ${userId} AND is_2fa_enabled = true
    `;

    if (profResult.length === 0) {
      return res.status(404).json({ error: 'User not found or 2FA not enabled' });
    }

    const secret = profResult[0].totp_secret;
    if (!secret) {
      return res.status(400).json({ error: 'TOTP secret not set' });
    }

    const verified = speakeasy.totp.verify({
      secret,
      token,
      window: 2,
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    res.json({ verified: true, purpose: purpose || 'auth' });
  } catch (err) {
    console.error('TOTP verify error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Verification failed' });
  }
}
