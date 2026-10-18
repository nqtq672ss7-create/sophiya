import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import { ReviewsProvider } from './context/ReviewsContext';
import { FigmaAppShell } from './components/figma/FigmaAppShell';

export function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <ReviewsProvider>
          <FigmaAppShell />
        </ReviewsProvider>
      </CatalogProvider>
    </AuthProvider>
  );
}

export default App;
