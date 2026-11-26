function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener(
      'load',
      () => {
        URL.revokeObjectURL(url);
        resolve(image);
      },
      { once: true },
    );
    image.addEventListener(
      'error',
      () => {
        URL.revokeObjectURL(url);
        reject(new Error('Gambar tidak dapat dibaca.'));
      },
      { once: true },
    );
    image.src = url;
  });
}

/**
 * Centre-crops an image to a square PNG, capped at `maxSize`, so favicons are
 * never stretched. The logo keeps the original uploaded file.
 */
export async function createSquareImage(file: File, maxSize = 512): Promise<File> {
  const image = await loadImage(file);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const side = Math.min(width, height);
  if (!side) throw new Error('Ukuran gambar tidak valid.');

  const size = Math.max(1, Math.min(maxSize, side));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas tidak tersedia untuk memotong gambar.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    (width - side) / 2,
    (height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Gambar persegi gagal dibuat.');

  const base =
    file.name
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 40) || 'ikon';
  return new File([blob], `${base}-persegi.png`, { type: 'image/png' });
}
