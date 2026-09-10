import getSql from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, params } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const sql = getSql();
    console.log('Testing DB connection in query...');
    await sql`SELECT 1`;
    console.log('DB connection OK in query');
    
    // Use sql.query for parameterized queries with $1, $2 placeholders
    const result = params && params.length > 0 
      ? await sql.query(query, params) 
      : await sql.query(query);
    // Neon's sql.query() returns rows as an array directly, but some driver
    // versions wrap them in { rows: [...] } — normalize to a flat array to
    // match the Express server format ({ data: [rows...], error: null }).
    const rows = Array.isArray(result) ? result : (result?.rows ?? []);
    res.json({ data: rows, error: null });
  } catch (err) {
    console.error('Query error:', err.message, err.stack);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
}
