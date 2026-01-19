# Recipe Import Edge Function

Supabase Edge Function that fetches and parses recipe data from URLs.

## Overview

This function accepts a recipe URL, fetches the HTML, and attempts to parse it into CommonTable's recipe format. It tries JSON-LD (schema.org Recipe) parsing first, then falls back to HTML pattern matching if JSON-LD is not available.

## Endpoint

```
POST https://lrelbxzvndbmfpxhgosd.supabase.co/functions/v1/recipe-import
```

## Authentication

Requires a valid Supabase user token in the Authorization header:

```
Authorization: Bearer <user-token>
```

## Request Format

```json
{
  "url": "https://www.allrecipes.com/recipe/12345/recipe-name/"
}
```

### Constraints

- URL must be HTTP or HTTPS
- URL max length: 2000 characters
- Cannot fetch from localhost or private IP addresses (SSRF protection)
- Response must be HTML content type
- Response size limit: 1MB
- Request timeout: 10 seconds

## Response Format

### Success (200)

```json
{
  "data": {
    "preview": {
      "title": "Pasta Carbonara",
      "description": "Classic Italian pasta dish",
      "servings": 4,
      "prep_time_minutes": 10,
      "cook_time_minutes": 20,
      "ingredients": [
        {
          "name": "spaghetti",
          "quantity": 400,
          "unit": "g"
        },
        {
          "name": "eggs",
          "quantity": 4
        },
        {
          "name": "parmesan cheese",
          "quantity": 1,
          "unit": "cup",
          "notes": "freshly grated"
        }
      ],
      "steps": [
        {
          "position": 1,
          "text": "Boil pasta according to package directions."
        },
        {
          "position": 2,
          "text": "Mix eggs and cheese in a bowl."
        }
      ],
      "image_url": "https://example.com/recipe-image.jpg",
      "tags": ["italian", "pasta", "dinner"]
    },
    "validation_errors": [],
    "source": {
      "url": "https://example.com/recipe",
      "parsed_via": "jsonld",
      "fetched_at": "2026-01-19T10:30:00Z"
    }
  }
}
```

### Partial Success (200 with validation errors)

When required fields are missing, the function still returns a 200 with whatever data was parsed, plus validation errors:

```json
{
  "data": {
    "preview": {
      "title": "Recipe Title",
      "ingredients": [],
      "steps": []
    },
    "validation_errors": [
      {
        "field": "ingredients",
        "message": "At least one ingredient is required"
      },
      {
        "field": "steps",
        "message": "At least one step is required"
      }
    ],
    "source": {
      "url": "https://example.com/recipe",
      "parsed_via": "html-fallback",
      "fetched_at": "2026-01-19T10:30:00Z"
    }
  }
}
```

### Error Responses

#### 400 - Validation Error

```json
{
  "error": "Invalid request body",
  "code": "VALIDATION_ERROR",
  "metadata": {
    "errors": [
      {
        "path": ["url"],
        "message": "Must be a valid URL"
      }
    ]
  }
}
```

#### 401 - Unauthorized

```json
{
  "error": "Invalid or expired token",
  "code": "UNAUTHORIZED"
}
```

#### 413 - Payload Too Large

```json
{
  "error": "Response too large (max 1MB)",
  "code": "PAYLOAD_TOO_LARGE"
}
```

#### 500 - Fetch Error

```json
{
  "error": "Failed to fetch URL (status: 404)",
  "code": "FETCH_ERROR",
  "metadata": {
    "status": 404
  }
}
```

#### 504 - Timeout

```json
{
  "error": "Request timed out after 10 seconds",
  "code": "TIMEOUT"
}
```

## Parsing Strategy

### 1. JSON-LD Parsing (First Attempt)

The function looks for `<script type="application/ld+json">` tags containing schema.org Recipe objects.

**Supported fields:**

- `name` → `title`
- `description` → `description`
- `recipeYield` → `servings` (parses "4", "4 servings", "Serves 4", "4-6")
- `prepTime` → `prep_time_minutes` (parses ISO 8601: PT30M, PT1H15M)
- `cookTime` → `cook_time_minutes` (parses ISO 8601)
- `recipeIngredient` → `ingredients[]` (array of strings)
- `recipeInstructions` → `steps[]` (array of strings or HowToStep objects)
- `image` → `image_url` (string, ImageObject, or array)
- `keywords`, `recipeCategory` → `tags[]`

**Handles:**

- Nested `@graph` structures
- Multiple JSON-LD script tags
- Various image formats (string, ImageObject with url, arrays)
- Mixed instruction formats (strings, HowToStep objects)

### 2. HTML Fallback Parsing

If JSON-LD is not found or invalid, the function uses regex patterns to extract data:

**Extraction patterns:**

- **Title**: `<h1>` or `<title>` tag
- **Description**: `<meta name="description">` or `<meta property="og:description">`
- **Ingredients**: `<ul>` or `<ol>` near heading containing "ingredient"
- **Steps**: `<ol>` or `<ul>` near heading containing "instruction|direction|step"
- **Servings**: Text matching "serves X" or "X servings"
- **Prep Time**: Text matching "prep time: X min" or "X min prep"
- **Cook Time**: Text matching "cook time: X min" or "X hours"
- **Image**: First `<img>` with src containing "recipe" or in `<article>` tag

