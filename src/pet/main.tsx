import React from 'react';
import { createRoot } from 'react-dom/client';
import { Pet } from './Pet';

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <Pet />
    </React.StrictMode>
  );
}
