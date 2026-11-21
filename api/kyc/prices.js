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
      const result = await sql`
        SELECT tier, name, price, description, color_scheme, benefits, updated_at
        FROM credit_card_prices
        ORDER BY CASE tier WHEN 'starter' THEN 1 WHEN 'premium' THEN 2 WHEN 'master' THEN 3 WHEN 'gold' THEN 4 ELSE 5 END
      `;
      return res.json({ prices: result.map(p => ({
        ...p,
        price: Number(p.price),
        colorScheme: typeof p.color_scheme === 'string' ? JSON.parse(p.color_scheme) : p.color_scheme,
        benefits: p.benefits || []
      })) });
    } catch (err) {
      console.error('Get prices error:', err);
      res.status(500).json({ error: err.message });
    }
  } else if (method === 'POST') {
    try {
      const { tier, name, price, description, colorScheme, benefits } = req.body;
      if (!tier || !name || price === undefined) {
        return res.status(400).json({ error: 'tier, name, and price are required' });
      }

      const result = await sql`
        INSERT INTO credit_card_prices (tier, name, price, description, color_scheme, benefits, updated_at)
        VALUES (${tier}, ${name}, ${price}, ${description || ''}, ${JSON.stringify(colorScheme || {})}, ${JSON.stringify(benefits || [])}, timezone('utc'::text, now()))
        ON CONFLICT (tier) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          description = EXCLUDED.description,
          color_scheme = EXCLUDED.color_scheme,
          benefits = EXCLUDED.benefits,
          updated_at = timezone('utc'::text, now())
        RETURNING *
      `;
      return res.json({ price: result[0] });
    } catch (err) {
      console.error('Post price error:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}