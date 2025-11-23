export const getAvailableColors = (material: string): string[] => {
  const colorsByMaterial: Record<string, string[]> = {
    PLA: ['Natural', 'Black', 'White', 'Red', 'Blue', 'Green'],
    ABS: ['Black', 'White', 'Gray', 'Red'],
    PETG: ['Natural', 'Black', 'White', 'Blue'],
    TPU: ['Black', 'White', 'Transparent'],
    Resin: ['Standard', 'Tough', 'Flexible'],
  };

  return colorsByMaterial[material] || ['Natural'];
};