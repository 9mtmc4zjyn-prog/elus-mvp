-- ELUS · assinaturas (ELUS Plus e planos futuros) via IAP (Apple/Google)
-- Preparação de schema para a Fase 1, antes das contas de desenvolvedor e
-- do RevenueCat estarem prontas. plan_key usa os mesmos valores de
-- frontend/src/data/pricing.ts (PlanKey) — mais granular que o antigo
-- enum public.elus_plan_type ('free'/'premium_person'/'premium_business'),
-- que continua existindo em public.users.plan por compatibilidade.
--
-- REGRA DE SEGURANÇA IMPORTANTE: nenhuma policy de insert/update é criada
-- para o papel "authenticated". Status de assinatura é fato de servidor —
-- só o service_role (usado pelo webhook do RevenueCat/App Store/Play,
-- ainda a implementar) pode gravar aqui. Se o próprio app pudesse
-- atualizar sua linha, qualquer usuário poderia se dar Plus de graça.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,

  -- Chave do plano, conforme frontend/src/data/pricing.ts (ex.: 'plus').
  plan_key text not null,

  -- Onde a compra foi feita.
  store text not null check (store in ('app_store', 'play_store', 'manual')),

  -- SKU/product id cadastrado no App Store Connect / Google Play Console.
  product_id text not null default '',

  -- Identificador da assinatura na loja ou no RevenueCat, para conciliar
  -- com o painel deles em caso de disputa/reembolso.
  external_subscription_id text not null default '',

  status text not null default 'active' check (
    status in ('active', 'in_grace_period', 'billing_issue', 'cancelled', 'expired')
  ),

  -- Preço de fundador (ver FOUNDER_PRICE em pricing.ts): assinante trava
  -- R$ 14,90 enquanto a assinatura permanecer ativa sem interrupção.
  is_founder_price boolean not null default false,

  current_period_start timestamptz,
  current_period_end timestamptz,
  auto_renew boolean not null default true,

  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

create unique index if not exists subscriptions_one_current_per_user_idx
  on public.subscriptions (user_id)
  where is_current = true;

alter table public.subscriptions enable row level security;

-- Leitura: o dono vê o próprio histórico de assinatura (ex.: tela "Meu plano").
drop policy if exists "ler_propria_assinatura" on public.subscriptions;
create policy "ler_propria_assinatura"
  on public.subscriptions
  for select
  using (user_id = auth.uid());

-- Leitura admin: equipe ELUS acompanha assinaturas de todo mundo.
drop policy if exists "ler_assinaturas_admin" on public.subscriptions;
create policy "ler_assinaturas_admin"
  on public.subscriptions
  for select
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

-- Sem policy de insert/update para "authenticated" de propósito — ver nota
-- de segurança no topo do arquivo. Grant também não inclui insert/update.
grant select on public.subscriptions to authenticated;
