import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.NEON_S3_REGION || process.env.VITE_NEON_S3_REGION || 'us-east-2',
  endpoint: process.env.NEON_S3_ENDPOINT || process.env.VITE_NEON_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEON_S3_ACCESS_KEY || process.env.VITE_NEON_S3_ACCESS_KEY,
    secretAccessKey: process.env.NEON_S3_SECRET_KEY || process.env.VITE_NEON_S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { bucket, key } = req.query || {};
  if (!bucket || !key) return res.status(400).json({ error: 'bucket and key query params are required' });

  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    res.setHeader('Content-Type', obj.ContentType || 'application/octet-stream');
    if (obj.ContentLength) res.setHeader('Content-Length', obj.ContentLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    obj.Body.pipe(res);
  } catch (err) {
    console.error('Storage GET error:', err);
    const status = err.$metadata?.httpStatusCode || 500;
    res.status(status === 404 ? 404 : 500).json({ error: status === 404 ? 'Not found' : err.message });
  }
}