### 3. Normalization

All parsed data is normalized to CommonTable format:

**Ingredient parsing:**

- "2 cups flour" → `{name: 'flour', quantity: 2, unit: 'cup'}`
- "1/2 tsp salt" → `{name: 'salt', quantity: 0.5, unit: 'tsp'}`
- "2-3 eggs" → `{name: 'eggs', quantity: 2}` (uses first number in range)
- "1 lb chicken (boneless)" → `{name: 'chicken', quantity: 1, unit: 'lb', notes: 'boneless'}`

**Unit normalization:**

- "cups" → "cup"
- "tablespoons" → "tbsp"
- "teaspoons" → "tsp"

**Field truncation:**

- Title: 200 chars
- Description: 2000 chars
- Tags: Max 20, each max 50 chars
- Steps: 2000 chars each

**Validation:**

- Missing title → validation error
- Empty ingredients → validation error
- Empty steps → validation error

## Testing

### Manual Testing with curl

```bash
# Test with JSON-LD recipe URL
curl -X POST https://lrelbxzvndbmfpxhgosd.supabase.co/functions/v1/recipe-import \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.allrecipes.com/recipe/24074/alysias-basic-meat-lasagna/"}'

# Test with invalid URL
curl -X POST https://lrelbxzvndbmfpxhgosd.supabase.co/functions/v1/recipe-import \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{"url": "not-a-url"}'

# Test with missing auth
curl -X POST https://lrelbxzvndbmfpxhgosd.supabase.co/functions/v1/recipe-import \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/recipe"}'
```

### Unit Tests

Run Deno tests locally:

```bash
cd supabase/functions/recipe-import/parsers
deno test jsonld.test.ts
deno test html-fallback.test.ts
deno test normalizer.test.ts
```

**Test coverage:**

- JSON-LD parser: 22 test cases
- HTML fallback parser: 26 test cases
- Normalizer: 26 test cases
- **Total: 74 test cases**

### View Logs

```bash
supabase functions logs recipe-import --follow
```

## File Structure

```
supabase/functions/recipe-import/
├── index.ts                      # Main handler
├── schema.ts                     # Zod validation schemas
├── README.md                     # This file
├── parsers/
│   ├── jsonld.ts                # JSON-LD parser
│   ├── jsonld.test.ts           # JSON-LD tests
│   ├── html-fallback.ts         # HTML pattern parser
│   ├── html-fallback.test.ts    # HTML fallback tests
│   ├── normalizer.ts            # Data normalization
│   └── normalizer.test.ts       # Normalizer tests
```

## Security Considerations

### SSRF Protection

The function rejects URLs pointing to:

- localhost
- 127.0.0.1
- Private IP ranges (192.168.x.x, 10.x.x.x, 172.16.x.x)
- IPv6 localhost (::1)

### Rate Limiting

No rate limiting is implemented in this function. Consider adding:

- Per-user rate limits (via Supabase Edge Functions rate limiting)
- Caching for frequently imported URLs
- Monitoring for abuse patterns

### Content Validation

- Only allows HTTP and HTTPS protocols
- Validates Content-Type is HTML
- Limits response size to 1MB
- 10-second timeout prevents hanging requests

## Known Limitations

### Not Supported in MVP

- Recipe site authentication (only public recipes)
- Image download/upload (returns URL only, client handles upload)
- Caching of parsed results
- Site-specific parsing rules (AllRecipes, NYT Cooking, etc.)
- Bulk URL import
- Import history tracking

### Edge Cases

- Some sites block automated requests (User-Agent filtering)
- Sites with heavy JavaScript rendering may not work (no browser/JS execution)
- Paywalled recipes cannot be accessed
- Some recipe formats may not parse correctly (relies on common patterns)

## Next Steps (Issue 3.3)

To complete the recipe import flow:

1. **Client UI** (web app)
   - URL input form
   - Preview display with validation errors
   - Image preview (from returned URL)
   - Edit fields before saving
   - Save button to create recipe

2. **Image Handling** (client-side)
   - Fetch image from returned URL
   - Upload to Supabase Storage via RecipeImageService
   - Link to created recipe

3. **Recipe Creation**
   - Call RecipeService.create() with normalized data
   - Handle validation errors
   - Redirect to recipe detail page

## Deployment

```bash
# Deploy to development
pnpm supabase functions deploy recipe-import

# Deploy to production
supabase link --project-ref <production-ref>
pnpm supabase functions deploy recipe-import --project-ref <production-ref>
```

## Support

For issues or questions:

- View function logs: `supabase functions logs recipe-import`
- Check deployment: https://supabase.com/dashboard/project/lrelbxzvndbmfpxhgosd/functions
- Refer to plan: `/Users/colinrodrigues/.claude/plans/dazzling-sleeping-key.md`
