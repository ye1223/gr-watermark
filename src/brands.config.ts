export interface BrandConfig {
  id: string;
  name: string;
  defaultModel: string;
  logo: string;
  logoAspectRatio?: number;
  logoHeightScale?: number;
  logoOnlyScale?: number;
  logoTone?: "original" | "foreground";
  accentColor: string;
  borderDefault: "white" | "black";
  match: string[];
}

export const brands: BrandConfig[] = [
  {
    id: "ricoh-gr",
    name: "RICOH",
    defaultModel: "GR IIIx",
    logo: "/gr-watermark/assets/logos/ricoh.svg",
    logoAspectRatio: 200 / 36.093304,
    logoTone: "original",
    accentColor: "#CC0000",
    borderDefault: "white",
    match: ["ricoh", "gr iii", "gr iiix", "gr ii", "gr digital"],
  },
  {
    id: "apple",
    name: "Apple",
    defaultModel: "iPhone",
    logo: "/gr-watermark/assets/logos/apple.svg",
    logoAspectRatio: 814 / 1000,
    logoHeightScale: 1.18,
    logoOnlyScale: 1.5,
    logoTone: "foreground",
    accentColor: "#111111",
    borderDefault: "white",
    match: ["apple", "iphone", "ipad"],
  },
];

export function getBrand(id: string) {
  return brands.find((brand) => brand.id === id) ?? brands[0];
}

export function detectBrandFromCamera(make?: string, model?: string) {
  const source = `${make || ""} ${model || ""}`.toLowerCase();
  if (!source.trim()) return null;

  return brands.find((brand) => brand.match.some((keyword) => source.includes(keyword))) ?? null;
}
