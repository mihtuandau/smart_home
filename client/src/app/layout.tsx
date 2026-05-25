import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './provider';
import MainLayout from '@/components/layout/MainLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const brandSans = Plus_Jakarta_Sans({
  variable: '--font-brand-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const brandMono = JetBrains_Mono({
  variable: '--font-brand-mono',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Smart Home Management System',
  description: 'Hệ thống quản lý nhà thông minh với IoT',
  icons: {
    icon: '/images/logo_smart.png',
    apple: '/images/logo_smart.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${brandSans.variable} ${brandMono.variable} antialiased`}>
        <ErrorBoundary>
          <Providers>
            <MainLayout>{children}</MainLayout>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
