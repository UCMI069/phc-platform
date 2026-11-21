import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import getSql from '../db.js';

const s3Client = new S3Client({
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse path from Vercel catch-all
  const pathSegments = req.query.path || [];
  const path = '/' + (Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments);
  const method = req.method;

  // GET /api/storage - Get object
  if (path === '' && req.method === 'GET') {
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

  // POST /api/storage - Delete objects
  if (path === '/delete' && method === 'POST') {
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

  // POST /api/storage - Upload
  if (path === '' && req.method === 'POST') {
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

  return res.status(404).json({ error: 'Not found' });
}