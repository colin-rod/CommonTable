/**
 * Unit Conversion Library
 *
 * Provides functions for converting between cooking measurement units.
 * Supports volume (cups, ml, etc.), weight (g, oz, etc.), and count units.
 */

export type UnitCategory = 'volume' | 'weight' | 'count';
export type UnitSystem = 'metric' | 'imperial';

/**
 * Unit alias mapping - normalizes various spellings to standard form
 */
const UNIT_ALIASES: Record<string, string> = {
  // Volume - imperial
  cups: 'cup',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',
  'fl. oz.': 'fl oz',
  teaspoon: 'tsp',
  teaspoons: 'tsp',

  // Volume - metric
  milliliter: 'ml',
  milliliters: 'ml',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',

  // Weight - imperial
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
  lbs: 'lb',

  // Weight - metric
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',

  // Count
  pieces: 'piece',
  pcs: 'piece',
};

/**
 * Unit definitions with conversion factors to base units
 * Volume base: ml
 * Weight base: g
 * Count base: piece
 */
interface UnitDefinition {
  category: UnitCategory;
  system: UnitSystem | 'both';
  toBase: number; // multiplier to convert to base unit
}

const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // Volume - imperial
  cup: { category: 'volume', system: 'imperial', toBase: 236.588 },
  tbsp: { category: 'volume', system: 'imperial', toBase: 14.787 },
  tsp: { category: 'volume', system: 'imperial', toBase: 4.929 },
  'fl oz': { category: 'volume', system: 'imperial', toBase: 29.574 },

  // Volume - metric
  ml: { category: 'volume', system: 'metric', toBase: 1 },
  l: { category: 'volume', system: 'metric', toBase: 1000 },

  // Weight - imperial
  oz: { category: 'weight', system: 'imperial', toBase: 28.3495 },
  lb: { category: 'weight', system: 'imperial', toBase: 453.592 },

  // Weight - metric
  g: { category: 'weight', system: 'metric', toBase: 1 },
  kg: { category: 'weight', system: 'metric', toBase: 1000 },

  // Count
  piece: { category: 'count', system: 'both', toBase: 1 },
  dozen: { category: 'count', system: 'both', toBase: 12 },
};

/**
 * Preferred units for each category when converting to a system
 */
const PREFERRED_UNITS: Record<UnitCategory, Record<UnitSystem, string>> = {
  volume: {
    metric: 'ml',
    imperial: 'cup',
  },
  weight: {
    metric: 'g',
    imperial: 'oz',
  },
  count: {
    metric: 'piece',
    imperial: 'piece',
  },
};

/**
 * Large metric unit thresholds - when to use larger units
 * Reserved for future use to auto-convert large values (e.g., 1000ml → 1l)
 */
const _LARGE_UNIT_THRESHOLDS: Record<string, { threshold: number; unit: string }> = {
  ml: { threshold: 1000, unit: 'l' },
  g: { threshold: 1000, unit: 'kg' },
};

/**
 * Normalizes a unit string to its standard form
 *
 * @param unit - The unit string to normalize
 * @returns The normalized unit string (lowercase)
 */
export function normalizeUnit(unit: string): string {
  if (!unit) return '';

  const lower = unit.toLowerCase().trim();

  // Check aliases first
  const alias = UNIT_ALIASES[lower];
  if (alias !== undefined) {
    return alias;
  }

  // Check if it's a known unit (case-insensitive match)
  if (lower in UNIT_DEFINITIONS) {
    return lower;
  }

  // Return as-is (lowercase) for unknown units
  return lower;
}

/**
 * Gets the category of a unit (volume, weight, or count)
 *
 * @param unit - The unit to categorize
 * @returns The unit category or null if unknown
 */
export function getUnitCategory(unit: string): UnitCategory | null {
  const normalized = normalizeUnit(unit);
  const definition = UNIT_DEFINITIONS[normalized];
  return definition?.category ?? null;
}

/**
 * Gets the system (metric or imperial) of a unit
 *
 * @param unit - The unit to check
 * @returns The unit system or null if unknown
 */
export function getUnitSystem(unit: string): UnitSystem | 'both' | null {
  const normalized = normalizeUnit(unit);
  const definition = UNIT_DEFINITIONS[normalized];
  return definition?.system ?? null;
}

/**
 * Checks if two units are compatible (can be converted between)
 *
 * @param unit1 - First unit
 * @param unit2 - Second unit
 * @returns True if units are in the same category
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const cat1 = getUnitCategory(unit1);
  const cat2 = getUnitCategory(unit2);

  if (cat1 === null || cat2 === null) {
    return false;
  }

  return cat1 === cat2;
}

/**
 * Converts a value from one unit to another
 *
 * @param value - The value to convert
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @returns The converted value or null if conversion is not possible
 */
export function convert(value: number, fromUnit: string, toUnit: string): number | null {
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);

  // Same unit - no conversion needed
  if (normalizedFrom === normalizedTo) {
    return value;
  }

  const fromDef = UNIT_DEFINITIONS[normalizedFrom];
  const toDef = UNIT_DEFINITIONS[normalizedTo];

  // Unknown units
  if (!fromDef || !toDef) {
    return null;
  }

  // Different categories - incompatible
  if (fromDef.category !== toDef.category) {
    return null;
  }

  // Convert: value -> base -> target
  const baseValue = value * fromDef.toBase;
  const targetValue = baseValue / toDef.toBase;

  return targetValue;
}

/**
 * Gets the preferred unit for a category in a given system
 *
 * @param unit - The current unit
 * @param targetSystem - The target unit system
 * @returns The preferred unit for the target system
 */
export function getPreferredUnit(unit: string, targetSystem: UnitSystem): string {
  const normalized = normalizeUnit(unit);
  const definition = UNIT_DEFINITIONS[normalized];

  // Unknown unit - return as-is
  if (!definition) {
    return normalized;
  }

  // Count units don't change between systems
  if (definition.category === 'count') {
    return normalized;
  }

  // If already in target system, keep it
  if (definition.system === targetSystem || definition.system === 'both') {
    return normalized;
  }

  // Convert to preferred unit in target system
  return PREFERRED_UNITS[definition.category][targetSystem];
}

/**
 * Converts a value to a target unit system
 *
 * @param value - The value to convert
 * @param fromUnit - The source unit
 * @param targetSystem - The target unit system (metric or imperial)
 * @returns Object with converted value and unit, or null if conversion failed
 */
export function convertToSystem(
  value: number,
  fromUnit: string,
  targetSystem: UnitSystem,
): { value: number; unit: string } | null {
  const normalized = normalizeUnit(fromUnit);
  const definition = UNIT_DEFINITIONS[normalized];

  // Unknown unit
  if (!definition) {
    return null;
  }

  // Get the target unit
  const targetUnit = getPreferredUnit(normalized, targetSystem);

  // Same unit - no conversion needed
  if (normalized === targetUnit) {
    return { value, unit: normalized };
  }

  // Convert
  const convertedValue = convert(value, normalized, targetUnit);
  if (convertedValue === null) {
    return null;
  }

  return { value: convertedValue, unit: targetUnit };
}
