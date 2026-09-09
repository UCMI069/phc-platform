// Quick migration script — run with: node neon/migrate.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Neon connection string from .env
const DATABASE_URL = 'postgresql://neondb_owner:npg_Cdit8Kf0VeOy@ep-square-violet-ae69wlzf-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function migrate() {
  // Dynamically import pg
  const { Client } = await import('pg');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Neon...');
    await client.connect();
    console.log('Connected!\n');

    const sql = readFileSync(join(__dirname, 'migrations', '001_full_schema.sql'), 'utf8');
    
    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration complete!\n');

    // Verify tables
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables created:');
    for (const row of res.rows) {
      console.log(`  ✓ ${row.table_name}`);
    }

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
