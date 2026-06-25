import { outputRatios, type OutputRatio, type WatermarkSettings } from "@/types/watermark";

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function ratioToNumber(ratio: OutputRatio, fallback: number) {
  if (ratio === "ORIGINAL") return fallback;
  const [width, height] = ratio.split(":").map(Number);
  return width && height ? width / height : fallback;
}

export function getCrop(
  imageWidth: number,
  imageHeight: number,
  targetRatio: OutputRatio,
  cropOffset: WatermarkSettings["cropOffset"] = { x: 0.5, y: 0.5 }
) {
  const sourceRatio = imageWidth / imageHeight;
  const ratio = ratioToNumber(targetRatio, sourceRatio);

  if (Math.abs(sourceRatio - ratio) < 0.001) {
    return { sx: 0, sy: 0, sw: imageWidth, sh: imageHeight };
  }

  if (sourceRatio > ratio) {
    const sw = imageHeight * ratio;
    return {
      sx: (imageWidth - sw) * clamp(cropOffset.x),
      sy: 0,
      sw,
      sh: imageHeight,
    };
  }

  const sh = imageWidth / ratio;
  return {
    sx: 0,
    sy: (imageHeight - sh) * clamp(cropOffset.y),
    sw: imageWidth,
    sh,
  };
}

export function getCenteredCrop(
  imageWidth: number,
  imageHeight: number,
  targetRatio: OutputRatio
) {
  return getCrop(imageWidth, imageHeight, targetRatio);
}

export function getNearestOutputRatio(imageWidth: number, imageHeight: number): OutputRatio {
  const sourceRatio = imageWidth / imageHeight;
  const fixedRatios = outputRatios.filter((ratio) => ratio !== "ORIGINAL");

  return fixedRatios.reduce((nearest, ratio) => {
    const currentDistance = Math.abs(Math.log(ratioToNumber(ratio, sourceRatio) / sourceRatio));
    const nearestDistance = Math.abs(Math.log(ratioToNumber(nearest, sourceRatio) / sourceRatio));

    return currentDistance < nearestDistance ? ratio : nearest;
  }, fixedRatios[0]);
}
