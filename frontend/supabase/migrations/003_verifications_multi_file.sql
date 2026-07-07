-- ELUS · verificação por múltiplos arquivos (documento + selfie + selfie com documento)
-- Adiciona colunas de storage para a foto do documento e para a selfie segurando o documento.

alter table public.verifications
  add column if not exists document_storage_path text not null default '',
  add column if not exists selfie_with_document_storage_path text not null default '';
