import { outputRatios, type OutputRatio } from "@/types/watermark";

export function ratioToNumber(ratio: OutputRatio, fallback: number) {
  const [width, height] = ratio.split(":").map(Number);
  return width && height ? width / height : fallback;
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

export function getNearestOutputRatio(imageWidth: number, imageHeight: number): OutputRatio {
  const sourceRatio = imageWidth / imageHeight;

  return outputRatios.reduce((nearest, ratio) => {
    const currentDistance = Math.abs(Math.log(ratioToNumber(ratio, sourceRatio) / sourceRatio));
    const nearestDistance = Math.abs(Math.log(ratioToNumber(nearest, sourceRatio) / sourceRatio));

    return currentDistance < nearestDistance ? ratio : nearest;
  }, outputRatios[0]);
}
