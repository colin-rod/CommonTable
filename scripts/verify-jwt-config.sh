#!/usr/bin/env bash
#
# verify-jwt-config.sh
#
# Verifies that JWT verification is disabled for specified Edge Functions.
# This script queries the Supabase Management API and checks the verify_jwt setting.
#
# Usage:
#   ./scripts/verify-jwt-config.sh <function-name> [function-name...]
#
# Environment variables required:
#   SUPABASE_ACCESS_TOKEN - Supabase Management API access token
#   SUPABASE_PROJECT_ID   - Supabase project reference ID
#
# Exit codes:
#   0 - All functions have JWT verification disabled
#   1 - One or more functions have JWT verification enabled or check failed
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check required environment variables
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo -e "${RED}Error: SUPABASE_ACCESS_TOKEN environment variable is required${NC}" >&2
  exit 1
fi

if [ -z "${SUPABASE_PROJECT_ID:-}" ]; then
  echo -e "${RED}Error: SUPABASE_PROJECT_ID environment variable is required${NC}" >&2
  exit 1
fi

# Check if function names provided
if [ $# -eq 0 ]; then
  echo -e "${RED}Error: No function names provided${NC}" >&2
  echo "Usage: $0 <function-name> [function-name...]" >&2
  exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${RED}Error: jq is not installed. Please install jq to use this script.${NC}" >&2
  exit 1
fi

echo "Verifying JWT configuration for Edge Functions..."
echo ""

ALL_VERIFIED=true

# Iterate through each function name
for FUNCTION_NAME in "$@"; do
  echo "Checking function: $FUNCTION_NAME"

  # Call Supabase Management API to get function config
  HTTP_STATUS=$(curl -s -o /tmp/jwt_verify_$$.json -w "%{http_code}" \
    -X GET \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_ID/functions/$FUNCTION_NAME")

  if [ "$HTTP_STATUS" = "200" ]; then
    # Extract verify_jwt field from response
    VERIFY_JWT=$(jq -r '.verify_jwt // "not_found"' /tmp/jwt_verify_$$.json)

    if [ "$VERIFY_JWT" = "false" ]; then
      echo -e "${GREEN}✅ JWT verification is disabled for $FUNCTION_NAME${NC}"
    elif [ "$VERIFY_JWT" = "true" ]; then
      echo -e "${RED}❌ JWT verification is ENABLED for $FUNCTION_NAME (should be disabled)${NC}"
      ALL_VERIFIED=false
    else
      echo -e "${YELLOW}⚠️  Could not determine JWT verification status for $FUNCTION_NAME${NC}"
      echo "Response: $(cat /tmp/jwt_verify_$$.json)"
      ALL_VERIFIED=false
    fi
  else
    echo -e "${RED}❌ Failed to fetch configuration for $FUNCTION_NAME (HTTP $HTTP_STATUS)${NC}"
    echo "Response: $(cat /tmp/jwt_verify_$$.json 2>/dev/null || echo 'No response body')"
    ALL_VERIFIED=false
  fi

  # Clean up temp file
  rm -f /tmp/jwt_verify_$$.json
  echo ""
done

# Summary
if [ "$ALL_VERIFIED" = true ]; then
  echo -e "${GREEN}✅ All functions verified successfully: JWT verification is disabled${NC}"
  exit 0
else
  echo -e "${RED}❌ Verification failed for one or more functions${NC}"
  exit 1
fi
