import { z } from 'zod';

/**
 * Request schema for example-function
 */
export const ExampleRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(200, 'Message too long'),
  metadata: z
    .object({
      userId: z.string().optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
});

export type ExampleRequest = z.infer<typeof ExampleRequestSchema>;

/**
 * Response schema (for documentation purposes)
 */
export const ExampleResponseSchema = z.object({
  message: z.string(),
  processedAt: z.string(),
  metadata: z
    .object({
      userId: z.string().optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
});

export type ExampleResponse = z.infer<typeof ExampleResponseSchema>;
