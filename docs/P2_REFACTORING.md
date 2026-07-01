# P2 — Рефакторинг AppContext

## PR1: типи + AuthProvider ✅

- `src/types/domain.ts` — доменні типи
- `src/context/auth/AuthProvider.tsx` — login, logout, register, users, session restore
- `src/context/AppContext.tsx` — thin wrapper; `useAppContext()` API **без змін**

### Новий hook (опційно)
```tsx
import { useAuth } from "@/context/auth";
```

---

## PR2: CoursesProvider + GamificationProvider ✅

- `src/context/courses/CoursesProvider.tsx` — курси, уроки, модулі, answers, realtime, CRUD
- `src/context/gamification/GamificationProvider.tsx` — streak, shop, coins, instructorMood
- `AppContext` — лише support tickets + profiles realtime + compose providers

### Нові hooks (опційно)
```tsx
import { useCourses } from "@/context/courses";
import { useGamification } from "@/context/gamification";
```

### Порядок провайдерів
```
AuthProvider → GamificationProvider → CoursesProvider → AppProviderInner
```

### Smoke після deploy
- [ ] Login teacher / student
- [ ] Save lesson + rename module (уроки не зникають)
- [ ] Quiz — один radio
- [ ] Feedback + coins (teacher → student)
- [ ] Shop / streak (dashboard)
- [ ] Baseline counts 2/20

### Далі (P3)
- Розбити `EditorTab` на менші компоненти
