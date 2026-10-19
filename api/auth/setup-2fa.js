import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const sql = getSql();

    const userResult = await sql`SELECT email FROM users WHERE id = ${userId}`;
    if (userResult.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userResult[0];

    const secret = speakeasy.generateSecret({
      name: `PHC Platform (${user.email})`,
      issuer: 'PHC Platform',
    });

    const updateResult = await sql`UPDATE profiles SET totp_secret = ${secret.base32} WHERE id = ${userId}`;
    console.log('[setup-2fa] UPDATE result:', JSON.stringify(updateResult), 'secret prefix:', secret.base32.slice(0, 8), 'length:', secret.base32.length);
    // Verify it was stored correctly
    const verifyResult = await sql`SELECT totp_secret FROM profiles WHERE id = ${userId}`;
    console.log('[setup-2fa] Verification query result:', verifyResult.length > 0 ? `found, secret prefix: ${verifyResult[0].totp_secret?.slice(0, 8)}` : 'no rows');

    const otpauthUrl = secret.otpauth_url;
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    res.json({ secret: secret.base32, qrCode, otpauthUrl });
  } catch (err) {
    console.error('2FA setup error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to set up 2FA' });
  }
}
