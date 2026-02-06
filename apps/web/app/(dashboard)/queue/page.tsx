import { redirect } from 'next/navigation';

/**
 * Queue Page - Redirects to Meal Plan
 *
 * This page has been renamed to "Meal Plan" for better UX.
 * The /queue route is kept for backwards compatibility and
 * redirects to /meal-plan.
 */
export default function QueuePage() {
  redirect('/meal-plan');
}
