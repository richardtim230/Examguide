import crypto from "crypto";

export function euclideanDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Number(a[i]) - Number(b[i]);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function averageDescriptors(listOfArrays) {
  if (!Array.isArray(listOfArrays) || listOfArrays.length === 0) return null;
  const len = listOfArrays[0].length;
  const out = new Array(len).fill(0);
  for (const arr of listOfArrays) {
    if (!Array.isArray(arr) || arr.length !== len) return null;
    for (let i = 0; i < len; i++) out[i] += Number(arr[i] || 0);
  }
  for (let i = 0; i < len; i++) out[i] = out[i] / listOfArrays.length;
  return out;
}

function getKey() {
  const secret =
    process.env.FACE_DESCRIPTOR_KEY ||
    "ExamGuardSuperSecretKey2026";

  return crypto
    .createHash("sha256")
    .update(secret)
    .digest();
}

export function encryptDescriptor(plainTextJson) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainTextJson, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptDescriptor(b64) {
  const key = getKey();
  const data = Buffer.from(b64, "base64");
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}


