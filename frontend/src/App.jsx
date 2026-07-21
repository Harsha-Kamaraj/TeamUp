import AppRoutes from '@/routes/AppRoutes';

/**
 * App — top-level component. Providers (Router, React Query) are set up in
 * main.jsx, so App just renders the route table. Global concerns like the
 * AuthContext and a toast provider will wrap this in later phases.
 */
export default function App() {
  return <AppRoutes />;
}
