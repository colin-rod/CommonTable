/**
 * Tests for OpenAI integration
 *
 * Run with: deno test --allow-env --allow-net openai.test.ts
 */

import { assertEquals, assertRejects } from 'https://deno.land/std@0.208.0/assert/mod.ts';

import { generateTagSuggestions } from './openai.ts';

// Mock fetch for tests
const originalFetch = globalThis.fetch;

function mockFetch(response: Response): void {
  globalThis.fetch = async () => response;
}

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

// =====================================================================
// TEST: Missing API Key
// =====================================================================

Deno.test('generateTagSuggestions - should throw error if OPENAI_API_KEY not set', async () => {
  // Remove API key
  const originalKey = Deno.env.get('OPENAI_API_KEY');
  Deno.env.delete('OPENAI_API_KEY');

  try {
    await assertRejects(
      async () => {
        await generateTagSuggestions('Test Recipe', [], [], []);
      },
      Error,
      'OPENAI_API_KEY environment variable not set',
    );
  } finally {
    // Restore API key if it existed
    if (originalKey) {
      Deno.env.set('OPENAI_API_KEY', originalKey);
    }
  }
});

// =====================================================================
// TEST: Successful Tag Generation
// =====================================================================

Deno.test(
  'generateTagSuggestions - should generate 3 tag suggestions with confidence scores',
  async () => {
    // Set test API key
    Deno.env.set('OPENAI_API_KEY', 'test-key');

    // Mock successful OpenAI response
    const mockResponse = new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                tags: [
                  { name: 'pasta', confidence: 0.95, reason: 'Main dish type' },
                  { name: 'italian', confidence: 0.9, reason: 'Cuisine type' },
                  { name: 'dinner', confidence: 0.85, reason: 'Meal type' },
                ],
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 100,
          total_tokens: 600,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );

    mockFetch(mockResponse);

    try {
      const suggestions = await generateTagSuggestions(
        'Pasta Carbonara',
        [
          { name: 'spaghetti', quantity: 400, unit: 'g' },
          { name: 'eggs', quantity: 4 },
          { name: 'bacon', quantity: 200, unit: 'g' },
        ],
        [
          { position: 1, text: 'Boil pasta in salted water' },
          { position: 2, text: 'Fry bacon until crispy' },
          { position: 3, text: 'Mix eggs with cheese' },
          { position: 4, text: 'Combine everything and serve' },
        ],
        ['italian', 'quick', 'comfort-food'],
      );

      assertEquals(suggestions.length, 3);
      assertEquals(suggestions[0].name, 'pasta');
      assertEquals(suggestions[0].confidence, 0.95);
      assertEquals(suggestions[1].name, 'italian');
      assertEquals(suggestions[1].confidence, 0.9);
      assertEquals(suggestions[2].name, 'dinner');
      assertEquals(suggestions[2].confidence, 0.85);
    } finally {
      restoreFetch();
    }
  },
);

// =====================================================================
// TEST: Tag Name Normalization
// =====================================================================

Deno.test('generateTagSuggestions - should normalize tag names to lowercase and trim', async () => {
  Deno.env.set('OPENAI_API_KEY', 'test-key');

  const mockResponse = new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: [
                { name: '  PASTA  ', confidence: 0.95, reason: 'Main dish' },
                { name: 'Italian ', confidence: 0.9, reason: 'Cuisine' },
                { name: ' Dinner', confidence: 0.85, reason: 'Meal' },
              ],
            }),
          },
        },
      ],
    }),
    { status: 200 },
  );

  mockFetch(mockResponse);

  try {
    const suggestions = await generateTagSuggestions('Test', [], [], []);

    assertEquals(suggestions[0].name, 'pasta');
    assertEquals(suggestions[1].name, 'italian');
    assertEquals(suggestions[2].name, 'dinner');
  } finally {
    restoreFetch();
  }
});

// =====================================================================
// TEST: OpenAI API Error
// =====================================================================

