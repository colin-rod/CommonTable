import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

import { parseJsonLd } from './jsonld.ts';

Deno.test('parseJsonLd - extracts recipe from valid JSON-LD', () => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": "Pasta Carbonara",
        "description": "Classic Italian pasta dish",
        "recipeYield": "4 servings",
        "prepTime": "PT10M",
        "cookTime": "PT20M",
        "recipeIngredient": [
          "400g spaghetti",
          "4 eggs",
          "1 cup parmesan cheese",
          "200g pancetta"
        ],
        "recipeInstructions": [
          {
            "@type": "HowToStep",
            "text": "Boil pasta according to package directions."
          },
          {
            "@type": "HowToStep",
            "text": "Mix eggs and cheese in a bowl."
          },
          {
            "@type": "HowToStep",
            "text": "Fry pancetta until crispy."
          }
        ],
        "image": "https://example.com/carbonara.jpg",
        "keywords": "italian, pasta, dinner"
      }
      </script>
    </head>
    <body></body>
    </html>
  `;

  const result = parseJsonLd(html);

  assertExists(result);
  assertEquals(result!.title, 'Pasta Carbonara');
  assertEquals(result!.description, 'Classic Italian pasta dish');
  assertEquals(result!.servings, 4);
  assertEquals(result!.prep_time_minutes, 10);
  assertEquals(result!.cook_time_minutes, 20);
  assertEquals(result!.ingredients.length, 4);
  assertEquals(result!.ingredients[0], '400g spaghetti');
  assertEquals(result!.steps.length, 3);
  assertEquals(result!.steps[0], 'Boil pasta according to package directions.');
  assertEquals(result!.image_url, 'https://example.com/carbonara.jpg');
  assertEquals(result!.tags, ['italian', 'pasta', 'dinner']);
});

Deno.test('parseJsonLd - handles @graph structure', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage"
        },
        {
          "@type": "Recipe",
          "name": "Chocolate Cake",
          "recipeIngredient": ["flour", "sugar", "cocoa"],
          "recipeInstructions": "Mix and bake."
        }
      ]
    }
    </script>
  `;

  const result = parseJsonLd(html);

  assertExists(result);
  assertEquals(result!.title, 'Chocolate Cake');
  assertEquals(result!.ingredients.length, 3);
});

Deno.test('parseJsonLd - parses ISO 8601 durations', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@type": "Recipe",
      "name": "Quick Meal",
      "prepTime": "PT15M",
      "cookTime": "PT1H30M"
    }
    </script>
  `;

  const result = parseJsonLd(html);

  assertExists(result);
  assertEquals(result!.prep_time_minutes, 15);
  assertEquals(result!.cook_time_minutes, 90);
});

Deno.test('parseJsonLd - handles various duration formats', () => {
  const testCases = [
    { input: 'PT30M', expected: 30 },
    { input: 'PT1H', expected: 60 },
    { input: 'PT1H15M', expected: 75 },
    { input: 'PT2H30M', expected: 150 },
    { input: 'P0DT0H45M0S', expected: 45 },
  ];

  testCases.forEach(({ input, expected }) => {
    const html = `
      <script type="application/ld+json">
      { "@type": "Recipe", "name": "Test", "prepTime": "${input}" }
      </script>
    `;

    const result = parseJsonLd(html);
    assertEquals(result!.prep_time_minutes, expected, `Failed for ${input}`);
  });
});

Deno.test('parseJsonLd - extracts servings from various formats', () => {
  const testCases = [
    { input: '4', expected: 4 },
    { input: '4 servings', expected: 4 },
    { input: 'Serves 6', expected: 6 },
    { input: '4-6 servings', expected: 4 },
    { input: 4, expected: 4 },
  ];

  testCases.forEach(({ input, expected }) => {
    const html = `
      <script type="application/ld+json">
      { "@type": "Recipe", "name": "Test", "recipeYield": ${typeof input === 'string' ? `"${input}"` : input} }
      </script>
    `;

    const result = parseJsonLd(html);
    assertEquals(result!.servings, expected, `Failed for ${input}`);
  });
});

Deno.test('parseJsonLd - handles image as string', () => {
  const html = `
    <script type="application/ld+json">
    { "@type": "Recipe", "name": "Test", "image": "https://example.com/image.jpg" }
    </script>
  `;

  const result = parseJsonLd(html);
  assertEquals(result!.image_url, 'https://example.com/image.jpg');
});

Deno.test('parseJsonLd - handles image as ImageObject', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@type": "Recipe",
      "name": "Test",
      "image": {
        "@type": "ImageObject",
        "url": "https://example.com/image.jpg"
      }
    }
    </script>
  `;

  const result = parseJsonLd(html);
  assertEquals(result!.image_url, 'https://example.com/image.jpg');
});

