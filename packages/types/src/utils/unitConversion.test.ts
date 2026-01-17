import { describe, it, expect } from 'vitest';

import {
  normalizeUnit,
  getUnitCategory,
  areUnitsCompatible,
  convert,
  getPreferredUnit,
  convertToSystem,
} from './unitConversion';

describe('unitConversion', () => {
  describe('normalizeUnit', () => {
    it('should normalize common unit variations to standard form', () => {
      // Volume - imperial
      expect(normalizeUnit('cups')).toBe('cup');
      expect(normalizeUnit('Cups')).toBe('cup');
      expect(normalizeUnit('CUP')).toBe('cup');
      expect(normalizeUnit('tablespoon')).toBe('tbsp');
      expect(normalizeUnit('tablespoons')).toBe('tbsp');
      expect(normalizeUnit('Tbsp')).toBe('tbsp');
      expect(normalizeUnit('teaspoon')).toBe('tsp');
      expect(normalizeUnit('teaspoons')).toBe('tsp');
      expect(normalizeUnit('fluid ounce')).toBe('fl oz');
      expect(normalizeUnit('fluid ounces')).toBe('fl oz');
      expect(normalizeUnit('fl. oz.')).toBe('fl oz');

      // Volume - metric
      expect(normalizeUnit('milliliter')).toBe('ml');
      expect(normalizeUnit('milliliters')).toBe('ml');
      expect(normalizeUnit('mL')).toBe('ml');
      expect(normalizeUnit('liter')).toBe('l');
      expect(normalizeUnit('liters')).toBe('l');
      expect(normalizeUnit('litre')).toBe('l');
      expect(normalizeUnit('litres')).toBe('l');
      expect(normalizeUnit('L')).toBe('l');

      // Weight - imperial
      expect(normalizeUnit('ounce')).toBe('oz');
      expect(normalizeUnit('ounces')).toBe('oz');
      expect(normalizeUnit('pound')).toBe('lb');
      expect(normalizeUnit('pounds')).toBe('lb');
      expect(normalizeUnit('lbs')).toBe('lb');

      // Weight - metric
      expect(normalizeUnit('gram')).toBe('g');
      expect(normalizeUnit('grams')).toBe('g');
      expect(normalizeUnit('kilogram')).toBe('kg');
      expect(normalizeUnit('kilograms')).toBe('kg');

      // Count
      expect(normalizeUnit('pieces')).toBe('piece');
      expect(normalizeUnit('pcs')).toBe('piece');
    });

    it('should return unknown units as-is (lowercase)', () => {
      expect(normalizeUnit('pinch')).toBe('pinch');
      expect(normalizeUnit('Pinch')).toBe('pinch');
      expect(normalizeUnit('bunch')).toBe('bunch');
    });

    it('should handle empty string', () => {
      expect(normalizeUnit('')).toBe('');
    });
  });

  describe('getUnitCategory', () => {
    it('should return volume for volume units', () => {
      expect(getUnitCategory('cup')).toBe('volume');
      expect(getUnitCategory('tbsp')).toBe('volume');
      expect(getUnitCategory('tsp')).toBe('volume');
      expect(getUnitCategory('ml')).toBe('volume');
      expect(getUnitCategory('l')).toBe('volume');
      expect(getUnitCategory('fl oz')).toBe('volume');
    });

    it('should return weight for weight units', () => {
      expect(getUnitCategory('g')).toBe('weight');
      expect(getUnitCategory('kg')).toBe('weight');
      expect(getUnitCategory('oz')).toBe('weight');
      expect(getUnitCategory('lb')).toBe('weight');
    });

    it('should return count for count units', () => {
      expect(getUnitCategory('piece')).toBe('count');
      expect(getUnitCategory('dozen')).toBe('count');
    });

    it('should return null for unknown units', () => {
      expect(getUnitCategory('pinch')).toBeNull();
      expect(getUnitCategory('bunch')).toBeNull();
      expect(getUnitCategory('')).toBeNull();
    });

    it('should normalize units before categorizing', () => {
      expect(getUnitCategory('cups')).toBe('volume');
      expect(getUnitCategory('Tablespoon')).toBe('volume');
      expect(getUnitCategory('grams')).toBe('weight');
    });
  });

  describe('areUnitsCompatible', () => {
    it('should return true for same category units', () => {
      expect(areUnitsCompatible('cup', 'ml')).toBe(true);
      expect(areUnitsCompatible('tbsp', 'tsp')).toBe(true);
      expect(areUnitsCompatible('g', 'oz')).toBe(true);
      expect(areUnitsCompatible('kg', 'lb')).toBe(true);
    });

    it('should return false for different category units', () => {
      expect(areUnitsCompatible('cup', 'g')).toBe(false);
      expect(areUnitsCompatible('ml', 'oz')).toBe(false);
      expect(areUnitsCompatible('piece', 'cup')).toBe(false);
    });

    it('should return false if either unit is unknown', () => {
      expect(areUnitsCompatible('cup', 'pinch')).toBe(false);
      expect(areUnitsCompatible('bunch', 'ml')).toBe(false);
    });

    it('should normalize units before comparing', () => {
      expect(areUnitsCompatible('cups', 'milliliters')).toBe(true);
      expect(areUnitsCompatible('Tablespoon', 'teaspoons')).toBe(true);
    });
  });

  describe('convert', () => {
    describe('volume conversions', () => {
      it('should convert cups to ml', () => {
        expect(convert(1, 'cup', 'ml')).toBeCloseTo(236.588, 1);
        expect(convert(2, 'cup', 'ml')).toBeCloseTo(473.176, 1);
      });

      it('should convert ml to cups', () => {
        expect(convert(236.588, 'ml', 'cup')).toBeCloseTo(1, 2);
        expect(convert(500, 'ml', 'cup')).toBeCloseTo(2.11, 1);
      });

      it('should convert tbsp to tsp', () => {
        expect(convert(1, 'tbsp', 'tsp')).toBeCloseTo(3, 2);
        expect(convert(2, 'tbsp', 'tsp')).toBeCloseTo(6, 2);
      });

      it('should convert tsp to ml', () => {
        expect(convert(1, 'tsp', 'ml')).toBeCloseTo(4.929, 1);
      });

      it('should convert tbsp to ml', () => {
        expect(convert(1, 'tbsp', 'ml')).toBeCloseTo(14.787, 1);
      });

      it('should convert fl oz to ml', () => {
        expect(convert(1, 'fl oz', 'ml')).toBeCloseTo(29.574, 1);
      });

      it('should convert liters to ml', () => {
        expect(convert(1, 'l', 'ml')).toBe(1000);
        expect(convert(0.5, 'l', 'ml')).toBe(500);
      });

      it('should convert ml to liters', () => {
        expect(convert(1000, 'ml', 'l')).toBe(1);
        expect(convert(500, 'ml', 'l')).toBe(0.5);
      });
    });

    describe('weight conversions', () => {
      it('should convert oz to g', () => {
        expect(convert(1, 'oz', 'g')).toBeCloseTo(28.35, 1);
        expect(convert(4, 'oz', 'g')).toBeCloseTo(113.4, 1);
      });

      it('should convert g to oz', () => {
        expect(convert(28.35, 'g', 'oz')).toBeCloseTo(1, 2);
        expect(convert(100, 'g', 'oz')).toBeCloseTo(3.53, 1);
      });

      it('should convert lb to g', () => {
        expect(convert(1, 'lb', 'g')).toBeCloseTo(453.592, 1);
      });

      it('should convert kg to g', () => {
        expect(convert(1, 'kg', 'g')).toBe(1000);
        expect(convert(0.5, 'kg', 'g')).toBe(500);
      });

      it('should convert g to kg', () => {
        expect(convert(1000, 'g', 'kg')).toBe(1);
        expect(convert(500, 'g', 'kg')).toBe(0.5);
      });

      it('should convert lb to kg', () => {
        expect(convert(1, 'lb', 'kg')).toBeCloseTo(0.454, 2);
        expect(convert(2.2, 'lb', 'kg')).toBeCloseTo(1, 1);
      });
    });

    describe('count conversions', () => {
      it('should convert dozen to piece', () => {
        expect(convert(1, 'dozen', 'piece')).toBe(12);
        expect(convert(2, 'dozen', 'piece')).toBe(24);
      });

      it('should convert piece to dozen', () => {
        expect(convert(12, 'piece', 'dozen')).toBe(1);
        expect(convert(6, 'piece', 'dozen')).toBe(0.5);
      });
    });

    describe('edge cases', () => {
      it('should return null for incompatible units', () => {
        expect(convert(1, 'cup', 'g')).toBeNull();
        expect(convert(1, 'oz', 'ml')).toBeNull();
      });

      it('should return null for unknown units', () => {
        expect(convert(1, 'pinch', 'ml')).toBeNull();
        expect(convert(1, 'cup', 'bunch')).toBeNull();
      });

      it('should return the same value for same unit', () => {
        expect(convert(5, 'cup', 'cup')).toBe(5);
        expect(convert(100, 'g', 'g')).toBe(100);
      });

      it('should handle zero values', () => {
        expect(convert(0, 'cup', 'ml')).toBe(0);
      });

      it('should normalize units before converting', () => {
        expect(convert(1, 'cups', 'milliliters')).toBeCloseTo(236.588, 1);
        expect(convert(1, 'Tablespoon', 'teaspoons')).toBeCloseTo(3, 2);
      });
    });
  });

  describe('getPreferredUnit', () => {
    it('should return metric equivalent for imperial volume units', () => {
      expect(getPreferredUnit('cup', 'metric')).toBe('ml');
      expect(getPreferredUnit('tbsp', 'metric')).toBe('ml');
      expect(getPreferredUnit('tsp', 'metric')).toBe('ml');
      expect(getPreferredUnit('fl oz', 'metric')).toBe('ml');
    });

    it('should return imperial equivalent for metric volume units', () => {
      expect(getPreferredUnit('ml', 'imperial')).toBe('cup');
      expect(getPreferredUnit('l', 'imperial')).toBe('cup');
    });

    it('should return metric equivalent for imperial weight units', () => {
      expect(getPreferredUnit('oz', 'metric')).toBe('g');
      expect(getPreferredUnit('lb', 'metric')).toBe('g');
    });

    it('should return imperial equivalent for metric weight units', () => {
      expect(getPreferredUnit('g', 'imperial')).toBe('oz');
      expect(getPreferredUnit('kg', 'imperial')).toBe('oz'); // Always converts to base imperial unit
    });

    it('should return same unit for count units regardless of system', () => {
      expect(getPreferredUnit('piece', 'metric')).toBe('piece');
      expect(getPreferredUnit('piece', 'imperial')).toBe('piece');
      expect(getPreferredUnit('dozen', 'metric')).toBe('dozen');
    });

    it('should return same unit if already in target system', () => {
      expect(getPreferredUnit('ml', 'metric')).toBe('ml');
      expect(getPreferredUnit('g', 'metric')).toBe('g');
      expect(getPreferredUnit('cup', 'imperial')).toBe('cup');
      expect(getPreferredUnit('oz', 'imperial')).toBe('oz');
    });

    it('should return original unit for unknown units', () => {
      expect(getPreferredUnit('pinch', 'metric')).toBe('pinch');
      expect(getPreferredUnit('bunch', 'imperial')).toBe('bunch');
    });
  });

  describe('convertToSystem', () => {
    it('should convert imperial volume to metric', () => {
      const result = convertToSystem(2, 'cup', 'metric');
      expect(result).not.toBeNull();
      expect(result!.value).toBeCloseTo(473, 0);
      expect(result!.unit).toBe('ml');
    });

    it('should convert metric volume to imperial', () => {
      const result = convertToSystem(500, 'ml', 'imperial');
      expect(result).not.toBeNull();
      expect(result!.value).toBeCloseTo(2.11, 1);
      expect(result!.unit).toBe('cup');
    });

    it('should convert imperial weight to metric', () => {
      const result = convertToSystem(4, 'oz', 'metric');
      expect(result).not.toBeNull();
      expect(result!.value).toBeCloseTo(113, 0);
      expect(result!.unit).toBe('g');
    });

    it('should convert metric weight to imperial', () => {
      const result = convertToSystem(500, 'g', 'imperial');
      expect(result).not.toBeNull();
      expect(result!.value).toBeCloseTo(17.6, 1);
      expect(result!.unit).toBe('oz');
    });

    it('should return same value and unit if already in target system', () => {
      const result = convertToSystem(500, 'ml', 'metric');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(500);
      expect(result!.unit).toBe('ml');
    });

    it('should return null for unknown units', () => {
      expect(convertToSystem(1, 'pinch', 'metric')).toBeNull();
    });

    it('should handle count units (no conversion needed)', () => {
      const result = convertToSystem(5, 'piece', 'metric');
      expect(result).not.toBeNull();
      expect(result!.value).toBe(5);
      expect(result!.unit).toBe('piece');
    });
  });
});
