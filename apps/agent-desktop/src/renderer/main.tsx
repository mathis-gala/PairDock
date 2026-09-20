import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DesktopApp } from './app.js';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('PairDock root element is missing.');

const client = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
});

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <DesktopApp bridge={window.pairdock} />
    </QueryClientProvider>
  </StrictMode>,
);