Deno.test('parseJsonLd - handles image as array', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@type": "Recipe",
      "name": "Test",
      "image": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ]
    }
    </script>
  `;

  const result = parseJsonLd(html);
  assertEquals(result!.image_url, 'https://example.com/image1.jpg');
});

Deno.test('parseJsonLd - handles recipeInstructions as array of strings', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@type": "Recipe",
      "name": "Test",
      "recipeInstructions": [
        "Step 1",
        "Step 2",
        "Step 3"
      ]
    }
    </script>
  `;

  const result = parseJsonLd(html);
  assertEquals(result!.steps.length, 3);
  assertEquals(result!.steps[0], 'Step 1');
});

Deno.test('parseJsonLd - handles recipeInstructions as single string', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@type": "Recipe",
      "name": "Test",
      "recipeInstructions": "Mix everything and bake at 350F for 30 minutes."
    }
    </script>
  `;

  const result = parseJsonLd(html);
  assertEquals(result!.steps.length, 1);
  assertEquals(result!.steps[0], 'Mix everything and bake at 350F for 30 minutes.');
});

Deno.test('parseJsonLd - extracts tags from keywords string', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@type": "Recipe",
      "name": "Test",
      "keywords": "italian, pasta, dinner, vegetarian"
    }
    </script>
  `;

  const result = parseJsonLd(html);
  assertEquals(result!.tags, ['italian', 'pasta', 'dinner', 'vegetarian']);
});

Deno.test('parseJsonLd - extracts tags from keywords array', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@type": "Recipe",
      "name": "Test",
      "keywords": ["italian", "pasta", "dinner"]
    }
    </script>
  `;

  const result = parseJsonLd(html);
  assertEquals(result!.tags, ['italian', 'pasta', 'dinner']);
});

Deno.test('parseJsonLd - combines keywords and recipeCategory', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@type": "Recipe",
      "name": "Test",
      "keywords": "italian, pasta",
      "recipeCategory": "Dinner"
    }
    </script>
  `;

  const result = parseJsonLd(html);
  assertEquals(result!.tags.includes('italian'), true);
  assertEquals(result!.tags.includes('pasta'), true);
  assertEquals(result!.tags.includes('Dinner'), true);
});

Deno.test('parseJsonLd - returns null when no JSON-LD found', () => {
  const html = '<html><body>No JSON-LD here</body></html>';

  const result = parseJsonLd(html);
  assertEquals(result, null);
});

Deno.test('parseJsonLd - returns null when JSON-LD exists but no Recipe', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@type": "WebPage",
      "name": "Not a recipe"
    }
    </script>
  `;

  const result = parseJsonLd(html);
  assertEquals(result, null);
});

Deno.test('parseJsonLd - handles malformed JSON gracefully', () => {
  const html = `
    <script type="application/ld+json">
    { "@type": "Recipe", "name": "Test", invalid json here }
    </script>
  `;

  const result = parseJsonLd(html);
  assertEquals(result, null);
});

Deno.test('parseJsonLd - handles multiple JSON-LD scripts', () => {
  const html = `
    <script type="application/ld+json">
    { "@type": "WebPage" }
    </script>
    <script type="application/ld+json">
    { "@type": "Recipe", "name": "Found Me" }
    </script>
  `;

  const result = parseJsonLd(html);
  assertExists(result);
  assertEquals(result!.title, 'Found Me');
});

Deno.test('parseJsonLd - returns partial data when some fields missing', () => {
  const html = `
    <script type="application/ld+json">
    {
      "@type": "Recipe",
      "name": "Minimal Recipe"
    }
    </script>
  `;

  const result = parseJsonLd(html);
  assertExists(result);
  assertEquals(result!.title, 'Minimal Recipe');
  assertEquals(result!.description, undefined);
  assertEquals(result!.servings, undefined);
  assertEquals(result!.ingredients, []);
  assertEquals(result!.steps, []);
});
