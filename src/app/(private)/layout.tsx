import { PrivateNavbar } from '@/components/PrivateNavbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PrivateNavbar />
      <main className="pt-16 min-h-screen bg-[#050505] pb-24 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </>
  );
}
