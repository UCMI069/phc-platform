import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getSql();

  try {
    // Get user from auth (you'd need to implement proper auth middleware)
    const userId = req.headers['x-user-id'] || req.query.user_id;
    const isAdmin = req.headers['x-is-admin'] === 'true';

    if (req.method === 'GET') {
      if (isAdmin) {
        // Admin sees all requests with user info
        const result = await sql`
          SELECT ccr.*, p.first_name, p.last_name, p.email, ccp.name as tier_name, ccp.price as tier_price
          FROM credit_card_requests ccr
          JOIN profiles p ON ccr.user_id = p.id
          JOIN credit_card_prices ccp ON ccr.card_tier = ccp.tier
          ORDER BY ccr.created_at DESC
        `;
        return res.json({ requests: result });
      } else if (userId) {
        // User sees only their requests
        const result = await sql`
          SELECT ccr.*, ccp.name as tier_name, ccp.price as tier_price, ccp.color_scheme, ccp.benefits
          FROM credit_card_requests ccr
          JOIN credit_card_prices ccp ON ccr.card_tier = ccp.tier
          WHERE ccr.user_id = ${userId}
          ORDER BY ccr.created_at DESC
        `;
        return res.json({ requests: result });
      }
      return res.status(400).json({ error: 'user_id required' });
    }

    if (req.method === 'POST') {
      const { user_id, card_tier } = req.body;
      
      if (!user_id || !card_tier) {
        return res.status(400).json({ error: 'user_id and card_tier are required' });
      }

      // Get price from prices table
      const priceResult = await sql`
        SELECT price, name FROM credit_card_prices WHERE tier = ${card_tier}
      `;
      
      if (priceResult.length === 0) {
        return res.status(400).json({ error: 'Invalid card tier' });
      }

      // Check if user already has a pending request
      const existing = await sql`
        SELECT id FROM credit_card_requests 
        WHERE user_id = ${user_id} AND status = 'pending'
      `;
      
      if (existing.length > 0) {
        return res.status(400).json({ error: 'You already have a pending credit card request' });
      }

      const requestedPrice = priceResult[0].price;
      
      const result = await sql`
        INSERT INTO credit_card_requests (user_id, card_tier, requested_price, status)
        VALUES (${user_id}, ${card_tier}, ${requestedPrice}, 'pending')
        RETURNING *
      `;
      
      return res.json({ request: result[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Credit card requests error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to manage credit card requests' });
  }
}