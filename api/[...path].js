import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { neon } from '@neondatabase/serverless';

// PHC Platform API — single catch-all handler (Vercel Hobby: 4 serverless functions max)

const sql = neon(process.env.DATABASE_URL);

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function jsonError(res, status, message) {
  res.status(status).json({ error: message });
}

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse path from Vercel catch-all or fallback to req.url
  let path = '';
  const rawPathSegments = req.query.path || [];
  let pathSegments;
  if (Array.isArray(rawPathSegments)) {
    pathSegments = rawPathSegments;
  } else if (typeof rawPathSegments === 'string' && rawPathSegments.length > 0) {
    pathSegments = rawPathSegments.split('/').filter(Boolean);
  } else {
    pathSegments = [];
  }
  if (pathSegments.length > 0) {
    path = '/' + pathSegments.join('/');
  } else {
    try {
      const url = new URL(req.url, `https://${req.headers.host}`);
      path = url.pathname;
      if (path.startsWith('/api/')) {
        path = path.slice(4); // Remove '/api'
      }
    } catch (e) {
      path = req.url;
    }
  }
  if (!path.startsWith('/')) path = '/' + path;

  const method = req.method;

  console.log('API Request:', { path, method, url: req.url, queryPath: req.query.path });

  // Parse request body for POST/PUT/PATCH if not already parsed by runtime
  if (['POST', 'PUT', 'PATCH'].includes(method) && (!req.body || typeof req.body !== 'object')) {
    try {
      const text = await new Promise((resolve) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks).toString()));
        req.on('error', () => resolve(''));
      });
      req.body = text ? JSON.parse(text) : {};
    } catch {
      req.body = {};
    }
  }

  try {
    setCORS(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    // ===== AUTH ENDPOINTS =====
    if (path.startsWith('/auth/')) {
      return handleAuth(path, method, req, res);
    }

    // ===== KYC/CARD ENDPOINTS =====
    if (path.startsWith('/kyc/')) {
      return handleKYC(path, method, req, res);
    }

    // ===== STORAGE ENDPOINTS =====
    if (path.startsWith('/storage/')) {
      return handleStorage(path, method, req, res);
    }

    // ===== DIRECT ROUTES (frontend calls these paths) =====
    if (path === '/credit-card-requests' && method === 'GET') return handleGetRequests(req, res);
    if (path === '/credit-card-requests' && method === 'POST') return handleCreateRequest(req, res);
    if (path === '/kyc-requests' && method === 'GET') return handleGetKYC(req, res);
    if (path === '/kyc-requests' && method === 'POST') return handleCreateKYC(req, res);
    if (path === '/admin/credit-card-prices' && method === 'GET') return handleGetPrices(req, res);
    if (path === '/upload-kyc' && method === 'POST') return handleUpload(req, res);
    if (path === '/upload' && method === 'POST') return handleUpload(req, res);
    if (path === '/storage-delete' && method === 'POST') return handleStorage('/storage/delete', method, req, res);

    // ===== CORE ENDPOINTS =====
    if (path === '/health' && method === 'GET') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }
    if (path === '/db' && method === 'GET') {
      return res.json({ status: 'ok' });
    }
    if (path === '/query' && method === 'POST') {
      return handleQuery(req, res);
    }

    return jsonError(res, 404, 'Not found');
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ===== AUTH HANDLERS =====
async function handleAuth(path, method, req, res) {
  // Remove '/auth' prefix
  const subPath = path.startsWith('/auth/') ? path.slice(5) : path;

  if (subPath === '/signin' && method === 'POST') return handleSignin(req, res);
  if (subPath === '/signup' && method === 'POST') return handleSignup(req, res);
  if (subPath === '/user' && method === 'GET') return handleGetUser(req, res);
  if (subPath === '/totp/setup' && method === 'POST') return handleSetup2FA(req, res);
  if (subPath === '/totp/configure' && method === 'POST') return handleConfigure2FA(req, res);
  if (subPath === '/totp/verify' && method === 'POST') return handleVerifyTOTP(req, res);

  return jsonError(res, 404, 'Not found');
}

async function handleSignin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1`;
    const userResult = await sql`
      SELECT id, email, password_hash, created_at FROM users WHERE email = ${email.toLowerCase()}
    `;
    if (userResult.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = userResult[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const profResult = await sql`
      SELECT first_name, last_name, is_admin, blocked, account_level, currency, is_2fa_enabled FROM profiles WHERE id = ${user.id}
    `;
    const profile = profResult[0] || {};

    res.json({
      id: user.id,
      email: user.email,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      isAdmin: profile.is_admin || false,
      blocked: profile.blocked || false,
      accountLevel: profile.account_level || 'starter',
      currency: profile.currency || 'GBP',
      createdAt: user.created_at,
      is2FAEnabled: profile.is_2fa_enabled || false,
      requires2FA: profile.is_2fa_enabled || false,
    });
  } catch (err) {
    console.error('Signin error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Login failed. Please try again.' });
  }
}

async function handleSignup(req, res) {
  const { email, password, firstName, lastName, accountType } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1`;
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await sql`
      INSERT INTO users (email, password_hash) VALUES (${email.toLowerCase()}, ${passwordHash})
      RETURNING id, email, created_at
    `;
    const user = userResult[0];

    await sql`
      INSERT INTO profiles (id, first_name, last_name, username, currency) 
      VALUES (${user.id}, ${firstName || 'New'}, ${lastName || 'User'}, ${email.toLowerCase()}, 'GBP')
    `;

    await sql`
      INSERT INTO accounts (user_id, type, balance, active, tier) 
      VALUES (${user.id}, ${accountType || 'checkings'}, 0.00, true, 'Standard')
    `;

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: firstName || 'New',
      lastName: lastName || 'User',
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Signup error:', err.message, err.stack);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

async function handleGetUser(req, res) {
  const userId = req.headers['x-user-id'] || req.query.user_id || req.query.id;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const profResult = await sql`
      SELECT id, first_name, last_name, email, currency, is_admin, blocked, is_2fa_enabled, kyc_verified, credit_card_tier, credit_card_status
      FROM profiles WHERE id = ${userId}
    `;
    if (profResult.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: profResult[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ===== TOTP/2FA HANDLERS =====
async function handleSetup2FA(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const userResult = await sql`SELECT email FROM users WHERE id = ${userId}`;
    if (userResult.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userResult[0];

    const secret = speakeasy.generateSecret({
      name: `PHC Platform (${user.email})`,
      issuer: 'PHC Platform',
    });

    await sql`UPDATE profiles SET totp_secret = ${secret.base32} WHERE id = ${userId}`;

    const otpauthUrl = secret.otpauth_url;
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    res.json({ secret: secret.base32, qrCode, otpauthUrl });
  } catch (err) {
    console.error('2FA setup error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to set up 2FA' });
  }
}

async function handleConfigure2FA(req, res) {
  const { userId, enable, token, secret } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    if (enable) {
      if (!token) return res.status(400).json({ error: 'TOTP token is required to enable 2FA' });

      let storedSecret = secret;
      if (!storedSecret) {
        const profResult = await sql`SELECT totp_secret FROM profiles WHERE id = ${userId}`;
        if (profResult.length === 0) return res.status(404).json({ error: 'Profile not found' });
        storedSecret = profResult[0].totp_secret;
      }
      if (!storedSecret) return res.status(400).json({ error: '2FA setup incomplete. Generate a secret first.' });

      const verified = speakeasy.totp.verify({ secret: storedSecret, token, encoding: 'base32', window: 2 });
      if (!verified) return res.status(401).json({ error: 'Invalid verification code' });

      await sql`UPDATE profiles SET is_2fa_enabled = true, totp_verified = true WHERE id = ${userId}`;
      res.json({ success: true, message: '2FA enabled successfully' });
    } else {
      await sql`UPDATE profiles SET is_2fa_enabled = false, totp_secret = NULL, totp_verified = false WHERE id = ${userId}`;
      res.json({ success: true, message: '2FA disabled successfully' });
    }
  } catch (err) {
    console.error('Configure 2FA error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to configure 2FA' });
  }
}

async function handleVerifyTOTP(req, res) {
  const { userId, token, purpose } = req.body;
  if (!userId || !token) return res.status(400).json({ error: 'userId and token are required' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    const profResult = await sql`SELECT totp_secret FROM profiles WHERE id = ${userId} AND is_2fa_enabled = true`;
    if (profResult.length === 0) return res.status(404).json({ error: 'User not found or 2FA not enabled' });

    const secret = profResult[0].totp_secret;
    if (!secret) return res.status(400).json({ error: 'TOTP secret not set' });

    const verified = speakeasy.totp.verify({ secret, token, encoding: 'base32', window: 2 });
    if (!verified) return res.status(401).json({ error: 'Invalid verification code' });

    res.json({ verified: true, purpose: purpose || 'auth' });
  } catch (err) {
    console.error('TOTP verify error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Verification failed' });
  }
}

// ===== KYC/CARD HANDLERS =====
async function handleKYC(path, method, req, res) {
  // Remove '/kyc' prefix
  const subPath = path.startsWith('/kyc/') ? path.slice(4) : path;

  if (subPath === '/prices' && method === 'GET') return handleGetPrices(req, res);
  if (subPath === '/prices' && method === 'POST') return handlePostPrice(req, res);

  if (subPath === '/requests' && method === 'GET') return handleGetRequests(req, res);
  if (subPath === '/requests' && method === 'POST') return handleCreateRequest(req, res);
  if (subPath.match(new RegExp('^/requests/[^/]+/decision$')) && method === 'POST') return handleRequestDecision(req, res);

  if (subPath === '/kyc' && method === 'GET') return handleGetKYC(req, res);
  if (subPath === '/kyc' && method === 'POST') return handleCreateKYC(req, res);
  if (subPath.match(new RegExp('^/kyc/[^/]+/decision$')) && method === 'POST') return handleKYCDecision(req, res);

  if (subPath === '/upload' && method === 'POST') return handleUpload(req, res);

  if (subPath === '/admin/requests' && method === 'GET') return handleAdminGetRequests(req, res);
  if (subPath === '/admin/kyc' && method === 'GET') return handleAdminGetKYC(req, res);
  if (subPath.match(new RegExp('^/kyc/[^/]+/decision$')) && method === 'POST') return handleKYCDecision(req, res);

  return jsonError(res, 404, 'Not found');
}

// ===== KYC HANDLERS =====
async function handleGetPrices(req, res) {
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
}

async function handlePostPrice(req, res) {
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
}

async function handleGetRequests(req, res) {
  try {
    const userId = req.headers['x-user-id'] || req.query.user_id || req.query.id;
    const isAdmin = req.headers['x-is-admin'] === 'true';
    const sql = neon(process.env.DATABASE_URL);

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

    const priceResult = await sql`SELECT price, name FROM credit_card_prices WHERE tier = ${card_tier}`;
    if (priceResult.length === 0) {
      return res.status(400).json({ error: 'Invalid card tier' });
    }

    const existing = await sql`SELECT id FROM credit_card_requests WHERE user_id = ${user_id} AND status = 'pending'`;
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
    const { action, admin_note, admin_id } = req.body;
    const urlParts = req.url.split('/');
    const requestId = urlParts[urlParts.length - 2];
    
    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'request_id and action (approve/reject) are required' });
    }

    const requestResult = await sql`SELECT * FROM credit_card_requests WHERE id = ${requestId}`;
    if (requestResult.length === 0) return res.status(404).json({ error: 'Credit card request not found' });
    const request = requestResult[0];
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const decidedAt = new Date().toISOString();

    await sql`
      UPDATE credit_card_requests 
      SET status = ${newStatus}, admin_note = ${admin_note || ''}, admin_id = ${admin_id}, decided_at = ${decidedAt}
      WHERE id = ${requestId}
    `;

    if (action === 'approve') {
      await sql`UPDATE profiles SET credit_card_tier = ${request.card_tier}, credit_card_status = 'approved', credit_card_approved_at = ${decidedAt} WHERE id = ${request.user_id}`;
      await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${request.user_id}, 'Credit Card Approved', 'Your ' || (SELECT name FROM credit_card_prices WHERE tier = ${request.card_tier}) || ' credit card request has been approved! ' || ${admin_note || ''}, 'success')`;
    } else {
      await sql`UPDATE profiles SET credit_card_status = 'rejected' WHERE id = ${request.user_id}`;
      await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${request.user_id}, 'Credit Card Request Update', 'Your credit card request was not approved. Admin note: ' || ${admin_note || 'No reason provided'}, 'info')`;
    }

    return res.json({ success: true, message: `Credit card request ${action}d successfully` });
  } catch (err) {
    console.error('Request decision error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function handleGetKYC(req, res) {
  try {
    const userId = req.headers['x-user-id'] || req.query.user_id || req.query.id;
    const isAdmin = req.headers['x-is-admin'] === 'true';

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
    const { action, admin_note, admin_id } = req.body;
    const urlParts = req.url.split('/');
    const requestId = urlParts[urlParts.length - 2];
    
    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'request_id and action (approve/reject) are required' });
    }

    const requestResult = await sql`SELECT * FROM kyc_requests WHERE id = ${requestId}`;
    if (requestResult.length === 0) return res.status(404).json({ error: 'KYC request not found' });
    const request = requestResult[0];
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

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

