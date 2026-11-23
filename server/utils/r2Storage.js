const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const path = require("path");

let s3Client = null;

const getS3Client = () => {
  if (s3Client) {
    return s3Client;
  }

  const requiredEnv = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_ENDPOINT",
  ];

  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing R2 environment variable: ${key}`);
    }
  }

  s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  return s3Client;
};

const getBucket = () => {
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is missing.");
  }

  return process.env.R2_BUCKET_NAME;
};

const isR2Key = (key) => typeof key === "string" && key.startsWith("students/");

const uploadToR2 = async (file, studentId, fileType) => {
  if (!file?.buffer) {
    throw new Error("Uploaded file buffer is missing.");
  }

  const extension = path.extname(file.originalname).toLowerCase();
  const uniqueName = `${crypto.randomUUID()}${extension}`;
  const key = `students/${studentId}/${fileType}/${uniqueName}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    }),
  );

  return key;
};

const getR2SignedUrl = async (key) => {
  if (!isR2Key(key)) {
    return "";
  }

  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
    { expiresIn: 300 },
  );
};

const deleteR2Object = async (key) => {
  if (!isR2Key(key)) {
    return;
  }

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
};

module.exports = {
  uploadToR2,
  getR2SignedUrl,
  deleteR2Object,
  isR2Key,
};
