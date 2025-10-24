# File Upload Service Guide

## Table of Contents
- [Overview](#overview)
- [S3 Configuration](#s3-configuration)
- [File Categories](#file-categories)
- [Upload Methods](#upload-methods)
- [API Endpoints](#api-endpoints)
- [Pre-signed URLs](#pre-signed-urls)
- [File Validation](#file-validation)
- [Security](#security)
- [Best Practices](#best-practices)

---

## Overview

The GoLive platform uses **AWS S3** for scalable, durable file storage with support for avatars, documents, artifacts, and more.

**Features:**
- **Direct S3 Upload** - Files stored directly in S3, not on server
- **Pre-signed URLs** - Secure temporary URLs for upload/download
- **Multipart Upload** - Support for large files (up to 500MB)
- **File Validation** - Type and size validation
- **Encryption** - Server-side AES-256 encryption
- **CDN Integration** - Optional CloudFront for fast delivery
- **Automatic Cleanup** - Scheduled removal of temporary files

**Technologies:**
- **AWS S3** - Object storage
- **Multer** - File upload middleware
- **AWS SDK v3** - S3 client library

---

## S3 Configuration

### Environment Variables

```bash
# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3 Bucket
S3_BUCKET_NAME=golive-files

# Optional: CloudFront CDN
CDN_URL=https://d1234567890.cloudfront.net
```

### IAM Policy

The AWS credentials need the following S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::golive-files/*",
        "arn:aws:s3:::golive-files"
      ]
    }
  ]
}
```

### S3 Bucket Configuration

**Bucket Settings:**
- **Versioning**: Enabled (recommended)
- **Encryption**: AES-256 server-side encryption
- **Public Access**: Block all public access
- **CORS**: Configured for pre-signed uploads

**CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:3030",
      "https://app.golive.dev"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## File Categories

Files are organized into categories:

| Category | Path | Purpose | Max Size | Access |
|----------|------|---------|----------|--------|
| **avatars** | `avatars/{userId}/` | User profile pictures | 5 MB | Public |
| **artifacts** | `artifacts/{userId}/` | Build artifacts | 500 MB | Private |
| **reports** | `reports/{userId}/` | Generated reports | 100 MB | Private |
| **attachments** | `attachments/{userId}/` | General documents | 50 MB | Private |
| **backups** | `backups/` | Database backups | 10 GB | Private |
| **temp** | `temp/` | Temporary files | 10 MB | Private |
| **logs** | `logs/` | Application logs | 100 MB | Private |

### File Access Levels

- **public-read** - Anyone can download (avatars)
- **private** - Only authenticated users with pre-signed URL
- **authenticated-read** - Any authenticated AWS user

---

## Upload Methods

### Method 1: Direct Upload via API

Upload file directly through API endpoint.

**Pros:**
- Simple integration
- Server validates file before upload
- Progress tracking on server

**Cons:**
- File passes through server (slower for large files)
- Uses server bandwidth and memory

**Example:**
```typescript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

const response = await fetch('http://localhost:8000/api/v1/files/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: formData,
});

const data = await response.json();
console.log('File URL:', data.data.url);
```

### Method 2: Pre-signed URL Upload

Get a pre-signed URL and upload directly to S3.

**Pros:**
- Faster (direct to S3)
- No server bandwidth usage
- Scalable for large files

**Cons:**
- Two-step process
- Client must handle S3 upload

**Example:**
```typescript
// Step 1: Get pre-signed URL
const urlResponse = await fetch('http://localhost:8000/api/v1/files/presigned-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    filename: 'document.pdf',
    contentType: 'application/pdf',
    category: 'attachments',
  }),
});

const { uploadUrl, key } = await urlResponse.json();

// Step 2: Upload to S3
await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/pdf',
  },
  body: file,
});

console.log('File uploaded with key:', key);
```

---

## API Endpoints

### Upload Avatar

```
POST /api/v1/files/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- avatar: File (image, max 5MB)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "avatars/user-123/1698067200-abc123-photo.jpg",
    "url": "https://golive-files.s3.amazonaws.com/avatars/...",
    "size": 245678,
    "contentType": "image/jpeg"
  }
}
```

### Upload Document

```
POST /api/v1/files/document
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- document: File (PDF/DOC/TXT, max 50MB)
```

### Upload Artifact

```
POST /api/v1/files/artifact
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- artifact: File (ZIP/TAR/GZ, max 500MB)
- projectId: string (optional)
- pipelineRunId: string (optional)
```

### Get Pre-signed Upload URL

```
POST /api/v1/files/presigned-url
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "filename": "document.pdf",
  "contentType": "application/pdf",
  "category": "attachments"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://golive-files.s3.amazonaws.com/...",
    "key": "attachments/user-123/...",
    "expiresIn": 300
  }
}
```

### Get Download URL

```
GET /api/v1/files/{key}/download?expiresIn=3600
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://golive-files.s3.amazonaws.com/...",
    "expiresIn": 3600
  }
}
```

### Get File Metadata

```
GET /api/v1/files/{key}/metadata
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "attachments/user-123/document.pdf",
    "size": 1024567,
    "contentType": "application/pdf",
    "lastModified": "2025-10-23T12:00:00Z",
    "etag": "abc123...",
    "metadata": {
      "userId": "user-123",
      "originalName": "document.pdf"
    }
  }
}
```

### Delete File

```
DELETE /api/v1/files/{key}
Authorization: Bearer <token>
```

---

## Pre-signed URLs

Pre-signed URLs allow secure, temporary access to S3 objects without AWS credentials.

### Upload Pre-signed URL

**Use Case:** Client uploads directly to S3

**Steps:**
1. Client requests pre-signed URL from API
2. API generates URL with PUT permission
3. Client uploads file to S3 using URL
4. URL expires after specified time (default: 5 minutes)

**Example:**
```typescript
// Get pre-signed URL
const { uploadUrl, key } = await getPresignedUploadUrl(
  'photo.jpg',
  'image/jpeg',
  'avatars'
);

// Upload file
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },
  body: file,
});
```

### Download Pre-signed URL

**Use Case:** Secure download of private files

**Steps:**
1. Client requests download URL from API
2. API generates URL with GET permission
3. Client downloads file from S3
4. URL expires after specified time (default: 1 hour)

**Example:**
```typescript
const { downloadUrl } = await getDownloadUrl(
  'artifacts/user-123/build.zip',
  3600 // 1 hour
);

// Download file
window.location.href = downloadUrl;
// or
const blob = await fetch(downloadUrl).then(r => r.blob());
```

---

## File Validation

### Allowed File Types

**Images** (for avatars):
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)
- SVG (`.svg`)

**Documents**:
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- Text (`.txt`)
- CSV (`.csv`)

**Archives** (for artifacts):
- ZIP (`.zip`)
- TAR (`.tar`)
- GZIP (`.gz`)

### File Size Limits

```typescript
{
  AVATAR: 5 MB,
  DOCUMENT: 50 MB,
  ARTIFACT: 500 MB,
  REPORT: 100 MB,
  DEFAULT: 10 MB
}
```

### Validation Process

1. **MIME Type Check** - Server validates Content-Type
2. **Size Check** - File size must be within limits
3. **Extension Check** - File extension must match MIME type
4. **Virus Scan** - (Optional) Scan for malware

**Error Responses:**
```json
{
  "success": false,
  "error": "File type image/bmp not allowed",
  "statusCode": 400
}
```

---

## Security

### Server-Side Encryption

All files are encrypted at rest using AES-256:

```typescript
await StorageService.uploadFile(buffer, filename, {
  encrypt: true, // Default: true
});
```

### Access Control

**Private Files:**
- Require pre-signed URL for access
- URL expires after specified time
- User must be authenticated to get URL

**Public Files:**
- Direct URL access (avatars)
- Still stored in S3 with encryption
- Can be cached by CDN

### File Ownership

Best practice: Track file ownership in database

```typescript
// Store file reference in database
await db.file.create({
  data: {
    key: result.key,
    url: result.url,
    userId: user.id,
    projectId: projectId,
    category: 'artifacts',
    size: result.size,
    contentType: result.contentType,
  },
});

// Check ownership before allowing download/delete
const file = await db.file.findUnique({ where: { key } });
if (file.userId !== user.id && user.role !== 'ADMIN') {
  throw new Error('Unauthorized');
}
```

### Virus Scanning

For production, integrate virus scanning:

```bash
npm install clamav.js
```

```typescript
import clamscan from 'clamav.js';

async function scanFile(buffer: Buffer): Promise<boolean> {
  const scanner = await clamscan({ ...config });
  const { isInfected } = await scanner.scanBuffer(buffer);
  return !isInfected;
}

// Use in upload handler
if (!await scanFile(file.buffer)) {
  throw new Error('File infected with virus');
}
```

---

## Best Practices

### 1. **Use Pre-signed URLs for Large Files**

For files over 10MB, use pre-signed URLs to avoid server bottleneck:

```typescript
// ✅ Good - Direct S3 upload
const { uploadUrl } = await getPresignedUploadUrl(...);
await uploadToS3(uploadUrl, largeFile);

// ❌ Bad - Through server
const formData = new FormData();
formData.append('file', largeFile); // Goes through server
await api.uploadFile(formData);
```

### 2. **Set Appropriate Expiration Times**

```typescript
// Short expiration for uploads (5 min)
await getPresignedUploadUrl(filename, type, category, 300);

// Longer expiration for downloads (1 hour)
await getPresignedDownloadUrl(key, 3600);

// Very short for sensitive files (5 min)
await getPresignedDownloadUrl(secretKey, 300);
```

### 3. **Organize Files by Category and User**

```
s3://golive-files/
├── avatars/
│   ├── user-123/
│   │   └── profile.jpg
│   └── user-456/
│       └── avatar.png
├── artifacts/
│   ├── user-123/
│   │   ├── build-1.zip
│   │   └── build-2.zip
│   └── user-456/
└── reports/
    └── analytics-2025-10.pdf
```

### 4. **Clean Up Temporary Files**

```typescript
// Scheduled cleanup job
import { StorageService } from '../services/storageService';

// Clean temp files older than 7 days
await StorageService.cleanupTempFiles(7);
```

### 5. **Track File Metadata in Database**

```prisma
model File {
  id          String   @id @default(uuid())
  key         String   @unique
  url         String
  userId      String
  projectId   String?
  category    String
  filename    String
  size        Int
  contentType String
  createdAt   DateTime @default(now())

  user    User     @relation(fields: [userId], references: [id])
  project Project? @relation(fields: [projectId], references: [id])

  @@index([userId])
  @@index([projectId])
  @@index([category])
}
```

### 6. **Implement Upload Progress**

```typescript
// Client-side progress tracking
const xhr = new XMLHttpRequest();

xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentComplete = (e.loaded / e.total) * 100;
    updateProgressBar(percentComplete);
  }
});

xhr.open('PUT', presignedUrl);
xhr.setRequestHeader('Content-Type', contentType);
xhr.send(file);
```

### 7. **Use CDN for Static Assets**

```bash
# CloudFront distribution
CDN_URL=https://d1234567890.cloudfront.net
```

**Benefits:**
- Faster downloads worldwide
- Reduced S3 costs
- DDoS protection

### 8. **Handle Errors Gracefully**

```typescript
try {
  const result = await StorageService.uploadFile(...);
  return result;
} catch (error: any) {
  if (error.code === 'NoSuchBucket') {
    logger.error('S3 bucket not found');
  } else if (error.code === 'AccessDenied') {
    logger.error('S3 access denied - check IAM permissions');
  } else {
    logger.error('Upload failed', { error: error.message });
  }
  throw error;
}
```

---

## Troubleshooting

### Upload Fails with "Access Denied"

**Cause:** IAM permissions insufficient

**Solution:**
1. Check AWS credentials are correct
2. Verify IAM policy includes `s3:PutObject`
3. Check bucket policy doesn't deny uploads

### Pre-signed URL Returns 403

**Cause:** URL expired or incorrect region

**Solution:**
1. Check URL hasn't expired
2. Verify `AWS_REGION` matches bucket region
3. Ensure Content-Type matches when using pre-signed upload

### Large File Upload Fails

**Cause:** Timeout or memory limit

**Solution:**
1. Use pre-signed URLs for files >10MB
2. Increase timeout in API Gateway
3. Implement multipart upload for files >100MB

### File Not Found After Upload

**Cause:** Using wrong bucket or key

**Solution:**
1. Log the returned key from upload
2. Verify bucket name in env vars
3. Check if file category path is correct

---

## Code Examples

### React File Upload Component

```typescript
import { useState } from 'react';

function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Get pre-signed URL
      const urlRes = await fetch('/api/v1/files/presigned-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          category: 'attachments',
        }),
      });

      const { uploadUrl, key } = await urlRes.json();

      // Upload to S3
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress((e.loaded / e.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          console.log('Upload complete:', key);
        }
      };

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <progress value={progress} max="100" />}
    </div>
  );
}
```

---

## Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Pre-signed URLs Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

---

**Last Updated:** October 23, 2025
**Maintained By:** GoLive Platform Team
