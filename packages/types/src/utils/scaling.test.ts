import { describe, it, expect } from 'vitest';

import type { IngredientInput } from '../models';

import { scaleQuantity, scaleIngredients, roundQuantity } from './scaling';

describe('scaling', () => {
  describe('roundQuantity', () => {
    it('should round to reasonable precision for cooking', () => {
      // Exact halves, quarters, thirds
      expect(roundQuantity(0.5)).toBe(0.5);
      expect(roundQuantity(0.25)).toBe(0.25);
      expect(roundQuantity(0.333)).toBeCloseTo(0.33, 2);
      expect(roundQuantity(0.666)).toBeCloseTo(0.67, 2);
      expect(roundQuantity(0.75)).toBe(0.75);
    });

    it('should round small quantities to 2 decimal places', () => {
      expect(roundQuantity(0.123)).toBe(0.12);
      expect(roundQuantity(0.127)).toBe(0.13);
    });

    it('should round larger quantities to 1 decimal place', () => {
      expect(roundQuantity(2.34)).toBe(2.3);
      expect(roundQuantity(2.36)).toBe(2.4);
      expect(roundQuantity(5.55)).toBe(5.6);
    });

    it('should round very large quantities to whole numbers', () => {
      expect(roundQuantity(10.3)).toBe(10);
      expect(roundQuantity(10.7)).toBe(11);
      expect(roundQuantity(100.5)).toBe(101);
    });

    it('should keep integers as integers', () => {
      expect(roundQuantity(1)).toBe(1);
      expect(roundQuantity(5)).toBe(5);
      expect(roundQuantity(10)).toBe(10);
    });

    it('should handle zero', () => {
      expect(roundQuantity(0)).toBe(0);
    });
  });

  describe('scaleQuantity', () => {
    it('should scale quantity by the given factor', () => {
      expect(scaleQuantity(2, 2)).toBe(4);
      expect(scaleQuantity(1, 0.5)).toBe(0.5);
      expect(scaleQuantity(3, 1.5)).toBe(4.5);
    });

    it('should apply smart rounding to scaled values', () => {
      // 1/3 scaling of 3 cups = 1 cup
      expect(scaleQuantity(3, 1 / 3)).toBeCloseTo(1, 2);

      // 2/3 scaling of 3 cups = 2 cups
      expect(scaleQuantity(3, 2 / 3)).toBe(2);
    });

    it('should handle zero scale factor', () => {
      expect(scaleQuantity(5, 0)).toBe(0);
    });

    it('should handle undefined quantity', () => {
      expect(scaleQuantity(undefined, 2)).toBeUndefined();
    });
  });

  describe('scaleIngredients', () => {
    const baseIngredients: IngredientInput[] = [
      { name: 'flour', quantity: 2, unit: 'cup' },
      { name: 'sugar', quantity: 1, unit: 'cup' },
      { name: 'salt', quantity: 0.5, unit: 'tsp' },
      { name: 'vanilla', notes: 'to taste' }, // No quantity
    ];

    it('should scale all quantities proportionally', () => {
      const result = scaleIngredients(baseIngredients, 4, 8);

      expect(result[0]!.quantity).toBe(4);
      expect(result[1]!.quantity).toBe(2);
      expect(result[2]!.quantity).toBe(1);
    });

    it('should preserve ingredients without quantities', () => {
      const result = scaleIngredients(baseIngredients, 4, 8);

      expect(result[3]!.name).toBe('vanilla');
      expect(result[3]!.quantity).toBeUndefined();
      expect(result[3]!.notes).toBe('to taste');
    });

    it('should include scale factor in result', () => {
      const result = scaleIngredients(baseIngredients, 4, 8);

      expect(result[0]!.scaleFactor).toBe(2);
      expect(result[3]!.scaleFactor).toBe(2);
    });

    it('should include original quantity in result', () => {
      const result = scaleIngredients(baseIngredients, 4, 8);

      expect(result[0]!.originalQuantity).toBe(2);
      expect(result[1]!.originalQuantity).toBe(1);
      expect(result[3]!.originalQuantity).toBeUndefined();
    });

    it('should preserve all other ingredient properties', () => {
      const result = scaleIngredients(baseIngredients, 4, 8);

      expect(result[0]!.unit).toBe('cup');
      expect(result[0]!.name).toBe('flour');
    });

    it('should scale down correctly (half recipe)', () => {
      const result = scaleIngredients(baseIngredients, 4, 2);

      expect(result[0]!.quantity).toBe(1);
      expect(result[1]!.quantity).toBe(0.5);
      expect(result[2]!.quantity).toBe(0.25);
      expect(result[0]!.scaleFactor).toBe(0.5);
    });

    it('should handle non-divisible scaling with smart rounding', () => {
      // Scale from 4 servings to 6 (1.5x)
      const result = scaleIngredients(baseIngredients, 4, 6);

      expect(result[0]!.quantity).toBe(3); // 2 * 1.5 = 3
      expect(result[1]!.quantity).toBe(1.5); // 1 * 1.5 = 1.5
      expect(result[2]!.quantity).toBe(0.75); // 0.5 * 1.5 = 0.75
    });

    it('should handle scaling to same serving count (1x)', () => {
      const result = scaleIngredients(baseIngredients, 4, 4);

      expect(result[0]!.quantity).toBe(2);
      expect(result[0]!.scaleFactor).toBe(1);
    });

    it('should handle empty ingredients array', () => {
      const result = scaleIngredients([], 4, 8);
      expect(result).toEqual([]);
    });

    it('should handle single ingredient', () => {
      const single: IngredientInput[] = [{ name: 'butter', quantity: 1, unit: 'tbsp' }];
      const result = scaleIngredients(single, 2, 4);

      expect(result).toHaveLength(1);
      expect(result[0]!.quantity).toBe(2);
    });

    describe('edge cases', () => {
      it('should handle very small scale factors', () => {
        const result = scaleIngredients(baseIngredients, 8, 1);

        expect(result[0]!.quantity).toBe(0.25); // 2 / 8 = 0.25
        expect(result[0]!.scaleFactor).toBe(0.125);
      });

      it('should handle large scale factors', () => {
        const result = scaleIngredients(baseIngredients, 1, 10);

        expect(result[0]!.quantity).toBe(20); // 2 * 10 = 20
        expect(result[0]!.scaleFactor).toBe(10);
      });

      it('should handle decimal original servings', () => {
        const result = scaleIngredients(baseIngredients, 2.5, 5);

        expect(result[0]!.scaleFactor).toBe(2);
        expect(result[0]!.quantity).toBe(4);
      });
    });
  });
});
