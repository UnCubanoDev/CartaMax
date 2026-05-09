-- CartaMax Seed Data
-- Initial data for testing and development

-- 1. Planes de ejemplo
insert into public.planes (nombre, descripcion, precio_mensual, max_productos, max_categorias, max_mesas) values
('Básico', 'Plan básico para pequeños restaurantes', 299.00, 30, 5, 10),
('Pro', 'Plan profesional para restaurantes medianos', 599.00, 100, 15, 30),
('Premium', 'Plan premium sin límites', 999.00, null, null, null)
on conflict (nombre) do nothing;

-- 2. Configuración de pago de ejemplo
insert into public.configuracion_pago (banco_nombre, numero_cuenta, clabe, beneficiario, instrucciones) values
('Banco Ejemplo', '1234567890', '012345678901234567', 'CartaMax SaaS', 'Enviar comprobante después de la transferencia')
on conflict do nothing;

-- Note: For testing, create a super admin user manually in Supabase Auth
-- and set their JWT role to 'super_admin' via hooks or manual JWT editing.
-- Example: In Supabase Dashboard > Authentication > Users > Edit > Add user_metadata: { "role": "super_admin" }

-- Example business (optional for dev):
-- insert into public.negocios (nombre, slug, owner_email, estado) values
-- ('Restaurante Demo', 'restaurante-demo', 'demo@cartamax.com', 'pendiente');
