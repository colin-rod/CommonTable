/**
 * TDD Example: Testing BaseService
 *
 * This file demonstrates testing patterns for service classes per CLAUDE.md:
 * - Mock Supabase client
 * - Test service initialization
 * - Verify Supabase client is accessible
 *
 * Future services extending BaseService can follow this pattern.
 */

import type { Database } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { BaseService } from './BaseService';

// Concrete implementation for testing the abstract BaseService
class TestService extends BaseService {
  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }
}

describe('BaseService', () => {
  let mockSupabase: SupabaseClient<Database>;
  let service: TestService;

  beforeEach(() => {
    // Create a minimal mock of the Supabase client
    mockSupabase = {
      from: vi.fn(),
      auth: {
        getUser: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
      },
      storage: {
        from: vi.fn(),
      },
    } as unknown as SupabaseClient<Database>;

    service = new TestService(mockSupabase);
  });

  it('should initialize with a Supabase client', () => {
    expect(service).toBeInstanceOf(BaseService);
    expect(service.getClient()).toBe(mockSupabase);
  });

  it('should provide access to the Supabase client', () => {
    const client = service.getClient();

    expect(client).toBe(mockSupabase);
    expect(client.from).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.storage).toBeDefined();
  });
});
