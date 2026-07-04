-- ELUS · schema principal (Supabase)
-- Alinhado aos fluxos do frontend: AppContext, verification, conexões e solicitações.

create extension if not exists "pgcrypto";

-- =====================================================
-- Tipos auxiliares
-- =====================================================

create type public.elus_plan_type as enum (
  'free',
  'premium_person',
  'premium_business'
);

create type public.elus_profile_type as enum (
  'person',
  'business',
  'assisted'
);

create type public.elus_presence_mode as enum (
  'personal',
  'need_service',
  'offer_service'
);

create type public.elus_verification_status as enum (
  'unverified',
  'pending',
  'in_review',
  'verified'
);

create type public.elus_connection_kind as enum (
  'family',
  'company',
  'interest',
  'preference',
  'service',
  'friend',
  'assisted'
);

create type public.elus_request_status as enum (
  'pending',
  'accepted',
  'rejected'
);

create type public.elus_profile_visibility_status as enum (
  'verified',
  'unverified',
  'in_review'
);

-- =====================================================
-- users · conta ELUS (extensão de auth.users)
-- =====================================================

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan public.elus_plan_type not null default 'free',
  profile_type public.elus_profile_type not null default 'person',
  profile_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index users_email_idx on public.users (email);

-- =====================================================
-- companies · empresas / negócios vinculados a perfis
-- =====================================================

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  legal_name text,
  service text,
  city text,
  state text,
  logo_url text,
  created_at timestamptz not null default now()
);

create index companies_owner_user_id_idx on public.companies (owner_user_id);
create index companies_name_idx on public.companies (name);

-- =====================================================
-- profiles · presença pública e dados de perfil
-- =====================================================

create table public.profiles (
  id uuid primary key references public.users (id) on delete cascade,
  name text not null,
  photo_url text,
  bio text not null default '',
  purpose text not null default '',
  role text not null default '',
  area text not null default '',
  presence_mode public.elus_presence_mode not null default 'personal',
  service text not null default '',
  city text not null default '',
  state text not null default '',
  location_label text not null default '',
  company_id uuid references public.companies (id) on delete set null,
  interests text[] not null default '{}',
  preferences text[] not null default '{}',
  basic_info text[] not null default '{}',
  assisted_by text not null default '',
  support_contact text not null default '',
  whatsapp text not null default '',
  phone text not null default '',
  instagram text not null default '',
  visibility_status public.elus_profile_visibility_status not null default 'unverified',
  is_online boolean not null default false,
  created_at timestamptz not null default now()
);

create index profiles_city_state_idx on public.profiles (city, state);
create index profiles_company_id_idx on public.profiles (company_id);
create index profiles_visibility_status_idx on public.profiles (visibility_status);

-- =====================================================
-- verifications · selfie + documento (histórico e status)
-- =====================================================

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  status public.elus_verification_status not null default 'unverified',
  document_type text not null default '',
  selfie_storage_path text not null default '',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users (id) on delete set null,
  rejection_reason text,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  constraint verifications_document_type_check check (
    document_type = ''
    or document_type in ('CIN/RG', 'CNH', 'Passaporte', 'CRNM/RNE')
  )
);

create index verifications_user_id_idx on public.verifications (user_id);
create index verifications_status_idx on public.verifications (status);
create unique index verifications_one_current_per_user_idx
  on public.verifications (user_id)
  where is_current = true;

-- =====================================================
-- connections · vínculos reais aceitos
-- =====================================================

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id uuid not null references public.users (id) on delete cascade,
  kind public.elus_connection_kind not null,
  label text not null default '',
  status public.elus_request_status not null default 'accepted',
  requires_mutual_approval boolean not null default true,
  created_at timestamptz not null default now(),
  constraint connections_no_self_reference check (from_user_id <> to_user_id),
  constraint connections_unique_pair_kind unique (from_user_id, to_user_id, kind)
);

create index connections_from_user_id_idx on public.connections (from_user_id);
create index connections_to_user_id_idx on public.connections (to_user_id);
create index connections_kind_idx on public.connections (kind);

-- =====================================================
-- connection_requests · solicitações de conexão real
-- =====================================================

create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id uuid not null references public.users (id) on delete cascade,
  kind public.elus_connection_kind not null,
  label text not null default '',
  status public.elus_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint connection_requests_no_self_reference check (from_user_id <> to_user_id)
);

create index connection_requests_from_user_id_idx on public.connection_requests (from_user_id);
create index connection_requests_to_user_id_idx on public.connection_requests (to_user_id);
create index connection_requests_status_idx on public.connection_requests (status);

create unique index connection_requests_pending_unique_idx
  on public.connection_requests (from_user_id, to_user_id, kind)
  where status = 'pending';

-- =====================================================
-- contact_requests · solicitações de informações de contato
-- =====================================================

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id uuid not null references public.users (id) on delete cascade,
  requested_method_ids text[] not null default '{}',
  approved_method_ids text[] not null default '{}',
  status public.elus_request_status not null default 'pending',
  note text not null default '',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint contact_requests_no_self_reference check (from_user_id <> to_user_id),
  constraint contact_requests_requested_methods_not_empty check (
    cardinality(requested_method_ids) > 0
  )
);

create index contact_requests_from_user_id_idx on public.contact_requests (from_user_id);
create index contact_requests_to_user_id_idx on public.contact_requests (to_user_id);
create index contact_requests_status_idx on public.contact_requests (status);

create unique index contact_requests_pending_unique_idx
  on public.contact_requests (from_user_id, to_user_id)
  where status = 'pending';

-- =====================================================
-- RLS (habilitado; políticas podem ser adicionadas depois)
-- =====================================================

alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.verifications enable row level security;
alter table public.connections enable row level security;
alter table public.connection_requests enable row level security;
alter table public.contact_requests enable row level security;
