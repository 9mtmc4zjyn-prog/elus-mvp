# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
yarn install

# Start dev server (opens QR code for Expo Go or emulator)
yarn start

# Platform-specific starts
yarn android
yarn ios
yarn web

# Lint
yarn lint
```

There is no test suite. TypeScript checking is done via `tsc` (not a script alias).

## Environment Variables

Requires a `.env` file (or Expo's env mechanism) with:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

The Supabase client (`src/lib/supabase.ts`) throws at import time if these are missing.

## Architecture

### Stack
React Native + Expo (SDK 54), file-based routing via **expo-router**, TypeScript, Supabase for auth/data.

### Routing (`app/`)
Expo Router file-based routing. Layout hierarchy:
- `app/_layout.tsx` — root: wraps everything in `AppProvider` + `GestureHandlerRootView`, handles auth guard (redirects to `/login` if no session on protected routes), renders a global floating "Planos" button
- `app/(tabs)/_layout.tsx` — bottom tab bar with 4 visible tabs: Campo (index), Explorar (search), Conexões (connections), Perfil (profile). Two hidden tabs (`map`, `requests`) exist but are not shown in the tab bar.

Auth flow: `index.tsx` → `login.tsx` / `signup.tsx` → `profile-type.tsx` → `profile-setup.tsx` → `onboarding.tsx` → `verification.tsx` → tabs

### State Management (`src/context/AppContext.tsx`)
Single `AppContext` / `AppProvider` holds all runtime state:
- Current user (`AppUser`) — persisted to AsyncStorage at `@elus/current-user/v2` and hydrated from Supabase (`users`, `profiles`, `verifications` tables) on session change
- All other users (mock list seeded in file for MVP)
- Connections and connection requests (all in-memory for MVP)
- Contact information requests

`useApp()` is the only hook needed to access user state and all actions (login, logout, updateUser, createConnection, acceptConnectionRequest, etc.).

**Important quirks:**
- `FORCE_CURRENT_USER_VERIFIED_FOR_PLANS_TEST` and `FORCE_CURRENT_USER_PENDING_FOR_TEST` are boolean flags in AppContext.tsx for manual test state overrides.
- The mock user list (`initialUsers`) is hardcoded in AppContext.tsx — there is no real user fetch for non-current users.

### Theme (`app/theme.ts` and `src/theme.ts`)
`app/theme.ts` is the canonical source. `src/theme.ts` re-exports the same tokens. Many screens define a local `COLORS` constant inline instead of importing from theme — this is intentional (screens were written before the central theme existed).

Key exports: `colors`, `statusColors`, `relationshipColors`, `spacing`, `radius`, `typography`, `transparentColor()`.

### Business Logic (pure utility files)

All core rules live in `src/utils/` — none depend on AppContext:

- **`connectionRules.ts`** — `evaluateConnectionRules()` determines what a viewer can see/do on a target profile based on identity phase of both parties and current connection state. Returns a `ConnectionRuleResult` with boolean flags (`canRequestConnection`, `canShowContactData`, `canShowFullProfile`, etc.) and UI labels.

- **`protectedProfileRules.ts`** — Rules for "Perfil Público Protegido" (protected public profiles). Provides `getProtectedProfilePolicy()` for a complete policy object and `evaluateProtectedConnectionDecision()` for connection decisions. Currently in structural preparation phase — rules exist but no UI screens fully implement them yet.

- **`elusIntelligenceRules.ts`** — Affinity logic. The core invariant: **automatic affinity detection ≠ real connection**. Provides visibility mode computation (`getVisibilityMode()`), safe display helpers (`getSafeDisplayName()`, `getSafeDisplayLocation()`), and local affinity explanation (`getLocalAffinityExplanation()`). All affinity is computed locally (no real AI backend for MVP).

- **`layers.ts`** — Defines the 4 information disclosure layers: `public`, `initial`, `relational`, `private`. Each layer has different fields for person vs business profiles.

- **`adaptSupabaseProfile.ts`** — Adapts raw Supabase row data to the `AppUser` shape.

### Core Domain Concepts

**Identity verification** is the gating mechanism for everything:
- `unverified` → can see affinities only, cannot request connections or see contact data
- `in_review` → submitted selfie+document, still blocked like unverified
- `verified` → can request real connections, see full profiles (if target also verified)

**Connection kinds** (`ConnectionKind`): `family`, `company`, `interest`, `preference`, `service`, `friend`, `assisted`. Each has a color in `theme.ts`. Max 5 kinds per person-person pair; max 2 (`company`, `interest`) per person-business pair.

**Plans** (`PlanType`): `free`, `premium_person`, `premium_business`. Premium unlocks advanced presence modes and company branches.

**Profile types** (`ProfileType`): `person`, `business`, `assisted`.

**Presence modes** (`PresenceMode`): `personal`, `need_service`, `offer_service`. Only paid users can use non-`personal` modes.

### .bak files
Files ending in `.bak`, `.bak-style-any`, `.bak-variant-compact` are old snapshots of screen files left alongside the active versions. They are not imported anywhere and can be ignored.

## Conhecimento do Banco (Supabase) — aprendido em depuração

### Tabela `verifications` é HISTÓRICO, não 1-linha-por-usuário
- Tem coluna `is_current` (boolean). Várias linhas por usuário são possíveis.
- A linha "atual" é a que tem `is_current = true`.
- O upsert usa `onConflict: 'user_id'`, então existe constraint UNIQUE em `user_id` (verifications_user_id_key).
- Toda query de status deve filtrar `.eq('is_current', true)`.

### Enum `elus_verification_status` — valores válidos
- Aceitos: unverified, pending, in_review, verified.
- NÃO existe 'approved'. O valor de aprovado/verificado é 'verified'.
- Aprovar manualmente: UPDATE verifications SET status = 'verified' WHERE user_id = '...';

### Status de verificação depende de profile_completed
- Em AppContext.tsx, normalizeStoredUser (~linha 307) rebaixa 'verified' para 'unverified' se users.profile_completed = false.
- Regra: profileCompleted && !isPlaceholderUser ? 'verified' : 'unverified'.
- Ter status='verified' em verifications NÃO basta para o badge verde; precisa também profile_completed=true em users.
- DECISÃO DE PRODUTO PENDENTE: avaliar se essa dependência é intencional.

### Trigger handle_new_user pode falhar
- Deveria popular public.users e public.profiles no cadastro.
- Usuários órfãos (existem em auth.users mas faltam em public.users/profiles) causam erro de foreign key verifications_user_id_fkey.
- INVESTIGAÇÃO PENDENTE: verificar se o trigger tem furo para usuários reais.

## Padrões de Código

### Queries Supabase: usar .maybeSingle(), não .single()
- .single() lança erro com 0 linhas (ou se RLS bloquear). Em Promise.all, derruba todas as queries.
- Padrão correto: .maybeSingle() (retorna null). Já corrigido em loadUserFromSupabase.

### AsyncStorage NÃO é fonte de verdade para verificação
- Cache local e Supabase carregam em paralelo no login.
- verified/verificationStatus vêm SÓ do Supabase. Ao restaurar o cache em normalizeStoredUser, descartar esses dois campos (já corrigido).

## INSERT manual de usuário de teste
- public.users: só id (uuid) é obrigatório sem default.
- public.profiles: só id (uuid) e name (text) são obrigatórios sem default.
