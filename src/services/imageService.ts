import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../lib/firebase';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface OptimizedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates file type and size to prevent unsafe uploads and arbitrary files
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type "${file.type}". Only JPG, PNG, WEBP, and GIF images are permitted.`,
    };
  }

  // Check file extension as defense-in-depth against MIME spoofing
  const ext = file.name.split('.').pop()?.toLowerCase();
  const safeExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  if (!ext || !safeExts.includes(ext)) {
    return {
      valid: false,
      error: 'File extension must be .jpg, .jpeg, .png, .webp, or .gif.',
    };
  }

  // Check file size limit
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image size (${sizeMb} MB) exceeds the maximum allowed limit of 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Optimizes an image using HTML5 Canvas:
 * - Resizes high-resolution photos down to maximum 1600px width/height while preserving aspect ratio
 * - Compresses to WebP (or JPEG fallback) at 85% quality
 * - Strips untrusted metadata and shrinks payload size drastically
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<OptimizedImageResult> {
  // If it's an animated GIF, avoid flattening frames through canvas
  if (file.type.toLowerCase() === 'image/gif') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          resolve({
            blob: file,
            dataUrl,
            width: img.width,
            height: img.height,
          });
        };
        img.onerror = () => reject(new Error('Failed to load GIF image dimensions.'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Scale down proportionally if larger than maximum bounds
      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = height;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Unable to obtain 2D canvas rendering context.'));
        return;
      }

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format (prefer webp, fallback to jpeg)
      const outputType = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to jpeg
            canvas.toBlob(
              (fallbackBlob) => {
                if (!fallbackBlob) {
                  reject(new Error('Image compression failed on canvas export.'));
                  return;
                }
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve({ blob: fallbackBlob, dataUrl, width, height });
              },
              'image/jpeg',
              quality
            );
            return;
          }
          const dataUrl = canvas.toDataURL(outputType, quality);
          resolve({ blob, dataUrl, width, height });
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image file. It may be corrupt.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Uploads an image file safely:
 * 1. Validates MIME type and size
 * 2. Optimizes through canvas
 * 3. Attempts upload to Firebase Storage if online and authenticated
 * 4. Falls back to clean local base64/dataUrl if offline or local admin
 */
export async function uploadImageFile(
  file: File,
  options: {
    folder?: 'articles' | 'authors' | 'uploads';
    id?: string;
    optimize?: boolean;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<{ url: string; width?: number; height?: number }> {
  // 1. Validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  // 2. Optimization
  let blob: Blob = file;
  let dataUrl = '';
  let width: number | undefined;
  let height: number | undefined;

  if (options.optimize !== false) {
    try {
      const optimized = await optimizeImage(
        file,
        options.maxWidth || 1600,
        options.maxHeight || 1600
      );
      blob = optimized.blob;
      dataUrl = optimized.dataUrl;
      width = optimized.width;
      height = optimized.height;
    } catch (e) {
      console.warn('Canvas optimization skipped, using original file:', e);
    }
  }

  // 3. Attempt Firebase Storage upload if user is signed in with Firebase
  const folder = options.folder || 'uploads';
  const subId = options.id || 'general';
  const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.webp`;
  const storagePath = `${folder}/${subId}/${cleanFileName}`;

  if (auth.currentUser) {
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: blob.type || 'image/webp',
        customMetadata: {
          uploadedBy: auth.currentUser.email || auth.currentUser.uid,
          uploadedAt: new Date().toISOString(),
        },
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return { url: downloadUrl, width, height };
    } catch (err: any) {
      console.warn('Firebase Storage upload failed, falling back to optimized inline data:', err);
    }
  }

  // 4. Return dataUrl or convert blob to dataUrl as instant robust fallback
  if (dataUrl) {
    return { url: dataUrl, width, height };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result as string, width, height });
    reader.onerror = () => reject(new Error('Failed to read image data.'));
    reader.readAsDataURL(blob);
  });
}
