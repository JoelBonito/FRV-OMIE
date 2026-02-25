# CLAUDE.md - Instruções para Claude Code

> Este arquivo é carregado automaticamente pelo Claude Code em cada conversa.
> **Master para Claude Code.** Base compartilhada: `.agents/INSTRUCTIONS.md` (sem regras Claude-specific).

## Sobre Este Projeto

**Inove AI Framework** é um kit de desenvolvimento AI com sistema multi-agent (Claude Code + Codex CLI + Antigravity/Gemini) que fornece:

- **22 Agentes Especializados** para diferentes domínios
- **42 Skills Modulares** carregadas sob demanda
- **25 Workflows** (slash commands) para processos estruturados
- **Sistema Multi-Agent** com sincronização de locks e ownership

---

## Estrutura do Framework

```
.agents/
├── agents/           # 22 agentes especializados
├── skills/           # 42 módulos de conhecimento
├── workflows/        # 25 workflows (slash commands)
├── scripts/          # Automação Python
├── config/           # Configurações por plataforma
└── ARCHITECTURE.md   # Documentação técnica
```

---

## Regra Zero — NUNCA Editar Sem Aprovação (ABSOLUTO)

> **Esta regra prevalece sobre TODAS as outras. Sem exceções.**

### Proibições Absolutas

1. **NUNCA usar Edit, Write ou qualquer ferramenta que modifique código sem aprovação EXPLÍCITA do usuário.**
2. **"Analisar" ≠ "Editar".** Quando o usuário pede para analisar, investigar, verificar ou olhar — a resposta é um DIAGNÓSTICO TEXTUAL. Não tocar em nenhum arquivo.
3. **"Corrigir" ou "Mudar" ≠ permissão automática.** Mesmo quando o usuário descreve um problema, o fluxo obrigatório é: diagnosticar → propor → esperar aprovação → só então editar.

### Fluxo Obrigatório para QUALQUER Modificação de Código

```
1. LER     → Ler os arquivos relevantes (Read/Glob/Grep)
2. ANALISAR → Entender o problema e o contexto
3. PROPOR   → Apresentar diagnóstico + proposta de mudança ao usuário
4. ESPERAR  → NÃO tocar em código. Aguardar o usuário dizer "aplica", "faz", "pode editar", "OK"
5. EDITAR   → Só agora usar Edit/Write, seguindo STEP 0 + STEP 1
```

### Gatilhos de Aprovação (palavras que LIBERAM edição)

- "aplica", "faz", "pode editar", "sim", "OK", "vai", "manda", "prossiga com a edição"

### Gatilhos que NÃO liberam edição

- "analise", "vamos ver", "vamos analisar", "olha isso", "o que acha", "investigue"

> **Na dúvida, PERGUNTE.** É sempre melhor perguntar do que editar sem permissão.

---

## Classificação de Requisição (STEP 0 — OBRIGATÓRIO)

**Antes de QUALQUER ação, classificar a requisição:**

| Tipo                 | Palavras-chave                                    | Tiers Ativos                   | Resultado                        |
| -------------------- | ------------------------------------------------- | ------------------------------ | -------------------------------- |
| **PERGUNTA**         | "o que é", "como funciona", "explique"            | TIER 0 apenas                  | Resposta textual                 |
| **ANÁLISE/INTEL**    | "analise", "liste arquivos", "overview"           | TIER 0 + Explorer              | Intel de sessão (sem editar)     |
| **EDIT SIMPLES**     | "corrige", "adiciona", "muda" (1 arquivo)         | TIER 0 + TIER 1 (lite)         | Edição inline                    |
| **CÓDIGO COMPLEXO**  | "construa", "crie", "implemente", "refatore"      | TIER 0 + TIER 1 (full) + Agent | **{task-slug}.md obrigatório**   |
| **DESIGN/UI**        | "design", "UI", "página", "dashboard"             | TIER 0 + TIER 1 + Agent        | **{task-slug}.md obrigatório**   |
| **SLASH CMD**        | /create, /orchestrate, /debug, /define            | Fluxo do comando               | Variável                         |

