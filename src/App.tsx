import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import { FigmaAppShell } from './components/figma/FigmaAppShell';

export function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <FigmaAppShell />
      </CatalogProvider>
    </AuthProvider>
  );
}

export default App;
