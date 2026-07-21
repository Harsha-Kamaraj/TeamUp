import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import './index.css';
import App from './App.jsx';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';

/**
 * App entry. Providers are composed here (outermost → innermost):
 *   QueryClientProvider → server-state caching (TanStack Query)
 *   BrowserRouter       → client-side routing
 *   AuthProvider        → current user + auth actions
 *   SocketProvider      → realtime chat connection (uses auth + query)
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