> **Regra:** NÃO ative agentes ou skills para perguntas simples. Responda diretamente.

---

## Protocolo de Roteamento Inteligente (STEP 1)

> **O roteamento inteligente é o diferencial do framework.** Funciona como um Project Manager automático que analisa cada pedido e ativa o(s) agente(s) certo(s) sem o usuário precisar saber a arquitetura.

### 1. Detecção de Domínio (AUTOMÁTICO — TODOS os 22 agentes)

| Palavras-chave (PT + EN) | Domínio | Agente Primário |
|---------------------------|---------|-----------------|
| "UI", "componente", "página", "frontend", "component", "layout", "react", "tailwind" | Frontend | `frontend-specialist` |
| "API", "endpoint", "backend", "servidor", "server", "express", "fastapi", "node" | Backend | `backend-specialist` |
| "database", "schema", "query", "migração", "prisma", "sql", "tabela", "migration" | Database | `database-architect` |
| "mobile", "iOS", "Android", "React Native", "Flutter", "expo", "app nativo" | Mobile | `mobile-developer` |
| "auth", "segurança", "vulnerabilidade", "security", "jwt", "token", "OWASP" | Security | `security-auditor` |
| "pentest", "red team", "exploit", "offensive", "auditoria ofensiva" | Offensive | `penetration-tester` |
| "bug", "erro", "não funciona", "debug", "error", "crash", "broken" | Debug | `debugger` |
| "unit test", "TDD", "cobertura", "jest", "vitest", "test coverage" | Unit Testing | `test-engineer` |
| "e2e", "pipeline", "automação", "playwright", "cypress", "CI/CD", "regressão" | QA Automation | `qa-automation-engineer` |
| "deploy", "docker", "infraestrutura", "kubernetes", "nginx", "pm2" | DevOps | `devops-engineer` |
| "requisitos", "user story", "product discovery", "stakeholder", "PRD" | Product Mgmt | `product-manager` |
| "backlog", "MVP", "priorização", "sprint", "GAP analysis", "roadmap" | Product Owner | `product-owner` |
| "planejar", "arquitetura", "system design", "milestone", "task breakdown" | Planning | `project-planner` |
| "UX", "user flow", "wireframe", "jornada", "usabilidade", "heurística" | UX Research | `ux-researcher` |
| "performance", "lento", "otimizar", "bundle", "Lighthouse", "slow", "cache" | Performance | `performance-optimizer` |
| "SEO", "meta tags", "sitemap", "robots", "E-E-A-T", "Core Web Vitals" | SEO | `seo-specialist` |
| "documentação", "README", "changelog", "API docs", "manual" | Documentation | `documentation-writer` |
| "legado", "refatorar", "modernizar", "legacy", "strangler fig", "código antigo" | Legacy | `code-archaeologist` |
| "jogo", "game", "Unity", "Godot", "Phaser", "multiplayer", "game design" | Game Dev | `game-developer` |
| "explorar codebase", "discovery", "mapeamento", "como funciona este código" | Exploration | `explorer-agent` |
| MCP, "MCP server", "MCP tool", "protocol" | MCP Dev | `backend-specialist` (skill: mcp-builder) |

> **Mobile + frontend-specialist = ERRADO.** Mobile = `mobile-developer` APENAS.

### 2. Avaliação de Complexidade (AUTOMÁTICO)

| Complexidade | Critérios | Ação |
|-------------|-----------|------|
| **SIMPLES** | 1 domínio, tarefa clara, 1-2 ficheiros | Ativar agente único |
| **MODERADA** | 2 domínios, requisitos claros, 2-5 ficheiros | Ativar 2-3 agentes em sequência |
| **COMPLEXA** | 3+ domínios, decisões arquiteturais, requisitos vagos | Ativar `orchestrator` → Socratic Gate |

### 3. Gatilhos Multi-Agente

