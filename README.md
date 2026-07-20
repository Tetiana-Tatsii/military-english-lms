# Military English LMS

Закрита платформа вивчення військової англійської (STANAG-орієнтована): курси, тести, домашні завдання, гейміфікація.

**Стек:** Next.js 16 (App Router) · React 19 · Supabase (Auth, Postgres, Storage) · Tailwind 4

---

## Швидкий старт

```bash
npm install
cp .env.example .env.local
# заповніть URL і anon key з Supabase → Project Settings → API
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000).

### Скрипти

| Команда | Що робить |
|---------|-----------|
| `npm run dev` | Локальний сервер |
| `npm run build` | Production build |
| `npm run start` | Запуск після build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |

---

## Ролі

| Роль | Куди потрапляє | Можливості |
|------|----------------|------------|
| **student** | `/dashboard` | Курси, тести, ДЗ, PX store |
| **teacher** | `/teacher` | Редактор уроків, перевірка відповідей |
| **admin** | `/teacher` | + користувачі, паролі, support |

Реєстрація створює акаунт зі статусом `pending` — адмін має схвалити в Users.

Паролі зберігаються **лише в Supabase Auth** (колонки `profiles.password` немає).

---

## Архітектура (коротко)

- UI майже весь client-side; сесія — **cookies** через `@supabase/ssr`
- Захист маршрутів: `src/proxy.ts` (Next.js 16 proxy)
- Дані: Supabase RLS + RPC (`buy_shop_item`, `admin_sync_auth_password`, module edits, …)
- HTML уроків (Quill) санітизується в `normalizeLessonHtml` (DOMPurify)

---

## База даних / міграції

SQL-скрипти лежать у `supabase/migrations/`. Застосовуйте їх **вручну** в Supabase SQL Editor (порядок і статус — у `docs/P4_SECURITY.md` та `docs/data-baseline.txt`).

Корисні доки:

- `docs/P4_SECURITY.md` — auth / security кроки
- `docs/RESET_PASSWORD.md` — скидання пароля
- `docs/data-baseline.txt` — counts і прогрес P4

Після чутливих SQL завжди:

```sql
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons
UNION ALL SELECT 'profiles', count(*) FROM public.profiles;
```

+ smoke: login teacher → save lesson → student quiz / shop.

---

## Smoke-чеклист

1. Без сесії `/dashboard` і `/teacher` → редірект на `/login`
2. Student → dashboard; `/teacher` недоступний
3. Teacher/admin → teacher panel
4. Практичний тест: не здається порожнім; одна спроба
5. PX store: ціна списується коректно
6. Адмін змінює пароль → login з новим паролем

---

## Деплой

Типово: **Vercel** + той самий Supabase project.  
У Vercel додайте `NEXT_PUBLIC_SUPABASE_URL` і `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

CI на GitHub: `.github/workflows/ci.yml` (`lint` + `typecheck` на `push`/`PR` до `main`).
