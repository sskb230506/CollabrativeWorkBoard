/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from '@providers/QueryProvider';
import { AuthProvider } from '@context/AuthContext';
import { AppRouter } from '@routes/AppRouter';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>,
);
