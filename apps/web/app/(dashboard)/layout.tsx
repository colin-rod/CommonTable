import type { ReactNode } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

/**
 * Dashboard Root Layout
 * Wraps all dashboard pages with persistent navigation
 */
export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
