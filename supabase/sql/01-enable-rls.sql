-- =====================================================
-- RLS Policies para portfolio Supabase
-- Rodar 1x no SQL Editor do Supabase Studio
-- =====================================================

-- 1) Habilita RLS em todas as tabelas
alter table bookings enable row level security;
alter table analytics enable row level security;
alter table leads  enable row level security;

-- 2) Drop policies existentes (idempotente — útil se você rodou este script antes)
drop policy if exists "anon insert bookings"  on bookings;
drop policy if exists "admin read bookings"   on bookings;
drop policy if exists "admin update bookings" on bookings;
drop policy if exists "admin delete bookings" on bookings;

drop policy if exists "anon insert analytics" on analytics;

drop policy if exists "anon insert leads"   on leads;
drop policy if exists "admin read leads"    on leads;
drop policy if exists "admin update leads"  on leads;
drop policy if exists "admin delete leads"  on leads;

-- 3) BOOKINGS
-- Visitante anônimo pode inserir (formulário público de agendamento)
create policy "anon insert bookings" on bookings
  for insert to anon with check (true);

-- Admin (role em app_metadata) lê/atualiza/deleta
create policy "admin read bookings" on bookings
  for select to authenticated using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "admin update bookings" on bookings
  for update to authenticated using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  ) with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "admin delete bookings" on bookings
  for delete to authenticated using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 4) ANALYTICS
-- Visitante anônimo pode inserir (page view)
-- Ninguém lê direto: admin usa Supabase Studio / service_role backend
create policy "anon insert analytics" on analytics
  for insert to anon with check (true);

-- 5) LEADS (mesmo padrão de bookings)
create policy "anon insert leads" on leads
  for insert to anon with check (true);

create policy "admin read leads" on leads
  for select to authenticated using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "admin update leads" on leads
  for update to authenticated using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  ) with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "admin delete leads" on leads
  for delete to authenticated using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 6) Verificação
-- Rode separadamente para confirmar que RLS está ativo:
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--   order by tablename;
