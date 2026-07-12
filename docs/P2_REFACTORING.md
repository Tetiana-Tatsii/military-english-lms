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
- ~~PR3a: hook + підкомпоненти EditorTab~~ ✅
- ~~PR3b: розбити `LessonEditorPanel` (media, content, quizlet, quiz)~~ ✅

---

## P3 PR3b: LessonEditorPanel split ✅

- `LessonEditorMediaSection.tsx` — фото, аудіо, документи
- `LessonEditorContentSection.tsx` — reading, граматика, інструкція ДЗ
- `LessonEditorQuizletSection.tsx` — картки словника
- `LessonEditorQuizSection.tsx` — інтерактивний тест
- `LessonEditorPanel.tsx` — заголовок, skill/YouTube, save (~220 рядків)
- `types.ts` — `LessonEditorSectionProps`

### Smoke після deploy
- [ ] Teacher → Editor → відкрити урок
- [ ] Завантажити фото / аудіо / документ
- [ ] Редагувати текст, quizlet, quiz
- [ ] Зберегти урок → refresh → дані на місці

---

## P3 PR3c: Course lesson page split ✅

- `lesson-page/useCourseLessonPage.ts` — стан, effects, handlers
- `CourseLessonSidebar.tsx` — навігація модулів/уроків
- `CourseLessonMobileBar.tsx` — mobile header
- `CourseLessonTheorySection.tsx` — skill, title, теорія, аудіо
- `CourseLessonMaterialsSection.tsx` — граматика, фото, відео, документи, quizlet
- `CourseLessonQuizPanel.tsx` — практичний тест
- `CourseLessonHomeworkPanel.tsx` — інструкція ДЗ + відправка/фідбек
- `CourseLessonMainContent.tsx` — композиція секцій
- `courses/[courseId]/page.tsx` — thin wrapper (~120 рядків)

### Smoke після deploy
- [ ] Student → курс → теорія → аудіо → quiz → голосове ДЗ
- [ ] Sidebar mobile (hamburger) + desktop
- [ ] Quiz результат зберігається після refresh

---

## P3 PR3a: EditorTab split ✅

- `src/components/teacher/editor/useEditorTab.ts` — стан і handlers
- `src/components/teacher/editor/utils.ts` — quill, upload, YouTube
- `src/components/teacher/editor/types.ts` — EditorTabProps
- `CourseStructurePanel` — вибір курсу, модулі, уроки
- `LessonEditorPanel` — глибоке редагування уроку
- `CourseFormModal` — створення/редагування курсу
- `EditorMobileGuard` — блок на mobile
- `EditorTab.tsx` — thin wrapper (~35 рядків)

### Smoke після deploy
- [ ] Teacher → Editor → вибір курсу
- [ ] Rename module / lesson
- [ ] Відкрити урок → зберегти текст, quiz, media
- [ ] Створити / редагувати курс (modal)
