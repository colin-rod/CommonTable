import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'CommonTable',
  description: 'A shared household recipe book',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1976d2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