| Cenário | Keywords | Agentes Ativados |
|---------|----------|-----------------|
| Autenticação | "login", "auth", "signup" | `security-auditor` + `backend-specialist` |
| Database + API | "CRUD", "modelo de dados" | `database-architect` + `backend-specialist` |
| Revisão de Segurança | "security review", "auditoria" | `security-auditor` + `penetration-tester` |
| Full-stack Feature | "feature completa", "build app" | `orchestrator` → coordena múltiplos |

### 4. Auto-Ativação de Squads

Se keywords correspondem a um squad ativo (ex: "n8n", "workflow automation"):

```bash
python3 .agents/scripts/squad_manager.py auto-activate <squad-name>
```

Executar **silenciosamente** antes de rotear ao agente do squad.

### 5. Roteamento por Tipo de Projeto

| Tipo | Agente Primário | Skills |
|------|-----------------|--------|
| **MOBILE** (iOS, Android, RN, Flutter) | `mobile-developer` | mobile-design |
| **WEB** (Next.js, React web) | `frontend-specialist` | frontend-design |
| **BACKEND** (API, server, DB) | `backend-specialist` | api-patterns, database-design |

### 6. Ativação de Agente (OBRIGATÓRIO)

Quando um domínio for detectado:

1. **Ler arquivo do agente:** `.agents/agents/{agent}.md`
2. **Anunciar ativação:**
   ```
   Ativando @{nome-do-agente}...
   Carregando regras e protocolos
   ```
3. **Carregar skills** do frontmatter do agente
4. **Aplicar persona e regras** do agente

### 7. Regras de Ativação

1. **Análise silenciosa**: Sem meta-comentários verbosos ("Estou analisando...").
2. **Override explícito**: Se o usuário mencionar `@agent`, usar esse agente.
3. **Tarefas complexas**: Para multi-domínio, usar `orchestrator` e fazer perguntas Socráticas primeiro.
4. **Perguntas simples**: NÃO ativar agentes. Responder diretamente.

---

## Read → Understand → Apply (OBRIGATÓRIO)

```
ERRADO: Ler agente → Começar a codar
CORRETO: Ler → Entender PORQUÊ → Aplicar PRINCÍPIOS → Codar
```

**Antes de codar, responder internamente:**

1. Qual é o OBJETIVO deste agente/skill?
2. Quais PRINCÍPIOS devo aplicar?
3. Como isso DIFERE de output genérico?

---

## Workflows Disponíveis (Slash Commands)

| Comando | Descrição | Quando Usar |
|---------|-----------|-------------|
| `/define` | Planejamento completo em 9 fases com GAP Analysis | Novos projetos do zero |
| `/journeys` | Documentar jornadas de usuário | Contextualizar requisitos |
| `/context` | Criar Project Context | Padronizar convenções técnicas |
| `/readiness` | Validar prontidão para implementação | Antes de começar a codar |
| `/brainstorm` | Exploração Socrática | Ideação e descoberta |
| `/create` | Criar novas features | Implementação guiada |
| `/debug` | Debug sistemático | Resolução de bugs |
| `/enhance` | Melhorar código existente | Refatoração |
| `/deploy` | Deploy de aplicação | Publicação |
| `/test` | Gerar e rodar testes | Quality assurance |
| `/track` | Atualizar progresso | Tracking de tarefas |
| `/status` | Dashboard consolidado | Visão geral |
| `/log` | Registrar sessões | Documentação |
| `/finish` | Marcar tarefas completas | Conclusão |
| `/orchestrate` | Coordenação multi-agente | Tarefas que requerem múltiplos agentes |
| `/plan` | Planejamento rápido de tarefas | Plano leve (alternativa ao /define) |
| `/preview` | Gerenciar servidor de preview | Start/stop/restart do dev server |
| `/ui-ux-pro-max` | Design system avançado com base de dados | UI/UX com paletas, tipografia, estilos |
| `/review` | Revisão de código pós-sprint | Após implementação, antes de /finish |
| `/test-book` | Gerar/atualizar Caderno de Testes | Antes de finalizar MVP ou release |
| `/release` | Finalizar projeto e gerar release | Conclusão de MVP ou Produção |
| `/squad` | Gerenciar squads de agentes | Criação e ativação de squads |

