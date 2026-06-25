import type { BrandConfig } from "@/brands.config";
import { getCenteredCrop } from "@/hooks/useCrop";
import type { BorderTone, FrameStyle, ImageSource, WatermarkSettings } from "@/types/watermark";

const frameMap: Record<FrameStyle, { top: number; side: number; bottom: number }> = {
  ORIGINAL: { top: 0, side: 0, bottom: 0 },
  CLASSIC: { top: 0, side: 0, bottom: 0.074 },
  MINIMAL: { top: 0, side: 0, bottom: 0.052 },
  INSTAX_MINI: { top: 0.035, side: 0.035, bottom: 0.2 },
  INSTAX_SQUARE: { top: 0.035, side: 0.035, bottom: 0.18 },
  INSTAX_WIDE: { top: 0.028, side: 0.028, bottom: 0.15 },
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

function applyCardMode({
  canvas,
  contentCanvas,
  settings,
}: {
  canvas: HTMLCanvasElement;
  contentCanvas: HTMLCanvasElement;
  settings: WatermarkSettings;
}) {
  if (!settings.cardMode) return;

  const contentWidth = contentCanvas.width;
  const contentHeight = contentCanvas.height;
  const cardBase = Math.min(contentWidth, contentHeight);
  const shadowBlur = Math.round(Math.max(26, cardBase * 0.045));
  const shadowOffsetY = Math.round(Math.max(8, cardBase * 0.018));
  const visualMargin = Math.round(Math.max(34, cardBase * 0.058));
  const padX = visualMargin + shadowBlur;
  const padTop = visualMargin + shadowBlur;
  const padBottom = visualMargin + shadowBlur + shadowOffsetY;
  const x = padX;
  const y = padTop;
  const outerWidth = contentWidth + padX * 2;
  const outerHeight = contentHeight + padTop + padBottom;
  const shadowStrong =
    settings.borderTone === "black" ? "rgba(0,0,0,0.58)" : "rgba(15,23,42,0.24)";
  const shadowSoft =
    settings.borderTone === "black" ? "rgba(0,0,0,0.36)" : "rgba(15,23,42,0.12)";
  const stroke = settings.borderTone === "black" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.12)";

  canvas.width = outerWidth;
  canvas.height = outerHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, outerWidth, outerHeight);

  ctx.save();
  ctx.shadowColor = shadowSoft;
  ctx.shadowBlur = shadowBlur * 1.6;
  ctx.shadowOffsetY = shadowOffsetY * 1.5;
  ctx.fillStyle = settings.borderTone === "black" ? "#080808" : "#ffffff";
  ctx.fillRect(x, y, contentWidth, contentHeight);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = shadowStrong;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetY = shadowOffsetY;
  ctx.fillStyle = settings.borderTone === "black" ? "#080808" : "#ffffff";
  ctx.fillRect(x, y, contentWidth, contentHeight);
  ctx.restore();

  ctx.drawImage(contentCanvas, x, y);

  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, cardBase * 0.001);
  ctx.strokeRect(x, y, contentWidth, contentHeight);
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
  const frameBase = Math.min(baseWidth, baseHeight);
  const topBorder = hasWatermark ? Math.round(frameBase * style.top) : 0;
  const sideBorder = hasWatermark ? Math.round(frameBase * style.side) : 0;
  const bottomBorder = hasWatermark ? Math.round(frameBase * style.bottom) : 0;
  const outputWidth = baseWidth + sideBorder * 2;
  const outputHeight = baseHeight + topBorder + bottomBorder;
  const contentCanvas = settings.cardMode ? document.createElement("canvas") : canvas;

  contentCanvas.width = outputWidth;
  contentCanvas.height = outputHeight;
  const ctx = contentCanvas.getContext("2d");

  if (!ctx) return;

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

  if (!hasWatermark || bottomBorder <= 0) {
    applyCardMode({ canvas, contentCanvas, settings });
    return;
  }

  const barY = topBorder + baseHeight;
  const padX = Math.max(24, outputWidth * 0.05);
  const gap = Math.max(12, outputWidth * 0.018);
  const logoMaxWidth = outputWidth * 0.18;
  const logoMaxHeight = Math.max(18, bottomBorder * 0.3);
  const logoNaturalRatio =
    logo && logo.naturalWidth > 0 && logo.naturalHeight > 0
      ? logo.naturalWidth / logo.naturalHeight
      : undefined;
  const logoRatio = brand.logoAspectRatio ?? logoNaturalRatio ?? 4.8;
  const logoSize =
    logoMaxHeight * logoRatio > logoMaxWidth
      ? { width: logoMaxWidth, height: logoMaxWidth / logoRatio }
      : { width: logoMaxHeight * logoRatio, height: logoMaxHeight };
  const logoDrawWidth = logoSize.width;
  const logoDrawHeight = logoSize.height;
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
    ctx.fillText(title, padX, barY + bottomBorder * (subtitle ? 0.39 : 0.5), leftWidth);
  }
  ctx.fillStyle = colors.muted;
  ctx.font = `400 ${smallSize}px Inter, Arial, sans-serif`;
  if (subtitle) ctx.fillText(subtitle, padX, barY + bottomBorder * (title ? 0.61 : 0.5), leftWidth);

  if (logo) {
    ctx.drawImage(logo, logoLeft, barY + (bottomBorder - logoDrawHeight) / 2, logoDrawWidth, logoDrawHeight);
  } else {
    ctx.fillStyle = brand.accentColor;
    ctx.font = `760 ${Math.max(12, logoDrawHeight)}px Inter, Arial, sans-serif`;
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
      ctx.fillText(params.join(" "), rightTextX, barY + bottomBorder * (date ? 0.39 : 0.5), rightWidth);
    }
    if (date) {
      ctx.fillStyle = colors.muted;
      ctx.font = `400 ${smallSize}px Inter, Arial, sans-serif`;
      ctx.fillText(date, rightTextX, barY + bottomBorder * (params.length ? 0.61 : 0.5), rightWidth);
    }
  }

  applyCardMode({ canvas, contentCanvas, settings });
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
      settings.cardMode ? "image/png" : "image/jpeg",
      settings.cardMode ? undefined : 0.95
    );
  });
}
