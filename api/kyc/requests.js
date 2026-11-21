import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const method = req.method;
  const sql = getSql();

  if (method === 'GET') {
    try {
      const userId = req.headers['x-user-id'] || req.query.user_id;
      const isAdmin = req.headers['x-is-admin'] === 'true';

      if (isAdmin) {
        const result = await sql`
          SELECT ccr.*, p.first_name, p.last_name, p.email, ccp.name as tier_name, ccp.price as tier_price
          FROM credit_card_requests ccr
          JOIN profiles p ON ccr.user_id = p.id
          JOIN credit_card_prices ccp ON ccr.card_tier = ccp.tier
          ORDER BY ccr.created_at DESC
        `;
        return res.json({ requests: result });
      } else if (userId) {
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
    } catch (err) {
      console.error('Get requests error:', err);
      res.status(500).json({ error: err.message });
    }
  } else if (method === 'POST') {
    try {
      const { user_id, card_tier } = req.body;
      if (!user_id || !card_tier) {
        return res.status(400).json({ error: 'user_id and card_tier are required' });
      }

      const priceResult = await sql`SELECT price, name FROM credit_card_prices WHERE tier = ${card_tier}`;
      if (priceResult.length === 0) {
        return res.status(400).json({ error: 'Invalid card tier' });
      }

      const existing = await sql`SELECT id FROM credit_card_requests WHERE user_id = ${user_id} AND status = 'pending'`;
      if (existing.length > 0) {
        return res.status(400).json({ error: 'You already have a pending credit card request' });
      }

      const result = await sql`
        INSERT INTO credit_card_requests (user_id, card_tier, requested_price, status)
        VALUES (${user_id}, ${card_tier}, ${priceResult[0].price}, 'pending')
        RETURNING *
      `;
      return res.json({ request: result[0] });
    } catch (err) {
      console.error('Create request error:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// POST /api/kyc/requests/:id/decision - Admin decision on card request
export async function handleRequestDecision(req, res) {
  const sql = getSql();
  const { action, admin_note, admin_id } = req.body;
  
  const urlParts = req.url.split('/');
  const requestId = urlParts[urlParts.length - 2]; // .../requests/{id}/decision
  
  if (!requestId || !action || !['approve', 'reject'].includes(action)) {
    return { status: 400, body: { error: 'request_id and action (approve/reject) are required' } };
  }

  const requestResult = await sql`SELECT * FROM credit_card_requests WHERE id = ${requestId}`;
  if (requestResult.length === 0) return { status: 404, body: { error: 'Credit card request not found' } };
  const request = requestResult[0];
  if (request.status !== 'pending') return { status: 400, body: { error: 'Request already processed' } };

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const decidedAt = new Date().toISOString();

  await sql`
    UPDATE credit_card_requests 
    SET status = ${newStatus}, admin_note = ${admin_note || ''}, admin_id = ${admin_id}, decided_at = ${decidedAt}
    WHERE id = ${requestId}
  `;

  if (action === 'approve') {
    await sql`UPDATE profiles SET credit_card_tier = ${request.card_tier}, credit_card_status = 'approved', credit_card_approved_at = ${decidedAt} WHERE id = ${request.user_id}`;
    await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${request.user_id}, 'Credit Card Approved', 'Your ' || (SELECT name FROM credit_card_prices WHERE tier = ${request.card_tier}) || ' credit card request has been approved! ' || ${admin_note || ''}, 'success')`;
  } else {
    await sql`UPDATE profiles SET credit_card_status = 'rejected' WHERE id = ${request.user_id}`;
    await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${request.user_id}, 'Credit Card Request Update', 'Your credit card request was not approved. Admin note: ' || ${admin_note || 'No reason provided'}, 'info')`;
  }

  return { status: 200, body: { success: true, message: `Credit card request ${action}d successfully` } };
}