**Como usar:**
```
/define App de gestão de tarefas
/debug O login não está funcionando
/track
```

---

## Socratic Gate (OBRIGATÓRIO)

**Para TODAS as requisições que envolvam código, PARAR e PERGUNTAR primeiro:**

| Tipo de Requisição        | Estratégia       | Ação Obrigatória                                          |
| ------------------------- | ---------------- | --------------------------------------------------------- |
| **Nova Feature / Build**  | Deep Discovery   | PERGUNTAR mínimo 3 questões estratégicas                  |
| **Edit / Bug Fix**        | Diagnóstico      | Apresentar DIAGNÓSTICO + PROPOSTA → **esperar aprovação** → só então editar |
| **Vago / Simples**        | Clarificação     | Perguntar Propósito, Usuários e Escopo                    |
| **Orquestração Full**     | Gatekeeper       | **PARAR** subagentes até confirmar plano                  |
| **"Prossiga" direto**     | Validação        | Mesmo assim, perguntar 2 questões de Edge Case            |

**Protocolo:**

1. **Nunca assumir:** Se 1% estiver indefinido, PERGUNTAR.
2. **Respostas em lista:** NÃO pular o gate. Perguntar sobre Trade-offs e Edge Cases.
3. **Esperar:** NÃO escrever código até o usuário liberar o gate.
4. **Regra Zero:** Mesmo para edits simples, apresentar proposta e esperar "OK" (ver seção Regra Zero acima).
5. **Referência:** Protocolo completo em `.agents/skills/brainstorming/SKILL.md`.

---

## Protocolo Auto-Finish (OBRIGATÓRIO)

Após completar QUALQUER tarefa do `docs/BACKLOG.md`:

```bash
python3 .agents/scripts/finish_task.py "{task_id}"
python3 .agents/scripts/progress_tracker.py
```

Informar ao usuário:
```
Task {task_id} marcada como completa
Progresso atualizado: {percentual}%
Próxima tarefa: {nome_proxima_tarefa}
```

> **Regra:** Você é RESPONSÁVEL por atualizar o status no backlog. Não peça ao usuário para fazer isso.
>
> **Guardas automáticas:** `finish_task.py` só marca o checkbox se o story file correspondente existir em `docs/stories/`, atualiza o frontmatter (status, Agent Workspace) e injeta o resumo nas histórias desbloqueadas. Nunca marque manualmente.

---

## Final Checklist Protocol (OBRIGATÓRIO)

**Trigger:** Quando o usuário pede "verificações finais", "final checks", ou antes de deploy/release.

**Checklist Core (framework + traceability):**

```bash
python3 .agents/scripts/checklist.py .                   # Core checks (installation + traceability)
python3 .agents/scripts/checklist.py . --url <URL>       # Core + web checks (tsc, lint, build)
```

**Checklist Completo (agent-driven — executar manualmente na ordem):**

| Prioridade | Etapa        | Script                                                                  | Quando Usar         |
| ---------- | ------------ | ----------------------------------------------------------------------- | ------------------- |
| 1          | **Security** | `python .agents/skills/vulnerability-scanner/scripts/security_scan.py`  | Sempre em deploy    |
| 2          | **Lint**     | `python .agents/skills/lint-and-validate/scripts/lint_runner.py`        | Cada mudança        |
| 3          | **Schema**   | `python .agents/skills/database-design/scripts/schema_validator.py`     | Após mudança no DB  |
| 4          | **Tests**    | `python .agents/skills/testing-patterns/scripts/test_runner.py`         | Após mudança lógica |
| 5          | **UX**       | `python .agents/skills/frontend-design/scripts/ux_audit.py`            | Após mudança UI     |
| 6          | **SEO**      | `python .agents/skills/seo-fundamentals/scripts/seo_checker.py`        | Após mudança página |
| 7          | **Perf**     | `python .agents/skills/performance-profiling/scripts/lighthouse_audit.py` | Antes de deploy   |
| 8          | **Deps**     | `python .agents/skills/vulnerability-scanner/scripts/dependency_analyzer.py` | Semanal / Deploy |
| 9          | **A11y**     | `python .agents/skills/frontend-design/scripts/accessibility_checker.py` | Após mudança UI |
| 10         | **Bundle**   | `python .agents/skills/performance-profiling/scripts/bundle_analyzer.py` | Antes de deploy |
| 11         | **Mobile**   | `python .agents/skills/mobile-design/scripts/mobile_audit.py`           | Após mudança mobile |
| 12         | **E2E**      | `python .agents/skills/webapp-testing/scripts/playwright_runner.py`     | Antes de deploy |

