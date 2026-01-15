/**
 * CORS headers for Edge Functions
 *
 * Allows cross-origin requests from any origin during development.
 * In production, consider restricting to specific origins.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

/**
 * Helper to create a CORS preflight response
 */
export function corsPreflightResponse(): Response {
  return new Response('ok', {
    headers: corsHeaders,
    status: 204,
  });
}

/**
 * Helper to add CORS headers to any response
 */
export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
