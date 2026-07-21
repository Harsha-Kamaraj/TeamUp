import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import './index.css';
import App from './App.jsx';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * App entry. Providers are composed here (outermost → innermost):
 *   QueryClientProvider → server-state caching (TanStack Query)
 *   BrowserRouter       → client-side routing
 *   AuthProvider        → current user + auth actions (uses router + query)
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
