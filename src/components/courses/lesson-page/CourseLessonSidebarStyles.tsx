export function CourseLessonSidebarStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @media (min-width: 1280px) {
            .sidebar-desktop {
              position: static !important;
              transform: none !important;
              z-index: auto !important;
              height: 100% !important;
            }
          }
          .lesson-content-area {
            min-width: 0;
            width: 100%;
          }
        `,
      }}
    />
  );
}