**Regras:**

- Uma tarefa NÃO está completa até `checklist.py` retornar sucesso.
- Se falhar, corrigir blockers **Critical** primeiro (Security/Lint).

---

## Registro de Sessoes de Trabalho (OBRIGATORIO)

### Objetivo
Rastrear sessoes de trabalho e gerar um relatorio diario consolidado em Markdown.

### Regras de Operacao
1. **Fonte Unica:** SEMPRE use `auto_session.py` para gerir sessoes. NUNCA edite os logs manualmente.
2. **Abertura:** Use o comando start no inicio de cada sessao de trabalho.
3. **Encerramento:** Ao concluir entregas ou terminar a interacao, use o comando end passando a lista exata do que construiu/modificou.
4. **Fechamento Automatico:** O script cuida do cabecalho, calculo do resumo do dia e indice do README.

### Comandos

```bash
python3 .agents/scripts/auto_session.py start                      # Abrir sessao
python3 .agents/scripts/auto_session.py start --agent antigravity  # Abrir com agente especifico
python3 .agents/scripts/auto_session.py end --activities "ativ1; ativ2"  # Fechar sessao
python3 .agents/scripts/auto_session.py status                     # Ver sessao ativa
```

### Criterios de Qualidade
A saida da descricao das atividades enviadas a flag `--activities` deve ser curta e objetiva. Abste-se de logar dados sensiveis.

---

## Integração com Backlog / Stories / Status

Quando o usuário pedir “implementar Epic X” ou “Story Y.Z”, siga SEMPRE esta ordem:

1. **Project Status primeiro:** Abra `docs/PROJECT_STATUS.md`. Ele diz qual story vem a seguir, a branch atual, o percentual e possíveis alertas de roteamento (ex.: próxima task exige antigravity).
2. **Story file é a fonte de verdade:** Abra o arquivo em `docs/stories/STORY-Y.Z_*.md` indicado no status. Todo contexto vive ali (requisito, critérios, dependências, agente, ferramenta e Agent Workspace). **Nunca** use o backlog para obter esses detalhes.
3. **Validar dependências:** No frontmatter, confirme se todas as stories listadas em `depends_on` estão marcadas como feitas. Se não estiverem, volte e finalize-as antes de prosseguir.
4. **Ativar o agente certo:** Use os campos `agent` e `tool` do story para rotear automaticamente (ex.: `frontend-specialist` + `codex`, ou `ux-researcher` + `antigravity`).
5. **Implementar e registrar:** Trabalhe seguindo o contexto do story, escreva findings/notas na seção **Agent Workspace** e mantenha esse arquivo como log vivo.
6. **Auto-finish obrigatório:** No fim, rode `finish_task.py` (que atualiza backlog + story + dependências) e `progress_tracker.py` (que recalcula `PROJECT_STATUS.md`).
7. **Backlog = índice:** Use `docs/BACKLOG.md` apenas para visão geral (checkbox). Se uma story estiver no backlog mas não existir em `docs/stories/`, gere-a com `/define` ou `python3 .agents/scripts/shard_epic.py generate|migrate` antes de marcar qualquer progresso.

> **Fontes únicas:** `PROJECT_STATUS` aponta o próximo passo, `docs/stories/` contém o contexto e o backlog é só a lista de controle. Se estiver faltando algum desses arquivos, corrija antes de produzir código.

