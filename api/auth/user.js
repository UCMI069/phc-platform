import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = req.headers['x-user-id'] || req.query.user_id;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const sql = getSql();
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