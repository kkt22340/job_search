/**
 * 이력서 첨부용 — 브라우저에서 JPEG로 리사이즈·압축해 data URL 반환.
 * (localStorage·JSONB 부담을 줄이기 위해 변 길이 상한)
 */

const DEFAULT_MAX_EDGE = 1200;
const DEFAULT_QUALITY = 0.82;
const DEFAULT_MAX_BYTES = 900_000;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했어요."));
    };
    img.src = url;
  });
}

function canvasToJpegDataUrl(
  canvas: HTMLCanvasElement,
  quality: number
): string {
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (!dataUrl.startsWith("data:image/jpeg")) {
    throw new Error("이미지로 저장하지 못했어요.");
  }
  return dataUrl;
}

function byteLengthOfDataUrl(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1];
  if (!base64) return dataUrl.length * 2;
  return (base64.length * 3) / 4;
}

export async function compressResumePhotoFile(
  file: File,
  options?: {
    maxEdge?: number;
    maxBytes?: number;
  }
): Promise<string> {
  const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;

  if (!file.type.startsWith("image/")) {
    throw new Error("사진 파일만 첨부할 수 있어요.");
  }

  const img = await loadImageFromFile(file);
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (!w || !h) {
    throw new Error("이미지 크기를 알 수 없어요.");
  }

  const scale = Math.min(1, maxEdge / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("이미지를 처리할 수 없어요.");
  }
  ctx.drawImage(img, 0, 0, w, h);

  let quality = DEFAULT_QUALITY;
  let dataUrl = canvasToJpegDataUrl(canvas, quality);
  while (byteLengthOfDataUrl(dataUrl) > maxBytes && quality > 0.35) {
    quality -= 0.07;
    dataUrl = canvasToJpegDataUrl(canvas, quality);
  }

  if (byteLengthOfDataUrl(dataUrl) > maxBytes) {
    throw new Error("사진이 너무 커요. 다른 사진을 선택해 주세요.");
  }

  return dataUrl;
}
