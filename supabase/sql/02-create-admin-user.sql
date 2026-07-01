-- =====================================================
-- Promove um usuário existente ao papel "admin"
-- Rodar APÓS criar o usuário (Authentication > Users > Add user)
-- Substitua 'seu-email@exemplo.com' antes de executar
-- =====================================================

update auth.users
   set raw_app_meta_data =
       coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
 where email = 'SEU-EMAIL-AQUI@exemplo.com';

-- Verificação (deve retornar 1 linha com role: "admin"):
--   select id, email, raw_app_meta_data
--   from auth.users
--   where email = 'SEU-EMAIL-AQUI@exemplo.com';
