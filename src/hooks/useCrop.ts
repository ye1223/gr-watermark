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
