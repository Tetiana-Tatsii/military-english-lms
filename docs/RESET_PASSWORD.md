# Скидання пароля викладача / курсанта

Паролі зберігаються **лише в Supabase Auth** (`auth.users`). Колонки `profiles.password` більше немає.

## Крок 1. Перевірка зв’язку profile ↔ auth

```sql
SELECT
  p.id AS profile_id,
  p.name,
  p.role,
  u.id AS auth_id,
  u.email AS auth_email,
  CASE WHEN u.id IS NULL THEN 'NO_AUTH_USER' ELSE 'OK' END AS status
FROM public.profiles p
LEFT JOIN auth.users u ON u.id::text = p.id
WHERE p.name ILIKE '%ВАШЕ ІМ%Я%';
```

Якщо `status = NO_AUTH_USER` — у **Authentication → Users** створіть користувача з **тим самим UUID**, що `profile_id`.

## Крок 2. Скидання пароля в SQL (замініть ім’я і пароль)

```sql
UPDATE auth.users u
SET
  encrypted_password = extensions.crypt('НовийПароль123', extensions.gen_salt('bf')),
  updated_at = now()
FROM public.profiles p
WHERE u.id::text = p.id
  AND p.name ILIKE 'Точне Ім%я З Профілю';
```

## Крок 3. Через адмін-панель

Адмін → Users → зміна пароля викликає RPC `admin_sync_auth_password` (оновлює лише Auth).

Якщо RPC ще не застосовано — запустіть у SQL Editor актуальну версію з  
`supabase/migrations/p4_drop_profiles_password.sql` (або попередній `admin_sync_auth_password.sql`).

## Важливо

- Входити треба **тим самим іменем**, що в `profiles.name` (регістр не важливий).
- Якщо в профілі кирилиця, а в Auth email латиницею — login використовує `auth_email` з `get_profile_for_login`.
