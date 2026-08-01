import AppRoutes from '@/routes/AppRoutes';
import ErrorBoundary from '@/components/layout/ErrorBoundary';

/**
 * App — top-level component. Providers (Router, React Query) are set up in
 * main.jsx, so App just renders the route table, wrapped in an ErrorBoundary
 * so a crash in any one component shows a recoverable message instead of
 * unmounting everything and leaving a blank page.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
