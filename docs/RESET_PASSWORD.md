# Скидання пароля викладача / курсанта

Якщо після зміни пароля в адмін-панелі вхід не працює і з’являється повідомлення про синхронізацію Supabase Auth — оновіть пароль **вручну в SQL Editor**.

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

Якщо `status = NO_AUTH_USER` — у **Authentication → Users** потрібно створити користувача з **тим самим UUID**, що `profile_id`.

## Крок 2. Синхронізація пароля (замініть ім’я і пароль)

```sql
UPDATE auth.users u
SET
  encrypted_password = extensions.crypt('НовийПароль123', extensions.gen_salt('bf')),
  updated_at = now()
FROM public.profiles p
WHERE u.id::text = p.id
  AND p.name ILIKE 'Точне Ім%я З Профілю';
```

## Крок 3. Оновити hash у profiles (опційно, якщо адмін-панель не спрацювала)

Після кроку 2 увійдіть з новим паролем. Якщо profiles ще зі старим hash — змініть пароль ще раз через **Users** у teacher panel після успішного входу.

## Крок 4. RPC для адмін-панелі (один раз)

Запустіть у SQL Editor файл:

`supabase/migrations/admin_sync_auth_password.sql`

Після цього зміна пароля в **UsersTab** має оновлювати і `profiles`, і `auth.users` автоматично.

## Важливо

- Входити треба **тим самим іменем**, що в `profiles.name` (регістр не важливий).
- Якщо в профілі кирилиця («Тетяна Тацій»), а в Auth email латиницею — це нормально; login використовує `auth_email` з RPC.
