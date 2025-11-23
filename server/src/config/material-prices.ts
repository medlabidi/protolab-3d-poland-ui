// Material prices in PLN per kg

export const MATERIAL_PRICES_PLN: Record<string, number> = {
  // PLA
  PLA_White: 39,
  PLA_Black: 39,
  PLA_Red: 49,
  PLA_Yellow: 49,
  PLA_Blue: 49,

  // ABS
  ABS_Silver: 50,
  ABS_Transparent: 50,
  ABS_Black: 50,
  ABS_Grey: 50,
  ABS_Red: 50,
  ABS_White: 50,
  ABS_Blue: 50,
  ABS_Green: 50,

  // PETG
  PETG_Black: 30,
  PETG_White: 35,
  PETG_Red: 39,
  PETG_Green: 39,
  PETG_Blue: 39,
  PETG_Yellow: 39,
  PETG_Pink: 39,
  PETG_Orange: 39,
  PETG_Silver: 39,
};

export function getMaterialPrice(materialType: string, color: string): number {
  const key = `${materialType}_${color}`;
  const price = MATERIAL_PRICES_PLN[key];

  if (price === undefined) {
    throw new Error(`Material price not found for: ${key}`);
  }

  return price;
}
