import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './provider';
import MainLayout from '@/components/layout/MainLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Smart Home Management System',
  description: 'Hệ thống quản lý nhà thông minh với IoT',
  icons: {
    icon: '/images/logo_smart.png',
    apple: '/images/logo_smart.png',
  },
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <Providers>
            <MainLayout>{children}</MainLayout>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
