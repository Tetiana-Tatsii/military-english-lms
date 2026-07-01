# P4 — Auth & Security (покроково)

**Правило:** без `DROP TABLE`, без масових `DELETE`. Baseline: **2 / 20 / 7 / 3 / 4 / 5**.

---

## Дорожня карта

| Крок | Файл | Що робить | Ризик |
|------|------|-----------|-------|
| **1** | `p4_step1_audit.sql` | Лише читання, звіт | **Нуль** |
| **2** | `p4_step2_private_schema.sql` | GRANT private + helpers | Низький |
| **3** | `p4_step3_revoke_password_select.sql` | REVOKE SELECT на `profiles.password` | Низький |
| **3b** | `p4_step3_student_rls_fix.sql` | Відновити student quiz/answers RLS якщо бракує | Низький |
| **4** | `p4_step4_login_rpc_hardening.sql` | Login без password_hash на клієnt* | Середній — потрібен deploy коду |
| **5** | `p4_step5_revoke_legacy_policies.sql` | Прибрати `Allow all` / `lms_lessons_all` | Низький |

\* Крок 4 — після оновлення frontend (окрема сесія).

---

## Зараз: виконайте лише КРОК 1

1. SQL Editor → **+ New query**
2. Вставте **`supabase/migrations/p4_step1_audit.sql`**
3. **Run**
4. Перевірте секцію **BASELINE** — має збігатися з baseline
5. Надішліть результати (скрін або текст) для секцій:
   - **RISK_POLICY** (має бути 0 rows)
   - **PRIVATE** (usage = true)
   - **STUDENT_RLS**
   - **RPC** (get_profile_for_login)

Після review — скажемо, чи запускати крок 2.

---

## Після кожного кроку

```sql
-- counts (швидко)
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons;
```

+ smoke: login teacher → save lesson → student quiz.
