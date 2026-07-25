# Supabase Security Advisor — що робити з warnings

## Зробити в SQL (міграція)

Файл: `supabase/migrations/p6_security_advisor_hygiene.sql`  
Запустити в **Supabase → SQL Editor** (Production), потім **Rerun linter**.

| # | Warning | Дія |
|---|---------|-----|
| 1 | `shop_item_kind` search_path | ✅ Фікс у P6 |
| 2 | `get_profile_for_login` callable by **anon** | ⚠️ **Навмисно** (логін до сесії). Payload зменшено; `authenticated` revoke |
| 3–12 | SECURITY DEFINER + **authenticated** | Більшість **навмисні** RPC з перевірками всередині. P6: `award_quiz_coins` більше не для клієнта |
| 13 | Leaked password protection | 👉 **Dashboard** (див. нижче) |

## Зробити вручну в Dashboard

**Authentication → Providers / Attack Protection** (або Settings → Auth):  
увімкнути **Leaked password protection** (Have I Been Pwned).

Це не SQL-міграція.

## Чому лінтер далі покаже «Signed-In Users Can Execute…»

PostgREST має викликати RPC від імені `authenticated`. Функції `SECURITY DEFINER` + внутрішні checks (`auth.uid()`, `private.is_admin()`, тощо) — нормальна модель для LMS.  
Прибирати `EXECUTE` у всіх = зламати shop / streak / certificates / quiz.

Критично перевіряти не «чи є GRANT», а **чи функція не дає зайвого без ролі**.

## Smoke після P6

1. Login (кирилиця + латиниця)  
2. Student: quiz submit → coins  
3. Teacher: award homework coins  
4. Admin: зміна пароля користувачу  
5. Shop buy item  
