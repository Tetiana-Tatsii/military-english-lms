# P4 — Auth & Security (покроково)

**Правило:** без `DROP TABLE`, без масових `DELETE`.  
**Baseline (2026-07-20):** courses **2** / lessons **20** / profiles **7** / answers **10** / quiz **9** / tickets **5**.

---

## Дорожня карта

| Крок | Файл | Статус | Ризик |
|------|------|--------|-------|
| **1** | `p4_step1_audit.sql` | ✅ done | Нуль |
| **2** | `p4_step2_private_schema.sql` | ✅ done | Низький |
| **3** | `p4_step3_revoke_password_select.sql` | ⚠️ недостатньо (PG table-level) | — |
| **3b** | `p4_step3b_revoke_password_select_fix.sql` | ✅ done 2026-07-20 | Низький |
| **4a** | student RLS verify | ✅ done earlier | — |
| **4** | `p4_step4_login_rpc_hardening.sql` + frontend | ✅ done 2026-07-20 | Середній |
| **5** | legacy policies | ✅ audit: 0 risk rows — skip | — |

---

## Зараз: після кроку 4

SQL і frontend для login hardening — **done**.

**Обов’язковий smoke:** login teacher + student на актуальному коді.

Далі (критична безпека поза P4 roadmap):
1. ~~`buy_shop_item` — ціна з сервера~~ → `p4_shop_server_price.sql` + frontend
2. ~~Quiz UX / empty submit / stale 0% results~~
3. ~~XSS — санітизація Quill HTML~~ → `isomorphic-dompurify` у `normalizeLessonHtml`
4. ~~REVOKE INSERT/UPDATE на `profiles.password`~~ → `p4_revoke_password_write.sql` + AuthProvider
5. ~~Middleware / Proxy + `@supabase/ssr`~~ → cookie session + route guards (`src/proxy.ts`)
6. ~~Dual auth: DROP `profiles.password`~~ → `p4_drop_profiles_password.sql`
7. CI + README (nice-to-have)

---

## Після кожного кроку

```sql
SELECT 'lms_courses' AS t, count(*) FROM public.lms_courses
UNION ALL SELECT 'lms_lessons', count(*) FROM public.lms_lessons;
```

+ smoke: login teacher → save lesson → student quiz.
