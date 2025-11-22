export const MATERIAL_DENSITY = {
  PLA: 1.24,    // g/cm³
  ABS: 1.04,
  Resin: 1.1,
  PETG: 1.27,
  TPU: 1.21,
};

export const FDM_PROFILES = {
  draft: {
    layer_height: 0.3,
    print_speed: 80,      // mm/s
    infill_density: 10,
    infill_pattern: 'lines',
  },
  standard: {
    layer_height: 0.2,
    print_speed: 60,
    infill_density: 20,
    infill_pattern: 'grid',
  },
  high: {
    layer_height: 0.1,
    print_speed: 40,
    infill_density: 30,
    infill_pattern: 'grid',
  },
};

export const PURPOSE_MODIFIERS = {
  prototype: {
    infill_density: 10,
    infill_pattern: 'lines',
  },
  functional: {
    infill_density: 40,
    infill_pattern: 'grid',
  },
  aesthetic: {
    infill_density: 15,
    infill_pattern: 'gyroid',
  },
};

export interface PrintParameters {
  layer_height: number;
  print_speed: number;
  infill_density: number;
  infill_pattern: string;
}

export function getPrintParameters(
  quality: 'draft' | 'standard' | 'high',
  purpose: 'prototype' | 'functional' | 'aesthetic'
): PrintParameters {
  const baseParams = { ...FDM_PROFILES[quality] };
  const modifier = PURPOSE_MODIFIERS[purpose];

  if (modifier) {
    return { ...baseParams, ...modifier };
  }

  return baseParams as PrintParameters;
}
