import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { FigmaAppShell } from './components/figma/FigmaAppShell';

export function App() {
  return (
    <AuthProvider>
      <FigmaAppShell />
    </AuthProvider>
  );
}

export default App;
