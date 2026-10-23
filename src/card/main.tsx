import React from 'react';
import { createRoot } from 'react-dom/client';
import { Card } from './Card';

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <Card />
    </React.StrictMode>
  );
}
