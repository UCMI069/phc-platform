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
      requests: requestsResult,
      kyc: kycResult
    });
  } catch (err) {
    console.error('Admin get error:', err);
    res.status(500).json({ error: err.message });
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