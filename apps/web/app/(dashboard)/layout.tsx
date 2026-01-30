import type { ReactNode } from 'react';

import {
  getPendingAiTagSuggestionsCount,
  getPendingMealRequestsCount,
} from '@/app/actions/dashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

/**
 * Dashboard Root Layout
 * Wraps all dashboard pages with persistent navigation
 */
export default async function DashboardRootLayout({ children }: { children: ReactNode }) {
  // Fetch pending counts for navigation badges
  const [tagsResult, requestsResult] = await Promise.all([
    getPendingAiTagSuggestionsCount(),
    getPendingMealRequestsCount(),
  ]);

  const pendingTagsCount = tagsResult.success ? tagsResult.data : 0;
  const pendingRequestsCount = requestsResult.success ? requestsResult.data : 0;

  return (
    <DashboardLayout
      pendingTagsCount={pendingTagsCount}
      pendingRequestsCount={pendingRequestsCount}
    >
      {children}
    </DashboardLayout>
  );
}
