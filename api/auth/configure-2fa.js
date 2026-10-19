import speakeasy from 'speakeasy';
import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, enable, token } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const sql = getSql();

    if (enable) {
      if (!token) return res.status(400).json({ error: 'TOTP token is required to enable 2FA' });

      const profResult = await sql`SELECT totp_secret FROM profiles WHERE id = ${userId}`;
      if (profResult.length === 0) return res.status(404).json({ error: 'Profile not found' });

      const storedSecret = profResult[0].totp_secret;
      if (!storedSecret) return res.status(400).json({ error: '2FA setup incomplete. Generate a secret first.' });

      const verified = speakeasy.totp.verify({ secret: storedSecret, token, window: 1 });
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
