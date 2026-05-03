import { PublicHeader } from '@/components/PublicHeader';
import { SiteFooter } from '@/components/SiteFooter';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          {children}
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
