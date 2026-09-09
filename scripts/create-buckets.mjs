import { S3Client, CreateBucketCommand, PutBucketPolicyCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'us-east-2',
  endpoint: 'https://br-blue-water-aewzgue6.storage.c-2.us-east-2.aws.neon.tech',
  credentials: {
    accessKeyId: 'nak_live_160488f2e50a49ec98d8b6178390d45c',
    secretAccessKey: 'nsk_live_181132d30573227975a926f883f8eb05631fcb2f85456217f09a50e0ccfd857e',
  },
  forcePathStyle: true,
});

const buckets = ['avatars', 'cryptoqr'];

const publicReadPolicy = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicRead',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::BUCKET_NAME/*',
    },
  ],
});

async function createBuckets() {
  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`✓ Bucket "${bucket}" already exists`);
    } catch {
      // Bucket doesn't exist, create it
      try {
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
        console.log(`✓ Bucket "${bucket}" created`);
      } catch (err) {
        console.error(`✗ Failed to create "${bucket}": ${err.message}`);
        continue;
      }
    }

    // Set public read policy
    try {
      const policy = publicReadPolicy.replace(/BUCKET_NAME/g, bucket);
      await s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy }));
      console.log(`✓ Public read policy set for "${bucket}"`);
    } catch (err) {
      console.error(`✗ Failed to set policy for "${bucket}": ${err.message}`);
    }
  }
}

createBuckets();
