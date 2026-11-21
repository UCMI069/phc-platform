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