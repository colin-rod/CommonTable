import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'CommonTable',
  description: 'A shared household recipe book',
  manifest: '/manifest.json',
  themeColor: '#1976d2',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
