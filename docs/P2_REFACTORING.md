# P2 — Рефакторинг AppContext

## PR1 (поточний): типи + AuthProvider

### Зроблено
- `src/types/domain.ts` — доменні типи
- `src/context/auth/AuthProvider.tsx` — login, logout, register, users, session restore
- `src/context/AppContext.tsx` — thin wrapper; `useAppContext()` API **без змін**
- Re-export типів з `AppContext` для backward compatibility

### Новий hook (опційно)
```tsx
import { useAuth } from "@/context/auth";
```

### Smoke після deploy
- [ ] Login teacher / student
- [ ] Save lesson
- [ ] Users tab (admin)
- [ ] Baseline counts 2/20

### Далі (P2 PR2)
- `CoursesProvider` — courses, lessons, modules, realtime
- `GamificationProvider` — streak, shop, coins