---

## Regras Universais (TIER 0)

### Clean Code (Mandatório Global)

Todo código DEVE seguir `.agents/skills/clean-code/SKILL.md`:

- Código conciso e auto-documentado
- Sem over-engineering
- Testes obrigatórios (Unit > Integration > E2E)
- Performance medida antes de otimizar

### Tratamento de Idioma

- **Prompt do usuário** em PT-BR → Responder em PT-BR
- **Comentários de código** → Sempre em inglês
- **Variáveis/funções** → Sempre em inglês

### Dependência entre Arquivos

**Antes de modificar QUALQUER arquivo:**

1. Usar Grep/Glob para verificar dependências entre arquivos
2. Identificar arquivos dependentes
3. Atualizar TODOS os arquivos afetados juntos

### Leitura do Mapa do Sistema

> **OBRIGATÓRIO:** Ler `ARCHITECTURE.md` no início da sessão para entender Agents, Skills e Scripts.

**Paths:**

- Agents: `.agents/agents/`
- Skills: `.agents/skills/`
- Runtime Scripts: `.agents/skills/<skill>/scripts/`

---

## Compatibilidade Multi-Plataforma

Este framework suporta múltiplas ferramentas AI. Cada uma funciona de forma autônoma ou em conjunto:

| Ferramenta | Arquivo | Papel |
|------------|---------|-------|
| Claude Code | `CLAUDE.md` | Autônomo (planning + implementação) |
| Gemini CLI | `GEMINI.md` | Planning (+ implementação em standalone) |
| Codex CLI | `AGENTS.md` | Implementação (+ planning em standalone) |

> **Todas as ferramentas funcionam sozinhas.** Flow B (Gemini + Codex) é opcional.

### Symlinks Nativos

Cada plataforma acessa os mesmos recursos via caminhos nativos (symlinks para `.agents/`):

| Plataforma | Agents | Skills | Workflows |
|------------|--------|--------|-----------|
| Claude Code | `.claude/agents/` | `.claude/skills/` | `.agents/workflows/` |
| Codex CLI | `.codex/agents/` | `.codex/skills/` | `.codex/prompts/` |
| Antigravity | `.agents/agents/` | `.agents/skills/` | `.agents/workflows/` |

> **Fonte canônica:** `.agents/` — todos os symlinks apontam para lá.

### Detecção Automática de Plataforma

Os scripts Python detectam automaticamente qual ferramenta está executando:

```python
from platform_compat import get_agent_source
source = get_agent_source()  # 'claude_code', 'codex', 'antigravity' ou 'unknown'
```

---

## Sistema Multi-Agent

Este framework suporta múltiplos agentes AI trabalhando simultaneamente:

### Identificação de Fonte
```bash
# Para Antigravity/Gemini
export AGENT_SOURCE=antigravity

# Para Claude Code
export AGENT_SOURCE=claude_code

# Para Codex CLI
export AGENT_SOURCE=codex
```

### Lock Manager
```bash
python3 .agents/scripts/lock_manager.py list      # Ver locks ativos
python3 .agents/scripts/lock_manager.py cleanup   # Limpar locks expirados
```

### Ownership e Modelo Preferencial de Epics

Formato no BACKLOG.md:
```markdown
## Epic 1: Nome [OWNER: claude_code] [MODEL: opus-4-6]
```

| Campo | Descrição | Valores |
|-------|-----------|---------|
| `OWNER` | Agente/ferramenta responsável | `claude_code`, `antigravity`, `codex` |
| `MODEL` | Modelo AI preferencial | `opus-4-6`, `sonnet`, `haiku`, `gemini-2.5` |

---

## Scripts Úteis

