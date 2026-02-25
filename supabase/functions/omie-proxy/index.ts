/**
 * Edge Function: omie-proxy
 *
 * Generic proxy for Omie API calls.
 * Frontend calls this function, which adds credentials server-side.
 *
 * POST /functions/v1/omie-proxy
 * Body: { endpoint: "geral/clientes", call: "ListarClientes", params: { pagina: 1 } }
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { omieCall } from '../_shared/omie-client.ts'
import { getOmieCredentials, logSync } from '../_shared/supabase-admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, call, params } = await req.json() as {
      endpoint: string
      call: string
      params: Record<string, unknown>
    }

    if (!endpoint || !call) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint or call parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch credentials from DB (server-side only)
    const credentials = await getOmieCredentials()

    // Call Omie API
    const result = await omieCall(credentials, { endpoint, call, params: params || {} })

    // Log the call
    await logSync({
      tipo: 'api_call',
      endpoint: `/${endpoint}/`,
      call_method: call,
      status: result.status,
      duracao_ms: result.duration_ms,
      erros: result.error ? { message: result.error } : null,
      payload_resumo: {
        total_registros: (result.data as Record<string, unknown>)?.total_de_registros,
      },
    })

    return new Response(
      JSON.stringify(result.data),
      {
        status: result.status === 'success' ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
