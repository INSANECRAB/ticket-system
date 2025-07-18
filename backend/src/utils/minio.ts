import { Client } from 'minio';
import { Readable } from 'stream';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9002', 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'ticket-files';

export const minioClient = new Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: false,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

function sanitizeFileName(filename: string): string {
  // 1. 유니코드 NFC 정규화
  let name = filename.normalize('NFC');
  // 2. 한글(완성형), 영문, 숫자, 일부 특수문자만 허용. 나머지는 모두 _
  // 한글 완성형: \uAC00-\uD7A3
  name = name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
  // 3. 연속된 _는 하나로
  name = name.replace(/_+/g, '_');
  // 4. 너무 긴 파일명은 100자 제한
  if (name.length > 100) {
    const ext = name.lastIndexOf('.') > 0 ? name.slice(name.lastIndexOf('.')) : '';
    name = name.slice(0, 100 - ext.length) + ext;
  }
  return name;
}

export async function ensureBucketExists() {
  const exists = await minioClient.bucketExists(MINIO_BUCKET);
  if (!exists) {
    await minioClient.makeBucket(MINIO_BUCKET, '');
  }
}

export async function uploadFileToMinio(originalFileName: string, buffer: Buffer, mimetype: string) {
  await ensureBucketExists();
  const safeFileName = sanitizeFileName(originalFileName);
  const encodedFileName = encodeURIComponent(safeFileName);
  await minioClient.putObject(MINIO_BUCKET, encodedFileName, buffer, buffer.length, {
    'Content-Type': mimetype,
  });
  return {
    url: getFileUrl(safeFileName),
    safeFileName,
    originalFileName
  };
}

export function getFileUrl(filename: string) {
  return `http://localhost:9002/ticket-files/${encodeURIComponent(sanitizeFileName(filename))}`;
}

export async function getPresignedUrl(filename: string) {
  await ensureBucketExists();
  const safeFileName = sanitizeFileName(filename);
  const encodedFileName = encodeURIComponent(safeFileName);
  return minioClient.presignedGetObject(MINIO_BUCKET, encodedFileName, 24 * 60 * 60);
} 