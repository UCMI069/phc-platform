import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { request_id, action, admin_note, admin_id } = req.body;
  
  if (!request_id || !action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'request_id and action (approve/reject) are required' });
  }

  const sql = getSql();

  try {
    const requestResult = await sql`
      SELECT * FROM kyc_requests WHERE id = ${request_id}
    `;
    
    if (requestResult.length === 0) {
      return res.status(404).json({ error: 'KYC request not found' });
    }
    
    const request = requestResult[0];
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const decidedAt = new Date().toISOString();

    // Update request
    await sql`
      UPDATE kyc_requests 
      SET status = ${newStatus}, admin_note = ${admin_note || ''}, admin_id = ${admin_id}, decided_at = ${decidedAt}
      WHERE id = ${request_id}
    `;

    // If approved, update user profile
    if (action === 'approve') {
      await sql`
        UPDATE profiles 
        SET kyc_verified = true, kyc_verified_at = ${decidedAt}
        WHERE id = ${request.user_id}
      `;

      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${request.user_id}, 'KYC Verified', 'Your identity has been verified successfully! ' || ${admin_note || ''}, 'success')
      `;
    } else {
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${request.user_id}, 'KYC Update', 'Your KYC verification was not approved. Admin note: ' || ${admin_note || 'No reason provided'}, 'info')
      `;
    }

    return res.json({ success: true, message: `KYC verification ${action}d successfully` });
  } catch (err) {
    console.error('Admin KYC decision error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to process decision' });
  }
}