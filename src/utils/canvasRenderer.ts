import type { BrandConfig } from "@/brands.config";
import { getAdjustedCrop } from "@/hooks/useCrop";
import type { BorderTone, FrameStyle, ImageSource, WatermarkSettings } from "@/types/watermark";

const frameMap: Record<FrameStyle, { top: number; side: number; bottom: number }> = {
  ORIGINAL: { top: 0, side: 0, bottom: 0 },
  CLASSIC: { top: 0, side: 0, bottom: 0.08 },
  MINIMAL: { top: 0, side: 0, bottom: 0.05 },
  INSTAX: { top: 0, side: 0, bottom: 0.16 },
  POLAROID: { top: 0.03, side: 0.03, bottom: 0.2 },
};

function toneColors(tone: BorderTone) {
  return tone === "black"
    ? { bg: "#080808", fg: "#f7f7f7", muted: "rgba(247,247,247,0.62)", line: "rgba(247,247,247,0.24)" }
    : { bg: "#ffffff", fg: "#111111", muted: "rgba(17,17,17,0.58)", line: "rgba(17,17,17,0.18)" };
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight = 600) {
  let next = size;
  do {
    ctx.font = `${weight} ${next}px Inter, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth || next <= 10) return next;
    next -= 1;
  } while (next > 9);
  return next;
}

export async function loadImageElement(src: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  image.src = src;
  await image.decode();
  return image;
}

export function drawWatermarkCanvas({
  canvas,
  image,
  settings,
  brand,
  logo,
}: {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  settings: WatermarkSettings;
  brand: BrandConfig;
  logo?: HTMLImageElement | null;
}) {
  const crop = getAdjustedCrop(
    image.naturalWidth,
    image.naturalHeight,
    settings.outputRatio,
    settings.cropZoom,
    settings.cropX,
    settings.cropY
  );
  const style = frameMap[settings.frameStyle];
  const baseWidth = Math.round(crop.sw);
  const baseHeight = Math.round(crop.sh);
  const hasWatermark = settings.watermark;
  const topBorder = hasWatermark ? Math.round(baseHeight * style.top) : 0;
  const sideBorder = hasWatermark ? Math.round(baseWidth * style.side) : 0;
  const bottomBorder = hasWatermark ? Math.round(baseHeight * style.bottom) : 0;
  const outputWidth = baseWidth + sideBorder * 2;
  const outputHeight = baseHeight + topBorder + bottomBorder;
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const colors = toneColors(settings.borderTone);

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    sideBorder,
    topBorder,
    baseWidth,
    baseHeight
  );

  if (!hasWatermark || bottomBorder <= 0) return;

  const barY = topBorder + baseHeight;
  const padX = Math.max(18, outputWidth * 0.035);
  const centerX = outputWidth / 2;
  const available = outputWidth - padX * 2;
  const logoWidth = Math.min(logo ? outputWidth * 0.12 : outputWidth * 0.1, 150);
  const leftWidth = available * 0.33;
  const rightX = centerX + logoWidth * 0.78;
  const rightWidth = outputWidth - rightX - padX;

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, barY, outputWidth, bottomBorder);

  const title = settings.showModel ? settings.model || brand.defaultModel : "";
  const date = settings.showDate ? settings.date : "";
  const subtitle = settings.showSubtitle ? settings.subtitle : "";
  const titleSize = fitFont(ctx, title || " ", leftWidth, Math.max(14, bottomBorder * 0.22), 650);
  const smallSize = Math.max(9, Math.min(15, bottomBorder * 0.13));

  ctx.fillStyle = colors.fg;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  if (title) {
    ctx.font = `650 ${titleSize}px Inter, Arial, sans-serif`;
    ctx.fillText(title, padX, barY + bottomBorder * (subtitle ? 0.34 : 0.38), leftWidth);
  }
  ctx.fillStyle = colors.muted;
  ctx.font = `400 ${smallSize}px Inter, Arial, sans-serif`;
  const secondLine = subtitle || date;
  if (secondLine) ctx.fillText(secondLine, padX, barY + bottomBorder * 0.68, leftWidth);

  const logoHeight = Math.max(12, bottomBorder * 0.18);
  if (logo) {
    const ratio = logo.naturalWidth / logo.naturalHeight;
    const drawWidth = Math.min(logoWidth, logoHeight * ratio);
    ctx.drawImage(logo, centerX - drawWidth / 2, barY + (bottomBorder - logoHeight) / 2, drawWidth, logoHeight);
  } else {
    ctx.fillStyle = brand.accentColor;
    ctx.font = `760 ${Math.max(12, logoHeight)}px Inter, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(brand.name, centerX, barY + bottomBorder / 2, logoWidth);
  }

  ctx.strokeStyle = colors.line;
  ctx.beginPath();
  ctx.moveTo(rightX - padX * 0.45, barY + bottomBorder * 0.25);
  ctx.lineTo(rightX - padX * 0.45, barY + bottomBorder * 0.75);
  ctx.stroke();

  if (settings.showExif) {
    const params = [
      settings.focalLength,
      settings.aperture,
      settings.shutter,
      settings.iso ? `ISO${settings.iso}` : "",
    ].filter(Boolean);
    ctx.fillStyle = colors.fg;
    ctx.font = `560 ${Math.max(10, Math.min(17, bottomBorder * 0.14))}px Inter, Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(params.join("  |  "), outputWidth - padX, barY + bottomBorder / 2, rightWidth);
  }
}

export function drawCropEditorCanvas({
  canvas,
  image,
  settings,
}: {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  settings: WatermarkSettings;
}) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const scale = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));
  const outputWidth = Math.round(sourceWidth * scale);
  const outputHeight = Math.round(sourceHeight * scale);
  const crop = getAdjustedCrop(
    sourceWidth,
    sourceHeight,
    settings.outputRatio,
    settings.cropZoom,
    settings.cropX,
    settings.cropY
  );
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  canvas.width = outputWidth;
  canvas.height = outputHeight;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, outputWidth, outputHeight);

  const x = crop.sx * scale;
  const y = crop.sy * scale;
  const width = crop.sw * scale;
  const height = crop.sh * scale;

  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.fillRect(0, 0, outputWidth, y);
  ctx.fillRect(0, y + height, outputWidth, outputHeight - y - height);
  ctx.fillRect(0, y, x, height);
  ctx.fillRect(x + width, y, outputWidth - x - width, height);

  ctx.strokeStyle = "#CC0000";
  ctx.lineWidth = Math.max(2, Math.round(Math.min(outputWidth, outputHeight) * 0.003));
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = 1;
  ctx.setLineDash([Math.max(8, outputWidth * 0.01), Math.max(5, outputWidth * 0.006)]);
  ctx.strokeRect(x + 6, y + 6, Math.max(0, width - 12), Math.max(0, height - 12));
  ctx.setLineDash([]);
}

export async function renderWatermarkBlob({
  imageSource,
  settings,
  brand,
}: {
  imageSource: ImageSource;
  settings: WatermarkSettings;
  brand: BrandConfig;
}) {
  const [image, logo] = await Promise.all([
    loadImageElement(imageSource.url),
    loadImageElement(brand.logo).catch(() => null),
  ]);
  const canvas = document.createElement("canvas");
  drawWatermarkCanvas({ canvas, image, settings, brand, logo });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Unable to render JPEG"));
      },
      "image/jpeg",
      0.95
    );
  });
}
