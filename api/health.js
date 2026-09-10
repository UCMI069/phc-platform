import getPool from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected', env: !!process.env.DATABASE_URL });
  } catch (err) {
    console.error('Health check error:', err.message, err.stack);
    res.status(500).json({ ok: false, error: err.message, stack: err.stack });
  }
}