async function handleAdminGetRequests(req, res) {
  try {
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

async function handleAdminGetKYC(req, res) {
  try {
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

    const command = new PutObjectCommand({
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
    console.error('Upload error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to upload file' });
  }
}

// ===== STORAGE HANDLERS =====
async function handleStorage(path, method, req, res) {
  const subPath = path.slice(8); // Remove '/storage'

  if (subPath === '' && method === 'GET') {
    const { bucket, key } = req.query || {};
    if (!bucket || !key) return res.status(400).json({ error: 'bucket and key query params are required' });

    try {
      const obj = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      res.setHeader('Content-Type', obj.ContentType || 'application/octet-stream');
      if (obj.ContentLength) res.setHeader('Content-Length', obj.ContentLength);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      obj.Body.pipe(res);
    } catch (err) {
      console.error('Storage GET error:', err);
      const status = err.$metadata?.httpStatusCode || 500;
      res.status(status === 404 ? 404 : 500).json({ error: status === 404 ? 'Not found' : err.message });
    }
    return;
  }

  if (subPath === '/delete' && method === 'POST') {
    const { bucket, paths } = req.body || {};
    if (!bucket || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'bucket and paths (array) are required' });
    }

    try {
      for (const p of paths) {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: p }));
      }
      res.json({ success: true, error: null });
    } catch (err) {
      console.error('Delete error:', err.message, err.stack);
      res.status(500).json({ error: { message: err.message } });
    }
    return;
  }

  if (subPath === '' && method === 'POST') {
    const { bucket, path, contentType, data } = req.body;
    if (!bucket || !path || !contentType || !data) {
      return res.status(400).json({ error: 'bucket, path, contentType, and data are required' });
    }

    try {
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

      const command = new PutObjectCommand({
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
      console.error('Upload error:', err.message, err.stack);
      res.status(500).json({ error: err.message || 'Failed to upload file' });
    }
    return;
  }

  return jsonError(res, 404, 'Not found');
}

// ===== CORE HANDLERS =====
async function handleQuery(req, res) {
  const { query, params } = req.body;
  if (!query) return res.status(400).json({ error: 'query is required' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql.query(query, params || []);
    res.json({ data: { rows: result.rows, rowCount: result.rowCount } });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: err.message });
  }
}