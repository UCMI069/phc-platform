import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.NEON_S3_REGION || process.env.VITE_NEON_S3_REGION || 'us-east-2',
  endpoint: process.env.NEON_S3_ENDPOINT || process.env.VITE_NEON_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEON_S3_ACCESS_KEY || process.env.VITE_NEON_S3_ACCESS_KEY,
    secretAccessKey: process.env.NEON_S3_SECRET_KEY || process.env.VITE_NEON_S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url.split('/api/kyc')[1] || '/';
  const method = req.method;

  // GET /api/kyc/prices - Get card prices
  if (path === '/prices' && method === 'GET') {
    return handleGetPrices(req, res);
  }
  
  // POST /api/kyc/prices - Create/update card price (admin)
  if (path === '/prices' && method === 'POST') {
    return handlePostPrice(req, res);
  }

  // GET /api/kyc/requests - Get user's card requests
  if (path === '/requests' && method === 'GET') {
    return handleGetRequests(req, res);
  }
  
  // POST /api/kyc/requests - Create card request
  if (path === '/requests' && method === 'POST') {
    return handleCreateRequest(req, res);
  }

  // POST /api/kyc/requests/[id]/decision - Admin decision on card request
  if (path.match(/^\/requests\/[^\/]+\/decision$/) && method === 'POST') {
    return handleRequestDecision(req, res);
  }

  // GET /api/kyc/kyc - Get user's KYC
  if (path === '/kyc' && method === 'GET') {
    return handleGetKYC(req, res);
  }
  
  // POST /api/kyc/kyc - Create KYC request
  if (path === '/kyc' && method === 'POST') {
    return handleCreateKYC(req, res);
  }

  // POST /api/kyc/kyc/[id]/decision - Admin decision on KYC
  if (path.match(/^\/kyc\/[^\/]+\/decision$/) && method === 'POST') {
    return handleKYCDecision(req, res);
  }

  // POST /api/kyc/upload - Upload KYC document
  if (path === '/upload' && method === 'POST') {
    return handleUpload(req, res);
  }

  // Admin: GET /api/kyc/admin/requests - All card requests
  if (path === '/admin/requests' && method === 'GET') {
    return handleAdminGetRequests(req, res);
  }

  // Admin: GET /api/kyc/admin/kyc - All KYC requests
  if (path === '/admin/kyc' && method === 'GET') {
    return handleAdminGetKYC(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}

// Helper: Get SQL client
function getSql() {
  const { neon } = require('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL);
}

// Helper: Verify admin
async function isAdmin(sql, userId) {
  if (!userId) return false;
  const result = await sql`SELECT is_admin FROM profiles WHERE id = ${userId}`;
  return result.length > 0 && result[0].is_admin === true;
}

// --- CARD PRICES ---

async function handleGetPrices(req, res) {
  try {
    const sql = getSql();
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
}

async function handlePostPrice(req, res) {
  try {
    const { tier, name, price, description, colorScheme, benefits } = req.body;
    if (!tier || !name || price === undefined) {
      return res.status(400).json({ error: 'tier, name, and price are required' });
    }

    const sql = getSql();
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
}

// --- CARD REQUESTS ---

async function handleGetRequests(req, res) {
  try {
    const userId = req.headers['x-user-id'] || req.query.user_id;
    const isAdmin = req.headers['x-is-admin'] === 'true';
    const sql = getSql();

    if (isAdmin) {
      const result = await sql`
        SELECT ccr.*, p.first_name, p.last_name, p.email, ccp.name as tier_name, ccp.price as tier_price
        FROM credit_card_requests ccr
        JOIN profiles p ON ccr.user_id = p.id
        JOIN credit_card_prices ccp ON ccr.card_tier = ccp.tier
        ORDER BY ccr.created_at DESC
      `;
      return res.json({ requests: result });
    } else if (userId) {
      const result = await sql`
        SELECT ccr.*, ccp.name as tier_name, ccp.price as tier_price, ccp.color_scheme, ccp.benefits
        FROM credit_card_requests ccr
        JOIN credit_card_prices ccp ON ccr.card_tier = ccp.tier
        WHERE ccr.user_id = ${userId}
        ORDER BY ccr.created_at DESC
      `;
      return res.json({ requests: result });
    }
    return res.status(400).json({ error: 'user_id required' });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function handleCreateRequest(req, res) {
  try {
    const { user_id, card_tier } = req.body;
    if (!user_id || !card_tier) {
      return res.status(400).json({ error: 'user_id and card_tier are required' });
    }

    const sql = getSql();
    const priceResult = await sql`SELECT price, name FROM credit_card_prices WHERE tier = ${card_tier}`;
    if (priceResult.length === 0) {
      return res.status(400).json({ error: 'Invalid card tier' });
    }

    const existing = await sql`
      SELECT id FROM credit_card_requests 
      WHERE user_id = ${user_id} AND status = 'pending'
    `;
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have a pending credit card request' });
    }

    const result = await sql`
      INSERT INTO credit_card_requests (user_id, card_tier, requested_price, status)
      VALUES (${user_id}, ${card_tier}, ${priceResult[0].price}, 'pending')
      RETURNING *
    `;
    return res.json({ request: result[0] });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function handleRequestDecision(req, res) {
  try {
    const requestId = req.url.split('/requests/')[1].split('/decision')[0];
    const { action, admin_note, admin_id } = req.body;
    
    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'request_id and action (approve/reject) are required' });
    }

    const sql = getSql();
    const requestResult = await sql`SELECT * FROM credit_card_requests WHERE id = ${requestId}`;
    if (requestResult.length === 0) {
      return res.status(404).json({ error: 'Credit card request not found' });
    }
    const request = requestResult[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const decidedAt = new Date().toISOString();

    await sql`
      UPDATE credit_card_requests 
      SET status = ${newStatus}, admin_note = ${admin_note || ''}, admin_id = ${admin_id}, decided_at = ${decidedAt}
      WHERE id = ${requestId}
    `;

    if (action === 'approve') {
      await sql`
        UPDATE profiles 
        SET credit_card_tier = ${request.card_tier}, credit_card_status = 'approved', credit_card_approved_at = ${decidedAt}
        WHERE id = ${request.user_id}
      `;
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${request.user_id}, 'Credit Card Approved', 
          'Your ' || (SELECT name FROM credit_card_prices WHERE tier = ${request.card_tier}) || ' credit card request has been approved! ' || ${admin_note || ''}, 'success')
      `;
    } else {
      await sql`UPDATE profiles SET credit_card_status = 'rejected' WHERE id = ${request.user_id}`;
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${request.user_id}, 'Credit Card Request Update', 
          'Your credit card request was not approved. Admin note: ' || ${admin_note || 'No reason provided'}, 'info')
      `;
    }

    return res.json({ success: true, message: `Credit card request ${action}d successfully` });
  } catch (err) {
    console.error('Request decision error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function handleAdminGetRequests(req, res) {
  try {
    const sql = getSql();
    const result = await sql`
      SELECT ccr.*, p.first_name, p.last_name, p.email, ccp.name as tier_name, ccp.price as tier_price
      FROM credit_card_requests ccr
      JOIN profiles p ON ccr.user_id = p.id
      JOIN credit_card_prices ccp ON ccr.card_tier = ccp.tier
      ORDER BY ccr.created_at DESC
    `;
    return res.json({ requests: result });
  } catch (err) {
    console.error('Admin get requests error:', err);
    res.status(500).json({ error: err.message });
  }
}

// --- KYC ---

async function handleGetKYC(req, res) {
  try {
    const userId = req.headers['x-user-id'] || req.query.user_id;
    const isAdmin = req.headers['x-is-admin'] === 'true';
    const sql = getSql();

    if (isAdmin) {
      const result = await sql`
        SELECT kr.*, p.first_name, p.last_name, p.email, p.avatar_url
        FROM kyc_requests kr
        JOIN profiles p ON kr.user_id = p.id
        ORDER BY kr.created_at DESC
      `;
      return res.json({ requests: result });
    } else if (userId) {
      const result = await sql`SELECT * FROM kyc_requests WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`;
      return res.json({ request: result[0] || null });
    }
    return res.status(400).json({ error: 'user_id required' });
  } catch (err) {
    console.error('Get KYC error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function handleCreateKYC(req, res) {
  try {
    const { user_id, document_front_url, document_back_url } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    if (!document_front_url) return res.status(400).json({ error: 'Front document is required' });

    const sql = getSql();
    const existing = await sql`SELECT id FROM kyc_requests WHERE user_id = ${user_id} AND status = 'pending'`;
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have a pending KYC verification' });
    }

    const result = await sql`
      INSERT INTO kyc_requests (user_id, document_front_url, document_back_url, status)
      VALUES (${user_id}, ${document_front_url}, ${document_back_url || null}, 'pending')
      RETURNING *
    `;
    return res.json({ request: result[0] });
  } catch (err) {
    console.error('Create KYC error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function handleKYCDecision(req, res) {
  try {
    const requestId = req.url.split('/kyc/')[1].split('/decision')[0];
    const { action, admin_note, admin_id } = req.body;
    
    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'request_id and action (approve/reject) are required' });
    }

    const sql = getSql();
    const requestResult = await sql`SELECT * FROM kyc_requests WHERE id = ${requestId}`;
    if (requestResult.length === 0) {
      return res.status(404).json({ error: 'KYC request not found' });
    }
    const request = requestResult[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const decidedAt = new Date().toISOString();

    await sql`
      UPDATE kyc_requests 
      SET status = ${newStatus}, admin_note = ${admin_note || ''}, admin_id = ${admin_id}, decided_at = ${decidedAt}
      WHERE id = ${requestId}
    `;

    if (action === 'approve') {
      await sql`UPDATE profiles SET kyc_verified = true, kyc_verified_at = ${decidedAt} WHERE id = ${request.user_id}`;
      await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${request.user_id}, 'KYC Verified', 'Your identity has been verified successfully! ' || ${admin_note || ''}, 'success')`;
    } else {
      await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${request.user_id}, 'KYC Update', 'Your KYC verification was not approved. Admin note: ' || ${admin_note || 'No reason provided'}, 'info')`;
    }

    return res.json({ success: true, message: `KYC verification ${action}d successfully` });
  } catch (err) {
    console.error('KYC decision error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function handleAdminGetKYC(req, res) {
  try {
    const sql = getSql();
    const result = await sql`
      SELECT kr.*, p.first_name, p.last_name, p.email, p.avatar_url
      FROM kyc_requests kr
      JOIN profiles p ON kr.user_id = p.id
      ORDER BY kr.created_at DESC
    `;
    return res.json({ requests: result });
  } catch (err) {
    console.error('Admin KYC error:', err);
    res.status(500).json({ error: err.message });
  }
}

// --- UPLOAD ---

async function handleUpload(req, res) {
  try {
    const { bucket, path, contentType, data } = req.body;
    if (!bucket || !path || !contentType || !data) {
      return res.status(400).json({ error: 'bucket, path, contentType, and data are required' });
    }

    let buffer;
    if (data.startsWith('data:')) {
      buffer = Buffer.from(data.split(',')[1], 'base64');
    } else {
      buffer = Buffer.from(data, 'base64');
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must be less than 10MB' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Only JPG, PNG, or PDF files are allowed' });
    }

    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: process.env.NEON_S3_REGION || process.env.VITE_NEON_S3_REGION || 'us-east-2',
      endpoint: process.env.NEON_S3_ENDPOINT || process.env.VITE_NEON_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.NEON_S3_ACCESS_KEY || process.env.VITE_NEON_S3_ACCESS_KEY,
        secretAccessKey: process.env.NEON_S3_SECRET_KEY || process.env.VITE_NEON_S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    const command = new (require('@aws-sdk/client-s3').PutObjectCommand)({
      Bucket: bucket,
      Key: path,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const endpoint = process.env.NEON_S3_ENDPOINT || process.env.VITE_NEON_S3_ENDPOINT;
    const url = `${endpoint}/${bucket}/${path}`;
    return res.json({ url, path });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload file' });
  }
}