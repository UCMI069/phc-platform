import getSql from '../../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const sql = getSql();

  if (req.method === 'GET') {
    try {
      const userResult = await sql`SELECT id, email, created_at FROM users WHERE id = ${id}`;
      if (userResult.length === 0) return res.status(404).json({ error: 'User not found' });

      const user = userResult[0];
      const profResult = await sql`
        SELECT first_name, last_name, phone, country, avatar_url, is_admin, blocked, account_level, currency 
        FROM profiles WHERE id = ${user.id}
      `;
      const profile = profResult[0] || {};

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
      console.error('Get user error:', err.message, err.stack);
      res.status(500).json({ error: 'Failed to get user' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { firstName, lastName, phone, country } = req.body;
      
      const updates = [];
      if (firstName !== undefined) updates.push({ col: 'first_name', val: firstName });
      if (lastName !== undefined) updates.push({ col: 'last_name', val: lastName });
      if (phone !== undefined) updates.push({ col: 'phone', val: phone });
      if (country !== undefined) updates.push({ col: 'country', val: country });

      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

      // Build dynamic query with parameterized values
      const setClauses = updates.map((u, i) => `"${u.col}" = $${i + 1}`).join(', ');
      const values = updates.map(u => u.val);
      values.push(id);

      const query = `UPDATE profiles SET ${setClauses} WHERE id = $${values.length}`;
      await sql.query(query, values);
      res.json({ success: true });
    } catch (err) {
      console.error('Update user error:', err.message, err.stack);
      res.status(500).json({ error: 'Update failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
