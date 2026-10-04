import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { database } from "./firebase";
export function mediaId(url: string) {
  return /^\/media\/([a-f0-9-]{36})$/.exec(url)?.[1] || "";
}
export async function resolveMedia(url: string): Promise<string> {
  const id = mediaId(url);
  if (!id) return url;
  const s = await getDoc(doc(database(), "media", id));
  if (!s.exists()) throw new Error("This image is unavailable.");
  const data = s.data().data;
  if (
    typeof data !== "string" ||
    !/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(data)
  )
    throw new Error("Invalid image data.");
  return data;
}
export async function uploadImage(
  file: File,
  ownerType: "article" | "author",
  ownerId: string,
  uid: string,
  onProgress: (n: number) => void,
) {
  if (!ownerId)
    throw new Error(
      "Add an article title and URL slug before uploading an image.",
    );
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error(
      "Choose a JPEG, PNG or WebP image. SVG and animated files are not supported.",
    );
  if (file.size > 8 * 1024 * 1024)
    throw new Error("Choose an image smaller than 8 MB.");
  onProgress(10);
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40000000)
      throw new Error("Image dimensions are too large.");
    const canvas = document.createElement("canvas"),
      scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Image optimisation is unavailable in this browser.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    onProgress(35);
    let data = "";
    for (const quality of [0.82, 0.68, 0.52, 0.38]) {
      data = canvas.toDataURL("image/webp", quality);
      if (data.length <= 240000) break;
    }
    if (data.length > 240000)
      throw new Error(
        "This image is too detailed for the free upload limit. Resize it and try again.",
      );
    onProgress(65);
    const id = crypto.randomUUID();
    await setDoc(doc(database(), "media", id), {
      ownerType,
      ownerId,
      uploadedBy: uid,
      data,
      width: canvas.width,
      height: canvas.height,
      createdAt: serverTimestamp(),
    });
    onProgress(100);
    return `/media/${id}`;
  } finally {
    bitmap.close();
  }
}
