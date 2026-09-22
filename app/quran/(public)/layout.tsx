import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementPopup from "@/components/AnnouncementPopup";

export default function PublicQuranLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <AnnouncementPopup />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
