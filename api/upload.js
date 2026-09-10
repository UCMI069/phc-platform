import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

  const { bucket, path, contentType, data } = req.body || {};
  if (!bucket || !path || !data) {
    return res.status(400).json({ error: 'bucket, path and data are required' });
  }

  try {
    const body = Buffer.from(data, 'base64');
    const s3 = getS3();
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
    }));
    res.json({ path, error: null });
  } catch (err) {
    console.error('Upload error:', err.message, err.stack);
    res.status(500).json({ error: { message: err.message } });
  }
}