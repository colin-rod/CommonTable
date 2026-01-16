import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { validateEnv, getEnv } from './env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should validate all required environment variables when valid', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key-123';
      process.env.NODE_ENV = 'development';

      const result = validateEnv();

      expect(result).toEqual({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key-123',
        NODE_ENV: 'development',
      });
    });

    it('should validate with optional SUPABASE_SECRET_KEY', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key-123';
      process.env.SUPABASE_SECRET_KEY = 'test-secret-key-456';
      process.env.NODE_ENV = 'production';

      const result = validateEnv();

      expect(result).toEqual({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key-123',
        SUPABASE_SECRET_KEY: 'test-secret-key-456',
        NODE_ENV: 'production',
      });
    });

    it('should default NODE_ENV to development when not provided', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key-123';
      delete process.env.NODE_ENV;

      const result = validateEnv();

      expect(result.NODE_ENV).toBe('development');
    });

    it('should throw Error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key-123';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should throw Error when NEXT_PUBLIC_SUPABASE_URL is not a valid URL', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key-123';

      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should throw Error when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should throw Error when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is empty string', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = '';

      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should throw Error when NODE_ENV is invalid', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key-123';
      process.env.NODE_ENV = 'staging'; // Not in enum

      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should accept test as valid NODE_ENV', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key-123';
      process.env.NODE_ENV = 'test';

      const result = validateEnv();

      expect(result.NODE_ENV).toBe('test');
    });

    it('should log error details when validation fails', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = '';

      expect(() => validateEnv()).toThrow('Invalid environment variables');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Invalid environment variables:',
        expect.any(Object),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getEnv', () => {
    it('should return validated environment variables', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key-123';
      process.env.NODE_ENV = 'development';

      // Reset module to clear cache
      vi.resetModules();
      const { getEnv: freshGetEnv } = await import('./env');

      const result = freshGetEnv();

      expect(result).toEqual({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key-123',
        NODE_ENV: 'development',
      });
    });

    it('should cache validated environment on first call', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key-123';

      // Reset module to clear cache
      vi.resetModules();
      const { getEnv: freshGetEnv } = await import('./env');

      const firstCall = freshGetEnv();
      const secondCall = freshGetEnv();

      // Should return the same object reference (cached)
      expect(firstCall).toBe(secondCall);
    });

    it('should throw Error when environment is invalid', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      // Reset module to clear cache
      vi.resetModules();
      const { getEnv: freshGetEnv } = await import('./env');

      expect(() => freshGetEnv()).toThrow('Invalid environment variables');
    });
  });

  describe('Type Safety', () => {
    it('should have correct TypeScript type for Env', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key-123';

      const env = getEnv();

      // TypeScript type checks (compile-time verification)
      const url: string = env.NEXT_PUBLIC_SUPABASE_URL;
      const publishableKey: string = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const nodeEnv: 'development' | 'production' | 'test' = env.NODE_ENV;
      const secretKey: string | undefined = env.SUPABASE_SECRET_KEY;

      expect(typeof url).toBe('string');
      expect(typeof publishableKey).toBe('string');
      expect(typeof nodeEnv).toBe('string');
      expect(['string', 'undefined']).toContain(typeof secretKey);
    });
  });
});
