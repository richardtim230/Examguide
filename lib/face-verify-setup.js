import faceapi from "@vladmandic/face-api";
import canvas from "canvas";
import path from "path";
import fetch from "node-fetch";
const { Canvas, Image, ImageData, loadImage } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch });

async function initTensorBackend() {
  try {
    // Prefer the native Node bindings for performance
    await import("@tensorflow/tfjs-node");
    console.log("Using @tensorflow/tfjs-node backend");
  } catch (err) {
    // If not available, fall back to pure JS (slower)
    await import("@tensorflow/tfjs");
    console.warn("Could not load @tensorflow/tfjs-node, falling back to @tensorflow/tfjs (slower).");
  }
}

export async function loadFaceModels(modelPath) {
  await initTensorBackend();
  const m = modelPath || process.env.FACE_MODEL_PATH || path.join(process.cwd(), "models", "/");
  await faceapi.nets.tinyFaceDetector.loadFromDisk(m);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(m);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(m);
}

export async function descriptorFromBuffer(buffer) {
  try {
    const img = await loadImage(buffer);
    const det = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (!det || !det.descriptor) return null;
    return Array.from(det.descriptor).map(Number);
  } catch (err) {
    console.error("descriptorFromBuffer error:", err);
    return null;
  }
}
