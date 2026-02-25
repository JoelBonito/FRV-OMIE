#!/bin/bash
# Deploy all FRV-OMIE Edge Functions to Supabase
# Usage: ./scripts/deploy-edge-functions.sh

set -e

echo "=== FRV-OMIE Edge Functions Deploy ==="
echo ""

FUNCTIONS=("omie-proxy" "omie-sync" "omie-webhook")

for fn in "${FUNCTIONS[@]}"; do
  echo "Deploying $fn..."
  supabase functions deploy "$fn"
  echo "  -> $fn deployed successfully"
  echo ""
done

echo "=== All functions deployed ==="
echo ""
echo "Verify at: https://supabase.com/dashboard/project/gcicvqnkawvgyyfiacdg/functions"
echo ""
echo "Post-deploy checklist:"
echo "  1. Test sync: Go to Sincronizacao page -> Sincronizar Agora"
echo "  2. Verify webhook URL in Configuracoes -> Omie API tab"
echo "  3. Register webhook in Omie admin panel"
echo "  4. Set webhook_secret in Configuracoes if needed"
echo "  5. For pg_cron (Pro+), run in SQL Editor:"
echo "     ALTER DATABASE postgres SET app.settings.supabase_url = 'https://gcicvqnkawvgyyfiacdg.supabase.co';"
echo "     ALTER DATABASE postgres SET app.settings.service_role_key = '<service-role-key>';"