Deno.test('generateTagSuggestions - should handle OpenAI API errors gracefully', async () => {
  Deno.env.set('OPENAI_API_KEY', 'test-key');

  const mockResponse = new Response('Internal server error', {
    status: 500,
    statusText: 'Internal Server Error',
  });

  mockFetch(mockResponse);

  try {
    await assertRejects(
      async () => {
        await generateTagSuggestions('Test Recipe', [], [], []);
      },
      Error,
      'OpenAI API error (500)',
    );
  } finally {
    restoreFetch();
  }
});

// =====================================================================
// TEST: Invalid JSON Response
// =====================================================================

Deno.test('generateTagSuggestions - should handle invalid JSON response', async () => {
  Deno.env.set('OPENAI_API_KEY', 'test-key');

  const mockResponse = new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: 'not valid json',
          },
        },
      ],
    }),
    { status: 200 },
  );

  mockFetch(mockResponse);

  try {
    await assertRejects(
      async () => {
        await generateTagSuggestions('Test Recipe', [], [], []);
      },
      Error,
      'Failed to parse OpenAI JSON response',
    );
  } finally {
    restoreFetch();
  }
});

// =====================================================================
// TEST: Missing Content in Response
// =====================================================================

Deno.test('generateTagSuggestions - should handle missing content in response', async () => {
  Deno.env.set('OPENAI_API_KEY', 'test-key');

  const mockResponse = new Response(
    JSON.stringify({
      choices: [],
    }),
    { status: 200 },
  );

  mockFetch(mockResponse);

  try {
    await assertRejects(
      async () => {
        await generateTagSuggestions('Test Recipe', [], [], []);
      },
      Error,
      'No content in OpenAI response',
    );
  } finally {
    restoreFetch();
  }
});

// =====================================================================
// TEST: Empty Ingredients and Steps
// =====================================================================

Deno.test(
  'generateTagSuggestions - should handle recipes with no ingredients or steps',
  async () => {
    Deno.env.set('OPENAI_API_KEY', 'test-key');

    const mockResponse = new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                tags: [
                  { name: 'simple', confidence: 0.5, reason: 'Minimal recipe' },
                  { name: 'quick', confidence: 0.45, reason: 'No steps' },
                  { name: 'basic', confidence: 0.4, reason: 'No ingredients' },
                ],
              }),
            },
          },
        ],
      }),
      { status: 200 },
    );

    mockFetch(mockResponse);

    try {
      const suggestions = await generateTagSuggestions(
        'Simple Recipe',
        [], // No ingredients
        [], // No steps
        [],
      );

      assertEquals(suggestions.length, 3);
      assertEquals(suggestions[0].name, 'simple');
    } finally {
      restoreFetch();
    }
  },
);

// =====================================================================
// TEST: Validation - Wrong Number of Tags
// =====================================================================

Deno.test('generateTagSuggestions - should reject response with wrong number of tags', async () => {
  Deno.env.set('OPENAI_API_KEY', 'test-key');

  const mockResponse = new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: [
                { name: 'only-one-tag', confidence: 0.95 },
                // Missing 2 more tags
              ],
            }),
          },
        },
      ],
    }),
    { status: 200 },
  );

  mockFetch(mockResponse);

  try {
    await assertRejects(
      async () => {
        await generateTagSuggestions('Test Recipe', [], [], []);
      },
      Error, // Zod validation error
    );
  } finally {
    restoreFetch();
  }
});

// =====================================================================
// TEST: Validation - Tag Name Too Long
// =====================================================================

Deno.test('generateTagSuggestions - should reject tags longer than 20 characters', async () => {
  Deno.env.set('OPENAI_API_KEY', 'test-key');

  const mockResponse = new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: [
                {
                  name: 'this-tag-name-is-way-too-long-and-exceeds-twenty-characters',
                  confidence: 0.95,
                },
                { name: 'valid-tag', confidence: 0.9 },
                { name: 'another-valid-tag', confidence: 0.85 },
              ],
            }),
          },
        },
      ],
    }),
    { status: 200 },
  );

  mockFetch(mockResponse);

  try {
    await assertRejects(
      async () => {
        await generateTagSuggestions('Test Recipe', [], [], []);
      },
      Error, // Zod validation error
    );
  } finally {
    restoreFetch();
  }
});