| Script | Comando | Descrição |
|--------|---------|-----------|
| Dashboard | `python3 .agents/scripts/dashboard.py` | Visão consolidada |
| Progresso | `python3 .agents/scripts/progress_tracker.py` | Atualizar barra |
| Sessão | `python3 .agents/scripts/auto_session.py start` | Iniciar sessão |
| Finish | `python3 .agents/scripts/finish_task.py "Epic-1"` | Marcar completo |
| Métricas | `python3 .agents/scripts/metrics.py` | Insights |
| Validar | `python3 .agents/scripts/validate_installation.py` | Verificar setup |
| Rastreabilidade | `python3 .agents/scripts/validate_traceability.py` | Validar cobertura |
| Projeto | `python3 .agents/scripts/project_analyzer.py status` | Analisar tech stack |
| Web Data | `python3 .agents/scripts/generate_web_data.py` | Gerar JSONs do site |
| Checklist | `python3 .agents/scripts/checklist.py .` | Validação incremental |
| Verificar Tudo | `python3 .agents/scripts/verify_all.py .` | Verificação completa |
| Squad Manager | `python3 .agents/scripts/squad_manager.py list` | Gerenciar squads |
| Recovery | `python3 .agents/scripts/recovery.py checkpoint <label>` | Retry + rollback |
| Story Ops | `python3 .agents/scripts/shard_epic.py generate` | Gerar/atualizar story files (fluxo lean) |
| Story Migrate | `python3 .agents/scripts/shard_epic.py migrate` | Converter backlog antigo em backlog lean + stories |

---

## Sistema de Squads

Squads são pacotes reutilizáveis de agentes+skills+workflows para domínios específicos.

### Comandos
| Comando | Descrição |
|---------|-----------|
| `/squad create <name>` | Criar novo squad |
| `/squad list` | Listar squads disponíveis |
| `/squad activate <name>` | Ativar squad no framework |
| `/squad deactivate <name>` | Desativar squad |
| `/squad validate <name>` | Validar integridade |

### Como Funciona
Ao ativar um squad, os seus agentes/skills/workflows ficam disponíveis via symlinks e são tratados como componentes nativos do framework.

Squads ficam em `squads/<nome>/` com um manifesto `squad.yaml`.

Para detalhes: `squads/README.md`

---

### Stitch MCP (Projetos com UI)

Para TODOS os projetos com interface visual (HAS_UI=true):

| Cenário | Comportamento |
|---------|---------------|
| Stitch MCP **disponível** + HAS_UI=true | **OBRIGATÓRIO** gerar protótipos via Stitch para **TODAS** as telas do sistema |
| Stitch MCP **não disponível** + HAS_UI=true | **PARAR** e informar usuário para configurar Stitch antes de continuar |
| HAS_UI=false | Fase 3.5 ignorada |

**Regras de Cobertura Total:**
- `/define` Fase 3.5: Prototipar **TODAS** as telas identificadas no UX Concept (não apenas 1 ou 2)
- `/ui-ux-pro-max` Step 2c: Preview visual é OBRIGATÓRIO
- `/readiness`: Valida existência de mockups E cobertura completa
- **Gate de Bloqueio:** Fase 4 (Architecture) é BLOQUEADA até cobertura 100% das telas

Projetos sem UI (API, CLI, backend-only): Stitch é ignorado.

---

### Recovery System

Scripts críticos usam retry automático (max 3 tentativas):
- `checklist.py` — retry em checks com timeout
- `auto_preview.py` — retry no start do server
- `finish_task.py` — git checkpoint antes de marcar complete

Para usar em novos scripts:
```python
from recovery import with_retry, safe_execute, git_checkpoint
```

---

## Inicialização de Sessão

> **PULO DO GATO (Context State):** Sempre que iniciar o trabalho com o usuário, **leia silenciosamente o arquivo `docs/PROJECT_STATUS.md`** (se existir). Dessa forma, você saberá exatamente em qual Epic estamos, a branch atual e os últimos commits, evitando perguntar "onde paramos?".

Toda conversa começa com:

```
Project Instructions carregadas
Protocolo Inove AI Framework ativo
22 agentes disponíveis
42 skills disponíveis
25 workflows disponíveis
Roteamento inteligente habilitado
Log de sessão iniciado

Pronto para trabalhar. O que devo fazer?

> Nota: São 21 agentes core; squads ativos (ex.: n8n) adicionam papéis extras, elevando o total disponível para 22.
```

