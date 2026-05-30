import { createClient } from '@supabase/supabase-js';

// Força o navegador a reconhecer as variáveis antes de qualquer outra importação carregar
const supabaseUrl = 'https://cygqomkyiheoijarrnsu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImN5Z3FvbWt5aWhlb2lqYXJybnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODQwOTUsImV4cCI6MjAzMjQ2MDA5NX0.PB04DWKvLFMV1ffsrkJc6ktBo85w2HOnCzXJwRURmVU';

// Injeção de segurança máxima na memória do navegador
(window as any).process = { env: { VITE_SUPABASE_URL: supabaseUrl, VITE_SUPABASE_ANON_KEY: supabaseAnonKey } };
(import.meta as any).env = { VITE_SUPABASE_URL: supabaseUrl, VITE_SUPABASE_ANON_KEY: supabaseAnonKey };

// Inicialização forçada global
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
