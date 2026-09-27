'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
        <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6 p-3">
          <Image src="/hrms-logo.png" alt="HRMS Logo" width={64} height={64} className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Application Error</h1>
        <p className="text-muted-foreground max-w-md mb-6 text-sm">
          {error?.message || 'A global error occurred.'}
        </p>
        <Button onClick={() => reset()}>Refresh Page</Button>
      </body>
    </html>
  );
}
