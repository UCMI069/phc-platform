import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = getSql();

    // Admin requests
    const requestsResult = await sql`
      SELECT ccr.*, p.first_name, p.last_name, p.email, ccp.name as tier_name, ccp.price as tier_price
      FROM credit_card_requests ccr
      JOIN profiles p ON ccr.user_id = p.id
      JOIN credit_card_prices ccp ON ccr.card_tier = ccp.tier
      ORDER BY ccr.created_at DESC
    `;

    // Admin KYC
    const kycResult = await sql`
      SELECT kr.*, p.first_name, p.last_name, p.email, p.avatar_url
      FROM kyc_requests kr
      JOIN profiles p ON kr.user_id = p.id
      ORDER BY kr.created_at DESC
    `;

    return res.json({ 
      requests: result,
      kyc: kycResult
    });
  } catch (err) {
    console.error('Admin get error:', err);
    res.status(500).json({ error: err.message });
  }
}