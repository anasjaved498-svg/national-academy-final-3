import DbErrorBanner from "@/components/DbErrorBanner";

// Deliberately bare — admin and portal have their own dedicated layouts
// with their own navigation. The public marketing nav/footer only belongs
// on the (public) route group's pages, not here, or it stacks on top of
// the admin/portal chrome (that was the mobile double-nav bug).
//
// DbErrorBanner is mounted here so every Quran-section page (public,
// admin and portal alike) surfaces database failures instead of silently
// showing stale or unsaved data.
export default function QuranLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DbErrorBanner />
      {children}
    </>
  );
}
