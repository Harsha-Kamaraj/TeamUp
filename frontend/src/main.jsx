import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import './index.css';
import App from './App.jsx';
import { queryClient } from '@/lib/queryClient';

/**
 * App entry. Providers are composed here (outermost → innermost):
 *   QueryClientProvider → server-state caching (TanStack Query)
 *   BrowserRouter       → client-side routing
 * The AuthProvider will be added here in Phase 4.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
