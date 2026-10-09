import './globals.css';
import QueryProvider from '../providers/QueryProvider';
import { ThemeProvider } from '../providers/ThemeProvider';
import { I18nProvider } from '../providers/I18nProvider';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';
import { PwaRegister } from '../components/shared/PwaRegister';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'HRMS Pro - Enterprise HR Management System',
  description: 'Enterprise Human Resource Management System Portal for multi-tenant administration, employee management, attendance, and payroll.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HRMS Pro',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/hrms-logo.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/hrms-logo.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PwaRegister />
        <Toaster richColors position="top-right" />
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <I18nProvider>
              {children}
            </I18nProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
