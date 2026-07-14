import faceapi from "@vladmandic/face-api";
import canvas from "canvas";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
const { Canvas, Image, ImageData, loadImage, createCanvas } = canvas;
process.env.TF_CPP_MIN_LOG_LEVEL = process.env.TF_CPP_MIN_LOG_LEVEL || "2";
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch });

const MODEL_BASE = process.env.FACE_MODEL_CDN || "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
const MODEL_DIR = process.env.FACE_MODEL_PATH || path.join(process.cwd(), "models", "/");
const REQUIRED_FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1"
];

async function initTensorBackend() {
  try {
    await import("@tensorflow/tfjs-node");
    console.log("Using @tensorflow/tfjs-node backend");
  } catch (err) {
    try {
      await import("@tensorflow/tfjs");
      console.warn("Could not load @tensorflow/tfjs-node, falling back to @tensorflow/tfjs (JS backend, slower).");
    } catch (err2) {
      console.error("Failed to load any tfjs backend:", err2);
      throw err2;
    }
  }
}

async function downloadModelFile(name) {
  const url = `${MODEL_BASE}/${name}`;
  const dest = path.join(MODEL_DIR, name);
  if (fs.existsSync(dest)) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buf));
}

async function ensureModels() {
  if (!fs.existsSync(MODEL_DIR)) fs.mkdirSync(MODEL_DIR, { recursive: true });
  for (const f of REQUIRED_FILES) {
    const p = path.join(MODEL_DIR, f);
    if (!fs.existsSync(p)) {
      await downloadModelFile(f);
    }
  }
}

export async function loadFaceModels(modelPath) {
  await initTensorBackend();
  const m = modelPath || MODEL_DIR;
  try {
    await ensureModels();
  } catch (err) {
    console.warn("Could not auto-download models; ensure models exist at", m, err.message);
  }
  await faceapi.nets.tinyFaceDetector.loadFromDisk(m);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(m);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(m);
}

export async function descriptorFromBuffer(buffer) {
  try {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      return null;
    }

    let img;

    try {
      img = await loadImage(buffer);
    } catch (err) {
      console.warn("Could not load image:", err.message);
      return null;
    }

    if (
      !img ||
      typeof img.width !== "number" ||
      typeof img.height !== "number" ||
      img.width < 10 ||
      img.height < 10
    ) {
      console.warn("Invalid image dimensions.");
      return null;
    }

    const canv = createCanvas(img.width, img.height);

    if (!canv || canv.width === 0 || canv.height === 0) {
      console.warn("Canvas creation failed.");
      return null;
    }

    const ctx = canv.getContext("2d");

    if (!ctx) {
      console.warn("Canvas context unavailable.");
      return null;
    }

    ctx.drawImage(img, 0, 0);

    let det;

    try {
      det = await faceapi
        .detectSingleFace(
          canv,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch (err) {
      console.error("Face detection failed:", err.message);
      return null;
    }

    if (!det || !det.descriptor) {
      return null;
    }

    return Array.from(det.descriptor).map(Number);

  } catch (err) {
    console.error("descriptorFromBuffer:", err);
    return null;
  }
}
