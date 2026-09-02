function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = src;
  });
}

export async function compressImage(
  file: Blob,
  maxDim = 960,
  quality = 0.78,
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    return drawJpeg(img, maxDim, quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function compressDataUrl(
  dataUrl: string,
  maxDim = 960,
  quality = 0.78,
): Promise<string> {
  const img = await loadImage(dataUrl);
  return drawJpeg(img, maxDim, quality);
}

export async function urlToDataUrl(
  url: string,
  maxDim = 960,
  quality = 0.78,
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load image");
  const blob = await res.blob();
  return compressImage(blob, maxDim, quality);
}

export async function makeThumb(dataUrl: string): Promise<string> {
  return compressDataUrl(dataUrl, 320, 0.62);
}

function drawJpeg(img: HTMLImageElement, maxDim: number, quality: number) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
