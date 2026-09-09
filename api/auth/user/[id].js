import getPool from '../../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const pool = getPool();

  if (req.method === 'GET') {
    try {
      const userResult = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

      const user = userResult.rows[0];
      const profResult = await pool.query(
        'SELECT first_name, last_name, phone, country, avatar_url, is_admin, blocked, account_level, currency FROM profiles WHERE id = $1',
        [user.id]
      );
      const profile = profResult.rows[0] || {};

      res.json({
        id: user.id,
        email: user.email,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
        country: profile.country || '',
        avatarUrl: profile.avatar_url || '',
        isAdmin: profile.is_admin || false,
        blocked: profile.blocked || false,
        accountLevel: profile.account_level || 'starter',
        currency: profile.currency || 'GBP',
        createdAt: user.created_at,
      });
    } catch (err) {
      console.error('Get user error:', err);
      res.status(500).json({ error: 'Failed to get user' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { firstName, lastName, phone, country } = req.body;
      const fields = [];
      const values = [];
      let i = 1;

      if (firstName !== undefined) { fields.push(`first_name = $${i++}`); values.push(firstName); }
      if (lastName !== undefined) { fields.push(`last_name = $${i++}`); values.push(lastName); }
      if (phone !== undefined) { fields.push(`phone = $${i++}`); values.push(phone); }
      if (country !== undefined) { fields.push(`country = $${i++}`); values.push(country); }

      if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

      values.push(id);
      await pool.query(`UPDATE profiles SET ${fields.join(', ')} WHERE id = $${i}`, values);
      res.json({ success: true });
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ error: 'Update failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
