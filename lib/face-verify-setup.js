import faceapi from "@vladmandic/face-api";
import canvas from "canvas";
import path from "path";
import fetch from "node-fetch";

const { Canvas, Image, ImageData, loadImage } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch });

export async function loadFaceModels(modelPath) {
  const m = modelPath || process.env.FACE_MODEL_PATH || path.join(process.cwd(), "models", "face-api");
  await faceapi.nets.tinyFaceDetector.loadFromDisk(m);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(m);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(m);
  return;
}

export async function descriptorFromBuffer(buffer) {
  try {
    const img = await loadImage(buffer);
    const det = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (!det || !det.descriptor) return null;
    return Array.from(det.descriptor).map(Number);
  } catch (err) {
    return null;
  }
}
