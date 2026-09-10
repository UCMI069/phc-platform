import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

function getS3() {
  return new S3Client({
    region: process.env.NEON_S3_REGION || process.env.VITE_NEON_S3_REGION || 'us-east-2',
    endpoint: process.env.NEON_S3_ENDPOINT || process.env.VITE_NEON_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.NEON_S3_ACCESS_KEY || process.env.VITE_NEON_S3_ACCESS_KEY,
      secretAccessKey: process.env.NEON_S3_SECRET_KEY || process.env.VITE_NEON_S3_SECRET_KEY,
    },
    forcePathStyle: true,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { bucket, paths } = req.body || {};
  if (!bucket || !Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'bucket and paths (array) are required' });
  }

  try {
    const s3 = getS3();
    for (const p of paths) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: p }));
    }
    res.json({ success: true, error: null });
  } catch (err) {
    console.error('Delete error:', err.message, err.stack);
    res.status(500).json({ error: { message: err.message } });
  }
}