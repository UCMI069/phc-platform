import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { neon } from '@neondatabase/serverless';

const s3Client = new S3Client({
  region: process.env.NEON_S3_REGION || process.env.VITE_NEON_S3_REGION || 'us-east-2',
  endpoint: process.env.NEON_S3_ENDPOINT || process.env.VITE_NEON_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEON_S3_ACCESS_KEY || process.env.VITE_NEON_S3_ACCESS_KEY,
    secretAccessKey: process.env.NEON_S3_SECRET_KEY || process.env.VITE_NEON_S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const sql = neon(process.env.DATABASE_URL);

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse path from Vercel catch-all or fallback to req.url
  let path = '';
  const pathSegments = req.query.path || [];
  if (Array.isArray(pathSegments) && pathSegments.length > 0) {
    path = '/' + pathSegments.join('/');
  } else {
    try {
      const url = new URL(req.url, `https://${req.headers.host}`);
      let pathname = url.pathname;
      // Remove /api/kyc prefix
      if (pathname.startsWith('/api/kyc/')) {
        path = pathname.slice(8); // Remove '/api/kyc'
      } else if (pathname.startsWith('/api/kyc')) {
        path = '/';
      } else {
        path = pathname;
      }
    } catch (e) {
      // fallback
      path = req.url;
    }
    if (!path.startsWith('/')) path = '/' + path;
  } else {
    path = '/' + pathSegments.join('/');
  }

  const method = req.method;

  console.log('KYC API Request:', { path, method, url: req.url, queryPath: req.query.path });

  try {
    // ===== CARD PRICES =====
    if (path === '/prices' && method === 'GET') {
      return handleGetPrices(req, res);
    }
    if (path === '/prices' && method === 'POST') {
      return handlePostPrice(req, res);
    }

    // ===== CARD REQUESTS =====
    if (path === '/requests' && method === 'GET') {
      return handleGetRequests(req, res);
    }
    if (path === '/requests' && method === 'POST') {
      return handleCreateRequest(req, res);
    }

    // POST /api/kyc/requests/:id/decision - Admin decision on card request
    if (path.match(/^\/requests\/[^\/]+\/decision$/) && method === 'POST') {
      return handleRequestDecision(req, res);
    }

    // ===== KYC =====
    if (path === '/kyc' && method === 'GET') {
      return handleGetKYC(req, res);
    }
    if (path === '/kyc' && method === 'POST') {
      return handleCreateKYC(req, res);
    }
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

    // POST /api/kyc/kyc/:id/decision - Admin decision on KYC
    if (path.match(/^\/kyc\/[^\/]+\/decision$/) && method === 'POST') {
      return handleKYCDecision(req, res);
    }

    console.warn('No route matched:', { path, method, url: req.url });
    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('KYC API Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ... rest of handlers remain the same