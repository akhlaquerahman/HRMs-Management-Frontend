import './globals.css';
import QueryProvider from '../providers/QueryProvider';
import { ThemeProvider } from '../providers/ThemeProvider';
import { I18nProvider } from '../providers/I18nProvider';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Enterprise HRMS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextTopLoader color="#3b82f6" showSpinner={false} shadow="0 0 10px #3b82f6,0 0 5px #3b82f6" zIndex={1600} />
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
