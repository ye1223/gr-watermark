export interface BrandConfig {
  id: string;
  name: string;
  defaultModel: string;
  logo: string;
  logoAspectRatio?: number;
  accentColor: string;
  borderDefault: "white" | "black";
}

export const brands: BrandConfig[] = [
  {
    id: "ricoh-gr",
    name: "RICOH",
    defaultModel: "GR IIIx",
    logo: "/gr-watermark/assets/logos/ricoh.svg",
    logoAspectRatio: 200 / 36.093304,
    accentColor: "#CC0000",
    borderDefault: "white",
  },
];

export function getBrand(id: string) {
  return brands.find((brand) => brand.id === id) ?? brands[0];
}
