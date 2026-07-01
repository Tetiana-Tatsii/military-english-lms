# P0: Безпека даних під час рефакторингу

**Правило:** жодних `DROP TABLE`, масових `DELETE`, зміни JSON-структури у `lms_lessons.content` / `lms_courses.modules` без окремої міграції-конвертера.

**Порядок робіт (узгоджено):**
1. P0 — бекапи та baseline
2. P4 — безпека (RLS, auth)
3. P2 + P3 — розбиття AppContext та EditorTab
4. П1.5, П5 — тести, React Query, E2E (пізніше)

---

## Крок 1. Backup Supabase (ви, Dashboard)

1. [Supabase Dashboard](https://supabase.com/dashboard) → проєкт **english-lms**
2. **Database** → **Backups** (або **Point in time** на Pro)
3. Переконайтесь, що є свіжий backup **перед** будь-якою SQL-міграцією
4. Опційно: **Database** → **Tables** → Export CSV для `lms_courses`, `lms_lessons` (додаткова страховка)

Запишіть дату backup у `docs/data-baseline.txt`.

---

## Крок 2. Baseline counts (SQL)

1. SQL Editor → **+ New query**
2. Вставте весь файл: `supabase/migrations/verify_data_baseline.sql`
3. **Run**
4. Запишіть `row_count` з першої таблиці результатів у `docs/data-baseline.txt`

**Очікувані орієнтири (production, стан на початок рефакторингу):**
- `lms_courses` ≥ 2
- `lms_lessons` ≥ 20
- `profiles` — усі teachers з `profile_auth_ok = true`

Якщо counts **зменшились** після deploy без вашого редагування — **rollback frontend**, БД не чіпати до розбору.

---

## Крок 3. Smoke-тест (localhost або production)

Виконайте **до** і **після** кожного PR. ~10–15 хв.

| # | Сценарій | Очікування |
|---|----------|------------|
| 1 | Login student | Dashboard, курси видно |
| 2 | Login teacher | `/teacher`, Editor, курси в dropdown |
| 3 | Відкрити урок | Контент, quiz, homework |
| 4 | Зберегти назву уроку | Без alert; після refresh — збережено |
| 5 | Зберегти назву модуля | Без помилки `schema private` |
| 6 | Quiz — один варіант | Один radio, коректний % |
| 7 | Submit homework (текст) | Відповідь у AnswersTab у teacher |
| 8 | Login admin | Users + Support доступні |
| 9 | `verify_data_baseline.sql` | Counts = baseline |

---

## Крок 4. Перед кожним SQL у production

- [ ] Backup свіжий (< 24 год або PITR)
- [ ] Baseline записаний
- [ ] Міграція **additive** (немає DROP / DELETE без WHERE id конкретного fix)
- [ ] Спочатку **+ New query**, не старий snippet tab
- [ ] Після Run — знову `verify_data_baseline.sql`

---

## Крок 5. Перед кожним git push / deploy

- [ ] `npm run build` локально без помилок
- [ ] Smoke #1–4 мінімум на localhost
- [ ] Немає змін у `supabase/migrations/` destructive SQL без review
- [ ] Після deploy — smoke на production + baseline SQL

---

## Заборонено без окремого погодження

| Дія | Чому |
|-----|------|
| `DROP TABLE` / `TRUNCATE` | Втрата даних |
| `DELETE FROM lms_*` без WHERE | Втрата курсів/уроків |
| Зміна `profile.id` масово | Злам login + RLS |
| Client-side seed `initialCourses` на production з даними | Ризик перезапису (seed лише якщо БД порожня — не чіпати) |
| Push секретів у `.env.example` | Витік |

---

## Файли P0

| Файл | Призначення |
|------|-------------|
| `supabase/migrations/verify_data_baseline.sql` | Counts + teachers auth check |
| `supabase/migrations/verify_courses_data.sql` | Швидка перевірка курсів |
| `docs/data-baseline.txt` | Журнал знімків |
| `docs/REFACTORING_SAFETY.md` | Цей checklist |

---

## Наступний крок (P4 — RLS / security)

Після заповнення baseline — сесія з consolidated RLS audit (additive migrations only).
