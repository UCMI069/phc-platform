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
    console.log('Connected to Neon');

    const sql = readFileSync(join(__dirname, 'migrations', '002_auth.sql'), 'utf8');
    await client.query(sql);
    console.log('Auth migration complete!');

    // Verify
    const res = await client.query(`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name IN ('signup_user','signin_user','get_user_by_id','update_password')
      ORDER BY routine_name
    `);
    console.log('\nAuth functions:');
    for (const row of res.rows) {
      console.log(`  ✓ ${row.routine_name}`);
    }

    const tbl = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position`);
    console.log('\nusers table columns:');
    for (const row of tbl.rows) {
      console.log(`  ✓ ${row.column_name}`);
    }

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
