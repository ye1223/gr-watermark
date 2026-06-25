import type { BrandConfig } from "@/brands.config";
import { getCrop, ratioToNumber } from "@/hooks/useCrop";
import { getFramePreset } from "@/presets.config";
import type { BorderTone, ImageSource, OutputRatio, WatermarkSettings } from "@/types/watermark";

function toneColors(tone: BorderTone) {
  return tone === "black"
    ? { bg: "#11100e", fg: "#f4efe7", muted: "rgba(244,239,231,0.64)", line: "rgba(244,239,231,0.24)" }
    : { bg: "#f7f3ec", fg: "#15130f", muted: "rgba(21,19,15,0.58)", line: "rgba(21,19,15,0.18)" };
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

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getEffectiveRatio(settings: WatermarkSettings): OutputRatio {
  const preset = getFramePreset(settings.frameStyle);
  return preset.lockRatio && preset.canvasRatio ? preset.canvasRatio : settings.outputRatio;
}

function getBorderRatios(settings: WatermarkSettings) {
  const preset = getFramePreset(settings.frameStyle);
  if (!settings.watermark) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const scale = preset.lockRatio || preset.group === "frame" ? 1 : settings.borderScale;
  const frameScale = settings.frameBorderScale;

  return {
    top: clamp(preset.border.top * scale * (preset.group === "frame" ? frameScale.top : 1), 0, 0.35),
    right: clamp(preset.border.right * scale * (preset.group === "frame" ? frameScale.side : 1), 0, 0.35),
    bottom: clamp(preset.border.bottom * scale * (preset.group === "frame" ? frameScale.bottom : 1), 0, 0.4),
    left: clamp(preset.border.left * scale * (preset.group === "frame" ? frameScale.side : 1), 0, 0.35),
  };
}

function getLayout({
  imageWidth,
  imageHeight,
  settings,
}: {
  imageWidth: number;
  imageHeight: number;
  settings: WatermarkSettings;
}) {
  const border = getBorderRatios(settings);
  const effectiveRatio = getEffectiveRatio(settings);
  const imageWidthFraction = Math.max(0.2, 1 - border.left - border.right);
  const imageHeightFraction = Math.max(0.2, 1 - border.top - border.bottom);

  if (effectiveRatio === "ORIGINAL") {
    const baseWidth = imageWidth;
    const baseHeight = imageHeight;
    return {
      crop: { sx: 0, sy: 0, sw: imageWidth, sh: imageHeight },
      outputWidth: Math.round(baseWidth / imageWidthFraction),
      outputHeight: Math.round(baseHeight / imageHeightFraction),
      imageX: Math.round((baseWidth / imageWidthFraction) * border.left),
      imageY: Math.round((baseHeight / imageHeightFraction) * border.top),
      imageWidth: baseWidth,
      imageHeight: baseHeight,
      border,
      effectiveRatio,
    };
  }

  const canvasRatio = ratioToNumber(effectiveRatio, imageWidth / imageHeight);
  const imageAreaRatio = canvasRatio * (imageWidthFraction / imageHeightFraction);
  const crop = getCrop(imageWidth, imageHeight, `${imageAreaRatio}:1` as OutputRatio, settings.cropOffset);
  const outputWidth = Math.round(crop.sw / imageWidthFraction);
  const outputHeight = Math.round(crop.sh / imageHeightFraction);
  const imageX = Math.round(outputWidth * border.left);
  const imageY = Math.round(outputHeight * border.top);
  const drawWidth = outputWidth - imageX - Math.round(outputWidth * border.right);
  const drawHeight = outputHeight - imageY - Math.round(outputHeight * border.bottom);

  return {
    crop,
    outputWidth,
    outputHeight,
    imageX,
    imageY,
    imageWidth: drawWidth,
    imageHeight: drawHeight,
    border,
    effectiveRatio,
  };
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
  const colors = toneColors(settings.borderTone);
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
  ctx.fillStyle = colors.bg;
  ctx.fillRect(x, y, contentWidth, contentHeight);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = shadowStrong;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetY = shadowOffsetY;
  ctx.fillStyle = colors.bg;
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
  const preset = getFramePreset(settings.frameStyle);
  const layout = getLayout({
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
    settings,
  });
  const { crop } = layout;
  const baseWidth = layout.imageWidth;
  const baseHeight = layout.imageHeight;
  const topBorder = layout.imageY;
  const leftBorder = layout.imageX;
  const bottomBorder = layout.outputHeight - layout.imageY - layout.imageHeight;
  const outputWidth = layout.outputWidth;
  const outputHeight = layout.outputHeight;
  const isFilmWatermark = preset.group === "film" && settings.filmWatermark;
  const hasWatermark = settings.watermark && (preset.showWatermarkBar || isFilmWatermark);
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
    leftBorder,
    topBorder,
    baseWidth,
    baseHeight
  );

  if (!hasWatermark || bottomBorder <= 0) {
    applyCardMode({ canvas, contentCanvas, settings });
    return;
  }

  const barHeight = isFilmWatermark
    ? Math.max(34, Math.min(bottomBorder * 0.42, outputWidth * 0.075))
    : bottomBorder;
  const barY = isFilmWatermark
    ? topBorder + baseHeight + bottomBorder * 0.54 - barHeight / 2
    : topBorder + baseHeight;
  const padX = Math.max(24, outputWidth * (isFilmWatermark ? 0.08 : 0.05));
  const gap = Math.max(12, outputWidth * 0.018);
  const logoMaxWidth = outputWidth * (isFilmWatermark ? 0.16 : 0.18);
  const logoMaxHeight = Math.max(16, barHeight * (isFilmWatermark ? 0.32 : 0.3));
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
  const logoCenterX = outputWidth * (isFilmWatermark ? 0.56 : 0.57);
  const logoLeft = logoCenterX - logoDrawWidth / 2;
  const logoRight = logoCenterX + logoDrawWidth / 2;
  const separatorX = Math.min(outputWidth - padX * 0.35, logoRight + gap);
  const rightTextX = outputWidth - padX;
  const rightWidth = Math.max(80, rightTextX - separatorX - gap);
  const leftWidth = Math.max(90, logoLeft - padX - gap);

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, barY, outputWidth, barHeight);

  const title = settings.showModel ? settings.model || brand.defaultModel : "";
  const date = settings.showDate ? settings.date : "";
  const subtitle = settings.showSubtitle ? settings.subtitle : "";
  const titleSize = fitFont(ctx, title || " ", leftWidth, Math.max(13, barHeight * 0.22), 650);
  const smallSize = Math.max(9, barHeight * 0.13);
  const rightSize = fitFont(
    ctx,
    [settings.focalLength, settings.aperture, settings.shutter, settings.iso ? `ISO${settings.iso}` : ""]
      .filter(Boolean)
      .join(" "),
    rightWidth,
    Math.max(13, barHeight * 0.22),
    650
  );

  ctx.fillStyle = colors.fg;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  if (title) {
    ctx.font = `650 ${titleSize}px Inter, Arial, sans-serif`;
    ctx.fillText(title, padX, barY + barHeight * (subtitle ? 0.39 : 0.5), leftWidth);
  }
  ctx.fillStyle = colors.muted;
  ctx.font = `400 ${smallSize}px Inter, Arial, sans-serif`;
  if (subtitle) ctx.fillText(subtitle, padX, barY + barHeight * (title ? 0.61 : 0.5), leftWidth);

  if (logo) {
    ctx.drawImage(logo, logoLeft, barY + (barHeight - logoDrawHeight) / 2, logoDrawWidth, logoDrawHeight);
  } else {
    ctx.fillStyle = brand.accentColor;
    ctx.font = `760 ${Math.max(12, logoDrawHeight)}px Inter, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(brand.name, logoCenterX, barY + barHeight / 2, logoMaxWidth);
  }

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = Math.max(1, outputWidth * 0.0014);
  ctx.beginPath();
  ctx.moveTo(separatorX, barY + barHeight * 0.23);
  ctx.lineTo(separatorX, barY + barHeight * 0.77);
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
      ctx.fillText(params.join(" "), rightTextX, barY + barHeight * (date ? 0.39 : 0.5), rightWidth);
    }
    if (date) {
      ctx.fillStyle = colors.muted;
      ctx.font = `400 ${smallSize}px Inter, Arial, sans-serif`;
      ctx.fillText(date, rightTextX, barY + barHeight * (params.length ? 0.61 : 0.5), rightWidth);
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
