---
story: "8.5"
epic: "Epic 8: Integração Omie"
status: done
agent: backend-specialist
tool: codex
depends_on: []
unlocks: ["8.7"]
priority: P0
spec_hash: "0e328e562e85"
---

# Story 8.5: Webhook listener (Edge Function para eventos real-time)

## Contexto do Epic
Integração Omie

## Requisito
Implementar uma Edge Function `omie-webhook` que atue como listener para eventos real-time do Omie ERP. A função deve processar atualizações de Clientes (Cadastro.Cliente) e Títulos (Financas.ContaReceber), mantendo o banco Supabase sincronizado sem depender apenas do cron quinzenal.

## Criterios de Aceite
1. [x] Função `omie-webhook` estruturada em TypeScript (Deno/Supabase).
2. [x] Validação de autenticidade do webhook via `endpoint_token` ou `x-webhook-secret`.
3. [x] Mapeamento e processamento correto de tópicos `Cadastro.Cliente.*` (Incluido, Alterado, Excluido).
4. [x] Mapeamento e processamento correto de tópicos `Financas.ContaReceber.*` (Incluido, Alterado, Excluido).
5. [x] Upsert automático na tabela `clientes` (incluindo resolução de tipo e vendedor).
6. [x] Upsert automático na tabela `vendas` (mapeando status Omie para status faturado/pendente/cancelado).
7. [x] Registro de logs detalhados na tabela `sync_logs` para cada evento processado.
8. [x] Tratamento de soft-delete (status 'inativo' para clientes e 'cancelado' para vendas).

## Contexto de Dependencias
> Sem dependencias anteriores

## Agent Workspace
> Notas do agente durante implementacao
