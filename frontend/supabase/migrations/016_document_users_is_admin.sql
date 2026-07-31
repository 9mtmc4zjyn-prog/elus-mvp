-- 016_document_users_is_admin.sql
-- Documenta a coluna já existente public.users.is_admin (boolean not null
-- default false). A coluna já existe e está em uso no banco — 5 policies
-- de RLS já dependem dela (004, 006, 008) — esta migration só registra a
-- estrutura real no repositório, fechando o "schema drift" (mesmo padrão
-- da 004_document_reports_and_blocked_users.sql).
-- Segura de rodar mesmo com a coluna já existindo (ADD COLUMN IF NOT EXISTS).

alter table public.users
  add column if not exists is_admin boolean not null default false;

comment on column public.users.is_admin is
  'Acesso de administrador (painéis internos: denúncias, assinaturas, verificação profissional). Hoje só clebera7x@gmail.com.';
