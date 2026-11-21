import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = getSql();
    const { action, admin_note, admin_id } = req.body;
    
    // Extract request ID from URL
    const urlParts = req.url.split('/');
    const requestId = urlParts[urlParts.length - 2]; // .../requests/{id}/decision or .../kyc/{id}/decision
    
    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'request_id and action (approve/reject) are required' });
    }

    // Determine if it's a card request or KYC decision based on URL
    const isCardRequest = req.url.includes('/requests/');
    
    if (isCardRequest) {
      const requestResult = await sql`SELECT * FROM credit_card_requests WHERE id = ${requestId}`;
      if (requestResult.length === 0) return res.status(404).json({ error: 'Credit card request not found' });
      const request = requestResult[0];
      if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

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
    } else {
      const requestResult = await sql`SELECT * FROM kyc_requests WHERE id = ${requestId}`;
      if (requestResult.length === 0) return res.status(404).json({ error: 'KYC request not found' });
      const request = requestResult[0];
      if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const decidedAt = new Date().toISOString();

      await sql`UPDATE kyc_requests SET status = ${newStatus}, admin_note = ${admin_note || ''}, admin_id = ${admin_id}, decided_at = ${decidedAt} WHERE id = ${requestId}`;

      if (action === 'approve') {
        await sql`UPDATE profiles SET kyc_verified = true, kyc_verified_at = ${decidedAt} WHERE id = ${request.user_id}`;
        await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${request.user_id}, 'KYC Verified', 'Your identity has been verified successfully! ' || ${admin_note || ''}, 'success')`;
      } else {
        await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${request.user_id}, 'KYC Update', 'Your KYC verification was not approved. Admin note: ' || ${admin_note || 'No reason provided'}, 'info')`;
      }
    }

    return res.json({ success: true, message: `Request ${action}d successfully` });
  } catch (err) {
    console.error('Decision error:', err);
    res.status(500).json({ error: err.message });
  }
}