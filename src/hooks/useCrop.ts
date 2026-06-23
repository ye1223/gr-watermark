import type { OutputRatio } from "@/types/watermark";

const presetRatioMap: Partial<Record<OutputRatio, number>> = {
  CLASSIC_LANDSCAPE: 3 / 2,
  CLASSIC_PORTRAIT: 2 / 3,
  SQUARE: 1,
  SOCIAL_PORTRAIT: 4 / 5,
  CINEMA_WIDE: 16 / 9,
  STORY_VERTICAL: 9 / 16,
  INSTAX_MINI: 54 / 86,
  INSTAX_SQUARE: 1,
  INSTAX_WIDE: 108 / 86,
};

export function ratioToNumber(ratio: OutputRatio, fallback: number) {
  const presetRatio = presetRatioMap[ratio];
  if (presetRatio) return presetRatio;

  return fallback;
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
