export interface BrandConfig {
  id: string;
  name: string;
  defaultModel: string;
  logo: string;
  accentColor: string;
  borderDefault: "white" | "black";
}

export const brands: BrandConfig[] = [
  {
    id: "ricoh-gr",
    name: "RICOH",
    defaultModel: "GR IIIx",
    logo: "/assets/logos/ricoh.svg",
    accentColor: "#CC0000",
    borderDefault: "white",
  },
];

export function getBrand(id: string) {
  return brands.find((brand) => brand.id === id) ?? brands[0];
}
