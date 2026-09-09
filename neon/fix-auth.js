import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = 'postgresql://neondb_owner:npg_Cdit8Kf0VeOy@ep-square-violet-ae69wlzf-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function migrate() {
  const { Client } = await import('pg');
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const sql = readFileSync(join(__dirname, 'migrations', '003_fix_auth.sql'), 'utf8');
    await client.query(sql);
    console.log('Auth functions fixed!');
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
