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
    // Get the request
    const requestResult = await sql`
      SELECT * FROM credit_card_requests WHERE id = ${request_id}
    `;
    
    if (requestResult.length === 0) {
      return res.status(404).json({ error: 'Credit card request not found' });
    }
    
    const request = requestResult[0];
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const decidedAt = new Date().toISOString();

    // Update request
    await sql`
      UPDATE credit_card_requests 
      SET status = ${newStatus}, admin_note = ${admin_note || ''}, admin_id = ${admin_id}, decided_at = ${decidedAt}
      WHERE id = ${request_id}
    `;

    // If approved, update user profile
    if (action === 'approve') {
      await sql`
        UPDATE profiles 
        SET credit_card_tier = ${request.card_tier}, 
            credit_card_status = 'approved',
            credit_card_approved_at = ${decidedAt}
        WHERE id = ${request.user_id}
      `;

      // Create notification for user
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${request.user_id}, 'Credit Card Approved', 
          'Your ' || (SELECT name FROM credit_card_prices WHERE tier = ${request.card_tier}) || ' credit card request has been approved! ' || ${admin_note || ''}, 'success')
      `;
    } else {
      // If rejected, update profile status
      await sql`
        UPDATE profiles 
        SET credit_card_status = 'rejected'
        WHERE id = ${request.user_id}
      `;

      // Create notification for user
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${request.user_id}, 'Credit Card Request Update', 
          'Your credit card request was not approved. Admin note: ' || ${admin_note || 'No reason provided'}, 'info')
      `;
    }

    return res.json({ success: true, message: `Credit card request ${action}d successfully` });
  } catch (err) {
    console.error('Admin credit card decision error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to process decision' });
  }
}