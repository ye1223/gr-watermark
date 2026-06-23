import type { BrandConfig } from "@/brands.config";
import { getCenteredCrop } from "@/hooks/useCrop";
import type { BorderTone, FrameStyle, ImageSource, WatermarkSettings } from "@/types/watermark";

const frameMap: Record<FrameStyle, { top: number; side: number; bottom: number }> = {
  ORIGINAL: { top: 0, side: 0, bottom: 0 },
  CLASSIC: { top: 0, side: 0, bottom: 0.074 },
  MINIMAL: { top: 0, side: 0, bottom: 0.052 },
  INSTAX: { top: 0, side: 0, bottom: 0.155 },
  POLAROID: { top: 0.03, side: 0.03, bottom: 0.19 },
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
  const crop = getCenteredCrop(image.naturalWidth, image.naturalHeight, settings.outputRatio);
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
  const padX = Math.max(24, outputWidth * 0.05);
  const gap = Math.max(12, outputWidth * 0.018);
  const logoMaxWidth = outputWidth * 0.18;
  const logoHeight = Math.max(18, bottomBorder * 0.3);
  const logoRatio = logo ? logo.naturalWidth / logo.naturalHeight : 4.8;
  const logoDrawWidth = Math.min(logoMaxWidth, logoHeight * logoRatio);
  const logoCenterX = outputWidth * 0.57;
  const logoLeft = logoCenterX - logoDrawWidth / 2;
  const logoRight = logoCenterX + logoDrawWidth / 2;
  const separatorX = Math.min(outputWidth - padX * 0.35, logoRight + gap);
  const rightTextX = outputWidth - padX;
  const rightWidth = Math.max(80, rightTextX - separatorX - gap);
  const leftWidth = Math.max(90, logoLeft - padX - gap);

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, barY, outputWidth, bottomBorder);

  const title = settings.showModel ? settings.model || brand.defaultModel : "";
  const date = settings.showDate ? settings.date : "";
  const subtitle = settings.showSubtitle ? settings.subtitle : "";
  const titleSize = fitFont(ctx, title || " ", leftWidth, Math.max(14, bottomBorder * 0.22), 650);
  const smallSize = Math.max(10, bottomBorder * 0.13);
  const rightSize = fitFont(
    ctx,
    [settings.focalLength, settings.aperture, settings.shutter, settings.iso ? `ISO${settings.iso}` : ""]
      .filter(Boolean)
      .join(" "),
    rightWidth,
    Math.max(14, bottomBorder * 0.22),
    650
  );

  ctx.fillStyle = colors.fg;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  if (title) {
    ctx.font = `650 ${titleSize}px Inter, Arial, sans-serif`;
    ctx.fillText(title, padX, barY + bottomBorder * (subtitle ? 0.34 : 0.38), leftWidth);
  }
  ctx.fillStyle = colors.muted;
  ctx.font = `400 ${smallSize}px Inter, Arial, sans-serif`;
  if (subtitle) ctx.fillText(subtitle, padX, barY + bottomBorder * 0.68, leftWidth);

  if (logo) {
    ctx.drawImage(logo, logoLeft, barY + (bottomBorder - logoHeight) / 2, logoDrawWidth, logoHeight);
  } else {
    ctx.fillStyle = brand.accentColor;
    ctx.font = `760 ${Math.max(12, logoHeight)}px Inter, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(brand.name, logoCenterX, barY + bottomBorder / 2, logoMaxWidth);
  }

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = Math.max(1, outputWidth * 0.0014);
  ctx.beginPath();
  ctx.moveTo(separatorX, barY + bottomBorder * 0.23);
  ctx.lineTo(separatorX, barY + bottomBorder * 0.77);
  ctx.stroke();

  const params = settings.showExif
    ? [
        settings.focalLength,
        settings.aperture,
        settings.shutter,
        settings.iso ? `ISO${settings.iso}` : "",
      ].filter(Boolean)
    : [];
  if (params.length || date) {
    ctx.fillStyle = colors.fg;
    ctx.font = `650 ${rightSize}px Inter, Arial, sans-serif`;
    ctx.textAlign = "right";
    if (params.length) {
      ctx.fillText(params.join(" "), rightTextX, barY + bottomBorder * (date ? 0.36 : 0.5), rightWidth);
    }
    if (date) {
      ctx.fillStyle = colors.muted;
      ctx.font = `400 ${smallSize}px Inter, Arial, sans-serif`;
      ctx.fillText(date, rightTextX, barY + bottomBorder * (params.length ? 0.68 : 0.5), rightWidth);
    }
  }
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
