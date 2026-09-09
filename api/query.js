import pool from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, params } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const result = await pool.query(query, params || []);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(400).json({ data: null, error: { message: err.message } });
  }
}
