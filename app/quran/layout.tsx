// Deliberately bare — admin and portal have their own dedicated layouts
// with their own navigation. The public marketing nav/footer only belongs
// on the (public) route group's pages, not here, or it stacks on top of
// the admin/portal chrome (that was the mobile double-nav bug).
export default function QuranLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
