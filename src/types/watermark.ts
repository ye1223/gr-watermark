export type FrameStyle = "ORIGINAL" | "CLASSIC" | "MINIMAL" | "INSTAX" | "POLAROID";
export type OutputRatio = "ORIGINAL" | "1:1" | "3:4" | "4:3" | "16:9" | "9:16";
export type BorderTone = "white" | "black";

export interface WatermarkSettings {
  frameStyle: FrameStyle;
  outputRatio: OutputRatio;
  watermark: boolean;
  brandId: string;
  borderTone: BorderTone;
  showModel: boolean;
  model: string;
  showExif: boolean;
  focalLength: string;
  aperture: string;
  shutter: string;
  iso: string;
  showDate: boolean;
  date: string;
  showSubtitle: boolean;
  subtitle: string;
  cropZoom: number;
  cropX: number;
  cropY: number;
}

export interface ImageSource {
  file: File;
  url: string;
  originalUrl: string;
  name: string;
  width: number;
  height: number;
}

export interface ParsedExif {
  model?: string;
  focalLength?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  date?: string;
}

export const frameStyles: FrameStyle[] = [
  "ORIGINAL",
  "CLASSIC",
  "MINIMAL",
  "INSTAX",
  "POLAROID",
];

export const outputRatios: OutputRatio[] = [
  "ORIGINAL",
  "1:1",
  "3:4",
  "4:3",
  "16:9",
  "9:16",
];
