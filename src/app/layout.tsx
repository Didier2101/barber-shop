import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kavvo.store';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BarberShop | Barberia Premium',
    template: '%s | BarberShop',
  },
  description: 'Reserva tu cita, conoce a nuestros barberos y descubre nuestros servicios.',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: '/',
    siteName: 'BarberShop',
    title: 'BarberShop | Barberia Premium',
    description: 'Reserva tu cita, conoce a nuestros barberos y descubre nuestros servicios.',
    images: [
      {
        url: '/nathon-oski-EW_rqoSdDes-unsplash.jpg',
        width: 1200,
        height: 630,
        alt: 'BarberShop portada',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BarberShop',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BarberShop | Barberia Premium',
    description: 'Reserva tu cita, conoce a nuestros barberos y descubre nuestros servicios.',
    images: ['/nathon-oski-EW_rqoSdDes-unsplash.jpg'],
  },
};

export const viewport = {
  themeColor: '#f59e0b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

import QueryProvider from '@/providers/QueryProvider';
import PWARegistration from '@/components/PWARegistration';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-black text-white transition-colors duration-300">
        <Toaster position="top-right" richColors theme="dark" />
        <PWARegistration />
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
