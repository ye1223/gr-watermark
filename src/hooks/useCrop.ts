import type { OutputRatio } from "@/types/watermark";

export function ratioToNumber(ratio: OutputRatio, fallback: number) {
  if (ratio === "ORIGINAL") return fallback;
  const [width, height] = ratio.split(":").map(Number);
  return width / height;
}

export function getCenteredCrop(
  imageWidth: number,
  imageHeight: number,
  targetRatio: OutputRatio
) {
  const sourceRatio = imageWidth / imageHeight;
  const ratio = ratioToNumber(targetRatio, sourceRatio);

  if (Math.abs(sourceRatio - ratio) < 0.001) {
    return { sx: 0, sy: 0, sw: imageWidth, sh: imageHeight };
  }

  if (sourceRatio > ratio) {
    const sw = imageHeight * ratio;
    return { sx: (imageWidth - sw) / 2, sy: 0, sw, sh: imageHeight };
  }

  const sh = imageWidth / ratio;
  return { sx: 0, sy: (imageHeight - sh) / 2, sw: imageWidth, sh };
}

export function getAdjustedCrop(
  imageWidth: number,
  imageHeight: number,
  targetRatio: OutputRatio,
  zoom = 1,
  offsetX = 0,
  offsetY = 0
) {
  if (targetRatio === "ORIGINAL") {
    return { sx: 0, sy: 0, sw: imageWidth, sh: imageHeight };
  }

  const base = getCenteredCrop(imageWidth, imageHeight, targetRatio);
  const safeZoom = Math.min(3, Math.max(1, zoom || 1));
  const sw = base.sw / safeZoom;
  const sh = base.sh / safeZoom;
  const maxCenterOffsetX = Math.max(0, (imageWidth - sw) / 2);
  const maxCenterOffsetY = Math.max(0, (imageHeight - sh) / 2);
  const centerX = imageWidth / 2 + maxCenterOffsetX * Math.max(-1, Math.min(1, offsetX / 100));
  const centerY = imageHeight / 2 + maxCenterOffsetY * Math.max(-1, Math.min(1, offsetY / 100));

  return {
    sx: Math.max(0, Math.min(imageWidth - sw, centerX - sw / 2)),
    sy: Math.max(0, Math.min(imageHeight - sh, centerY - sh / 2)),
    sw,
    sh,
  };
}