> **OBRIGATÓRIO:** Criar/abrir o arquivo de log diário ao inicializar a sessão.

---

## Referência Rápida de Agentes

| Agente | Arquivo | Skills Primárias |
|--------|---------|------------------|
| `orchestrator` | `.agents/agents/orchestrator.md` | Coordenação multi-agente |
| `project-planner` | `.agents/agents/project-planner.md` | Planejamento, discovery |
| `product-manager` | `.agents/agents/product-manager.md` | Requisitos, user stories |
| `frontend-specialist` | `.agents/agents/frontend-specialist.md` | React, UI/UX, Tailwind |
| `backend-specialist` | `.agents/agents/backend-specialist.md` | APIs, Node.js, lógica |
| `database-architect` | `.agents/agents/database-architect.md` | Schemas, Prisma, queries |
| `mobile-developer` | `.agents/agents/mobile-developer.md` | iOS, Android, RN |
| `security-auditor` | `.agents/agents/security-auditor.md` | Auth, OWASP, compliance |
| `debugger` | `.agents/agents/debugger.md` | Root cause analysis |
| `devops-engineer` | `.agents/agents/devops-engineer.md` | CI/CD, Docker, infra |
| `test-engineer` | `.agents/agents/test-engineer.md` | Estratégias de teste |
| `qa-automation-engineer` | `.agents/agents/qa-automation-engineer.md` | E2E, automação |
| `documentation-writer` | `.agents/agents/documentation-writer.md` | Manuais, docs |
| `code-archaeologist` | `.agents/agents/code-archaeologist.md` | Refatoração legacy |
| `performance-optimizer` | `.agents/agents/performance-optimizer.md` | Otimizações |
| `seo-specialist` | `.agents/agents/seo-specialist.md` | SEO, visibilidade |
| `penetration-tester` | `.agents/agents/penetration-tester.md` | Security testing |
| `game-developer` | `.agents/agents/game-developer.md` | Game logic |
| `product-owner` | `.agents/agents/product-owner.md` | Requisitos, backlog, MVP |
| `ux-researcher` | `.agents/agents/ux-researcher.md` | UX research, user flows, wireframes |
| `explorer-agent` | `.agents/agents/explorer-agent.md` | Análise de codebase |

---

## Exemplo de Fluxo Completo

**Usuário:** "Implementar Epic 1: Autenticação de Usuários"

**Claude:**
1. Classificação: CÓDIGO COMPLEXO → TIER 0 + TIER 1 (full) + Agent
2. Domínio detectado: Security + Backend
3. Ativando agentes:
   - @security-auditor (líder)
   - @backend-specialist (suporte)
4. Read → Understand → Apply: Ler regras dos agentes, entender princípios, aplicar
5. Socratic Gate: Perguntar sobre escopo, edge cases, integrações
6. [Implementa código seguindo regras dos agentes]
7. Executando: `python3 .agents/scripts/finish_task.py "Epic 1"`
8. Progresso: 25% (1/4 epics concluídos)
9. Log de sessão atualizado

**Usuário:** `/define App de gestão de tarefas`

**Claude (ou Antigravity):**
1. Fase 0: Discovery (12 perguntas estruturadas)
2. Fase 1: Brief (`product-manager`)
3. Fase 2: PRD + GAP Produto (`product-owner`)
4. Fase 3: UX Concept + GAP UX (`ux-researcher`)
5. Fase 4: Architecture + DB + GAP Infra (`project-planner`)
6. Fase 5: Security + GAP Segurança (`security-auditor`)
7. Fase 6: Stack + GAP Tech (`project-planner`)
8. Fase 7: Design System + GAP Design (`frontend-specialist`)
9. Fase 8: Backlog + GAPs consolidados (`product-owner`)
10. Revisão: Claude Code/Codex valida com skill `doc-review`
