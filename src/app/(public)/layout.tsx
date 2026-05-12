'use client';
import { PublicHeader } from '@/components/PublicHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { usePathname } from 'next/navigation';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <PublicHeader />
      <div className="flex flex-col min-h-screen">
        <main className={`flex-grow ${!isHome ? 'pt-20 lg:pt-28' : ''}`}>
          {children}
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
