-- ELUS · enforcement no banco: limite de cards ativos por plano
-- + bloqueio de encerramento antecipado no Essencial
-- Migration 014
--
-- Espelha getActivePlanKey (subscriptions is_current + active/in_grace_period;
-- fallback users.plan legado) e interestCardRules.ts:
-- essential=1, plus=1, premium=2, commercial=3, businessPro=6 (1 unidade).
--
-- REVERTER (014 down):
--   drop trigger if exists interest_cards_enforce_plan_limit_trg on public.interest_cards;
--   drop trigger if exists interest_cards_enforce_early_end_plan_trg on public.interest_cards;
--   drop function if exists public.interest_cards_enforce_plan_limit();
--   drop function if exists public.interest_cards_enforce_early_end_plan();
--   drop function if exists public.elus_max_active_interest_cards(text);
--   drop function if exists public.elus_active_plan_key(uuid);
-- Não apaga dados de interest_cards / subscriptions.

create or replace function public.elus_active_plan_key(p_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan_key text;
  v_legacy text;
begin
  select s.plan_key
    into v_plan_key
  from public.subscriptions s
  where s.user_id = p_user_id
    and s.is_current = true
    and s.status in ('active', 'in_grace_period')
  limit 1;

  if v_plan_key is not null then
    return v_plan_key;
  end if;

  select u.plan::text into v_legacy
  from public.users u
  where u.id = p_user_id;

  if v_legacy = 'premium_person' then
    return 'premium';
  elsif v_legacy = 'premium_business' then
    return 'businessPro';
  else
    return 'essential';
  end if;
end;
$$;

revoke all on function public.elus_active_plan_key(uuid) from public;
grant execute on function public.elus_active_plan_key(uuid) to authenticated;

create or replace function public.elus_max_active_interest_cards(p_plan_key text)
returns integer
language sql
immutable
as $$
  select case p_plan_key
    when 'essential' then 1
    when 'plus' then 1
    when 'premium' then 2
    when 'commercial' then 3
    when 'businessPro' then 6
    else 1
  end;
$$;

revoke all on function public.elus_max_active_interest_cards(text) from public;
grant execute on function public.elus_max_active_interest_cards(text) to authenticated;

create or replace function public.interest_cards_enforce_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_max integer;
  v_active integer;
begin
  v_plan := public.elus_active_plan_key(new.user_id);
  v_max := public.elus_max_active_interest_cards(v_plan);

  select count(*)::integer
    into v_active
  from public.interest_cards c
  where c.user_id = new.user_id
    and c.ended_early_at is null
    and c.expires_at > now();

  if v_active >= v_max then
    raise exception
      'interest_cards: limite de % card(s) ativo(s) atingido para o plano %',
      v_max, v_plan
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists interest_cards_enforce_plan_limit_trg
  on public.interest_cards;
create trigger interest_cards_enforce_plan_limit_trg
  before insert on public.interest_cards
  for each row
  execute function public.interest_cards_enforce_plan_limit();

create or replace function public.interest_cards_enforce_early_end_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  if old.ended_early_at is null
     and new.ended_early_at is not null
  then
    v_plan := public.elus_active_plan_key(new.user_id);
    if v_plan = 'essential' then
      raise exception
        'interest_cards: plano essential não permite encerrar antes das 24h'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists interest_cards_enforce_early_end_plan_trg
  on public.interest_cards;
create trigger interest_cards_enforce_early_end_plan_trg
  before update on public.interest_cards
  for each row
  execute function public.interest_cards_enforce_early_end_plan();

comment on function public.elus_active_plan_key(uuid) is
  'Espelha getActivePlanKey: subscriptions atual, senão users.plan legado.';
