export const MATERIAL_COLORS = {
  PLA: {
    Natural: { density: 1.24, priceMultiplier: 1.0 },
    Black: { density: 1.24, priceMultiplier: 1.05 },
    White: { density: 1.24, priceMultiplier: 1.05 },
    Red: { density: 1.24, priceMultiplier: 1.1 },
    Blue: { density: 1.24, priceMultiplier: 1.1 },
    Green: { density: 1.24, priceMultiplier: 1.1 },
    Yellow: { density: 1.24, priceMultiplier: 1.12 },
    Purple: { density: 1.24, priceMultiplier: 1.15 },
    Orange: { density: 1.24, priceMultiplier: 1.12 },
  },
  ABS: {
    Natural: { density: 1.04, priceMultiplier: 1.0 },
    Black: { density: 1.04, priceMultiplier: 1.08 },
    White: { density: 1.04, priceMultiplier: 1.08 },
    Red: { density: 1.04, priceMultiplier: 1.12 },
    Blue: { density: 1.04, priceMultiplier: 1.12 },
    Gray: { density: 1.04, priceMultiplier: 1.1 },
  },
  PETG: {
    Natural: { density: 1.27, priceMultiplier: 1.0 },
    Black: { density: 1.27, priceMultiplier: 1.08 },
    White: { density: 1.27, priceMultiplier: 1.08 },
    Clear: { density: 1.27, priceMultiplier: 1.15 },
    Blue: { density: 1.27, priceMultiplier: 1.1 },
  },
  TPU: {
    Black: { density: 1.21, priceMultiplier: 1.0 },
    White: { density: 1.21, priceMultiplier: 1.05 },
    Red: { density: 1.21, priceMultiplier: 1.1 },
    Blue: { density: 1.21, priceMultiplier: 1.1 },
  },
  Resin: {
    Clear: { density: 1.1, priceMultiplier: 1.0 },
    Opaque: { density: 1.1, priceMultiplier: 1.05 },
    White: { density: 1.1, priceMultiplier: 1.08 },
    Black: { density: 1.1, priceMultiplier: 1.08 },
    Colored: { density: 1.1, priceMultiplier: 1.15 },
  },
};

export function getColorPrice(
  material: string,
  color: string
): { density: number; priceMultiplier: number } {
  const colorData = MATERIAL_COLORS[material as keyof typeof MATERIAL_COLORS];
  if (!colorData) {
    throw new Error(`Material '${material}' not found`);
  }

  const colorInfo = colorData[color as keyof typeof colorData];
  if (!colorInfo) {
    throw new Error(`Color '${color}' not found for material '${material}'`);
  }

  return colorInfo;
}

export function getAvailableColors(material: string): string[] {
  const colorData = MATERIAL_COLORS[material as keyof typeof MATERIAL_COLORS];
  if (!colorData) return [];
  return Object.keys(colorData);
}
