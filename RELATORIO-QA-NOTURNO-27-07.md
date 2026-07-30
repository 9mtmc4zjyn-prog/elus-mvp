# Relatório QA noturno — Card de Status de Interesse

**Data do trabalho:** 30/07/2026 (noite)  
**Arquivo pedido:** `RELATORIO-QA-NOTURNO-27-07.md`  
**Branch:** `fix/qa-noturno-27-07`  
**Escopo:** `frontend/` (Expo + Supabase)  
**Push remoto:** **não feito** (trava do Cleber)

---

## Resumo executivo

Corrigidos os dois achados críticos do QA anterior e aplicados no Supabase remoto com migrations reversíveis:

1. **42501 em `interest_card_views`** — SELECT RLS do viewer bloqueava `INSERT … RETURNING` / resposta do PostgREST.
2. **Limite de cards e encerrar cedo só no client** — agora há triggers no banco (014).

Smoke SQL pós-fix: INSERT RETURNING ok; 2º card essential rejeitado; `ended_early_at` no essential rejeitado. Dados de teste limpos; usuário Teste voltou a `unverified`.

---

## O que foi corrigido

### A) Bug 42501 — views

| Item | Detalhe |
|------|---------|
| Causa | Policy SELECT só permitia o **dono do card**. Viewer inseria ok (WITH CHECK), mas RETURNING/upsert exigia SELECT → 42501. |
| Fix DB | Migration `015_interest_card_views_select_viewer.sql` — policy `ler_propria_interest_card_view_como_viewer` (`viewer_id = auth.uid()`). |
| Fix app | `interestCardsApi.recordInterestCardViews` — insert por card (sem upsert), trata `23505` como ok. |
| Reversão 015 | `drop policy if exists "ler_propria_interest_card_view_como_viewer" on public.interest_card_views;` |
| Smoke | `INSERT … RETURNING` como viewer autenticado → **passou**. |

### B) Enforcement de plano no banco

| Item | Detalhe |
|------|---------|
| Migration | `014_interest_cards_plan_enforcement.sql` |
| Helpers | `elus_active_plan_key(user_id)` (subscriptions → fallback `users.plan`) e `elus_max_active_interest_cards(plan_key)` |
| Limites | essential=1, plus=1, premium=2, commercial=3, businessPro=6 |
| Triggers | BEFORE INSERT (limite ativos); BEFORE UPDATE (bloqueia `ended_early_at` se essential) |
| Reversão 014 | Documentada no cabeçalho da migration (drop triggers + functions). Sem DROP TABLE / TRUNCATE. |
| Smoke | 2º card essential → erro limite; early end essential → erro plano. |

### C) Feature já existente (Fases 1–3) incluída nesta branch

Arquivos da feature (UI + regras + API) que estavam untracked/modificados e entram no commit da branch para o Cleber revisar juntos:

- `frontend/app/interest-cards.tsx`
- `frontend/src/components/CreateInterestCardModal.tsx`
- `frontend/src/components/InterestCardView.tsx`
- `frontend/src/utils/interestCardRules.ts`
- `frontend/src/utils/interestCardLabels.ts`
- `frontend/src/utils/interestCardsApi.ts`
- `frontend/src/utils/planTier.ts` (`getActivePlanKey`)
- Integrações: `app/(tabs)/profile.tsx`, `app/(tabs)/index.tsx`, `app/profile/[id].tsx`
- Migrations `013`–`015`

---

## Migrations no remoto

| Migration | Status remoto |
|-----------|----------------|
| 013_interest_cards.sql | já aplicada (QA anterior) |
| 014_interest_cards_plan_enforcement.sql | **aplicada nesta noite** |
| 015_interest_card_views_select_viewer.sql | **aplicada nesta noite** |

---

## Typecheck

Comando: `npx tsc --noEmit -p tsconfig.json` (pasta `frontend/`)

- **Arquivos novos/alterados desta feature:** sem erros de tipo reportados.
- **Erros pré-existentes (não tocados):** `app/profile-setup.tsx` (user possibly null), `src/data/professionalCouncils.ts` (`hasKnownApi`), edge functions Deno (`delete-account`, `reset-password`).

---

## O que NÃO foi mexido (arriscado / fora do escopo seguro)

1. **IAP / RevenueCat / webhook de `subscriptions`** — ainda não implementados; `FREE_ONLY_BUILD = true`. Não ligamos checkout real.
2. **Deploy site / `wrangler.toml` / `.github/workflows/deploy-elus-site.yml` / `docs/` / `website/`** — alterações locais pré-existentes; **não** entram neste commit (risco de deploy).
3. **`FORCE ROW LEVEL SECURITY` em tabelas** — desnecessário após o fix da policy SELECT.
4. **Limite businessPro multi-unidade (6 × N CNPJs)** — banco e app usam **6** (1 unidade). Contagem por filial/CNPJ ainda não tem modelo confiável no schema.
5. **Visitas de perfil (`profile_visits`)** — feature ainda não existe; só espelhamos o padrão agregado/exato nos cards.
6. **Erros TS pré-existentes** listados acima — correção ampla de conselhos profissionais / Deno types deixada para outro PR.
7. **git push** — deliberadamente não executado.

---

## Como o Cleber revisa de manhã

```powershell
cd "C:\Users\juaze\Downloads\Projeto Elus\App\codigo\elus-mvp-main"
git checkout fix/qa-noturno-27-07
git log --oneline -5
git diff main...HEAD --stat
```

Para reverter só a 014/015 no remoto (se necessário), usar os blocos `REVERTER` no topo de cada migration SQL — depois `supabase migration repair` conforme o fluxo do CLI.

---

## Commits nesta branch

(Preenchido após o commit local.)
