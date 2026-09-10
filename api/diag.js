import getSql from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const sql = getSql();

    // 1. Tagged template query (used by auth endpoints)
    const tagged = await sql`SELECT COUNT(*) AS users FROM users`;

    // 2. sql.query() — used by /api/query. Show its raw shape.
    let qResult = null;
    let qType = 'unknown';
    try {
      qResult = await sql.query('SELECT COUNT(*) AS count FROM users');
      qType = `isArray=${Array.isArray(qResult)}; keys=[${Object.keys(qResult).join(',')}]; hasRowsProp=${'rows' in Object(qResult)}`;
    } catch (e) {
      qType = 'sql.query ERROR: ' + e.message;
    }

    // 3. Build exactly what api/query.js would send back
    const normalizedRows = Array.isArray(qResult) ? qResult : (qResult?.rows ?? []);
    const queryResponseShape = { data: normalizedRows, error: null };

    res.json({
      ok: true,
      dbEnvSet: !!process.env.DATABASE_URL,
      taggedQueryRows: tagged,
      sqlQueryType: qType,
      sqlQuerySample: qResult,
      whatApiQuerySends: queryResponseShape,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, stack: err.stack });
  }
}