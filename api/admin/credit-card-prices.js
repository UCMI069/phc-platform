import getSql from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getSql();

  try {
    if (req.method === 'GET') {
      const result = await sql`
        SELECT tier, name, price, description, color_scheme, benefits, updated_at
        FROM credit_card_prices
        ORDER BY 
          CASE tier 
            WHEN 'starter' THEN 1
            WHEN 'premium' THEN 2
            WHEN 'master' THEN 3
            WHEN 'gold' THEN 4
            ELSE 5
          END
      `;
      return res.json({ prices: result });
    }

    if (req.method === 'POST') {
      const { tier, name, price, description, color_scheme, benefits } = req.body;
      
      if (!tier || !name || price === undefined) {
        return res.status(400).json({ error: 'tier, name, and price are required' });
      }

      const result = await sql`
        INSERT INTO credit_card_prices (tier, name, price, description, color_scheme, benefits, updated_at, updated_by)
        VALUES (${tier}, ${name}, ${price}, ${description || ''}, ${color_scheme || '{}'}, ${benefits || []}, timezone('utc'::text, now()), ${req.body.admin_id || null})
        ON CONFLICT (tier) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          description = EXCLUDED.description,
          color_scheme = EXCLUDED.color_scheme,
          benefits = EXCLUDED.benefits,
          updated_at = timezone('utc'::text, now()),
          updated_by = EXCLUDED.updated_by
        RETURNING *
      `;
      
      return res.json({ price: result[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Credit card prices error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to manage credit card prices' });
  }
}