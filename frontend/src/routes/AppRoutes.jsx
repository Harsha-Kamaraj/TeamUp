import { Routes, Route } from 'react-router-dom';
import RootLayout from '@/components/layout/RootLayout';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Application route table.
 *
 * All routes render inside RootLayout (navbar + footer). Feature routes
 * (auth pages, dashboard, posts, chat…) are added in their respective phases.
 * The catch-all `*` renders the 404 page.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        {/* Phase 4+: /login, /register, /dashboard, /browse, etc. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
