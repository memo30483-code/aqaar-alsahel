/**
 * قراءة صورة من جهاز المستخدم وتصغيرها قبل تخزينها.
 * نستخدمها لمستندات التسجيل حتى لا نتجاوز مساحة التخزين المحلية.
 */
export async function readCompressedImage(
  file: File,
  options: { maxSize?: number; quality?: number } = {}
): Promise<string> {
  const { maxSize = 900, quality = 0.72 } = options;
  const dataUrl = await readAsDataUrl(file);

  /* الملفات الصغيرة تُترك كما هي */
  if (file.size <= 220 * 1024) return dataUrl;

  try {
    const image = await loadImage(dataUrl);
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return dataUrl;
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
