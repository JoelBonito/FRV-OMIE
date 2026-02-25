---
story: "8.6"
epic: "Epic 8: Integração Omie"
status: done
agent: project-planner
tool: claude_code
depends_on: []
unlocks: ["8.7"]
priority: P0
spec_hash: "c0b8876185f6"
---

# Story 8.6: pg_cron sync incremental (6h)

## Contexto do Epic
Integração Omie

## Requisito
Configurar o `pg_cron` no Supabase para disparar a sincronização automática de dados do Omie a cada 6 horas. Isso garante que o dashboard esteja sempre atualizado sem intervenção manual.

## Criterios de Aceite
1. [x] Extensões `pg_cron` e `pg_net` habilitadas no banco.
2. [x] Função `frv_omie.trigger_scheduled_sync()` implementada para chamar a Edge Function via HTTP.
3. [x] Job `omie-sync-6h` agendado no cron (`0 */6 * * *`).
4. [ ] Variáveis `app.settings.supabase_url` e `app.settings.service_role_key` configuradas no banco de dados (Aguardando credenciais do usuário).
5. [x] Log de execução automática estruturado na tabela `sync_logs`.

## Agent Workspace
O cron job já está agendado e ativo no banco de dados. Para que o disparo funcione, o usuário deve executar o seguinte comando no SQL Editor do Supabase:

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://gcicvqnkawvgyyfiacdg.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'SUA_SERVICE_ROLE_KEY';
```

## Contexto de Dependencias
> Sem dependencias anteriores

## Agent Workspace
> Notas do agente durante implementacao
