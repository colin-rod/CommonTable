import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

import { parseHtmlFallback } from './html-fallback.ts';

Deno.test('parseHtmlFallback - extracts title from h1', () => {
  const html = `
    <html>
      <head><title>Page Title</title></head>
      <body>
        <h1>Chocolate Chip Cookies</h1>
        <p>Some content</p>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.title, 'Chocolate Chip Cookies');
});

Deno.test('parseHtmlFallback - extracts title from <title> tag if no h1', () => {
  const html = `
    <html>
      <head><title>Banana Bread Recipe</title></head>
      <body><p>Content</p></body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.title, 'Banana Bread Recipe');
});

Deno.test('parseHtmlFallback - extracts ingredients from ul near "ingredients" heading', () => {
  const html = `
    <html>
      <body>
        <h2>Ingredients</h2>
        <ul>
          <li>2 cups flour</li>
          <li>1 cup sugar</li>
          <li>3 eggs</li>
        </ul>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.ingredients.length, 3);
  assertEquals(result.ingredients[0], '2 cups flour');
  assertEquals(result.ingredients[1], '1 cup sugar');
  assertEquals(result.ingredients[2], '3 eggs');
});

Deno.test('parseHtmlFallback - extracts ingredients from ol', () => {
  const html = `
    <html>
      <body>
        <h3>What You Need</h3>
        <ol>
          <li>flour</li>
          <li>sugar</li>
        </ol>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.ingredients.length, 2);
});

Deno.test('parseHtmlFallback - extracts steps from ol near "instructions" heading', () => {
  const html = `
    <html>
      <body>
        <h2>Instructions</h2>
        <ol>
          <li>Preheat oven to 350F</li>
          <li>Mix dry ingredients</li>
          <li>Add wet ingredients</li>
        </ol>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.steps.length, 3);
  assertEquals(result.steps[0], 'Preheat oven to 350F');
  assertEquals(result.steps[1], 'Mix dry ingredients');
  assertEquals(result.steps[2], 'Add wet ingredients');
});

Deno.test('parseHtmlFallback - handles "Directions" heading', () => {
  const html = `
    <html>
      <body>
        <h3>Directions</h3>
        <ol>
          <li>Step 1</li>
          <li>Step 2</li>
        </ol>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.steps.length, 2);
});

Deno.test('parseHtmlFallback - handles "Steps" heading', () => {
  const html = `
    <html>
      <body>
        <h2>Steps</h2>
        <ul>
          <li>Do this</li>
          <li>Then that</li>
        </ul>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.steps.length, 2);
});

Deno.test('parseHtmlFallback - extracts servings from "serves X" pattern', () => {
  const html = `
    <html>
      <body>
        <p>This recipe serves 6 people</p>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.servings, 6);
});

Deno.test('parseHtmlFallback - extracts servings from "X servings" pattern', () => {
  const html = `
    <html>
      <body>
        <div>Makes 4 servings</div>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.servings, 4);
});

Deno.test('parseHtmlFallback - extracts prep time from "prep time: X min" pattern', () => {
  const html = `
    <html>
      <body>
        <p>Prep time: 15 minutes</p>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.prep_time_minutes, 15);
});

Deno.test('parseHtmlFallback - extracts prep time from "X min prep" pattern', () => {
  const html = `
    <html>
      <body>
        <span>20 min prep</span>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.prep_time_minutes, 20);
});

Deno.test('parseHtmlFallback - extracts cook time from "cook time: X min" pattern', () => {
  const html = `
    <html>
      <body>
        <p>Cook time: 30 minutes</p>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.cook_time_minutes, 30);
});

Deno.test('parseHtmlFallback - extracts cook time in hours', () => {
  const html = `
    <html>
      <body>
        <p>Cook time: 2 hours</p>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.cook_time_minutes, 120);
});

Deno.test('parseHtmlFallback - extracts image from first img tag', () => {
  const html = `
    <html>
      <body>
        <img src="https://example.com/recipe.jpg" alt="Recipe photo">
        <img src="https://example.com/other.jpg">
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.image_url, 'https://example.com/recipe.jpg');
});

Deno.test('parseHtmlFallback - prioritizes images with "recipe" in src', () => {
  const html = `
    <html>
      <body>
        <img src="https://example.com/logo.jpg">
        <img src="https://example.com/recipe-photo.jpg">
        <img src="https://example.com/ad.jpg">
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.image_url, 'https://example.com/recipe-photo.jpg');
});

Deno.test('parseHtmlFallback - returns partial data when some fields missing', () => {
  const html = `
    <html>
      <body>
        <h1>Simple Recipe</h1>
        <p>Just a title, no other data</p>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.title, 'Simple Recipe');
  assertEquals(result.ingredients, []);
  assertEquals(result.steps, []);
  assertEquals(result.servings, undefined);
  assertEquals(result.prep_time_minutes, undefined);
  assertEquals(result.cook_time_minutes, undefined);
});

Deno.test('parseHtmlFallback - handles empty HTML gracefully', () => {
  const html = '<html><body></body></html>';

  const result = parseHtmlFallback(html);
  assertEquals(result.title, undefined);
  assertEquals(result.ingredients, []);
  assertEquals(result.steps, []);
});

Deno.test('parseHtmlFallback - strips HTML tags from list items', () => {
  const html = `
    <html>
      <body>
        <h2>Ingredients</h2>
        <ul>
          <li><strong>2 cups</strong> flour</li>
          <li><em>1 tsp</em> salt</li>
        </ul>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.ingredients[0], '2 cups flour');
  assertEquals(result.ingredients[1], '1 tsp salt');
});

Deno.test('parseHtmlFallback - handles case-insensitive headings', () => {
  const html = `
    <html>
      <body>
        <h2>INGREDIENTS</h2>
        <ul><li>flour</li></ul>
        <h2>INSTRUCTIONS</h2>
        <ol><li>Mix</li></ol>
      </body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.ingredients.length, 1);
  assertEquals(result.steps.length, 1);
});

Deno.test('parseHtmlFallback - extracts description from meta tag', () => {
  const html = `
    <html>
      <head>
        <meta name="description" content="A delicious chocolate cake recipe">
      </head>
      <body></body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.description, 'A delicious chocolate cake recipe');
});

Deno.test('parseHtmlFallback - extracts description from og:description', () => {
  const html = `
    <html>
      <head>
        <meta property="og:description" content="Best pasta recipe ever">
      </head>
      <body></body>
    </html>
  `;

  const result = parseHtmlFallback(html);
  assertEquals(result.description, 'Best pasta recipe ever');
});

Deno.test('parseHtmlFallback - handles malformed HTML', () => {
  const html = `
    <html>
      <body>
        <h1>Title
        <ul>
          <li>Item 1
          <li>Item 2
      </body>
  `;

  const result = parseHtmlFallback(html);
  assertExists(result);
  assertEquals(result.title, 'Title');
});
