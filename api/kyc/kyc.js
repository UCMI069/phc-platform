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
          SELECT kr.*, p.first_name, p.last_name, p.email, p.avatar_url
          FROM kyc_requests kr
          JOIN profiles p ON kr.user_id = p.id
          ORDER BY kr.created_at DESC
        `;
        return res.json({ requests: result });
      } else if (userId) {
        const result = await sql`SELECT * FROM kyc_requests WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`;
        return res.json({ request: result[0] || null });
      }
      return res.status(400).json({ error: 'user_id required' });
    } catch (err) {
      console.error('Get KYC error:', err);
      res.status(500).json({ error: err.message });
    }
  } else if (method === 'POST') {
    try {
      const { user_id, document_front_url, document_back_url } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id is required' });
      if (!document_front_url) return res.status(400).json({ error: 'Front document is required' });

      const existing = await sql`SELECT id FROM kyc_requests WHERE user_id = ${user_id} AND status = 'pending'`;
      if (existing.length > 0) {
        return res.status(400).json({ error: 'You already have a pending KYC verification' });
      }

      const result = await sql`
        INSERT INTO kyc_requests (user_id, document_front_url, document_back_url, status)
        VALUES (${user_id}, ${document_front_url}, ${document_back_url || null}, 'pending')
        RETURNING *
      `;
      return res.json({ request: result[0] });
    } catch (err) {
      console.error('Create KYC error:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Admin: GET /api/kyc/admin/requests - All card requests
export async function handleAdminGetRequests(req, res) {
  const sql = getSql();
  const result = await sql`
    SELECT ccr.*, p.first_name, p.last_name, p.email, ccp.name as tier_name, ccp.price as tier_price
    FROM credit_card_requests ccr
    JOIN profiles p ON ccr.user_id = p.id
    JOIN credit_card_prices ccp ON ccr.card_tier = ccp.tier
    ORDER BY ccr.created_at DESC
  `;
  return res.json({ requests: result });
}

export async function handleAdminGetKYC(req, res) {
  const sql = getSql();
  const result = await sql`
    SELECT kr.*, p.first_name, p.last_name, p.email, p.avatar_url
    FROM kyc_requests kr
    JOIN profiles p ON kr.user_id = p.id
    ORDER BY kr.created_at DESC
  `;
  return res.json({ requests: result });
}

// POST /api/kyc/kyc/:id/decision - Admin decision on KYC
export async function handleKYCDecision(req, res) {
  const sql = getSql();
  const { action, admin_note, admin_id } = req.body;
  
  const urlParts = req.url.split('/');
  const requestId = urlParts[urlParts.length - 2]; // .../kyc/{id}/decision
  
  if (!requestId || !action || !['approve', 'reject'].includes(action)) {
    return { status: 400, body: { error: 'request_id and action (approve/reject) are required' } };
  }

  const requestResult = await sql`SELECT * FROM kyc_requests WHERE id = ${requestId}`;
  if (requestResult.length === 0) return { status: 404, body: { error: 'KYC request not found' } };
  const request = requestResult[0];
  if (request.status !== 'pending') return { status: 400, body: { error: 'Request already processed' } };

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const decidedAt = new Date().toISOString();

  await sql`
    UPDATE kyc_requests 
    SET status = ${newStatus}, admin_note = ${admin_note || ''}, admin_id = ${admin_id}, decided_at = ${decidedAt}
    WHERE id = ${requestId}
  `;

  if (action === 'approve') {
    await sql`UPDATE profiles SET kyc_verified = true, kyc_verified_at = ${decidedAt} WHERE id = ${request.user_id}`;
    await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${request.user_id}, 'KYC Verified', 'Your identity has been verified successfully! ' || ${admin_note || ''}, 'success')`;
  } else {
    await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${request.user_id}, 'KYC Update', 'Your KYC verification was not approved. Admin note: ' || ${admin_note || 'No reason provided'}, 'info')`;
  }

  return { status: 200, body: { success: true, message: `KYC verification ${action}d successfully` } };
}